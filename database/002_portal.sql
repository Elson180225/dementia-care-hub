BEGIN;
CREATE TABLE IF NOT EXISTS rcbc.sessions (
 token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES rcbc.users(id),
 csrf_token text NOT NULL, expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON rcbc.sessions(expires_at);
ALTER TABLE rcbc.trainer_access_requests ADD COLUMN IF NOT EXISTS requested_password_hash text;
ALTER TABLE rcbc.trainer_access_requests ADD CONSTRAINT request_hash_argon CHECK (requested_password_hash IS NULL OR requested_password_hash ~ '^\$argon2id\$');
CREATE TABLE IF NOT EXISTS rcbc.enquiries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL,email text NOT NULL,
 type text NOT NULL,message text NOT NULL,status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','in_progress','resolved')),
 admin_comment text, created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rcbc.content_pages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),slug text NOT NULL,locale text NOT NULL REFERENCES rcbc.languages(code),
 title text NOT NULL,body text NOT NULL,section text NOT NULL,source_note text,
 status rcbc.review_status NOT NULL DEFAULT 'draft',admin_comment text,
 reviewed_by uuid REFERENCES rcbc.users(id),reviewed_at timestamptz,last_reviewed_at timestamptz,next_review_on date,
 published_at timestamptz,archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(slug,locale), CHECK(published_at IS NULL OR (status='approved' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE TRIGGER audit_change AFTER INSERT OR UPDATE OR DELETE ON rcbc.enquiries FOR EACH ROW EXECUTE FUNCTION rcbc.record_change();
CREATE TRIGGER audit_change AFTER INSERT OR UPDATE OR DELETE ON rcbc.content_pages FOR EACH ROW EXECUTE FUNCTION rcbc.record_change();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON rcbc.enquiries FOR EACH ROW EXECUTE FUNCTION rcbc.touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON rcbc.content_pages FOR EACH ROW EXECUTE FUNCTION rcbc.touch_updated_at();
REVOKE ALL ON ALL TABLES IN SCHEMA rcbc FROM PUBLIC;
COMMIT;
