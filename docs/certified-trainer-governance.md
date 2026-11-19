# Certified Trainer workflow and testing

## Administration
Open Admin → Education & Events CMS → Certified Trainers. This editor uses trainer_profiles, the same record used by the portal and public directory. The old CMS JSON is retained for recovery, but no longer directly supplies public cards.

The editor guides admins through four steps: Personal details, Check credentials, Teaching & access, and Website & consent. Optional account setup, supporting documents, module limits and public contact controls expand when needed. Website & consent also includes the before/after profile comparison. The preview represents proposed information; Save changes does not replace the approved public snapshot. Approve profile & save approves that snapshot as well. A summary explains the distinction next to the save buttons.

- RCBC records HCP / Non-HCP and assessment outcomes without inferring them from legacy categories or job titles.
- Completed, Pass and Independent are recorded outcomes, not automatic teaching licences.
- Teaching is off by default. Either background group may receive explicit scope approval.
- Programme permissions use the programme ID; standalone events use their activity type. Optional module restrictions require the corresponding Teaching module on the event.
- Portal access and listing are independent. An account can be active while unpublished, and an approved public record can remain listed without portal access.
- Publication requires RCBC verification, recorded background, an approved profile and listing consent/date.
- Email and phone require separate consent and display controls. Only approved contact values are public.
- Trainer changes are submitted for review. Previously approved public information remains visible when a submission is pending or returned.
- Approvals provides before/after comparison and short return comments. Existing audit history records reviewer and change dates.
- Account credentials are not emailed automatically. Share any initial credentials privately through RCBC's established channel.

## Data migration
Run npm run db:migrate and restart the API. Migration 023 has been applied locally.
Existing trainer records and certificate references are preserved. Existing approved profile text becomes the initial approved snapshot. Existing activity assignments retain their historical hours.

Legacy CMS entries are imported as unverified, unpublished records without active access or teaching permission. Their complete original values are retained in legacy_source; no background or certificate validity is guessed. Review these with RCBC before publication. An empty public directory is valid while no records satisfy verification and consent requirements.

Do not create another record when the same person already has a verified account. Review legacy duplicates before deciding which record to use; no identity matching or automatic merging is performed.

## Individual activity hours
Completion records include event duration and an explicit actual-hours figure for every assigned trainer. The trainer enters the figures and RCBC verifies them. Totals only include verified completions. A six-hour event with contributions of two and four hours results in two and four hours for the respective trainers, not six each.
Event edits retain existing individual hours. Assigned people are locked once completion is submitted or verified, preventing silent changes to verified totals.
Historical figures are preserved rather than retrospectively guessed.

## Manual acceptance checks
1. Create a record without an account email. It must have no teaching permission, public listing or portal access.
2. Set HCP, then Non-HCP, and change Completed / Pass / Independent. None of these actions alone grants teaching permission.
3. Verify certificate/background. Approve Workshop teaching. Assign that person to a Workshop: accepted; a non-approved programme/module: rejected.
4. Set a module restriction. An event must specify that exact module; a blank or different module is rejected.
5. Approve profile and consent, then publish while portal access remains off. Check that the public card appears in the correct group.
6. Enable the trainer account separately. Submit a changed biography/photo/contact. Public information stays on the previous version until approval.
7. Return the change with a comment: old public information stays visible. Resubmit and approve: public information updates.
8. Try to show contact details without consent: rejected. Record consent and approve the public contact values: only those fields are exposed.
9. Hide the listing without disabling access. Then disable access without changing listing: verify the two controls operate independently.
10. Complete an event with two assigned trainers and different hours. No totals before verification; individual totals afterwards. Edit event details and confirm hours remain unchanged.
11. Open a trainer record in two sessions. After one saves, the stale editor must be rejected rather than overwriting newer work.

## Automated verification
npm test runs the ordinary suite; database tests are skipped unless TEST_DATABASE_URL is provided.
The isolated trainer-governance database test covers public snapshots, consent, classification, separate access/publication, permission enforcement, stale updates and individual verified hours. Portal, registration and translation database regressions are tested separately using temporary schemas. No production emails or messages are sent by those tests.

## Archive and restore a trainer

Open **Certified Trainers → Manage trainer** and scroll to **Archive this trainer** below the save controls. Select **Archive trainer**, optionally record a reason, and confirm the named trainer. Unsaved editor changes are not saved by archiving.

Archiving hides the public listing, disables teaching and portal access, and ends existing sign-in sessions. Certificates, approved profile snapshots, event assignments, contribution hours and approval history remain stored. Archived records cannot be edited or approved.

Use the **Archived trainers** filter to find the record and select **Restore trainer**. Restoration does not automatically restore teaching, portal access or public listing; review and approve those decisions separately. Existing event assignments are retained rather than automatically cancelled.

