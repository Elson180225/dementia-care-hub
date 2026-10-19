ALTER TABLE subscribers ADD COLUMN city text NOT NULL DEFAULT '', ADD COLUMN state text NOT NULL DEFAULT '';
ALTER TABLE subscribers ALTER COLUMN name SET NOT NULL, ALTER COLUMN language SET NOT NULL;
ALTER TABLE dcs_certificates ADD COLUMN completion_date date, ADD COLUMN training_location text;
CREATE FUNCTION audit_user() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO audit_log(actor_id,entity,record_id,operation,before_data,after_data)
 VALUES(nullif(current_setting('app.actor_id',true),'')::uuid,'users',NEW.id::text,TG_OP,
 CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD)-'password_hash' END,to_jsonb(NEW)-'password_hash');
 RETURN NULL;
END $$;
CREATE TRIGGER user_audit AFTER INSERT OR UPDATE ON users FOR EACH ROW EXECUTE FUNCTION audit_user();
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE INDEX activities_date_status ON activities(status,starts_at);
CREATE INDEX trainer_activities ON activity_trainers(trainer_id);
