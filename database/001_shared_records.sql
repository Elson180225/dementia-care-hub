CREATE TABLE users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL,
 password_hash text NOT NULL, name text NOT NULL,
 role text NOT NULL CHECK(role IN ('admin','trainer')),
 enabled boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_unique ON users(lower(email));
CREATE TABLE trainer_profiles (
 id uuid PRIMARY KEY REFERENCES users(id), city text NOT NULL DEFAULT '', language text NOT NULL DEFAULT 'English',
 short_profile text NOT NULL DEFAULT '', qualifications text NOT NULL DEFAULT '', experience text NOT NULL DEFAULT '',
 photo_url text, supporting_documents jsonb NOT NULL DEFAULT '[]',
 certified_status text NOT NULL DEFAULT 'pending' CHECK(certified_status IN ('pending','certified','suspended')),
 certificate_ref text UNIQUE, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','approved','returned')),
 admin_comment text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE organisations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, category text NOT NULL,
 services text[] NOT NULL DEFAULT '{}', specialist_field text, address text, city text, state text, postcode text,
 latitude numeric, longitude numeric, contact_name text, phone text, email text, website text,
 languages text[] NOT NULL DEFAULT '{}', opening_hours text, eligibility text, fees text,
 accepting_volunteers boolean NOT NULL DEFAULT false, volunteer_details text, support_group boolean NOT NULL DEFAULT false,
 source_url text, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','verified','published','archived')),
 last_reviewed_at timestamptz, next_review_at timestamptz, correction_notes text, admin_comment text
);
CREATE TABLE activities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_by uuid NOT NULL REFERENCES users(id),
 organiser_id uuid REFERENCES organisations(id), title text NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz,
 type text NOT NULL CHECK(type IN ('Workshop','Seminar')), mode text NOT NULL CHECK(mode IN ('Online','Physical')),
 city text NOT NULL DEFAULT '', venue text NOT NULL DEFAULT '', language text NOT NULL, audience text NOT NULL,
 description text NOT NULL, poster_url text, registration_link text, planned_hours numeric(7,2) NOT NULL CHECK(planned_hours > 0),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','approved','returned','published','completed','verified','archived')),
 admin_comment text NOT NULL DEFAULT '', published_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(ends_at IS NULL OR ends_at >= starts_at)
);
CREATE TABLE activity_trainers (
 activity_id uuid REFERENCES activities(id) ON DELETE CASCADE, trainer_id uuid REFERENCES trainer_profiles(id),
 role text NOT NULL CHECK(role IN ('Trainer','Co-Trainer','Speaker')), PRIMARY KEY(activity_id, trainer_id)
);
CREATE TABLE completions (
 activity_id uuid PRIMARY KEY REFERENCES activities(id), actual_venue text NOT NULL,
 participants integer NOT NULL CHECK(participants >= 0), actual_hours numeric(7,2) NOT NULL CHECK(actual_hours > 0),
 photos jsonb NOT NULL DEFAULT '[]', status text NOT NULL CHECK(status IN ('submitted','verified','returned')),
 admin_comment text NOT NULL DEFAULT '', verified_by uuid REFERENCES users(id), verified_at timestamptz,
 CHECK((status = 'verified') = (verified_by IS NOT NULL AND verified_at IS NOT NULL))
);
CREATE TABLE learning_resources (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), activity_id uuid REFERENCES activities(id), title text NOT NULL,
 resource_type text NOT NULL, topic text, language text, audience text, description text, url text,
 copyright_permission text, source_url text, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','approved','published','returned','archived')),
 last_reviewed_at timestamptz, next_review_at timestamptz, admin_comment text
);
CREATE TABLE subscribers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL, name text, language text,
 consent_version text NOT NULL, consent_at timestamptz NOT NULL, confirmed_at timestamptz, unsubscribed_at timestamptz,
 source text NOT NULL DEFAULT 'get-updated', provider_reference text
);
CREATE UNIQUE INDEX subscriber_email_unique ON subscribers(lower(email));
CREATE TABLE dcs_certificates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), certificate_ref text UNIQUE NOT NULL, recipient_name text NOT NULL,
 programme text NOT NULL, issued_at date NOT NULL, issuer text NOT NULL, activity_id uuid REFERENCES activities(id),
 status text NOT NULL CHECK(status IN ('valid','revoked')), verification_consent_at timestamptz, admin_comment text
);
CREATE TABLE content_pages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL, language text NOT NULL, title text NOT NULL,
 body jsonb NOT NULL DEFAULT '{}', source_url text, reviewer text, last_reviewed_at timestamptz, next_review_at timestamptz,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','published','archived')), UNIQUE(slug,language)
);
CREATE TABLE audit_log (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor_id uuid REFERENCES users(id),
 entity text NOT NULL, record_id text NOT NULL, changed_at timestamptz NOT NULL DEFAULT now(),
 operation text NOT NULL, before_data jsonb, after_data jsonb, admin_comment text
);
CREATE FUNCTION audit_record() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO audit_log(actor_id,entity,record_id,operation,before_data,after_data,admin_comment)
 VALUES(nullif(current_setting('app.actor_id',true),'')::uuid,TG_TABLE_NAME,
 coalesce(to_jsonb(NEW)->>'id',to_jsonb(NEW)->>'activity_id',to_jsonb(OLD)->>'id',to_jsonb(OLD)->>'activity_id'),TG_OP,
 CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END,
 CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END,coalesce(to_jsonb(NEW)->>'admin_comment',''));
 RETURN NULL;
END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['trainer_profiles','activities','activity_trainers','completions','organisations','learning_resources','subscribers','dcs_certificates','content_pages'] LOOP
 EXECUTE format('CREATE TRIGGER record_audit AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION audit_record()',t);
 END LOOP;
END $$;
CREATE VIEW public_trainers AS SELECT p.id,u.name,p.city,p.language,p.short_profile,p.qualifications,p.experience,p.photo_url,p.certificate_ref
 FROM trainer_profiles p JOIN users u ON u.id=p.id WHERE p.status='approved' AND p.certified_status='certified' AND u.enabled;
CREATE VIEW annual_trainer_contributions AS
 SELECT t.trainer_id,extract(year FROM a.starts_at AT TIME ZONE 'Asia/Kuala_Lumpur')::int AS year,
 sum(c.actual_hours) AS hours,sum(c.participants) AS participants,count(*) AS activities
 FROM completions c JOIN activities a ON a.id=c.activity_id JOIN activity_trainers t ON t.activity_id=a.id
 WHERE c.status='verified' GROUP BY t.trainer_id,year;
CREATE VIEW annual_project_reach AS
 SELECT extract(year FROM a.starts_at AT TIME ZONE 'Asia/Kuala_Lumpur')::int AS year,
 sum(c.participants) AS participants,count(*) AS activities FROM completions c JOIN activities a ON a.id=c.activity_id
 WHERE c.status='verified' GROUP BY year;
