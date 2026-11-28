-- Repair learning resources that were marked published in admin but hidden on the public site.
CREATE OR REPLACE FUNCTION repair_learning_resources_public() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 PERFORM sync_poster_aligned_webinar_times();
 PERFORM apply_historical_demo_approval();

 UPDATE learning_resources AS r SET
  activity_id = m.activity_id::uuid,
  qa_folder = m.qa_folder,
  resource_type = 'Q&A',
  review_status = 'current',
  publication_status = 'published',
  source = 'RCBC verified historical material',
  last_reviewed_at = coalesce(r.last_reviewed_at, now()),
  copyright_permission = 'RCBC confirmed publication permissions for Alzheimer''s Care Project materials.',
  admin_comment = 'Poster-aligned Q&A pack linked to approved historical webinar.'
 FROM (VALUES
  ('cms:101','a0000001-0000-0000-0000-000000000001'::uuid,'Understanding the Missing Pieces'),
  ('cms:102','a0000001-0000-0000-0000-000000000010'::uuid,'Oral Health Webinar'),
  ('cms:103','a0000001-0000-0000-0000-000000000003'::uuid,'Prevention&Early Detection (Chinese)')
 ) AS m(legacy_key, activity_id, qa_folder)
 WHERE r.legacy_cms_key = m.legacy_key;

 UPDATE learning_resources SET url = ''
 WHERE qa_folder <> '' AND resource_type = 'Q&A';
END $$;