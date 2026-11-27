-- Preserve legacy CMS materials as unapproved master resources, not a second
-- independently published library. The original JSON remains for audit/reference.
ALTER TABLE learning_resources ADD COLUMN legacy_cms_key text UNIQUE;
INSERT INTO learning_resources(title,resource_type,language,description,url,activity_id,legacy_cms_key,review_status,publication_status,admin_comment)
 SELECT coalesce(item->>'title','Material awaiting review'),
 CASE WHEN coalesce(item->>'videoUrl','')<>'' THEN 'Recording' ELSE 'Q&A' END,
 coalesce(nullif(item->>'language',''),'English'),item->>'description',
 coalesce(nullif(item->>'videoUrl',''),nullif(item->>'qaUrl','')),
 (SELECT a.id FROM activities a WHERE a.id::text=item->>'activityId'),
 'cms:'||coalesce(item->>'id',md5(item::text)), 'needs review','unpublished',
 'Legacy CMS material: verify source, activity link and publication permissions. Original metadata: '||item::text
 FROM learn_events_content c CROSS JOIN LATERAL jsonb_array_elements(coalesce(c.data#>'{onlineEducation,approvedResources}','[]')) item
 ON CONFLICT(legacy_cms_key) DO NOTHING;
