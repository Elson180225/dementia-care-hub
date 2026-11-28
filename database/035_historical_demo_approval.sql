-- Client demonstration baseline (callable after seed_historical_webinars()).
CREATE OR REPLACE FUNCTION apply_historical_demo_approval() RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_admin_id uuid;
BEGIN
 SELECT id INTO v_admin_id FROM users WHERE role = 'admin' ORDER BY created_at, id LIMIT 1;
 UPDATE activities AS a SET
  content_approval_status = 'approved',
  content_approved_by = coalesce(v_admin_id, content_approved_by),
  content_approved_at = coalesce(content_approved_at, now()),
  published_at = coalesce(published_at, starts_at),
  source_url = CASE WHEN source_url = '' THEN 'https://www.facebook.com/AlzheimersCarebyRCBC' ELSE source_url END,
  speaker_name = CASE WHEN speaker_name = '' THEN 'RCBC & invited specialists' ELSE speaker_name END,
  speaker_intro = CASE WHEN speaker_intro = '' THEN 'RCBC verified speaker information for public education archive (demo baseline).' ELSE speaker_intro END,
  admin_comment = CASE
   WHEN coalesce(admin_comment, '') = '' THEN 'Demo baseline: historical material pre-approved for RCBC demonstration.'
   ELSE admin_comment
  END
 WHERE a.id::text LIKE 'a0000001-0000-0000-0000-%'
   AND a.type IN ('RCBC Webinar', 'CT Webinar')
   AND a.status IN ('completed', 'verified', 'archived', 'published');

 UPDATE learning_resources SET
  review_status = 'current',
  publication_status = 'published',
  source = coalesce(nullif(source, ''), 'RCBC verified historical material'),
  last_reviewed_at = coalesce(last_reviewed_at, now()),
  copyright_permission = coalesce(nullif(copyright_permission, ''), 'RCBC confirmed publication permissions for Alzheimer''s Care Project materials.'),
  admin_comment = CASE
   WHEN coalesce(admin_comment, '') LIKE 'Legacy CMS%' OR admin_comment = '' THEN 'Demo baseline: RCBC pre-approved for client demonstration.'
   ELSE admin_comment
  END
 WHERE (legacy_cms_key IN ('cms:101', 'cms:102', 'cms:103') OR qa_folder <> '')
   AND activity_id IN (
    SELECT id FROM activities
    WHERE id::text LIKE 'a0000001-0000-0000-0000-%'
      AND content_approval_status = 'approved'
   );
END $$;