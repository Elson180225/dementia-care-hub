# Client Feedback: Implementation and Acceptance Testing

- Trainer data: Admin > Users > Manage access records assessment results, healthcare professional status (including not recorded), and independent teaching scope. Trainers give public listing consent under My profile. Public profiles require explicit listing consent and listing approval, a completed profile, certified status, an approved access request and an enabled account. Trainers save profile edits directly without another RCBC profile review. Assessment results remain private.
- Contact: Admin > Content & records > Enquiries records follow-up notes and closure, timestamps and decision history. The existing queued Brevo worker sends notifications to ENQUIRY_ADMIN_EMAIL. Configure that address, verified sender, API key and APP_BASE_URL before demonstrating actual delivery. No email is sent merely by applying migrations.
- Get Updated demo: subscribe with a demonstration address and consent at /get-updated; save the unsubscribe link shown after the first signup. Open it, confirm unsubscribe, then check Subscribers in admin. A repeated signup preserves existing opt-outs. Never use a real visitor's address for a demo. Automatic reminders include an unsubscribe link; reminder preview is available with npm run reminders:preview.
- Email inventory: available in Admin > Content & records. The shared inventory lists all three website email types plus separately managed Brevo campaigns, their triggers, recipients and off switches. No automatic welcome, trainer-decision or invitation email currently exists.
- Resource Finder: migration 017 adds three clearly labelled fictional examples. Edit them in Content & records > Directory; search Home / Community Care in Bintulu, Financial Assistance in Sibu, or Daily Living Aids in Kuching. Examples are never labelled verified. Keep the example flag until replacing the entire record with verified information.
- About the Project: existing Website content editor supports project, partner and acknowledgement sections. Save drafts, record RCBC approver/source/review date, then mark current and publish. The public About page displays the approved content.

Apply schema updates with `npm run db:migrate` and subscriber schema with `npm run db:migrate:subscribers`. RCBC still needs to test and accept the workflows and supply its actual email address and approved content.

## Start the test environment

Run these commands from the project root:

```powershell
npm run db:migrate
npm run db:migrate:subscribers
```

Migration `017_trainer_details_and_resource_examples.sql` follows the merged `015_trainer_listing_approval.sql` and certificate migration 016. The runner recognises both earlier local names (`015_howard_tasks.sql` and `015_trainer_consent_and_resource_examples.sql`) so existing databases do not execute the same column additions again. Existing legacy consent does not grant public listing approval; use the separate listing request flow. Do not execute migration SQL manually.

Start the API and frontend in separate terminals:

```powershell
# Terminal 1
npm run server
```

```powershell
# Terminal 2
npm run dev
```

Open the URL printed by Vite, normally http://localhost:5173. Use separate browser profiles for the trainer and admin so signing in to one does not replace the other session. Restart the API after changing `.env`.

Sign in at `/admin`. If no administrator exists, create an invitation with `npm run admin:invite -- your-admin-email@example.com`, open the printed link and register using that email. For trainer tests, use an approved test trainer account; new applicants register at `/trainer-portal/signup` and require admin access approval.

Keep `REMINDERS_ENABLED=false` during ordinary tests. Contact notifications use a separate worker and may still send when its email settings are configured. Use an intended test recipient when testing actual delivery.

## Manual acceptance tests

### 1. Trainer details and public listing consent

1. Admin: open `/admin/users`, select a trainer and click **Manage access**.
2. Enter an assessment result, healthcare professional status and approved independent teaching scope. Save, reopen and check that all values persist. Try **Not recorded**, **Yes** and **No** for professional status.
3. Trainer: open `/trainer-portal/profile`. Confirm the admin-entered values are read-only.
4. Complete the profile and click **Save profile**. This saves directly; no profile review is required.
5. In **Public listing**, tick consent and click **Request public listing**. Before approval, confirm the trainer is not shown publicly.
6. Admin: approve the **Public listing request** at `/admin/review`. Open `/learn-events/certified-trainers`; the trainer should now appear. Assessment results and certificate attachments must stay private.
7. Trainer: edit the profile again and save. The listing should display the saved changes without a second profile review.
8. Click **Withdraw from public listing**. Refresh the public page; the listing should disappear while portal access still works. Request and approve a listing again to restore it.
9. Admin: use **Suspend public listing** and **Restore public listing** in Users. Confirm the listing disappears and returns without changing portal access.

Expected: stored details survive reloads; direct profile editing, listing consent and listing approval remain separate from account access. The merged sidebar, user tables and event cards are retained.

### 1a. Private certificate images and PDFs

Migration `016_trainer_certificate_evidence.sql` adds private certificate attachments. The certificate reference remains a text field; its optional upload supplies evidence for review.

