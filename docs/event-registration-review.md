# RCBC registration demonstration and testing

## Updated single-location setup
Apply migration 016 and restart the API. Edit the event to configure classification, fee/payment instructions (paid only), general registration instructions, and ONE registration method: Google Form, Website registration, or Registration closed. Admin no longer configures registration in the participant page. Free saves clear payment fields on the server; entering “Free” is unnecessary. Existing Google links are retained where a legacy Google route can be identified; closed events remain closed until deliberately opened.

After selecting the event under Workshop participants, the participant list is shown first. Open Registration review for approval and, for paid events, payment evidence. Free records do not show payment evidence controls. Existing saved records are preserved when the method changes.

Regression checks: switch a paid event with NO registrations to free and Online mode; verify stale fee and payment instructions disappear after saving/reloading. Add a general joining instruction and ensure it remains visible. Google method requires a valid link and opens that link from Register. Website method requires no link and opens the native form. Closed method shows no active Register action. Existing registrations must remain when changing methods. Pricing changes with existing registrations are deliberately blocked to protect payment history.

## Setup
### Event editing and public labels
In the admin event editor choose Free online webinar (Online delivery) or Paid in-person programme (Physical delivery). Set the fee description and payment instructions before saving. A mismatched mode must fail. Existing events with no saved classification show Registration details pending rather than being assumed free; edit those records to classify them. General community activities outside these two categories need RCBC agreement before a broader pricing taxonomy is introduced.

The event editor saves classification atomically with the activity; registration routes are enabled from Participants. Public Online Education/event cards and activity/calendar details show the saved category. Calendar and shared event details offer the managed website/Google routes. Topic-preview content and general Physical Education track expressions of interest remain separate from database-backed event bookings.

### Recommendation for RCBC review
Recommend website registration as the primary route when its standard fields meet RCBC’s needs, because it avoids recurring CSV transfers and shares payment review and export. Recommend Google Forms if flexible question editing is essential and RCBC prefers maintaining the form and import process. Demonstrate both before RCBC chooses; this is a provisional recommendation, not a recorded client decision.

### Four demonstrations to record
1. Free online webinar through website: submit, confirm without payment, explicitly send confirmation, export.
2. Same free webinar through RCBC’s Google Form: submit, export Sheets CSV, import, confirm and export.
3. Paid DCS event through website: submit, move to pending, attempt confirmation before payment (must fail), verify payment evidence, confirm, explicitly send confirmation.
4. Same paid event through Google Form/import: repeat review, duplicate import, confirmation and export.
Use different controlled test emails for each route, plus one shared email to demonstrate cross-route deduplication. These demonstrations are pending until the development database, actual RCBC test forms and email configuration are available. Do not mark Accepted based on automated checks alone.

Run `npm run db:migrate` against a development database to apply migration 015. Restart the API. Use two published future activities: one free online webinar and one paid physical programme. No sample records or payments are created automatically.

Open Admin → Workshop participants and choose an activity. Configure registration settings. Name and email are standard fields; phone and notes are optional configuration choices. Enter RCBC-approved fee descriptions, payment instructions and actual Google Form links. Both routes can be enabled for comparison; RCBC selects the final workflow. This is manual payment verification, not an online payment gateway.

## Website route
Open the activity details from Online Education / Events and find Event registration. Choose Register on this website. Submit the form with consent. Expected: Submitted, never automatic confirmation. Repeat using the same email with different casing: one record is retained. Track applications remain separate in Physical Education → Applications and do not become event bookings.

## Google route
RCBC creates a corresponding form with name, email and any agreed extra fields. Demonstrate both free and paid examples. Download responses from Sheets as CSV and import using the existing Import registrations tab. Expected: new rows start Submitted, source google-import. Existing emails are skipped even when originally submitted through the website. The importer currently maps name/email/phone only; additional Google answers remain in Google until further field mapping is agreed. Google Form configuration, ownership and ongoing updates remain RCBC responsibilities. No Google OAuth or automatic sync is added.

## Paid event acceptance
1. Submitted registration → Await payment verification → Pending payment verification.
2. Enter a reference to evidence RCBC checked. Verify payment. Expected: reviewer and verification time recorded; still not confirmed.
3. Confirm registration. Expected: Confirmed with reviewer/time recorded. Direct API confirmation without verified payment must fail.
4. Send confirmation after checking the recipient. Expected: Brevo provider acceptance recorded. Configure BREVO_API_KEY/BREVO_SENDER_EMAIL. Use addresses you control. Confirmation email is separate from reminders. Attempts are protected against duplicates, including ambiguous network failures. Check provider logs for sending/failed/uncertain entries before further action; no automatic retry is included.

## Free event acceptance
Submission stays Submitted. Admin confirms directly without payment evidence. This conservative review step is provisional until RCBC confirms the free-webinar rules. Confirmation is sent only by explicit administrator action, so no emails are sent just by importing or approving records.

## Other checks
- Export CSV includes source, lifecycle state, cancellation, payment reference and confirmation time. Check quoted commas and spreadsheet-formula protection.
- Cancelled participants cannot be confirmed or emailed. Cancelled/past/deadline-expired activities reject public submissions.
- Disabling phone/notes prevents those extra values being stored from website requests.
- Registration settings and payment actions require admin access. Verify trainer 403 and anonymous 401.
- Existing participant cancellation and import history are preserved. Existing records start Submitted, not assumed paid or confirmed.
- Once managed registration is enabled, reminders accept only confirmed participants. Existing subscriber reminders use a separate workflow and are outside this change.
- Test database persistence, publication visibility, export, real email receipt and browser layouts before RCBC acceptance. Automated unit tests do not establish these outcomes.

## Comparison and recommendation
Google Forms offers client-controlled question editing and Google exports, but requires manual CSV imports and two systems to maintain. Website registration stores responses directly and shares payment review/export, but field changes are limited to the agreed fixed fields and toggles. Demonstrate both using the same free and paid examples. Recommend one operational source per event to reduce reconciliation; retain both only for the comparison until RCBC chooses. Payment rules, participant fields, confirmation wording and the treatment of repeat/shared-email registrations require RCBC agreement. Capacity/waitlist automation and payment refunds are not included.
