ALTER TABLE trainer_access_requests ADD COLUMN certificate_file_id uuid REFERENCES files(id);
ALTER TABLE trainer_profiles ADD COLUMN certificate_file_id uuid REFERENCES files(id);
