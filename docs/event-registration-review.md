# RCBC event registration and acceptance testing

## Event setup
Run `npm run db:migrate` and restart the API after pulling these changes.
In the event editor, choose delivery (Online / Physical) and pricing (Free / Paid) independently. All four combinations are supported. Free saves clear fee/payment fields; general joining instructions remain. Pricing changes are blocked once registrations exist to preserve payment history.

Choose one registration method per event: Website registration, Google Form, or Registration closed. Configure the Google URL in the event editor. Changing methods preserves existing participant records. Programme tracks are categories; registration belongs to a specific dated intake.

## Shared registration rules
- Every new registration needs a name, valid email, and WhatsApp phone number. Emails may be shared. Optional questions/notes are always available (2000-character maximum).
- Normalised active phone numbers must be unique within one intake. Local Malaysian and +60 formats match; the same phone can register for different events.
- Free website submissions are confirmed immediately. Free Google responses are confirmed when imported.
- Paid submissions/imports start Submitted. Admin moves them to Pending payment verification, verifies payment, then confirms. Uploading evidence alone does not verify or confirm anything.
- Registration review shows all active submissions. Participant list and reminder selection contain only active confirmed participants.
- Capacity is advisory and counts only active confirmed participants. The admin warning shows the exact excess; new registrations and confirmations are still allowed.
- Remove requires confirmation and moves a record into History. Restore retains payment/confirmation history, but is blocked if another active registration uses that phone. History records are not deleted.
- Legacy shared-phone registrations are preserved and flagged for admin review. Migration 022 adds a database trigger and partial unique index to enforce the new rule without automatically cancelling older records.

## Google Form route
RCBC maintains the external form, including required name/email/WhatsApp fields and an optional speaker questions/notes field. The website cannot edit an external Google Form or prevent its duplicate submissions.

Download Responses → View in Sheets → File → Download → CSV. In Import registrations, map name, email, phone and questions/notes. Invalid and duplicate-phone rows are excluded in preview. The server rechecks existing phones during import and reports added/skipped counts. Shared emails are accepted. Existing records retain their statuses.

This remains manual CSV transfer, without Google OAuth or automatic synchronisation. Google responses do not appear on the website until imported.

## Payment evidence and communication
Admin can upload PNG, JPEG, WebP or PDF evidence up to 8 MB. File types are checked by content; payment evidence files are admin-only. Choose Verify payment to attach the evidence to that registration and record reviewer/time. A text verification reference remains an alternative. Confirm registration is a separate action.

Confirmation status and email delivery are separate. Registration submission, CSV import, verification and confirmation do not automatically send email. Send confirmation and reminders remain explicit administrator actions using configured Brevo credentials. Check delivery history/provider logs before retrying failed or uncertain sends.

## Manual acceptance checks
1. Create free online and free physical events with capacity 1. Submit two people using one email and different phone numbers. Both are confirmed; admin sees two participants and an excess of one.
2. Submit a duplicate phone using local and +60 formats for the same event. The second submission shows an obvious duplicate-phone notice. Register that phone for another event: accepted.
3. Import Google CSV with questions, shared emails and different phones. Free rows appear in Participant list. Re-importing the same phones adds no new records. Confirm questions appear in review, participant details and CSV export.
4. Register for paid online and paid physical events using website and CSV routes. Records remain in Registration review and outside Participant list.
5. Attempt paid confirmation before verification: rejected. Upload an image/PDF: still unverified. Move to pending payment, verify, then confirm: the record appears in Participant list.
6. Open an evidence URL while signed out: denied. A signed-in admin can view it.
7. Exceed planned capacity with free registrations and paid confirmations. Count only confirmed active participants. Remove one: count decreases. Restore: count returns.
8. Remove a participant, register a new person with that phone, then restore the original: restoration is rejected and both histories are retained.
9. Check that closed, cancelled, ended and deadline-expired events reject new website submissions. Capacity alone never closes registration.
10. Confirm Certified Trainer details and workflows remain unchanged.

## RCBC demonstration and recommendation
Demonstrate one free webinar and one paid programme through each route. Compare:
- Editable fields: Google Forms is flexible; website standardises contact/questions.
- Records/status: website updates immediately; Google requires CSV imports.
- Payment: both use the same admin verification and confirmation workflow.
- Export: admin CSV includes contact details, questions, source, status and payment/History audit information.
- Duplicates: website blocks duplicate phones immediately; Google duplicates are detected during import.
- Maintenance: website avoids repeated transfers; Google requires RCBC form ownership and regular CSV imports.

Recommend website registration when the standard fields meet RCBC's needs. RCBC makes the final choice. Use controlled addresses for email demonstrations; automated checks alone do not constitute client acceptance.

