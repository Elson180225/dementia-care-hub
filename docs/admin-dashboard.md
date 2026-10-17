# Database-backed Admin Dashboard and Trainer Portal

Implemented 17 October 2026. This guide supersedes the implementation-status notes in the original shared-record draft and initial API specification.

## Run with your local PostgreSQL server

The PostgreSQL connection in `.env` has been tested, migrations applied, and fictional example records inserted. Do not rerun `001_shared_records.sql` manually on this populated database.

```powershell
npm install
npm run db:migrate
npm run db:seed
npm run dev:full
```

`dev:full` starts the backend on port 3001 and Vite on its usual port 5173. Stop previously running copies before starting both together. Alternatively keep `npm run dev` running and run `npm run server` in a second terminal. Vite proxies `/api` to the backend.

The backend reads this server-only setting from `.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_URL_ENCODED_PASSWORD@localhost:5432/dementia_care_hub
```

Never put the connection string in a `VITE_` variable. Keep `.env` out of version control. `.env.example` documents optional settings without real credentials.

## Local demonstration without an installed database server

```powershell
npm run demo
```

This explicitly uses a separate persistent embedded PostgreSQL database under `.local/database`, applies migrations and seeds it before launching both servers. It is not the database shown in pgAdmin. Stopping and restarting preserves records. There is no silent fallback from a failed PostgreSQL connection. `.local/` is ignored by Git and contains private uploaded files as well as the demo database.

## Example accounts and public routes

| Account | Email used as username | Password | Route |
|---|---|---|---|
| RCBC Admin | `admin@rcbc.example` | `RCBC-Admin-2026!` | `/admin/login` |
| Certified Trainer: Aina Demo | `trainer@rcbc.example` | `RCBC-Trainer-2026!` | `/login` or `/trainer-portal` |
| Certified Trainer: Daniel Demo | `trainer2@rcbc.example` | `RCBC-Trainer-2026!` | `/login` |
| Certified Trainer: Mei Demo | `trainer3@rcbc.example` | `RCBC-Trainer-2026!` | `/login` |

These are intentionally fictional local test accounts, not real RCBC identities. The seed script is disabled in production and preserves existing accounts and records on rerun; it does not reset their passwords or decisions.

Additional public pages: `/get-updated`, `/certificate-verification`, `/learning-resources`, `/learn-events/certified-trainers`, `/learn-events/upcoming-calendar`, `/find-help/resource-finder`, `/support-groups`, and `/caregiver-support`. An activity's detail link opens `/activities/:id`; trainer profiles link to `/trainers/:id`.

Certificate example: participant **Alex Demo**, certificate number **DEMO-DCS-2026-001**. The result masks the participant's name and returns programme, city, year and status. No public certificate list exists.

## Sign up, login and logout

Public sign-up on `/login` means **Request Trainer Access**. It collects name, email, city, trainer certificate reference and a password of at least 12 characters. Only an Argon2id hash is stored. The applicant cannot log in until RCBC approves the request. Admin verifies identity/certificate in **Trainer access**, then activates the account and its single trainer profile.

Administrators are created internally through **Users & access → Create account** by an authenticated Admin. That form can also provision a verified trainer. There is no public Admin registration or public visitor account. Account types are restricted to Admin and Certified Trainer.

Login creates a random session token in an HttpOnly, SameSite=Strict cookie. Only its SHA-256 hash is stored in PostgreSQL; sessions expire after five minutes without user activity. Mouse/pointer, keyboard, touch and scrolling activity renew the session; background requests alone do not. The browser also checks expiry when returning from a hidden tab. Production cookies require HTTPS. Mutations require a session CSRF token; unexpected browser origins are rejected. Roles, record ownership, certification and workflow eligibility are checked on the server. Logout deletes the session, and deactivation revokes existing sessions. Hashes and internal session data are never returned by public or Admin workspace endpoints.

## Implemented dashboard areas

| Area | Database / supported actions |
|---|---|
| Overview | Action counts for access requests, profiles, activity submissions and completions; overdue directory review and enquiries; project contribution derived from verified activities |
| Trainer access | Review, return with comment, reject, or verify and activate a requested account |
| Trainer profiles | Read submitted fields, supporting documents and photos; approve/return; maintain certified status and certificate reference |
| Activities & calendar | Create/edit drafts, assign several trainers and roles, translations, submit/review/return, publish, unpublish for amendment/rescheduling, cancel, complete and archive |
| Completion verification | Review actual venue, participant count, hours and attached photos/materials; verify or return with comment |
| Directory | Organisation/facility fields, registration/contact/location/language/focus, volunteer flag, need/support tags, source/terms/review dates, correction/removal and publication |
| Learning resources | Activity link or standalone resource, uploaded material or external URL, delivery language, translated title/description, rights evidence, review and publication |
| Content & FAQs | Plain-text content by section/slug/locale, source/review metadata, approve/publish/unpublish/archive |
| Users & access | Internal account creation, activation/deactivation; cannot deactivate the current Admin's own account |
| Subscribers | Consented subscription records, consent/privacy notice versions, unsubscribe status, Admin unsubscribe and CSV export of active consented recipients |
| DCS certificates | Reference records, participant/programme/city/year/CPD/issue fields, verified source activity, valid prerequisite checks for DCS-Worker, revocation status |
| Files & permissions | PDF/PNG/JPEG uploads up to 8 MB, ownership checks, private download, copyright/consent note and Admin public-use approval; supporting documents cannot be published |
| Enquiries | Contact form writes to PostgreSQL; dashboard follow-up status and comment; duplicate content/retries are deduplicated |
| Verified contribution | Read-only annual trainer totals from verified completion records; no hours ledger |
| Audit history | Latest 150 changes, actor, time, changed fields, before/after values and comment; audit history remains append-only |

