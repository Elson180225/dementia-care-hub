# Trainer Portal and Administrative Dashboard

The application uses local PostgreSQL through the private `DATABASE_URL` in `.env`. Public visitors have no accounts. The only user roles are `trainer` and `admin`.

## Run locally

```powershell
npm install
npm run db:migrate
npm run server
# Another terminal:
npm run dev
```

Use Vite's printed URL (5173 or 5174). `PUBLIC_ORIGIN` is the main origin; `ADDITIONAL_PUBLIC_ORIGINS` contains explicitly allowed alternate origins. PostgreSQL credentials must never have a `VITE_` prefix. The local database is `dementia_care_hub`.

Migrations 001, 003, 004, **005_admin_workflow.sql**, 006, 007 and 008 are active. Do not execute the historical `005_admin_workflow.draft.sql`. `npm run db:migrate` records and skips previously applied versions. For a database populated manually in pgAdmin, `scripts/adopt-existing-schema.js` compares its columns and constraints against the baseline before recording existing migrations; it aborts on differences and never resets tables. This baseline has already been reconciled on the current local database.

## Test the account workflow

1. Register at `/trainer-portal/signup` with name, email, city, claimed certificate reference and a password of at least 12 characters.
2. RCBC must approve access before sign-in works. Applicants check status or submit amendments at `/trainer-portal/application` using their email/password; this creates no portal session. Returned and pending applications can be amended; rejected applications stay blocked.
3. Bootstrap an administrator internally with `npm run admin:invite -- authorised-admin@example.org`. Open the printed link and register using that exact email. Invitations expire after 24 hours and work once. No email is sent and no default password is created.
4. Sign in at `/admin`; use Review queue to inspect, approve, return or reject access. Approval requires an official certificate reference. This is separate from the applicant's claimed reference.
5. The approved trainer signs in, saves/submits their profile, uploads a photo/supporting documents, and sees admin feedback. Only approved, certified profiles appear publicly.
6. The trainer drafts a workshop/seminar, assigns distinct trainers and roles, and submits it. RCBC approves and publishes through Review queue. Approval alone does not publish.
7. After a published activity happens, the owner submits actual venue, participants, hours and photos. RCBC verifies or returns it. Only verified completions count toward annual contribution views. Archive keeps the same activity and preserves verified totals.

Use separate browser profiles or an incognito session when testing trainer/admin concurrently: cookies are shared across localhost ports. Portal data refreshes on sign-in, actions, browser visibility changes and every 30 seconds while visible. Reloading preserves database records and valid sessions.

## Screens implemented

| Screen | Functions |
| --- | --- |
| Trainer dashboard | Profile/submission status, upcoming activities, verified annual hours and reach |
| My Profile | Draft/save/submit own fields; photo and private document upload; RCBC-controlled certificate fields |
| Workshop & Seminar | Create/edit drafts/returned records; trainer assignments/roles; poster, registration link/deadline and capacity; submit |
| Conducted | Same activity's actual venue, photos, participant count and hours; returned-record amendments |
| Contribution & Hours | Year filter, verified-only totals and per-activity contribution status |
| Admin overview | Action queue, review-due records, open enquiries and annual summaries |
| Admin review | Full submitted evidence, approve/return/reject access, review profiles/activities/completions, publish/unpublish/cancel/archive and audit history |
| Events and workshops | Admin creation of webinars, DCS programmes and project events; edit/reschedule; optional trainer assignment; completion records |
| Content and records | Directory, learning resources, FAQs and website text; source/language/review dates, correct/unpublish/archive, removal of never-published drafts |
| Users and access | Enable/disable accounts, suspend certification, official certificate references, internal admin invitations; prevents self-disable of admin |
| Project records | Subscriber consent/locality/language, unsubscribe status and opted-in CSV export; DCS certificate references and consent; contact enquiry follow-up |

Publication of managed directory/content requires a source and last-reviewed date. Learning-resource publication also requires permission evidence and a resource link. Archived records are always unpublished. Public managed blocks read the same records on Find Help pages, online learning, FAQs and matching home/about/understanding slugs. Existing static editorial material is retained; it is not silently reclassified as verified database content. Only the database-backed blocks are edited through the new management screens. Use `home`, `about`, or `understand-dementia` for managed page updates.

