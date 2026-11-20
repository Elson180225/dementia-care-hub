ALTER TABLE trainer_profiles
 ADD COLUMN archived_at timestamptz,
 ADD COLUMN archived_by uuid REFERENCES users(id),
 ADD COLUMN archive_reason text NOT NULL DEFAULT '',
 ADD COLUMN restored_at timestamptz,
 ADD COLUMN restored_by uuid REFERENCES users(id),
 ADD CONSTRAINT archived_trainer_inactive CHECK(archived_at IS NULL OR
  (NOT teaching_allowed AND NOT portal_access_enabled AND listing_status<>'approved' AND NOT publish_email AND NOT publish_phone));
CREATE OR REPLACE VIEW approved_trainer_accounts AS
 SELECT u.id,u.name,u.email FROM users u JOIN trainer_access_requests r ON r.user_id=u.id
 JOIN trainer_profiles p ON p.id=u.id
 WHERE u.role='trainer' AND u.enabled AND r.status='approved' AND p.certified_status='certified'
 AND p.portal_access_enabled AND p.archived_at IS NULL;
CREATE OR REPLACE VIEW public_trainers AS SELECT p.id,
 coalesce(p.approved_snapshot->>'name',u.name) AS name,
 p.approved_snapshot->>'city' AS city,p.approved_snapshot->>'language' AS language,
 p.approved_snapshot->>'short_profile' AS short_profile,
 p.approved_snapshot->>'qualifications' AS qualifications,
 p.approved_snapshot->>'experience' AS experience,p.approved_snapshot->>'photo_url' AS photo_url,
 p.certificate_ref,p.healthcare_professional,p.assessment_status,p.teaching_allowed,p.teaching_permissions,
 CASE WHEN p.publish_email AND p.email_consent THEN p.approved_snapshot->>'contact_email' ELSE NULL END AS contact_email,
 CASE WHEN p.publish_phone AND p.phone_consent THEN p.approved_snapshot->>'contact_phone' ELSE NULL END AS contact_phone
 FROM trainer_profiles p JOIN users u ON u.id=p.id
 WHERE p.archived_at IS NULL AND p.approved_snapshot IS NOT NULL AND p.certified_status='certified'
 AND p.healthcare_professional IS NOT NULL AND p.listing_status='approved' AND p.listing_consent_at IS NOT NULL;
