CREATE TABLE event_registration_settings (
 activity_id uuid PRIMARY KEY REFERENCES activities(id), enabled boolean NOT NULL DEFAULT false,
 paid boolean NOT NULL DEFAULT false, fee text NOT NULL DEFAULT '', instructions text NOT NULL DEFAULT '',
 website_enabled boolean NOT NULL DEFAULT true, google_url text NOT NULL DEFAULT '',
 ask_phone boolean NOT NULL DEFAULT false, ask_notes boolean NOT NULL DEFAULT false,
 updated_by uuid REFERENCES users(id), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE event_participants ADD COLUMN registration_state text NOT NULL DEFAULT 'submitted'
 CHECK(registration_state IN ('submitted','pending-payment','confirmed'));
ALTER TABLE event_participants ADD COLUMN registration_source text NOT NULL DEFAULT 'google-import';
ALTER TABLE event_participants ADD COLUMN notes text NOT NULL DEFAULT '';
ALTER TABLE event_participants ADD COLUMN consent_at timestamptz;
ALTER TABLE event_participants ADD COLUMN payment_reference text NOT NULL DEFAULT '';
ALTER TABLE event_participants ADD COLUMN payment_verified_by uuid REFERENCES users(id);
ALTER TABLE event_participants ADD COLUMN payment_verified_at timestamptz;
ALTER TABLE event_participants ADD COLUMN confirmed_by uuid REFERENCES users(id);
ALTER TABLE event_participants ADD COLUMN confirmed_at timestamptz;
CREATE TABLE event_confirmation_deliveries (
 participant_id uuid PRIMARY KEY REFERENCES event_participants(id), status text NOT NULL CHECK(status IN ('sending','sent','failed','uncertain')),
 attempted_at timestamptz NOT NULL DEFAULT now(), attempted_by uuid REFERENCES users(id), provider_id text, error text
);
