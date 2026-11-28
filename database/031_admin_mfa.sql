-- Multi-factor authentication for administrators (RCBC Admin Portal Draft 02, 4.2-4.4).
-- mfa_pending_secret holds a new secret until the admin confirms it with a first code.
-- mfa_last_step stops the same 6-digit code being used twice.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS mfa_secret text,
  ADD COLUMN IF NOT EXISTS mfa_pending_secret text,
  ADD COLUMN IF NOT EXISTS mfa_enabled_at timestamptz,
  ADD COLUMN IF NOT EXISTS mfa_last_step bigint;
