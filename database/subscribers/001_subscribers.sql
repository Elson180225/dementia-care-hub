CREATE TABLE IF NOT EXISTS subscribers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL, name text NOT NULL,
 city text NOT NULL DEFAULT '', state text NOT NULL DEFAULT '', language text NOT NULL,
 consent_version text NOT NULL, consent_at timestamptz NOT NULL, confirmed_at timestamptz,
 unsubscribed_at timestamptz, source text NOT NULL DEFAULT 'get-updated', provider_reference text, unsubscribe_hash text
);
CREATE UNIQUE INDEX IF NOT EXISTS subscriber_email_unique ON subscribers(lower(email));
CREATE TABLE IF NOT EXISTS subscriber_audit_log (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor_id uuid, entity text NOT NULL, record_id text NOT NULL,
 changed_at timestamptz NOT NULL DEFAULT now(), operation text NOT NULL, before_data jsonb, after_data jsonb,
 admin_comment text, decision text, from_status text, to_status text
);
CREATE OR REPLACE FUNCTION audit_subscriber_record() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO subscriber_audit_log(actor_id,entity,record_id,operation,before_data,after_data)
 VALUES(nullif(current_setting('app.actor_id',true),'')::uuid,'subscribers',coalesce(NEW.id,OLD.id)::text,TG_OP,
 CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END,CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END);
 RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS record_audit ON subscribers;
DROP TRIGGER IF EXISTS subscriber_record_audit ON subscribers;
CREATE TRIGGER subscriber_record_audit AFTER INSERT OR UPDATE OR DELETE ON subscribers
 FOR EACH ROW EXECUTE FUNCTION audit_subscriber_record();
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriber_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON subscribers, subscriber_audit_log FROM PUBLIC;
DO $$ DECLARE r text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN
   EXECUTE format('REVOKE ALL ON subscribers, subscriber_audit_log FROM %I',r);
  END IF;
 END LOOP;
END $$;
