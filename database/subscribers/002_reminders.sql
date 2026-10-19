CREATE TABLE reminder_deliveries (
 activity_id uuid NOT NULL, starts_at timestamptz NOT NULL, subscriber_id uuid NOT NULL REFERENCES subscribers(id),
 status text NOT NULL CHECK(status IN ('sending','sent','retry','failed','uncertain','suppressed','cancelled')),
 attempts integer NOT NULL DEFAULT 1, attempted_at timestamptz NOT NULL DEFAULT now(),
 next_attempt_at timestamptz, sent_at timestamptz, provider_message_id text, error text,
 PRIMARY KEY(activity_id,starts_at,subscriber_id)
);
CREATE INDEX reminder_delivery_retry ON reminder_deliveries(status,next_attempt_at);
ALTER TABLE reminder_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON reminder_deliveries FROM PUBLIC;
DO $$ DECLARE r text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON reminder_deliveries FROM %I',r); END IF;
 END LOOP;
END $$;
