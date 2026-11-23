CREATE TABLE event_attendance_reminders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 activity_id uuid NOT NULL REFERENCES activities(id),
 starts_at timestamptz NOT NULL,
 participant_id uuid NOT NULL REFERENCES event_participants(id),
 status text NOT NULL CHECK (status IN ('sending','sent','retry','failed','uncertain','cancelled')),
 attempts integer NOT NULL DEFAULT 1,
 attempted_at timestamptz NOT NULL DEFAULT now(),
 next_attempt_at timestamptz,
 sent_at timestamptz,
 provider_message_id text,
 error text,
 UNIQUE (activity_id,starts_at,participant_id)
);
