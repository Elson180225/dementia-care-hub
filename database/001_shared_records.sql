-- RCBC shared-record schema, first draft. PostgreSQL 15+.
-- Run once against an empty database: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/001_shared_records.sql
BEGIN;
CREATE SCHEMA rcbc;
SET search_path = rcbc, public;

CREATE TYPE account_role AS ENUM ('admin', 'certified_trainer');
CREATE TYPE review_status AS ENUM ('draft', 'submitted', 'approved', 'returned');
CREATE TYPE completion_review_status AS ENUM ('submitted', 'verified', 'returned');
CREATE TYPE activity_lifecycle AS ENUM ('planned', 'published', 'completed', 'verified', 'archived', 'cancelled');
CREATE TYPE trainer_role AS ENUM ('trainer', 'co_trainer', 'speaker');
CREATE TYPE delivery_mode AS ENUM ('online', 'physical');

CREATE TABLE users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text NOT NULL CHECK (btrim(email) <> ''),
 display_name text NOT NULL CHECK (btrim(display_name) <> ''),
 password_hash text NOT NULL CHECK (password_hash ~ '^\$argon2id\$'),
 role account_role NOT NULL,
 active boolean NOT NULL DEFAULT false,
 created_by uuid REFERENCES users(id),
 activated_by uuid REFERENCES users(id),
 activated_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (NOT active OR (activated_by IS NOT NULL AND activated_at IS NOT NULL))
);
CREATE UNIQUE INDEX users_email_unique ON users (lower(btrim(email)));

-- Requests are not accounts. An Admin creates/activates an account only after verification.
CREATE TABLE trainer_access_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK (btrim(name) <> ''),
 email text NOT NULL CHECK (btrim(email) <> ''),
 certificate_reference text NOT NULL CHECK (btrim(certificate_reference) <> ''),
 city text NOT NULL CHECK (btrim(city) <> ''),
 status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','approved','returned','rejected')),
 admin_comment text,
 reviewed_by uuid REFERENCES users(id), reviewed_at timestamptz,
 user_id uuid UNIQUE REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (status <> 'approved' OR (user_id IS NOT NULL AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
 CHECK (status NOT IN ('returned','rejected') OR nullif(btrim(admin_comment),'') IS NOT NULL)
);

CREATE TABLE languages (code text PRIMARY KEY, name text NOT NULL UNIQUE);
INSERT INTO languages VALUES ('en','English'),('ms','Bahasa Malaysia'),('zh','Chinese');

-- Metadata only; store bytes in private object storage, never in this table.
CREATE TABLE assets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 storage_key text NOT NULL UNIQUE,
 original_filename text NOT NULL, media_type text NOT NULL,
 byte_size bigint NOT NULL CHECK (byte_size > 0),
 uploaded_by uuid NOT NULL REFERENCES users(id),
 publication_approved boolean NOT NULL DEFAULT false,
 rights_note text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE trainer_profiles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL UNIQUE REFERENCES users(id),
 city text, language_code text REFERENCES languages(code),
 short_profile text, qualifications text, experience text,
 photo_asset_id uuid REFERENCES assets(id),
 certified_status text NOT NULL DEFAULT 'pending' CHECK (certified_status IN ('pending','certified','suspended','revoked')),
 certificate_reference text UNIQUE,
 status review_status NOT NULL DEFAULT 'draft', admin_comment text,
 reviewed_by uuid REFERENCES users(id), reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (certified_status <> 'certified' OR nullif(btrim(certificate_reference),'') IS NOT NULL),
 CHECK (status = 'draft' OR (nullif(btrim(city),'') IS NOT NULL AND language_code IS NOT NULL AND nullif(btrim(short_profile),'') IS NOT NULL)),
 CHECK (status <> 'approved' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
 CHECK (status <> 'returned' OR nullif(btrim(admin_comment),'') IS NOT NULL)
);
CREATE TABLE trainer_documents (
 trainer_id uuid NOT NULL REFERENCES trainer_profiles(id),
 asset_id uuid NOT NULL REFERENCES assets(id),
 description text,
 PRIMARY KEY (trainer_id, asset_id)
);

CREATE TABLE organisations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK (btrim(name) <> ''),
 registration_number text,
 kind text NOT NULL, -- healthcare_provider, support_group, NGO, care_facility, supplier, government, etc.
 city text NOT NULL, state text, address text,
 contact_email text, contact_phone text, official_url text,
 language_codes text[] NOT NULL DEFAULT '{}',
 focus text, activity_frequency text,
 accepting_volunteers boolean NOT NULL DEFAULT false,
 need_tags text[] NOT NULL DEFAULT '{}', support_type_tags text[] NOT NULL DEFAULT '{}',
 source_url text, source_note text,
 terms_accepted_at timestamptz, terms_version text,
 status review_status NOT NULL DEFAULT 'draft', admin_comment text,
 verified_by uuid REFERENCES users(id), verified_at timestamptz,
 last_reviewed_at timestamptz, next_review_on date,
 published_at timestamptz, archived_at timestamptz, removed_at timestamptz, correction_note text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (published_at IS NULL OR (status = 'approved' AND verified_by IS NOT NULL AND verified_at IS NOT NULL AND terms_accepted_at IS NOT NULL AND terms_version IS NOT NULL)),
 CHECK (status <> 'returned' OR nullif(btrim(admin_comment),'') IS NOT NULL)
);

