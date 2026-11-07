# Physical Education applications

Run `npm run db:migrate` against the development database, then restart the API. Migration 013 creates track_applications. No emails are sent by this feature and a review status does not create an event booking.

## Acceptance checks

1. Open a Physical Education track and apply. Fill required name, email and phone fields, select consent, and submit. Expect success only after the API confirms a save. Sign in as admin and open Learn & Events → Physical Education → Applications. Verify the exact track and contact details persist after refreshing.
2. Submit the same track/email again, including a different email letter case. Expect one record only. Retrying a failed acknowledgement preserves the original application. A new intake with the same track ID currently shares this deduplication rule; intake-specific reapplication is a future enhancement.
3. Stop the API, submit, and verify an error instead of success. Details remain for retry. Missing/invalid fields and missing consent must not save.
4. Update a track and turn off Accept applications. Public submissions must be rejected even if an old browser tab still has the form open.
5. Review a saved application and change its status. Refresh to verify it persists. Check search, track/status filters, pagination and historical records for removed tracks. Anonymous access must return 401 and trainers must receive 403. Application details must never appear in public APIs.
6. Check submit, cancel and close controls show a pointer when enabled; only disabled controls show a restricted cursor. Verify keyboard focus visibility.
7. Edit each track section and check the preview reflects changes. Verify saving, reloading, cancellation with unsaved changes, and errors retaining the draft. Check a narrow mobile viewport. Preview shows editable content, not an exact rendering of all public layouts or bundled images.

## Automated checks

`node --test tests/track-applications.test.js` covers validation, consent, field bounds, untrusted status fields, anonymous access and origin rejection. Run `npm run build` and `npm run lint` as well. Persistence, review auditing, and actual browser accessibility require the integration checks above.
