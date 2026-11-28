ALTER TABLE subscribers
 ADD COLUMN IF NOT EXISTS country text,
 ADD COLUMN IF NOT EXISTS renewal_hash text,
 ADD COLUMN IF NOT EXISTS renewal_expires_at timestamptz;

ALTER TABLE subscribers ALTER COLUMN language DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS subscriber_renewal_hash_unique ON subscribers(renewal_hash);
