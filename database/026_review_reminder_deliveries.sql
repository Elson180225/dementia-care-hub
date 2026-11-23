CREATE TABLE review_reminder_deliveries (
 review_day date PRIMARY KEY,
 status text NOT NULL CHECK (status IN ('sending', 'sent', 'uncertain')),
 attempted_at timestamptz NOT NULL DEFAULT now(),
 sent_at timestamptz,
 provider_message_id text
);
