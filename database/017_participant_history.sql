ALTER TABLE event_participants ADD COLUMN removed_at timestamptz;
ALTER TABLE event_participants ADD COLUMN removed_by uuid REFERENCES users(id);
ALTER TABLE event_participants ADD COLUMN restored_at timestamptz;
ALTER TABLE event_participants ADD COLUMN restored_by uuid REFERENCES users(id);
