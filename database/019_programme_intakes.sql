-- Programme definitions live in RCBC CMS JSON; IDs are validated by the API.
-- No title-based backfill: RCBC explicitly links each existing intake.
ALTER TABLE activities ADD COLUMN programme_id text;
CREATE INDEX activities_programme_id_idx ON activities(programme_id);
