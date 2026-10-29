CREATE TABLE participant_imports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), activity_id uuid NOT NULL REFERENCES activities(id),
 filename text NOT NULL, imported_by uuid NOT NULL REFERENCES users(id), imported_at timestamptz NOT NULL DEFAULT now(),
 added integer NOT NULL, skipped integer NOT NULL
);
CREATE TABLE event_participants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), activity_id uuid NOT NULL REFERENCES activities(id),
 name text NOT NULL, email text NOT NULL, phone text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'registered' CHECK(status IN ('registered','cancelled')),
 imported_at timestamptz NOT NULL DEFAULT now(), import_id uuid REFERENCES participant_imports(id),
 UNIQUE(activity_id,email)
);
CREATE TABLE participant_reminders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), participant_id uuid NOT NULL REFERENCES event_participants(id),
 subject text NOT NULL, message text NOT NULL, created_by uuid NOT NULL REFERENCES users(id),
 status text NOT NULL CHECK(status IN ('sending','sent','failed','uncertain')),
 created_at timestamptz NOT NULL DEFAULT now(), provider_id text, error text,
 UNIQUE(participant_id,subject,message)
);
