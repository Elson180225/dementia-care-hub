-- Learning-resource Q&A folders (Grouped_Q&A) and poster-aligned historical webinar times.
ALTER TABLE learning_resources ADD COLUMN IF NOT EXISTS qa_folder text NOT NULL DEFAULT '';

UPDATE activities AS a SET
 starts_at = s.starts_at::timestamptz,
 ends_at = s.starts_at::timestamptz + (s.planned_hours * interval '1 hour'),
 planned_hours = s.planned_hours,
 published_at = coalesce(a.published_at, s.starts_at::timestamptz)
FROM (VALUES
 ('a0000001-0000-0000-0000-000000000001','2024-03-15 09:00:00+08',1.5),
 ('a0000001-0000-0000-0000-000000000002','2024-05-18 10:00:00+08',1.5),
 ('a0000001-0000-0000-0000-000000000003','2024-07-20 14:00:00+08',1.5),
 ('a0000001-0000-0000-0000-000000000004','2024-09-21 10:00:00+08',1.5),
 ('a0000001-0000-0000-0000-000000000005','2024-11-16 10:00:00+08',1.5),
 ('a0000001-0000-0000-0000-000000000006','2025-01-18 10:00:00+08',1.5),
 ('a0000001-0000-0000-0000-000000000007','2025-03-15 10:00:00+08',1.5),
 ('a0000001-0000-0000-0000-000000000008','2025-05-17 10:00:00+08',1.5),
 ('a0000001-0000-0000-0000-000000000009','2025-07-19 10:00:00+08',1.5),
 ('a0000001-0000-0000-0000-000000000010','2025-09-20 10:00:00+08',1.5),
 ('a0000001-0000-0000-0000-000000000011','2025-11-15 10:00:00+08',1.5)
) AS s(id, starts_at, planned_hours)
WHERE a.id = s.id::uuid;

UPDATE learning_resources SET
 qa_folder = 'Understanding the Missing Pieces',
 activity_id = coalesce((SELECT id FROM activities WHERE id = 'a0000001-0000-0000-0000-000000000001'), activity_id)
WHERE title ILIKE '%Understanding the Missing Pieces%' OR legacy_cms_key = 'cms:101';

UPDATE learning_resources SET
 qa_folder = 'Oral Health Webinar',
 activity_id = coalesce((SELECT id FROM activities WHERE id = 'a0000001-0000-0000-0000-000000000010'), activity_id)
WHERE title ILIKE '%Oral Health%' OR legacy_cms_key = 'cms:102';

UPDATE learning_resources SET
 qa_folder = 'Prevention&Early Detection (Chinese)',
 activity_id = coalesce((SELECT id FROM activities WHERE id = 'a0000001-0000-0000-0000-000000000003'), activity_id)
WHERE title ILIKE '%Prevention & Early Detection%' OR legacy_cms_key = 'cms:103';
