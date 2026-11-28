-- Keep only the nine "Certified ADFM Trainer" facilitators from the poster in legacy CMS / DB seeds.
-- QA/QC advisory names and placeholder demo trainers are removed; they are not re-imported.

CREATE OR REPLACE FUNCTION sync_poster_facilitators_catalog() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 UPDATE learn_events_content
 SET data = jsonb_set(
   data,
   '{certifiedTrainers,trainersList}',
   COALESCE((
     SELECT jsonb_agg(elem)
     FROM jsonb_array_elements(
       COALESCE(data#>'{certifiedTrainers,trainersList}', '[]'::jsonb)
     ) AS elem
     WHERE elem->>'id' IN ('1','2','3','4','5','6','7','8','9')
   ), '[]'::jsonb),
   true
 )
 WHERE id = 'main';

 DELETE FROM trainer_profiles p
 WHERE p.legacy_source_id IS NOT NULL
   AND p.legacy_source_id NOT IN ('1','2','3','4','5','6','7','8','9');

 DELETE FROM users u
 WHERE u.role = 'trainer'
   AND NOT EXISTS (SELECT 1 FROM trainer_profiles p WHERE p.id = u.id);

 UPDATE trainer_profiles p
 SET healthcare_professional = CASE
   WHEN p.legacy_source->>'healthcare_professional' IN ('true','false')
     THEN (p.legacy_source->>'healthcare_professional')::boolean
   ELSE p.healthcare_professional
 END
 WHERE p.legacy_source_id IN ('1','2','3','4','5','6','7','8','9');
END $$;