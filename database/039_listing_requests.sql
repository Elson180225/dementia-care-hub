-- SCRUM-229: private moderation queue; never publishes directory entries.
CREATE TABLE listing_request_settings (
    singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
    mode text NOT NULL DEFAULT 'closed' CHECK (mode IN ('closed', 'invitation_only', 'open')),
    updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO listing_request_settings (singleton, mode) VALUES (true, 'closed');

CREATE TABLE listing_request_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash text NOT NULL UNIQUE,
    email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
    request_type text NOT NULL CHECK (request_type IN ('apply', 'update')),
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
    used_at timestamptz,
    revoked_at timestamptz,
    CHECK (expires_at > created_at)
);

CREATE TABLE listing_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type text NOT NULL CHECK (request_type IN ('apply', 'update')),
    listing_id uuid,
    organisation_name text NOT NULL CHECK (char_length(btrim(organisation_name)) BETWEEN 1 AND 200),
    contact_name text NOT NULL CHECK (char_length(btrim(contact_name)) BETWEEN 1 AND 200),
    email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
    phone text CHECK (char_length(phone) <= 80),
    details text NOT NULL CHECK (char_length(btrim(details)) BETWEEN 1 AND 5000),
    consent_at timestamptz NOT NULL,
    invitation_id uuid UNIQUE REFERENCES listing_request_invitations(id),
    status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'closed')),
    admin_note text NOT NULL DEFAULT '' CHECK (char_length(admin_note) <= 5000),
    submitted_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (request_type <> 'apply' OR listing_id IS NULL)
);
CREATE INDEX listing_requests_queue_idx ON listing_requests (status, submitted_at DESC);
