ALTER TABLE trainer_profiles
 ADD COLUMN teaching_allowed boolean NOT NULL DEFAULT false,
 ADD COLUMN teaching_permissions jsonb NOT NULL DEFAULT '[]',
 ADD COLUMN portal_access_enabled boolean NOT NULL DEFAULT true,
 ADD COLUMN contact_email text NOT NULL DEFAULT '',
 ADD COLUMN contact_phone text NOT NULL DEFAULT '',
 ADD COLUMN publish_email boolean NOT NULL DEFAULT false,
 ADD COLUMN publish_phone boolean NOT NULL DEFAULT false,
 ADD COLUMN email_consent boolean NOT NULL DEFAULT false,
 ADD COLUMN phone_consent boolean NOT NULL DEFAULT false,
 ADD COLUMN consent_note text NOT NULL DEFAULT '',
 ADD COLUMN approved_snapshot jsonb,
 ADD COLUMN legacy_source_id text UNIQUE,
 ADD COLUMN legacy_source jsonb,
 ADD COLUMN revision integer NOT NULL DEFAULT 0;
UPDATE trainer_profiles p SET approved_snapshot=jsonb_build_object(
 'name',u.name,'city',p.city,'language',p.language,'short_profile',p.short_profile,
 'qualifications',p.qualifications,'experience',p.experience,'photo_url',p.photo_url,
 'contact_email',p.contact_email,'contact_phone',p.contact_phone)
 FROM users u WHERE u.id=p.id AND p.status='approved';
ALTER TABLE activity_trainers ADD COLUMN actual_hours numeric(7,2) CHECK(actual_hours>=0);
-- Preserve historical totals; future completion submissions require individual hours.
UPDATE activity_trainers t SET actual_hours=c.actual_hours FROM completions c WHERE c.activity_id=t.activity_id;
ALTER TABLE activities ADD COLUMN teaching_module text NOT NULL DEFAULT '';
CREATE OR REPLACE VIEW approved_trainer_accounts AS
 SELECT u.id,u.name,u.email FROM users u JOIN trainer_access_requests r ON r.user_id=u.id
 JOIN trainer_profiles p ON p.id=u.id
 WHERE u.role='trainer' AND u.enabled AND r.status='approved' AND p.certified_status='certified' AND p.portal_access_enabled;
DROP VIEW public_trainers;
CREATE VIEW public_trainers AS SELECT p.id,
 coalesce(p.approved_snapshot->>'name',u.name) AS name,
 p.approved_snapshot->>'city' AS city,p.approved_snapshot->>'language' AS language,
 p.approved_snapshot->>'short_profile' AS short_profile,
 p.approved_snapshot->>'qualifications' AS qualifications,
 p.approved_snapshot->>'experience' AS experience,p.approved_snapshot->>'photo_url' AS photo_url,
 p.certificate_ref,p.healthcare_professional,p.assessment_status,p.teaching_allowed,p.teaching_permissions,
 CASE WHEN p.publish_email AND p.email_consent THEN p.approved_snapshot->>'contact_email' ELSE NULL END AS contact_email,
 CASE WHEN p.publish_phone AND p.phone_consent THEN p.approved_snapshot->>'contact_phone' ELSE NULL END AS contact_phone
 FROM trainer_profiles p JOIN users u ON u.id=p.id
 WHERE p.approved_snapshot IS NOT NULL AND p.certified_status='certified'
 AND p.healthcare_professional IS NOT NULL AND p.listing_status='approved' AND p.listing_consent_at IS NOT NULL;
CREATE OR REPLACE VIEW annual_trainer_contributions AS
 SELECT t.trainer_id,extract(year FROM a.starts_at AT TIME ZONE 'Asia/Kuala_Lumpur')::int AS year,
 sum(coalesce(t.actual_hours,0)) AS hours,sum(c.participants) AS participants,count(*) AS activities
 FROM completions c JOIN activities a ON a.id=c.activity_id JOIN activity_trainers t ON t.activity_id=a.id
 WHERE c.status='verified' GROUP BY t.trainer_id,year;
CREATE FUNCTION trainer_profile_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.revision=OLD.revision+1; RETURN NEW; END $$;
CREATE TRIGGER trainer_profile_revision_guard BEFORE UPDATE ON trainer_profiles
 FOR EACH ROW EXECUTE FUNCTION trainer_profile_revision();
