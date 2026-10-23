DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO activities (id, created_by, title, starts_at, type, mode, city, venue, language, audience, description, poster_url, planned_hours, status, published_at)
    VALUES
      (
        'a0000001-0000-0000-0000-000000000012',
        v_admin_id,
        'Basic Dementia Care Skill (Family) Course — DCS-Family Online Webinar',
        '2026-05-16 09:00:00+08',
        'CT Webinar',
        'Online',
        'Online',
        'Online',
        'English / Bahasa Melayu / 中文',
        'Family caregivers, relatives and community helpers',
        'Online Foundation Dementia Care Course for family caregivers delivered by ADFM-Certified Trainers covering core person-centred care modules.',
        '/src/assets/Certified_Trainer_Webinar/What_is_DCS-Family_16th_May_2026_Poster.jpg',
        4.0,
        'published',
        '2026-05-16 09:00:00+08'
      )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      starts_at = EXCLUDED.starts_at,
      type = EXCLUDED.type,
      mode = EXCLUDED.mode,
      city = EXCLUDED.city,
      venue = EXCLUDED.venue,
      language = EXCLUDED.language,
      audience = EXCLUDED.audience,
      description = EXCLUDED.description,
      poster_url = EXCLUDED.poster_url,
      planned_hours = EXCLUDED.planned_hours,
      status = EXCLUDED.status,
      published_at = EXCLUDED.published_at;
  END IF;
END $$;
