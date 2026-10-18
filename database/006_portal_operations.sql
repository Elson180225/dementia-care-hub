ALTER TABLE activities DROP CONSTRAINT activities_type_check;
ALTER TABLE activities ADD CONSTRAINT activities_type_check CHECK(type IN ('Workshop','Seminar','RCBC Webinar','CT Webinar','DCS-Family','DCS-TTT','Expo','Dialogue','Forum','Public Talk','Other'));
ALTER TABLE activities ADD COLUMN registration_deadline timestamptz,
 ADD COLUMN capacity integer CHECK(capacity > 0), ADD COLUMN cancelled_at timestamptz,
 ADD COLUMN cancellation_reason text NOT NULL DEFAULT '';
CREATE TABLE files (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES users(id),
 kind text NOT NULL CHECK(kind IN ('photo','document','poster','activity-photo')),
 name text NOT NULL, mime text NOT NULL, data bytea NOT NULL CHECK(octet_length(data) <= 8388608),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX files_owner ON files(owner_id);
CREATE OR REPLACE VIEW approved_trainer_accounts AS
 SELECT u.id,u.name,u.email FROM users u JOIN trainer_access_requests r ON r.user_id=u.id
 JOIN trainer_profiles p ON p.id=u.id
 WHERE u.role='trainer' AND u.enabled AND r.status='approved' AND p.certified_status='certified';
ALTER TABLE subscribers ADD COLUMN unsubscribe_hash text;
CREATE TABLE enquiries (
 id uuid PRIMARY KEY, fingerprint text UNIQUE NOT NULL, name text NOT NULL, email text NOT NULL,
 type text NOT NULL, message text NOT NULL, received_at timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','follow-up','closed')),
 admin_comment text NOT NULL DEFAULT ''
);
CREATE TRIGGER enquiry_audit AFTER INSERT OR UPDATE OR DELETE ON enquiries
 FOR EACH ROW EXECUTE FUNCTION audit_record();

-- Preserve existing real approval evidence; never infer approval from sample names.
-- Legacy applicants without these fields must supply them before approval.
INSERT INTO trainer_access_requests(user_id,name,email,city,claimed_certificate_ref,status,admin_comment,reviewed_by,reviewed_at)
 SELECT u.id,u.name,u.email,coalesce(nullif(p.city,''),'Not provided'),
 coalesce(p.certificate_ref,'Not provided'),
 CASE WHEN evidence.actor_id IS NOT NULL AND p.certified_status='certified' THEN 'approved' ELSE 'submitted' END,
 CASE WHEN evidence.actor_id IS NULL THEN 'Please confirm your city and certificate reference through Check application.' ELSE '' END,
 CASE WHEN p.certified_status='certified' THEN evidence.actor_id END,
 CASE WHEN p.certified_status='certified' THEN evidence.changed_at END
 FROM users u JOIN trainer_profiles p ON p.id=u.id
 LEFT JOIN LATERAL (
 SELECT l.actor_id,l.changed_at FROM audit_log l JOIN users a ON a.id=l.actor_id AND a.role='admin'
 WHERE l.entity='trainer_profiles' AND l.record_id=p.id::text
 AND l.after_data->>'certified_status'='certified'
 ORDER BY l.id DESC LIMIT 1
 ) evidence ON true WHERE u.role='trainer'
 ON CONFLICT DO NOTHING;

CREATE OR REPLACE VIEW public_trainers AS SELECT p.id,u.name,p.city,p.language,p.short_profile,p.qualifications,p.experience,p.photo_url,p.certificate_ref
 FROM trainer_profiles p JOIN users u ON u.id=p.id
 JOIN trainer_access_requests r ON r.user_id=u.id AND r.status='approved'
 WHERE p.status='approved' AND p.certified_status='certified' AND u.enabled;