-- Lookup permits RCBC webinars, DCS programmes and future events without duplicate event tables.
CREATE TABLE activity_types (code text PRIMARY KEY, name text NOT NULL UNIQUE, trainer_submittable boolean NOT NULL DEFAULT false);
INSERT INTO activity_types VALUES
 ('workshop','Workshop',true),('seminar','Seminar',true),('webinar','Webinar',false),
 ('dcs_family','DCS-Family',false),('dcs_ttt','DCS-TTT',false),('dcs_worker','DCS-Worker (future)',false),
 ('expo','Expo',false),('dialogue','Dialogue',false),('forum','Forum',false),('other','Other',false);

CREATE TABLE activities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_by uuid NOT NULL REFERENCES users(id),
 organiser_id uuid REFERENCES organisations(id),
 title text NOT NULL CHECK (btrim(title) <> ''),
 starts_at timestamptz, ends_at timestamptz,
 timezone text NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
 type_code text NOT NULL REFERENCES activity_types(code), mode delivery_mode,
 city text, venue text, language_code text REFERENCES languages(code),
 target_audience text, description text,
 poster_asset_id uuid REFERENCES assets(id),
 registration_url text CHECK (registration_url IS NULL OR registration_url ~ '^https?://'),
 registration_deadline timestamptz, capacity integer CHECK (capacity > 0),
 registration_closed boolean NOT NULL DEFAULT false,
 planned_hours numeric(8,2) CHECK (planned_hours > 0),
 status review_status NOT NULL DEFAULT 'draft', admin_comment text,
 reviewed_by uuid REFERENCES users(id), reviewed_at timestamptz,
 lifecycle activity_lifecycle NOT NULL DEFAULT 'planned',
 published_at timestamptz, completed_at timestamptz, archived_at timestamptz,
 cancelled_at timestamptz, cancellation_reason text,
 -- Completion is an optional component of THIS activity, not a second event.
 actual_venue text, participant_count integer CHECK (participant_count >= 0),
 actual_hours numeric(8,2) CHECK (actual_hours > 0),
 completion_status completion_review_status,
 completion_submitted_by uuid REFERENCES users(id), completion_submitted_at timestamptz,
 completion_admin_comment text,
 completion_reviewed_by uuid REFERENCES users(id), completion_reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (ends_at IS NULL OR ends_at >= starts_at),
 CHECK (registration_deadline IS NULL OR registration_deadline <= starts_at),
 CHECK (status = 'draft' OR (starts_at IS NOT NULL AND mode IS NOT NULL AND language_code IS NOT NULL
   AND nullif(btrim(target_audience),'') IS NOT NULL AND nullif(btrim(description),'') IS NOT NULL
   AND planned_hours IS NOT NULL AND (mode = 'online' OR (nullif(btrim(venue),'') IS NOT NULL AND nullif(btrim(city),'') IS NOT NULL)))),
 CHECK (status <> 'approved' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
 CHECK (status <> 'returned' OR nullif(btrim(admin_comment),'') IS NOT NULL),
 CHECK (lifecycle NOT IN ('published','completed','verified','archived') OR status = 'approved'),
 CHECK (lifecycle <> 'published' OR published_at IS NOT NULL),
 CHECK (lifecycle <> 'archived' OR archived_at IS NOT NULL),
 CHECK (lifecycle <> 'cancelled' OR (cancelled_at IS NOT NULL AND nullif(btrim(cancellation_reason),'') IS NOT NULL)),
 CHECK (completion_status IS NULL OR (status = 'approved' AND lifecycle IN ('completed','verified','archived')
   AND completed_at IS NOT NULL AND nullif(btrim(actual_venue),'') IS NOT NULL AND participant_count IS NOT NULL
   AND actual_hours IS NOT NULL AND completion_submitted_by IS NOT NULL AND completion_submitted_at IS NOT NULL)),
 CHECK (completion_status IS DISTINCT FROM 'returned' OR nullif(btrim(completion_admin_comment),'') IS NOT NULL),
 CHECK (completion_status IS DISTINCT FROM 'verified' OR (completion_reviewed_by IS NOT NULL AND completion_reviewed_at IS NOT NULL AND lifecycle IN ('verified','archived'))),
 CHECK (lifecycle <> 'verified' OR completion_status IS NOT DISTINCT FROM 'verified')
);
CREATE TABLE activity_trainers (
 activity_id uuid NOT NULL REFERENCES activities(id),
 trainer_id uuid NOT NULL REFERENCES trainer_profiles(id),
 role trainer_role NOT NULL,
 PRIMARY KEY (activity_id, trainer_id)
);
CREATE INDEX activity_trainers_trainer_idx ON activity_trainers(trainer_id);
CREATE INDEX activities_calendar_idx ON activities(lifecycle, starts_at, city, language_code);
CREATE INDEX activities_completion_queue_idx ON activities(completion_status) WHERE completion_status = 'submitted';