`/get-updated` collects opt-in consent and supplies an unsubscribe link. `/caregiver-support/verify-certificate` requires name plus certificate reference and returns minimal consented details, never an open recipient list. No bulk email or external-provider transmission is performed. Admins export opted-in recipients for their approved email platform; automated email delivery, reminders, rich CMS tooling and certificate generation remain outside the first-build scope defined by RCBC.

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health/database` | PostgreSQL connectivity |
| `POST /api/auth/register` | Trainer application and password hash |
| `POST /api/auth/application`, `/resubmit` | Credential-checked application status and amendments |
| `POST /api/auth/admin-register` | Email-bound internal invitation |
| `POST /api/auth/login`, `/logout`; `GET /api/auth/me` | Cookie session lifecycle |
| `GET /api/portal`, `/api/portal/trainers` | Role-scoped state and eligible trainer assignment list |
| `POST /api/portal/actions` | Profile, activity, completion and admin decisions |
| `POST /api/uploads?kind=photo|document|poster|activity-photo` | Raw file body; encoded filename in `X-File-Name` |
| `GET /api/files/:id` | Owner/admin downloads; linked approved public images only |
| `GET/POST /api/admin/records/:kind` | Whitelisted admin CRUD/maintenance; metadata in `shared/admin-records.js` |
| `POST /api/admin/users`, `/api/admin/invitations` | Account controls and internal invitations |
| `GET /api/trainers`, `/api/activities` | Public projections of shared records |
| `GET /api/public/organisations|learning_resources|content_pages|faqs` | Published managed records |
| `POST /api/public/subscribe|unsubscribe|verify-certificate` | Consent and minimal verification |
| `POST /api/enquiries` | Validated, deduplicated PostgreSQL contact submission |

Admin writes and decision audit events commit in one transaction. Generic changes retain before/after data; passwords are removed from user audits. Sessions and invitations store token hashes; passwords use salted scrypt. Trainer approval, account enabled state and certification are checked on every authenticated request. Revoked sessions cannot continue accessing files/API data. Supporting documents are never publicly served. Files accept JPEG, PNG, WebP and (documents only) PDF signatures, maximum 8 MB each; SVG/HTML uploads are rejected. Hosted legacy URLs are also checked for HTTP/HTTPS; private uploads are recommended for supporting documents.

`annual_trainer_contributions` calculates each assigned trainer's actual hours/reach from verified completions; `annual_project_reach` counts a multi-trainer activity's participants once. These are participation totals across activities, not distinct-person tracking. There is no independent hours ledger. Cancelled activities retain their status record plus cancellation timestamp/reason and cannot accept completion submissions or expose a registration link.

## Validation

```powershell
npm test
npm run lint
npm run build
node --env-file=.env --input-type=module -e "process.env.TEST_DATABASE_URL=process.env.DATABASE_URL; await import('./tests/portal.test.js');"
```

The integration test creates/drops an isolated schema. It tests registration gating, returned amendments, invitations, ownership, upload privacy, profile approval, activity lifecycle, multi-trainer totals, admin event creation/reschedule/cancel/archive, directory/resource/content/FAQ maintenance and publication, subscription/unsubscribe, certificate lookup, enquiry persistence/follow-up, immediate access revocation and audit attribution. No test accounts are inserted in the application schema.

For deployment beyond local development, configure HTTPS, backups, file retention and recovery operations. The current rate limiter is per-process; use shared rate limiting if running multiple API instances. No external email provider is called by these workflows.

## Five-minute inactivity logout

Both trainer and administrator sessions expire after five minutes without user activity. Keyboard input, pointer activity, scrolling and touch reset the timeout through a throttled activity heartbeat. Background polling and visibility changes do not extend the session. Expiry is checked by PostgreSQL on every authenticated request; expired sessions cannot be revived by a heartbeat. Active sessions have no fixed 12-hour cutoff. Activity in another tab sharing the session is respected before showing the idle logout message. Migration 008 applies this policy to existing sessions as well.
