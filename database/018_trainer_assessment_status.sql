-- Structured assessment status for RCBC teaching-eligibility rules (feedback, 8 Nov 2026).
-- Works with migration 017: healthcare_professional is the HCP category; assessment_result stays as free-text notes.
ALTER TABLE trainer_profiles
  ADD COLUMN assessment_status text NOT NULL DEFAULT 'not_assessed'
    CHECK (assessment_status IN ('not_assessed','completed','pass','independent','unsuccessful'));