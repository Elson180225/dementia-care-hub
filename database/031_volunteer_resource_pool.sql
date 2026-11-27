CREATE TABLE IF NOT EXISTS volunteer_registrations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL, email text NOT NULL, phone text NOT NULL, city text NOT NULL,
 languages text NOT NULL, certificate text NOT NULL, experience text NOT NULL DEFAULT '',
 interest text NOT NULL DEFAULT '', availability text NOT NULL DEFAULT '',
 consent_version text NOT NULL, consent_at timestamptz NOT NULL DEFAULT now(),
 verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','not_verified')),
 verified_certificate_id uuid REFERENCES dcs_certificates(id) ON DELETE SET NULL,
 verified_by uuid REFERENCES users(id), verified_at timestamptz,
 record_status text NOT NULL DEFAULT 'active' CHECK (record_status IN ('active','withdrawn','archived')),
 withdrawn_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS volunteer_registrations_status_idx ON volunteer_registrations(record_status,verification_status);