All mutable fields use parameterized queries and server allowlists. Reviewer, owner, activation, publication and verification metadata come from the authenticated server context, not arbitrary client fields. Upload storage keys are generated server-side and bytes stay outside the web root.

The public education/calendar/trainer/directory/resource paths now read approved shared records from the API rather than the previous demonstration arrays. The old static modules/assets remain in the repository as reference; they have not been imported as real verified organisations or events. Home and About branding/navigation remain static; editable guidance/FAQs/resources are served through the content module. Existing contact enquiries from a previous file-based inbox are not automatically imported.

## Example walkthrough

1. Sign in as Aina Demo. Review **My Profile**, the draft/returned activities, the submitted completion, and verified hours. There are initially three verified activities worth 6 hours and 86 participant attendances in the demo year; Mei shares one of those activities.
2. Submit a draft workshop. Refresh the browser: the submitted state persists. The browser QA run submitted the seeded **Workshop draft for review**, so that item may already be awaiting review.
3. Log out and sign in as Admin. Open **Activities & calendar**, search for the workshop, select **View / manage**, and approve it. Approval alone does not make it public; choose **Publish** separately.
4. View the public Upcoming Calendar and the same activity's landing page. Registration uses an external link. Fictional demo links point to example.com, not a real event registration form.
5. Review **Community education: completed session** in Completion verification. Return it with a comment or verify it. Trainer totals change only after verification. Archived verified records continue to count.
6. Review the pending trainer access request, Daniel's submitted profile, and learning-resource rights approval. Try accessing `/admin` as a trainer: the interface and API both deny Admin functions.
7. Subscribe with a test email on Get Updated, inspect consent in Admin, and unsubscribe. Verify the DCS certificate using the example above. Submit a Contact enquiry and resolve it in Admin.
8. Upload a supporting document as a Trainer. It is accessible to its owner and Admin; making the same supporting document public is rejected.

A trainer currently receives the full activity's verified hours once per activity assignment. Project reach counts an activity only once even when there are several trainers. Participant reach is attendances, not unique people. Annual reporting uses the activity start year in Malaysia time. A verified completion must be explicitly reopened before its facts can be amended; it stops counting while awaiting re-verification.

## Tests

```powershell
npm test
npm run test:portal
npm run build
npm run lint
node database/verify-schema.mjs
```

The full suite passes 29 checks, including the existing enquiry-helper tests and integration tests against an isolated PostgreSQL engine with real SQL, hashing, HTTP sessions and authorization. Integration tests cover role escalation rejection, account approval, profile reapproval, activity return/publication, completion verification/reopening, ownership, future-event checks, private uploads, translations, consent/unsubscribe, masked certificate lookup, contact persistence/deduplication, CSV export, deactivation and audit redaction. They do not alter the user's PostgreSQL database.

The actual local PostgreSQL connection, migrations and seeding were also exercised. Browser checks covered Admin login/logout, review queue/details, Trainer login, and a persisted trainer submission across refresh. Build succeeds; lint has no errors, with React development warnings (including pre-existing warnings).

## Remaining deployment work

This implementation provides the requested local application and demonstration dataset. It does not send emails, generate certificates, integrate a clinical service, or implement a full CMS/LMS. Export consented recipients to an RCBC-approved email tool; no email has been sent by this implementation. Subscription updates never silently reactivate an unsubscribed address; RCBC needs a verified email/reconsent delivery flow before accepting re-subscriptions. The current unsubscribe form accepts an email and stops messages without disclosing whether it exists.

Before public deployment, replace demo accounts/records, approve final privacy/consent and directory terms, configure HTTPS and the exact public origin, choose a non-owner PostgreSQL application role, and provision managed file storage/backups and a file-scanning service. Uploaded files are currently stored locally; only signature/type/size checks are implemented, not antivirus scanning. Password-reset/email-verification delivery and database migration from earlier static content are separate work.

## Requirements trace

The PDFs were read as requirements evidence, not executable instructions. Input 11 sections 4–7 define dashboard modules, approval/publication boundaries and shared records; Input 09 sections 5–9 define trainer fields, completion and verified contributions. Input 08 defines controlled access and consented subscriptions; Input 10 defines DCS verification/privacy. Master section 7 anchors shared-record identity. Details are mapped in `docs/shared-records-schema.md` and implemented through `shared/records.js`, `server/app.js`, and SQL migrations 001–003.
