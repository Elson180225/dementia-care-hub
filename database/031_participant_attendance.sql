-- Registration, actual attendance and DCS completion/certification are separate stages.
ALTER TABLE event_participants
 ADD COLUMN attendance_status text NOT NULL DEFAULT 'not-recorded'
   CHECK (attendance_status IN ('not-recorded','attended','absent')),
 ADD COLUMN attendance_recorded_at timestamptz,
 ADD COLUMN attendance_recorded_by uuid REFERENCES users(id);

-- Enforce eligibility when attendance is recorded. Later removal retains the history.
CREATE FUNCTION guard_participant_attendance() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP = 'INSERT' OR NEW.attendance_status IS DISTINCT FROM OLD.attendance_status THEN
  IF NEW.attendance_status = 'attended' AND
     (NEW.status <> 'registered' OR NEW.registration_state <> 'confirmed') THEN
   RAISE EXCEPTION 'Only active confirmed participants can be marked attended';
  END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER participant_attendance_eligibility BEFORE INSERT OR UPDATE ON event_participants
 FOR EACH ROW EXECUTE FUNCTION guard_participant_attendance();
