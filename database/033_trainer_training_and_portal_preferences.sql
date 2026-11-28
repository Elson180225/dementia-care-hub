ALTER TABLE trainer_profiles
  ADD COLUMN IF NOT EXISTS ttt_completion_date date,
  ADD COLUMN IF NOT EXISTS portal_access_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_teaching_conditions text NOT NULL DEFAULT '';