CREATE TABLE activity_assets (
 activity_id uuid NOT NULL REFERENCES activities(id),
 asset_id uuid NOT NULL REFERENCES assets(id),
 purpose text NOT NULL CHECK (purpose IN ('photo','recording','slides','qa','handout','other')),
 PRIMARY KEY (activity_id, asset_id)
);
CREATE TABLE learning_resources (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 activity_id uuid REFERENCES activities(id), -- optional for standalone learning materials
 title text NOT NULL, description text,
 resource_type text NOT NULL CHECK (resource_type IN ('recording','video','qa','slides','handout','guide','faq','other')),
 language_code text NOT NULL REFERENCES languages(code),
 asset_id uuid REFERENCES assets(id), external_url text CHECK (external_url IS NULL OR external_url ~ '^https?://'),
 source_note text, rights_note text,
 rights_approved boolean NOT NULL DEFAULT false,
 status review_status NOT NULL DEFAULT 'draft', admin_comment text,
 reviewed_by uuid REFERENCES users(id), reviewed_at timestamptz,
 last_reviewed_at timestamptz, next_review_on date,
 published_at timestamptz, archived_at timestamptz, correction_note text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (asset_id IS NOT NULL OR external_url IS NOT NULL),
 CHECK (published_at IS NULL OR (status = 'approved' AND rights_approved AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
 CHECK (status <> 'returned' OR nullif(btrim(admin_comment),'') IS NOT NULL)
);
-- Translations reference a shared record, never duplicate its identity or workflow.
CREATE TABLE activity_translations (
 activity_id uuid NOT NULL REFERENCES activities(id), locale text NOT NULL REFERENCES languages(code),
 title text NOT NULL, target_audience text, description text,
 PRIMARY KEY (activity_id, locale)
);
CREATE TABLE learning_resource_translations (
 resource_id uuid NOT NULL REFERENCES learning_resources(id), locale text NOT NULL REFERENCES languages(code),
 title text NOT NULL, description text,
 PRIMARY KEY (resource_id, locale)
);

CREATE TABLE subscribers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK (btrim(name) <> ''), email text NOT NULL CHECK (btrim(email) <> ''),
 city text NOT NULL CHECK (btrim(city) <> ''), state text NOT NULL CHECK (btrim(state) <> ''),
 preferred_language text NOT NULL REFERENCES languages(code),
 consent_given boolean NOT NULL CHECK (consent_given),
 consent_at timestamptz NOT NULL, consent_text_version text NOT NULL, privacy_notice_version text NOT NULL,
 consent_source text NOT NULL DEFAULT 'get_updated',
 unsubscribed_at timestamptz,
 unsubscribe_token_hash text NOT NULL UNIQUE, -- hash only; never store the email link token
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX subscribers_email_unique ON subscribers(lower(btrim(email)));
-- No subscriber phone, password or user_id.
CREATE TABLE dcs_certificates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 certificate_number text NOT NULL UNIQUE,
 participant_name text NOT NULL, -- participant need not be an account holder
 programme text NOT NULL CHECK (programme IN ('dcs_family','dcs_worker')),
 activity_id uuid REFERENCES activities(id),
 prerequisite_certificate_id uuid REFERENCES dcs_certificates(id),
 city text NOT NULL, completion_year integer NOT NULL CHECK (completion_year BETWEEN 1900 AND 9999),
 issued_on date NOT NULL,
 verification_status text NOT NULL CHECK (verification_status IN ('valid','revoked','superseded')),
 cpd_points numeric(8,2) CHECK (cpd_points >= 0),
 issued_by uuid NOT NULL REFERENCES users(id), revoked_at timestamptz, admin_comment text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (programme <> 'dcs_worker' OR prerequisite_certificate_id IS NOT NULL),
 CHECK (prerequisite_certificate_id IS DISTINCT FROM id)
);

CREATE TABLE audit_log (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 entity_table text NOT NULL, entity_id text NOT NULL,
 action text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
 actor_id uuid NOT NULL REFERENCES users(id),
 changed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 changed_fields text[] NOT NULL,
 old_values jsonb, new_values jsonb,
 admin_comment text,
 transaction_id bigint NOT NULL DEFAULT txid_current()
);
CREATE INDEX audit_entity_idx ON audit_log(entity_table, entity_id, changed_at);

-- Backend sets SET LOCAL rcbc.actor_id = '<authenticated user UUID>' within each transaction.
-- End users must never receive SQL access or be able to set this identity themselves.
CREATE FUNCTION record_change() RETURNS trigger LANGUAGE plpgsql SET search_path = rcbc, pg_temp AS $$
DECLARE before_row jsonb; after_row jsonb; actor uuid; fields text[]; row_id text;
BEGIN
 actor := nullif(current_setting('rcbc.actor_id', true), '')::uuid;
 IF actor IS NULL THEN RAISE EXCEPTION 'Authenticated audit actor is required'; END IF;
 IF TG_OP <> 'INSERT' THEN before_row := to_jsonb(OLD) - 'password_hash' - 'unsubscribe_token_hash'; END IF;
 IF TG_OP <> 'DELETE' THEN after_row := to_jsonb(NEW) - 'password_hash' - 'unsubscribe_token_hash'; END IF;
 SELECT array_agg(key ORDER BY key) INTO fields FROM (
   SELECT key FROM jsonb_object_keys(coalesce(before_row,'{}') || coalesce(after_row,'{}')) AS key
   WHERE (before_row -> key) IS DISTINCT FROM (after_row -> key)
 ) AS changes;
 -- Record credential changes without copying secrets into the audit log.
 IF TG_TABLE_NAME = 'users' AND TG_OP = 'UPDATE' THEN
   IF OLD.password_hash IS DISTINCT FROM NEW.password_hash THEN fields := array_append(fields,'password_hash'); END IF;
 END IF;
 row_id := coalesce(after_row->>'id',before_row->>'id',
   concat_ws(':',coalesce(after_row->>'activity_id',before_row->>'activity_id'),coalesce(after_row->>'trainer_id',before_row->>'trainer_id'),coalesce(after_row->>'asset_id',before_row->>'asset_id'),coalesce(after_row->>'resource_id',before_row->>'resource_id'),coalesce(after_row->>'locale',before_row->>'locale')));
 INSERT INTO audit_log(entity_table,entity_id,action,actor_id,changed_fields,old_values,new_values,admin_comment)
 VALUES (TG_TABLE_NAME,row_id,TG_OP,actor,coalesce(fields,'{}'),before_row,after_row,
   coalesce(nullif(current_setting('rcbc.admin_comment',true),''),after_row->>'completion_admin_comment',after_row->>'admin_comment'));
 RETURN NULL;
END $$;
CREATE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['users','trainer_access_requests','assets','trainer_profiles','organisations','activities','learning_resources','subscribers','dcs_certificates'] LOOP
   EXECUTE format('CREATE TRIGGER touch_updated_at BEFORE UPDATE ON rcbc.%I FOR EACH ROW EXECUTE FUNCTION rcbc.touch_updated_at()',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['users','trainer_access_requests','assets','trainer_profiles','trainer_documents','organisations','activities','activity_trainers','activity_assets','learning_resources','activity_translations','learning_resource_translations','subscribers','dcs_certificates'] LOOP
   EXECUTE format('CREATE TRIGGER audit_change AFTER INSERT OR UPDATE OR DELETE ON rcbc.%I FOR EACH ROW EXECUTE FUNCTION rcbc.record_change()',t);
 END LOOP;
END $$;
CREATE FUNCTION reject_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Audit history is append-only'; END $$;
CREATE TRIGGER immutable_audit BEFORE UPDATE OR DELETE OR TRUNCATE ON audit_log FOR EACH STATEMENT EXECUTE FUNCTION reject_audit_mutation();

-- One row per activity/trainer: no hour ledger and no repeated participant counts from asset joins.
CREATE VIEW verified_trainer_contributions AS
 SELECT a.id AS activity_id, at.trainer_id, at.role,
 extract(year FROM a.starts_at AT TIME ZONE 'Asia/Kuala_Lumpur')::integer AS year,
 a.actual_hours AS verified_hours, a.participant_count AS participants_reached
 FROM activities a JOIN activity_trainers at ON at.activity_id = a.id
 WHERE a.completion_status = 'verified' AND a.lifecycle IN ('verified','archived');
CREATE VIEW trainer_annual_totals AS
 SELECT trainer_id, year, count(*) AS activities_conducted,
 sum(verified_hours) AS verified_hours, sum(participants_reached) AS participants_reached
 FROM verified_trainer_contributions GROUP BY trainer_id, year;
CREATE VIEW project_annual_totals AS
 SELECT extract(year FROM starts_at AT TIME ZONE 'Asia/Kuala_Lumpur')::integer AS year,
 count(*) AS activities_conducted, sum(actual_hours) AS activity_hours,
 sum(participant_count) AS participant_attendances
 FROM activities WHERE completion_status = 'verified' AND lifecycle IN ('verified','archived')
 GROUP BY 1;
-- Explicit safe projection: public consumers never query the full profile or account tables.
CREATE VIEW public_trainers AS
 SELECT p.id, u.display_name AS name, p.certificate_reference, p.city, p.language_code,
 p.short_profile, p.qualifications, p.experience,
 CASE WHEN f.publication_approved THEN p.photo_asset_id END AS photo_asset_id
 FROM trainer_profiles p JOIN users u ON u.id=p.user_id LEFT JOIN assets f ON f.id=p.photo_asset_id
 WHERE p.status='approved' AND p.certified_status='certified' AND u.active;
CREATE VIEW public_activities AS
 SELECT id,title,starts_at,ends_at,timezone,type_code,mode,city,venue,language_code,
 target_audience,description,registration_url,registration_deadline,registration_closed,capacity,lifecycle,
 CASE WHEN EXISTS (SELECT 1 FROM assets f WHERE f.id=a.poster_asset_id AND f.publication_approved) THEN poster_asset_id END AS poster_asset_id
 FROM activities a WHERE status='approved' AND published_at IS NOT NULL
 AND lifecycle IN ('published','completed','verified','archived');

-- No public SQL access. Provision a separate non-owner backend role in deployment.
REVOKE ALL ON SCHEMA rcbc FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA rcbc FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA rcbc FROM PUBLIC;
COMMIT;
