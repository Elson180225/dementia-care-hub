-- Re-sync historical RCBC webinar schedule from Online_webinar poster artwork (MYT).
CREATE OR REPLACE FUNCTION sync_poster_aligned_webinar_times() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 UPDATE activities AS a SET
  starts_at = s.starts_at::timestamptz,
  ends_at = s.starts_at::timestamptz + (s.planned_hours * interval '1 hour'),
  planned_hours = s.planned_hours,
  published_at = coalesce(a.published_at, s.starts_at::timestamptz)
 FROM (VALUES
  ('a0000001-0000-0000-0000-000000000001','2024-10-19 15:00:00+08',1.5),
  ('a0000001-0000-0000-0000-000000000002','2024-10-19 20:00:00+08',1.5),
  ('a0000001-0000-0000-0000-000000000003','2025-07-13 20:00:00+08',1.25),
  ('a0000001-0000-0000-0000-000000000004','2025-04-26 20:00:00+08',1.25),
  ('a0000001-0000-0000-0000-000000000005','2024-10-26 20:00:00+08',1.5),
  ('a0000001-0000-0000-0000-000000000006','2024-11-09 20:00:00+08',1.5),
  ('a0000001-0000-0000-0000-000000000007','2024-11-02 20:00:00+08',1.5),
  ('a0000001-0000-0000-0000-000000000008','2024-11-02 20:00:00+08',1.5),
  ('a0000001-0000-0000-0000-000000000009','2026-04-11 20:00:00+08',1.5),
  ('a0000001-0000-0000-0000-000000000010','2026-08-08 20:00:00+08',1.25),
  ('a0000001-0000-0000-0000-000000000011','2025-10-18 20:00:00+08',1.25)
 ) AS s(id, starts_at, planned_hours)
 WHERE a.id = s.id::uuid;
END $$;

-- Ensure learning-resource repair matches public API rules (re-runnable after admin edits).
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
 JOIN activities AS a ON a.id = m.activity_id
 WHERE r.legacy_cms_key = m.legacy_key;

 UPDATE learning_resources SET url = ''
 WHERE qa_folder <> '' AND resource_type = 'Q&A';
END $$;