1. Register a test trainer at `/trainer-portal/signup`, enter the certificate reference, and select a certificate PNG, JPEG, WebP or PDF of 8 MB or less. Submit the registration.
2. Admin: open `/admin/review`, find the application and select **Open private certificate image or PDF**. The file should open/download for the signed-in admin.
3. Applicant: use `/trainer-portal/application` with the same email and password. The page should report that evidence is on file. Select a replacement and use **Submit amendments**; the admin should receive the replacement evidence.
4. Approve access. Trainer: sign in, open `/trainer-portal/profile` and confirm the certificate attachment is available. Replace or remove it, save, reload and check the change persists.
5. Admin: `/admin/users` > **Manage access** also supports attaching a certificate beside the official reference. Save, reopen and check it persists. The assigned trainer can access this evidence too.
6. Open the file URL while signed out or as another trainer: access must be denied. Publishing the trainer's public profile must not expose the certificate image/PDF.
7. Try a file over 8 MB or an unsupported file type: it must be rejected with an error. Registering without a certificate attachment should still work; the textual reference remains required.

Existing profile photos, activity posters, completion photos and supporting-document uploads remain available in their respective forms. Upload fields include an **i** help icon explaining their purpose.

### 2. Contact follow-up and closure

1. Submit a uniquely worded test enquiry at `/contact`.
2. Admin: open `/admin/records`, choose **Enquiries**, and find the message.
3. Edit it, enter a follow-up note and change its status to **In progress**. Save.
4. Add a closure note and set **Closed**. Reopen the record and check the status, timestamps and decision history.
5. Try closing a new enquiry without a note; the save should be rejected.

Expected: the enquiry persists and follow-up actions are traceable.

For actual notification delivery, configure `ENQUIRY_ADMIN_EMAIL`, `BREVO_API_KEY`, a verified `BREVO_SENDER_EMAIL` and `APP_BASE_URL`, restart the API and submit another test enquiry. Allow up to one minute for the worker. Check the admin notification status, designated inbox/spam folder and Brevo transactional logs. A `sent` status means provider acceptance; it does not prove inbox delivery. See [email setup](GET_UPDATED_EMAIL_SETUP.md).

### 3. Subscription and unsubscribe

1. At `/get-updated`, use a fresh test address, fill in name/locality/language and give consent.
2. Save the unsubscribe link shown after the first successful signup. No automatic welcome email is sent.
3. Admin: choose **Subscribers** in `/admin/records` and confirm the record and consent date exist.
4. Open the saved link and confirm unsubscribe. Refresh the admin record; its unsubscribed date should be populated.
5. Submit the same address again. The existing opt-out must remain in place.

Expected: signup stores consent, unsubscribe persists, and repeat signup does not silently reactivate an opted-out record.

### 4. Editable Resource Finder examples

Search at `/find-help/resource-finder` using each combination:

| Need | Support type | Location | Expected example |
| --- | --- | --- | --- |
| Support Services | Home / Community Care | Bintulu | Community support service |
| Government & Financial | Financial Assistance | Sibu | Financial support information |
| Equipment & Practical Aids | Daily Living Aids | Kuching | Practical aids information |

1. Confirm each result is labelled **EXAMPLE** / **Example only**, rather than verified.
2. Admin: choose **Directory** in `/admin/records`, edit an example title or description and save. Published records require a source and last-reviewed date; retain the demonstration source and example flag.
3. Refresh the Finder and repeat the matching search; the edit should appear.
4. Unpublish that example, refresh and search again; it should disappear. Restore publication for the next demo.

Expected: search results reflect managed records and demonstration content is clearly identified.

### 5. Email inventory

At `/admin/records`, expand **Website emails: triggers, recipients and off switches**. Check that contact notifications, automatic activity reminders, participant reminders and separately managed Brevo campaigns each explain what triggers them, who receives them and how to stop them.

Expected: RCBC can review its email needs without sending a message.

### 6. About the Project content

1. In `/admin/records`, choose **Website content** and add an About section using its section button. Use the English language and a clearly labelled test text.
2. Save unpublished and confirm `/about` still shows the previous public text.
3. Add the RCBC reviewer, source and last-reviewed date, set review status to **current**, and publish.
4. Refresh `/about` in English; the text should replace the matching section.
5. Repeat for partner and acknowledgement sections. Unpublish demonstration text after testing.

Expected: approved content is editable by admins and unpublished drafts do not appear publicly.

## Automated checks

```powershell
npm test
npm run lint
npm run build
npm run reminders:preview
```

Reminder preview reads due activities and audience counts without sending emails. Unit tests use simulated providers. For database integration coverage, set `TEST_DATABASE_URL` to a PostgreSQL connection whose role can create isolated test schemas before running `npm test`; otherwise those tests are skipped. Integration tests create and remove their own schemas and do not send real email.

Record each manual result as Pass, Fail or Waiting for RCBC, with the test date, tester and any issue. Passing automated checks does not replace RCBC acceptance testing.
