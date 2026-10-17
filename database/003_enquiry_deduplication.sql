BEGIN;
ALTER TABLE rcbc.enquiries ADD COLUMN IF NOT EXISTS fingerprint text;
CREATE UNIQUE INDEX IF NOT EXISTS enquiries_fingerprint_unique ON rcbc.enquiries(fingerprint);
COMMIT;
