-- Keep historical records; enforce one active registration per normalised phone.
CREATE FUNCTION registration_phone_key(value text) RETURNS text LANGUAGE sql IMMUTABLE STRICT AS $$
 SELECT CASE WHEN digits LIKE '0%' THEN '60'||substring(digits from 2) ELSE digits END
 FROM (SELECT CASE WHEN raw LIKE '00%' THEN substring(raw from 3) ELSE raw END AS digits
 FROM (SELECT regexp_replace(value,'[^0-9]','','g') AS raw) r) d
$$;
ALTER TABLE event_participants DROP CONSTRAINT event_participants_activity_id_email_key;
-- Grandfather existing duplicates without changing their registration or payment status.
ALTER TABLE event_participants ADD COLUMN legacy_shared_phone boolean NOT NULL DEFAULT false;
WITH ranked AS (
 SELECT id,row_number() OVER(PARTITION BY activity_id,registration_phone_key(phone) ORDER BY imported_at,id) AS position
 FROM event_participants WHERE status='registered' AND registration_phone_key(phone)<>''
) UPDATE event_participants p SET legacy_shared_phone=true FROM ranked r WHERE r.id=p.id AND r.position>1;
CREATE UNIQUE INDEX participant_active_phone ON event_participants(activity_id,registration_phone_key(phone))
 WHERE status='registered' AND NOT legacy_shared_phone AND registration_phone_key(phone)<>'';
CREATE FUNCTION enforce_registration_phone() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='UPDATE' THEN
  IF NEW.phone IS NOT DISTINCT FROM OLD.phone AND NEW.status IS NOT DISTINCT FROM OLD.status AND NEW.activity_id=OLD.activity_id THEN
   NEW.legacy_shared_phone=OLD.legacy_shared_phone;
   RETURN NEW;
  END IF;
 END IF;
 NEW.legacy_shared_phone=false;
 IF NEW.status='registered' THEN
  PERFORM id FROM activities WHERE id=NEW.activity_id FOR UPDATE;
  IF registration_phone_key(NEW.phone)='' OR length(registration_phone_key(NEW.phone)) NOT BETWEEN 7 AND 15 THEN
   RAISE EXCEPTION 'A valid WhatsApp phone number is required' USING ERRCODE='23514';
  END IF;
  IF EXISTS(SELECT 1 FROM event_participants WHERE activity_id=NEW.activity_id AND id<>NEW.id AND status='registered' AND registration_phone_key(phone)=registration_phone_key(NEW.phone)) THEN
   RAISE EXCEPTION 'Phone already registered for this intake' USING ERRCODE='23505';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER participant_phone_guard BEFORE INSERT OR UPDATE ON event_participants FOR EACH ROW EXECUTE FUNCTION enforce_registration_phone();
ALTER TABLE files DROP CONSTRAINT files_kind_check;
ALTER TABLE files ADD CONSTRAINT files_kind_check CHECK(kind IN ('photo','document','poster','activity-photo','payment-evidence'));
ALTER TABLE event_participants ADD COLUMN payment_evidence_file_id uuid REFERENCES files(id);
UPDATE event_registration_settings SET ask_phone=true,ask_notes=true;
UPDATE event_participants p SET registration_state='confirmed',confirmed_at=coalesce(confirmed_at,now()) FROM event_registration_settings s WHERE s.activity_id=p.activity_id AND NOT s.paid AND p.status='registered';
