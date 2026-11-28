-- Publication permission is separate from activity/completion status.
ALTER TABLE activities
 ADD COLUMN content_approval_status text NOT NULL DEFAULT 'pending' CHECK(content_approval_status IN ('pending','approved')),
 ADD COLUMN content_approved_by uuid REFERENCES users(id),
 ADD COLUMN content_approved_at timestamptz,
 ADD COLUMN source_url text NOT NULL DEFAULT '',
 ADD COLUMN speaker_name text NOT NULL DEFAULT '',
 ADD COLUMN speaker_intro text NOT NULL DEFAULT '',
 ADD COLUMN recording_url text NOT NULL DEFAULT '',
 ADD COLUMN qa_url text NOT NULL DEFAULT '',
 ADD COLUMN qa_text text NOT NULL DEFAULT '';
-- Preserve existing non-seeded publication decisions. Historical source material
-- must be explicitly reviewed; no content, participants or evidence is deleted.
UPDATE activities SET content_approval_status='approved' WHERE id::text NOT LIKE 'a0000001-0000-0000-0000-%';
CREATE FUNCTION historical_activity_review() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.id::text LIKE 'a0000001-0000-0000-0000-%' THEN NEW.content_approval_status='pending'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER historical_activity_review_guard BEFORE INSERT ON activities FOR EACH ROW EXECUTE FUNCTION historical_activity_review();
INSERT INTO event_registration_settings(activity_id,enabled,paid,website_enabled)
 SELECT id,false,false,false FROM activities WHERE type='RCBC Webinar'
 ON CONFLICT(activity_id) DO NOTHING;
-- Existing separately maintained cards have no publication review history.
INSERT INTO learn_events_content_history(data,revision) SELECT data,revision FROM learn_events_content WHERE id='main';
UPDATE learn_events_content SET data=jsonb_set(jsonb_set(data,'{onlineEducation,upcomingTopics}',
 coalesce((SELECT jsonb_agg(item || jsonb_build_object('publicationStatus','pending')) FROM jsonb_array_elements(coalesce(data#>'{onlineEducation,upcomingTopics}','[]')) item),'[]')),
 '{onlineEducation,approvedResources}',coalesce((SELECT jsonb_agg(item || jsonb_build_object('publicationStatus','pending')) FROM jsonb_array_elements(coalesce(data#>'{onlineEducation,approvedResources}','[]')) item),'[]')),revision=revision+1 WHERE id='main';
