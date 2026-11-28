CREATE SEQUENCE activity_reference_sequence;
ALTER TABLE activities ADD COLUMN activity_reference text UNIQUE NOT NULL DEFAULT ('ACT-' || lpad(nextval('activity_reference_sequence')::text,6,'0')),
 ADD COLUMN organiser_kind text NOT NULL DEFAULT 'rcbc' CHECK(organiser_kind IN ('rcbc','joint','independent')),
 ADD COLUMN organiser_name text NOT NULL DEFAULT 'RCBC',
 ADD COLUMN postponed_at timestamptz, ADD COLUMN postponement_reason text NOT NULL DEFAULT '';
ALTER TABLE completions ADD COLUMN actual_starts_at timestamptz, ADD COLUMN actual_ends_at timestamptz,
 ADD CONSTRAINT completion_timing CHECK ((actual_starts_at IS NULL AND actual_ends_at IS NULL) OR
 (actual_starts_at IS NOT NULL AND actual_ends_at IS NOT NULL AND actual_ends_at>actual_starts_at AND actual_hours<=extract(epoch FROM (actual_ends_at-actual_starts_at))/3600));
ALTER TABLE activity_trainers ADD COLUMN topic text NOT NULL DEFAULT '',
 ADD COLUMN contribution_status text NOT NULL DEFAULT 'pending' CHECK(contribution_status IN ('pending','confirmed','verified','returned')),
 ADD COLUMN confirmed_at timestamptz, ADD COLUMN reviewed_by uuid REFERENCES users(id), ADD COLUMN reviewed_at timestamptz,
 ADD COLUMN review_comment text NOT NULL DEFAULT '';
UPDATE activity_trainers t SET contribution_status='verified',reviewed_by=c.verified_by,reviewed_at=c.verified_at
 FROM completions c WHERE c.activity_id=t.activity_id AND c.status='verified' AND t.actual_hours IS NOT NULL;
CREATE OR REPLACE VIEW annual_trainer_contributions AS
 SELECT t.trainer_id,extract(year FROM coalesce(c.actual_starts_at,a.starts_at) AT TIME ZONE 'Asia/Kuala_Lumpur')::int AS year,
 sum(coalesce(t.actual_hours,0)) AS hours,sum(c.participants) AS participants,count(*) AS activities
 FROM completions c JOIN activities a ON a.id=c.activity_id JOIN activity_trainers t ON t.activity_id=a.id
 WHERE c.status='verified' AND t.contribution_status='verified' AND a.cancelled_at IS NULL AND a.postponed_at IS NULL GROUP BY t.trainer_id,year;
CREATE OR REPLACE VIEW annual_project_reach AS
 SELECT extract(year FROM coalesce(c.actual_starts_at,a.starts_at) AT TIME ZONE 'Asia/Kuala_Lumpur')::int AS year,
 sum(c.participants) AS participants,count(*) AS activities FROM completions c JOIN activities a ON a.id=c.activity_id
 WHERE c.status='verified' AND a.cancelled_at IS NULL AND a.postponed_at IS NULL GROUP BY year;
