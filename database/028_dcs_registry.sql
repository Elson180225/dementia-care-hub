-- No automatic migration of legacy identities or approvals.
CREATE TABLE dcs_registry_participants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 participant_key text UNIQUE NOT NULL CHECK(length(participant_key) BETWEEN 3 AND 100),
 name text NOT NULL, email text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE dcs_registry_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 participant_id uuid NOT NULL REFERENCES dcs_registry_participants(id),
 programme text NOT NULL, intake text NOT NULL,
 training_location text NOT NULL CHECK(length(trim(training_location)) BETWEEN 1 AND 200),
 attendance_date date NOT NULL,
 activity_id uuid REFERENCES activities(id),
 organiser text NOT NULL CHECK(length(trim(organiser)) BETWEEN 1 AND 200),
 source_reference text NOT NULL CHECK(length(trim(source_reference)) BETWEEN 1 AND 200),
 assessment_reference text NOT NULL DEFAULT '' CHECK(length(assessment_reference)<=2000),
 evidence_reference text NOT NULL DEFAULT '' CHECK(length(evidence_reference)<=2000),
 status text NOT NULL CHECK(status IN ('attended','completed')),
 completion_date date, certificate_ref text, issued_at date, issuer text,
 verified boolean NOT NULL DEFAULT false,
 public_consent boolean NOT NULL DEFAULT false,
 approved_public_display boolean NOT NULL DEFAULT false,
 reviewed_by uuid REFERENCES users(id), reviewed_at timestamptz,
 consent_note text NOT NULL DEFAULT '',
 legacy_certificate_id uuid UNIQUE REFERENCES dcs_certificates(id),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(participant_id,programme,intake),
 CHECK(completion_date IS NULL OR completion_date>=attendance_date),
 CHECK(NOT approved_public_display OR (verified AND public_consent)),
 CHECK(status<>'completed' OR completion_date IS NOT NULL),
 CHECK((certificate_ref IS NULL AND issued_at IS NULL AND issuer IS NULL) OR
 (certificate_ref IS NOT NULL AND issued_at IS NOT NULL AND issuer IS NOT NULL AND status='completed' AND issued_at>=completion_date)),
 CHECK(NOT public_consent OR length(trim(consent_note))>0)
);
CREATE UNIQUE INDEX dcs_registry_certificate_ref ON dcs_registry_records(lower(certificate_ref));
CREATE INDEX dcs_registry_public ON dcs_registry_records(programme,training_location,attendance_date) WHERE verified AND public_consent AND approved_public_display;
CREATE TRIGGER dcs_registry_participants_audit AFTER INSERT OR UPDATE OR DELETE ON dcs_registry_participants FOR EACH ROW EXECUTE FUNCTION audit_record();
CREATE TRIGGER dcs_registry_records_audit AFTER INSERT OR UPDATE OR DELETE ON dcs_registry_records FOR EACH ROW EXECUTE FUNCTION audit_record();
-- Legacy backfill is an explicit admin action per certificate, with a supplied stable
-- participant_key and intake. It never copies verification/consent approvals.
