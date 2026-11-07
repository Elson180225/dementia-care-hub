CREATE TABLE track_applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), track_id text NOT NULL, track_title text NOT NULL,
 name text NOT NULL, email text NOT NULL, phone text NOT NULL, role text NOT NULL DEFAULT '',
 preferred_language text NOT NULL DEFAULT '', intake_location text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','under-review','accepted','waitlisted','declined')),
 submitted_at timestamptz NOT NULL DEFAULT now(), consent_at timestamptz NOT NULL DEFAULT now(),
 reviewed_by uuid REFERENCES users(id), reviewed_at timestamptz,
 UNIQUE(track_id,email)
);
