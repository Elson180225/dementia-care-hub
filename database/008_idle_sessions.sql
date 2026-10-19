ALTER TABLE sessions ADD COLUMN last_activity_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE sessions ALTER COLUMN expires_at SET DEFAULT now() + interval '5 minutes';
-- Existing sessions get at most five minutes to report fresh user activity.
UPDATE sessions SET expires_at=least(expires_at,now() + interval '5 minutes');
