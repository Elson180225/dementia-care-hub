DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO activities (id, created_by, title, starts_at, type, mode, city, venue, language, audience, description, poster_url, planned_hours, status, published_at)
    VALUES
      ('a0000001-0000-0000-0000-000000000001', v_admin_id, 'Alzheimer''s 101: Eye-opening facts', '2024-03-15 09:00:00+08', 'RCBC Webinar', 'Online', 'Online', 'Online', 'English', 'General public, families and caregivers', 'A public introduction to Alzheimer’s disease and the facts families should know.', '/src/assets/Online_webinar/Alzheimer''s_101_Eye-Opening_Facts_About.jpg', 1.5, 'completed', '2024-03-15 09:00:00+08'),
      ('a0000001-0000-0000-0000-000000000002', v_admin_id, 'Alzheimer''s Awareness Webinar', '2024-05-18 10:00:00+08', 'RCBC Webinar', 'Online', 'Online', 'Online', 'English', 'General public, families and caregivers', 'An accessible session for building awareness and understanding in the community.', '/src/assets/Online_webinar/Poster_Alzheimer''s_Awareness_Webinar.jpg', 1.5, 'completed', '2024-05-18 10:00:00+08'),
      ('a0000001-0000-0000-0000-000000000003', v_admin_id, 'Early Detection & Monitoring of Dementia', '2024-07-20 14:00:00+08', 'RCBC Webinar', 'Online', 'Online', 'Online', '中文', 'General public, families and caregivers', 'Information about recognising changes early and discussing concerns with a healthcare professional.', '/src/assets/Online_webinar/Early_Detection&Monitoring_of_Dementia(Chinese).jpg', 1.5, 'completed', '2024-07-20 14:00:00+08'),
      ('a0000001-0000-0000-0000-000000000004', v_admin_id, 'Embracing Wellness: Ageing with Dignity in Sarawak', '2024-09-21 10:00:00+08', 'RCBC Webinar', 'Online', 'Online', 'Online', 'English', 'General public, families and caregivers', 'A conversation about wellbeing, dignity, and support as people age.', '/src/assets/Online_webinar/Embracing_Wellness_Aging_with_Dignity_in_Sarawak.jpg', 1.5, 'completed', '2024-09-21 10:00:00+08'),
      ('a0000001-0000-0000-0000-000000000005', v_admin_id, 'Essential Care: Practical Tips for Alzheimer’s Caregivers', '2024-11-16 10:00:00+08', 'RCBC Webinar', 'Online', 'Online', 'Online', 'English', 'Family caregivers and helpers', 'Practical ideas for caregivers supporting everyday routines and care needs.', '/src/assets/Online_webinar/Essential_Care_Practical_Tips_for_Alzheimer''s_Caregivers.jpg', 1.5, 'completed', '2024-11-16 10:00:00+08'),
      ('a0000001-0000-0000-0000-000000000006', v_admin_id, 'Peranan Wanita Dalam Penjagaan Alzheimer', '2025-01-18 10:00:00+08', 'RCBC Webinar', 'Online', 'Online', 'Online', 'Bahasa Melayu', 'General public, families and caregivers', 'A Malay-language conversation about women’s roles and experiences in Alzheimer’s care.', '/src/assets/Online_webinar/Peranan_Wanita_Dalam_Penjagaan_Alzheimer(Malay).jpg', 1.5, 'completed', '2025-01-18 10:00:00+08'),
      ('a0000001-0000-0000-0000-000000000007', v_admin_id, 'Safe Space: Adapting the Home for Alzheimer’s Care', '2025-03-15 10:00:00+08', 'RCBC Webinar', 'Online', 'Online', 'Online', 'English', 'Family caregivers and relatives', 'Ideas for making everyday home environments safer and more supportive.', '/src/assets/Online_webinar/Safe_Space_Adapting_the_Home_for_Alzheimer''s_Care.jpg', 1.5, 'completed', '2025-03-15 10:00:00+08'),
      ('a0000001-0000-0000-0000-000000000008', v_admin_id, 'Making the Most Suitable Decision', '2025-05-17 10:00:00+08', 'RCBC Webinar', 'Online', 'Online', 'Online', 'English', 'Family caregivers and healthcare helpers', 'A reflective session about making informed care decisions with families.', '/src/assets/Online_webinar/Making_the_most_Suitable_Decision.jpg', 1.5, 'completed', '2025-05-17 10:00:00+08'),
      ('a0000001-0000-0000-0000-000000000009', v_admin_id, 'A Practical Webinar on Cataracts', '2025-07-19 10:00:00+08', 'RCBC Webinar', 'Online', 'Online', 'Online', 'English', 'General public, older adults, caregivers', 'A practical health education session on cataracts and ageing.', '/src/assets/Online_webinar/A_Practical_Webinar_on_Cataracts.jpg', 1.5, 'completed', '2025-07-19 10:00:00+08'),
      ('a0000001-0000-0000-0000-000000000010', v_admin_id, 'Is Tooth Loss Really Part of Getting Older?', '2025-09-20 10:00:00+08', 'RCBC Webinar', 'Online', 'Online', 'Online', 'English', 'General public, families and caregivers', 'A public education session about oral health and ageing.', '/src/assets/Online_webinar/Is_Tooth_Loss_Really_Part_of_Getting_Older_Webinar.jpg', 1.5, 'completed', '2025-09-20 10:00:00+08'),
      ('a0000001-0000-0000-0000-000000000011', v_admin_id, 'Silent but Serious: Understanding Osteoporosis', '2025-11-15 10:00:00+08', 'RCBC Webinar', 'Online', 'Online', 'Online', 'English', 'General public, older adults, caregivers', 'An educational session about osteoporosis prevention and awareness.', '/src/assets/Online_webinar/Silent_but_Serious_Understanding_and_Preventing_OSTEOPOROSIS.jpg', 1.5, 'completed', '2025-11-15 10:00:00+08')
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
