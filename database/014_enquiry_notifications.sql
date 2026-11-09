ALTER TABLE enquiries
 ADD COLUMN notification_status text NOT NULL DEFAULT 'pending' CHECK (notification_status IN ('pending','sending','sent','failed','uncertain')),
 ADD COLUMN notification_attempted_at timestamptz,
 ADD COLUMN notification_sent_at timestamptz,
 ADD COLUMN notification_error text,
 ADD COLUMN notification_message_id text,
 ADD COLUMN followed_up_at timestamptz,
 ADD COLUMN closed_at timestamptz;
-- Existing enquiries are already in the admin inbox; do not email historical submissions.
UPDATE enquiries SET notification_status='failed',notification_error='Historical enquiry; available in the admin inbox.';
