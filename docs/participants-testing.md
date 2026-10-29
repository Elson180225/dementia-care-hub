# Workshop participant management

## Setup

Run `npm run db:migrate` against your development database, then start/restart the API with `npm run server` and frontend with `npm run dev`. Migration 012 adds three tables; no existing registrations are changed. Do not run this against production before validating it in development.

Sign in as an administrator. Open Learn & Events Hub → Events & Workshop → Participants on an event, or use Workshop participants in the admin navigation. Choose a database-backed workshop. Static content cards without an activity record are not selectable.

## Import acceptance tests

1. Upload `docs/participants-sample.csv`, mapping Full Name → Name, Email Address → Email, Contact Number → Phone. Expect two valid rows, one duplicate, and two invalid rows. Preview must show `Tan, Mei` in one cell. Confirm the two valid rows. Expect two new participants.
2. Upload the same file again. Expect zero additions and two existing registrations skipped. Names and cancellation statuses must not change.
3. Add a new unique valid email to the file and reimport. Only that participant is added. Removing a row from the file must not remove a saved participant.
4. Import into another workshop. The same email is permitted there; each workshop retains its own list.
5. Change the headings and select the matching columns manually. The preview must still show correct names and emails. Missing name/email mappings must prevent a valid import.
6. Try empty, malformed, non-CSV, oversized, and over-500-row files. Expect a clear error without saved participants. Quoted commas, escaped quotes, BOM, CRLF, and multiline answers are supported.
7. Search a saved name/email/phone. Cancel a participant, verify they cannot be selected for reminders, then restore them. Reimport must not undo cancellation.

Only mapped name, email, and optional phone are stored. Other Google Form answers and original Google submission timestamps are not stored in this version. The recorded timestamp is the website import time. Emails identify a registration within a workshop: shared-family emails are treated as duplicates.

## Email acceptance tests

Use a future, non-cancelled workshop and ONLY email addresses you control. The sample example.com addresses are for import testing, not actual email tests. Configure BREVO_API_KEY, BREVO_SENDER_EMAIL, and optionally BREVO_SENDER_NAME, then restart the API. No email is sent during automated tests.

1. Select your test participant, edit the subject/message, and choose Review reminder. Expect recipient addresses and the exact message; no email should be sent yet.
2. Choose Back to editing. Expect no delivery record and no email.
3. Review again and Confirm and send. Expect a sent history entry and a provider message ID. Verify the test inbox. Sent means provider acceptance, not confirmed inbox delivery.
4. Submit the identical subject/message to the same participant again. Expect skipped, with no second provider request. The database prevents concurrent identical attempts too.
5. Cancel a participant. A stale/direct request including them must be rejected. Past or cancelled workshops must reject reminders.
6. With Brevo configuration missing, expect an actionable configuration error and no sending. Provider rejection is recorded as failed; ambiguous/network outcomes are recorded as uncertain. Check Brevo logs before any further attempt. A server interruption may leave sending entries, which also require manual review. This release does not automatically retry attempted messages.
7. Confirm recipients never see other participants' addresses: each email is sent individually. Sending accepts up to 25 recipients per action.

## Access and integration checks

Signed-out requests must return 401; signed-in trainers must return 403 for participant GET and POST endpoints. A cross-origin POST from an unrelated origin must return 403. Validate these in a running development environment with the respective sessions. Refresh the page to verify imports, cancellations, and history persist in PostgreSQL. Confirm no participant appears in newsletter subscriber records as a consequence of importing.

## Automated checks

`node --test tests/participants.test.js` tests CSV edge cases, validation, duplicate normalization, and unauthenticated access without a database or sending email. Run `npm run build` and `npm run lint` for frontend checks. Database persistence, trainer permissions, and Brevo sending require the manual integration checks above; unit tests do not establish those outcomes.
