-- REVIEW DRAFT: deliberately excluded from scripts/migrate.js.
-- Apply only alongside the API changes described in docs/admin-schema-draft.md.
-- Requires migrations 001, 003 and 004. No application data is reset.

-- An application is not an approved trainer profile or a public account.
-- The nullable user link permits approval before account activation/provisioning.
CREATE TABLE trainer_access_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid UNIQUE REFERENCES users(id),
 name text NOT NULL CHECK (length(btrim(name)) > 0),
 email text NOT NULL CHECK (length(btrim(email)) > 0),
 city text NOT NULL CHECK (length(btrim(city)) > 0),
 claimed_certificate_ref text NOT NULL CHECK (length(btrim(claimed_certificate_ref)) > 0),
 status text NOT NULL DEFAULT 'submitted'
   CHECK (status IN ('submitted','approved','returned','rejected')),
 admin_comment text NOT NULL DEFAULT '',
 submitted_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 reviewed_by uuid REFERENCES users(id),
 reviewed_at timestamptz,
 CHECK ((status = 'submitted' AND reviewed_by IS NULL AND reviewed_at IS NULL)
     OR (status <> 'submitted' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
 CHECK (status NOT IN ('returned','rejected') OR length(btrim(admin_comment)) > 0)
);
CREATE UNIQUE INDEX trainer_access_request_email ON trainer_access_requests(lower(email));
CREATE INDEX trainer_access_request_queue ON trainer_access_requests(status,submitted_at);
CREATE VIEW approved_trainer_accounts AS
 SELECT u.id,u.name,u.email FROM users u JOIN trainer_access_requests r ON r.user_id=u.id
 WHERE u.role='trainer' AND u.enabled AND r.status='approved';

-- A source citation need not be a URL (e.g. RCBC's own verification call).
-- Review freshness and public visibility are independent dimensions.
ALTER TABLE organisations
 ADD COLUMN source text,
 ADD COLUMN language text NOT NULL DEFAULT 'English',
 ADD COLUMN review_status text NOT NULL DEFAULT 'needs review'
   CHECK (review_status IN ('current','needs review','archived')),
 ADD COLUMN publication_status text NOT NULL DEFAULT 'unpublished'
   CHECK (publication_status IN ('unpublished','published')),
 ADD CONSTRAINT organisation_archive_hidden CHECK (review_status <> 'archived' OR publication_status='unpublished'),
 ADD CONSTRAINT organisation_current_reviewed CHECK (review_status <> 'current' OR last_reviewed_at IS NOT NULL);
ALTER TABLE learning_resources
 ADD COLUMN source text,
 ADD COLUMN review_status text NOT NULL DEFAULT 'needs review'
   CHECK (review_status IN ('current','needs review','archived')),
 ADD COLUMN publication_status text NOT NULL DEFAULT 'unpublished'
   CHECK (publication_status IN ('unpublished','published')),
 ADD CONSTRAINT resource_archive_hidden CHECK (review_status <> 'archived' OR publication_status='unpublished'),
 ADD CONSTRAINT resource_current_reviewed CHECK (review_status <> 'current' OR last_reviewed_at IS NOT NULL);
ALTER TABLE content_pages
 ADD COLUMN source text,
 ADD COLUMN review_status text NOT NULL DEFAULT 'needs review'
   CHECK (review_status IN ('current','needs review','archived')),
 ADD COLUMN publication_status text NOT NULL DEFAULT 'unpublished'
   CHECK (publication_status IN ('unpublished','published')),
 ADD CONSTRAINT content_archive_hidden CHECK (review_status <> 'archived' OR publication_status='unpublished'),
 ADD CONSTRAINT content_current_reviewed CHECK (review_status <> 'current' OR last_reviewed_at IS NOT NULL);

-- Preserve existing publication/archive state when moving to separate columns.
UPDATE organisations SET source=source_url,
 publication_status=CASE WHEN status='published' THEN 'published' ELSE 'unpublished' END,
 review_status=CASE WHEN status='archived' THEN 'archived'
                   WHEN last_reviewed_at IS NOT NULL THEN 'current' ELSE 'needs review' END;
UPDATE learning_resources SET source=source_url,
 publication_status=CASE WHEN status='published' THEN 'published' ELSE 'unpublished' END,
 review_status=CASE WHEN status='archived' THEN 'archived'
                   WHEN last_reviewed_at IS NOT NULL THEN 'current' ELSE 'needs review' END;
UPDATE content_pages SET source=source_url,
 publication_status=CASE WHEN status='published' THEN 'published' ELSE 'unpublished' END,
 review_status=CASE WHEN status='archived' THEN 'archived'
                   WHEN last_reviewed_at IS NOT NULL THEN 'current' ELSE 'needs review' END;

-- FAQs are independently maintainable records, not copies of whole content pages.
CREATE TABLE faqs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 slug text NOT NULL, language text NOT NULL,
 question text NOT NULL, answer text NOT NULL, category text,
 source text, source_url text, last_reviewed_at timestamptz, next_review_at timestamptz,
 review_status text NOT NULL DEFAULT 'needs review'
   CHECK (review_status IN ('current','needs review','archived')),
 publication_status text NOT NULL DEFAULT 'unpublished'
   CHECK (publication_status IN ('unpublished','published')),
 admin_comment text NOT NULL DEFAULT '',
 UNIQUE(slug,language),
 CHECK (review_status <> 'archived' OR publication_status='unpublished'),
 CHECK (review_status <> 'current' OR last_reviewed_at IS NOT NULL)
);
CREATE TRIGGER access_request_audit AFTER INSERT OR UPDATE OR DELETE ON trainer_access_requests
 FOR EACH ROW EXECUTE FUNCTION audit_record();
CREATE TRIGGER faq_audit AFTER INSERT OR UPDATE OR DELETE ON faqs
 FOR EACH ROW EXECUTE FUNCTION audit_record();

ALTER TABLE audit_log ADD COLUMN decision text,
 ADD COLUMN from_status text, ADD COLUMN to_status text;
ALTER TABLE audit_log ADD CONSTRAINT explicit_admin_decision CHECK (
 operation <> 'DECISION' OR (actor_id IS NOT NULL AND decision IS NOT NULL)
);
CREATE INDEX audit_record_history ON audit_log(entity,record_id,changed_at);

-- Use in the same transaction as the actual decision UPDATE. Do not call it
-- for failed decisions. Actor identity comes from server session transaction context.
-- Entity/ID refer to the canonical record; no second history table is needed.
CREATE FUNCTION record_admin_decision(
 p_entity text, p_record_id uuid, p_decision text, p_comment text,
 p_from_status text, p_to_status text
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_actor uuid := nullif(current_setting('app.actor_id',true),'')::uuid;
BEGIN
 IF NOT EXISTS (SELECT 1 FROM users WHERE id=v_actor AND role='admin' AND enabled) THEN
  RAISE EXCEPTION 'Enabled RCBC admin required' USING ERRCODE='42501';
 END IF;
 IF p_entity NOT IN ('trainer_access_requests','trainer_profiles','activities','completions',
                     'organisations','learning_resources','content_pages','faqs','dcs_certificates') THEN
  RAISE EXCEPTION 'Unsupported decision entity';
 END IF;
 IF p_decision NOT IN ('approved','returned','rejected','published','unpublished','completed',
                       'verified','archived','corrected','marked needs review') THEN
  RAISE EXCEPTION 'Unsupported admin decision';
 END IF;
 IF p_decision IN ('returned','rejected') AND length(btrim(coalesce(p_comment,'')))=0 THEN
  RAISE EXCEPTION 'Return or rejection comment required';
 END IF;
 INSERT INTO audit_log(actor_id,entity,record_id,operation,decision,admin_comment,from_status,to_status)
 VALUES(v_actor,p_entity,p_record_id::text,'DECISION',p_decision,coalesce(p_comment,''),p_from_status,p_to_status);
END $$;

-- Activity creator already references users, whose only roles are admin/trainer.
CREATE VIEW activity_creators AS
 SELECT a.id AS activity_id,a.created_by,u.name AS creator_name,u.role AS creator_role
 FROM activities a JOIN users u ON u.id=a.created_by;

-- public visibility must consult publication_status; review status is also
-- available to display a review warning. No privileged/private fields selected.
CREATE VIEW public_faqs AS
 SELECT id,slug,language,question,answer,category,source,source_url,last_reviewed_at,review_status
 FROM faqs WHERE publication_status='published' AND review_status<>'archived';
