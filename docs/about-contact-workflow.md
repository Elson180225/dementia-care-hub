# About and Contact release checks

Run `npm run db:migrate` before starting the updated API. Migration 014 adds enquiry delivery and follow-up timestamps. Historical enquiries remain available in the admin inbox and are not emailed automatically.

## About content

In Admin > Content & records > Website content, use the About section buttons. Save text as unpublished while RCBC reviews it. Record the RCBC approver in Reviewer, a source/approval reference, the language and last-reviewed date; set review status to current before publishing. Published entries replace the matching public section in that language. Multiple entries support partner roles and individual acknowledgements. Unpublish an entry to remove it. Empty supporter and acknowledgement sections remain hidden. Existing `about` entries remain visible as project updates.

Section identifiers: `about-overview`, `about-mission`, `about-journey`, `about-organiser`, `about-partner`, `about-advisors`, `about-supported`, `about-acknowledgements`. Supported language values: English, Bahasa Malaysia, Chinese. Translation drafts need RCBC approval before publication. A journey override is displayed as approved plain text instead of the default timeline.

## Enquiry delivery

Set ENQUIRY_ADMIN_EMAIL to the designated RCBC recipient, and configure BREVO_API_KEY, BREVO_SENDER_EMAIL (verified sender), BREVO_SENDER_NAME and APP_BASE_URL. No recipient is guessed. The API scans queued enquiries every minute. A successful form submission means the enquiry was saved; it does not promise email delivery. The admin inbox remains the source of truth when email is unavailable.

In Content & records > Enquiries, review notification status and choose Record follow-up. Reply using the visitor email link, record the action/outcome, and select In progress or Closed. A note is required for these states. Timestamps and the follow-up history preserve the recorded actions. This records follow-up; it does not send a visitor reply automatically.

Confirmed failed notifications can be queued again with Retry notification. Uncertain sends and interrupted sends require inspection of Brevo logs before any manual database recovery to avoid duplicate messages. A sent notification means Brevo accepted it, not confirmed inbox delivery.

## Acceptance demonstration

1. Publish RCBC-approved text for an About section and verify it replaces that section in the matching language. Unpublish it and verify the baseline returns.
2. Add an acknowledgement, publish it, then unpublish it and verify the empty section disappears.
3. With RCBC authorization and a test recipient configured, submit a contact enquiry. Verify one saved record and one email receipt after the worker scan. Repeat the same submission ID to verify no duplicate notification.
4. Record follow-up and closure. Reopen the record and verify notes, status, timestamps and history.
5. Check narrow/mobile layouts, keyboard navigation, field errors, and all three language selections.

No live email or production database changes are required for automated tests.

## Contact options awaiting confirmation

All project and organiser contact options remain visible, including unconfigured email, WhatsApp, website and Facebook options. Unavailable options show a translated confirmation notice and direct visitors to the enquiry form; they do not create empty or placeholder links. Postal addresses are displayed only after approval.
