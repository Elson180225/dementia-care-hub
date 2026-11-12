-- Public listing is approved separately from portal access (RCBC feedback, 8 Nov 2026).
ALTER TABLE trainer_profiles
  ADD COLUMN listing_status text NOT NULL DEFAULT 'none'
    CHECK (listing_status IN ('none','requested','approved','returned','rejected','suspended')),
  ADD COLUMN listing_consent_at timestamptz,
  ADD COLUMN listing_comment text NOT NULL DEFAULT '',
  ADD COLUMN listing_reviewed_by uuid REFERENCES users(id),
  ADD COLUMN listing_reviewed_at timestamptz;

-- Only trainers with portal access, an approved profile, consent and an approved listing are public.
CREATE OR REPLACE VIEW public_trainers AS SELECT p.id,u.name,p.city,p.language,p.short_profile,p.qualifications,p.experience,p.photo_url,p.certificate_ref
 FROM trainer_profiles p JOIN users u ON u.id=p.id
 JOIN trainer_access_requests r ON r.user_id=u.id AND r.status='approved'
 WHERE p.status='approved' AND p.certified_status='certified' AND u.enabled
   AND p.listing_status='approved' AND p.listing_consent_at IS NOT NULL;