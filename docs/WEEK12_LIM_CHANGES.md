# Week 12 — Draft 02 implementation (Lim)

**Final revision:** 27 November 2026 | **Scope:** SCRUM-243–248 | **Status:** Ready for teammate review, subject to outstanding integration checks.

Baseline: main archive at commit `7314e11f0a891ee9231998bafdac905d9d088885` (27 November 2026). Scope SCRUM-243–248 only. The pending SCRUM-219 MFA PR #86 was not included in the baseline and was not modified or tested.

## Changes and status

| Jira      | Delivered                                                                                                                                                                                                                                                                                                                                                                                           | Remaining verification / dependency                                                                                                                                                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SCRUM-243 | Six pathways grouped around caregivers’ needs on a dedicated overview; separate Guidance page with five interactive topics; self-care moved to wellbeing; webinar/course links; removed public Caregiver certificate entry and redirected legacy routes; wellbeing page with three future assessment resource slots. Whole-card links, consistent purple hover/focus states and responsive layouts. | Professional review, approved references, CMS records and automated browser verification. No assessment/scoring engine.                                                                                                                                                 |
| SCRUM-244 | Family page with six interactive topics and five resource slots; approved resources pulled from existing learning-resource CMS. Dedicated topic and resource layouts.                                                                                                                                                                                                                               | RCBC specialist content and actual files/links.                                                                                                                                                                                                                         |
| SCRUM-245 | Shared directory with city and group type filters, four contact fields, no volunteer checkbox or detailed services in groups-only view; duplicate organisation cards suppressed.                                                                                                                                                                                                                    | Verify approved directory records and listing application route with Howard/Nikita; existing contact-team link retained until shared listing application route is known.                                                                                                |
| SCRUM-246 | Numbered objectives, phase titles, Phase 3 title only, five names, separate Supported By and Acknowledgements, CMS shortcuts. Compact contents navigation with dynamic header offset and current-section highlighting.                                                                                                                                                                              | RCBC profiles, logos, names and approved contribution text. Working objectives not presented as achievements. Legacy general About/journey CMS entries no longer rendered because of possible Phase 3 disclosure; republish approved phase 1/2 records using new slugs. |
| SCRUM-247 | Draft follow-up email/checklist in WEEK12_RCBC_FOLLOW_UP.md.                                                                                                                                                                                                                                                                                                                                        | Send to RCBC; actual replies pending.                                                                                                                                                                                                                                   |
| SCRUM-248 | Two-column registration UI with dedicated consent area, gated public POST, private admin API and resource-pool view, consent tracking, matching existing DCS certificate records, withdrawal/archive and audit decisions.                                                                                                                                                                           | Migrate and test PostgreSQL; confirm final privacy/consent; integrate Ming Hui's final registry if its schema differs; verify MFA merge and security in integrated environment.                                                                                         |

## Final visual and navigation refinements

- The Caregiver Support landing page is now a dedicated overview with six pathways, grouped into Caring for Others, Caring for Yourself & Your Family, and Connecting & Contributing. The existing hero and “Still looking for something?” call-to-action are retained; the call-to-action predates this work.
- Caregiver Guidance has its own route and retains the interactive five-topic guidance panel. Legacy links (`/caregiver-support#guidance`, `/caregiver-support?topic=activities` and `/caregiver-support/supporting-someone`) are redirected to the dedicated page as appropriate. The caregiver dropdown, navigation data and search destination are updated.
- Overview and training cards use consistent white resting backgrounds, visible action arrows and whole-card links. Purple hover and keyboard-focus states use readable white text; reduced-motion preferences are respected. Existing imagery, colours and fonts are reused.
- Wellbeing and Family Support use interactive topic selection, a detailed content panel and distinct resource lists. Volunteer uses an introductory panel beside a structured form. Support Groups has a clearer filter panel and directory cards; styling is scoped to Caregiver Support.
- About the Project uses a compact 172px contents rail instead of a large tinted box. The sticky and anchor offsets are measured from the actual site header using ResizeObserver where available. Active-section indicators and hover/focus styling provide feedback without blocky backgrounds. The contents rail becomes non-sticky on small screens.
- These refinements do not add dependencies or change the volunteer backend, migration or translation approval rules. The site-wide header, footer and MFA implementation are not redesigned.

### Public routes and administrative entry

| Page                               | Path                                |
| ---------------------------------- | ----------------------------------- |
| Caregiver Support overview         | `/caregiver-support`                |
| Caregiver Guidance                 | `/caregiver-support/guidance`       |
| Caregiver Education & Training     | `/caregiver-support/training`       |
| Caregiver Wellbeing & Resilience   | `/caregiver-support/wellbeing`      |
| Family Support & Shared Caregiving | `/caregiver-support/family`         |
| Support Groups                     | `/caregiver-support/support-groups` |
| Volunteer registration             | `/caregiver-support/volunteer`      |
| About the Project                  | `/about`                            |
| Private Volunteer Resource Pool    | `/admin/volunteers`                 |

## Changed-file inventory

26 files: 15 modified and 11 newly added relative to the supplied main archive. No deletions.

### Modified

- `scripts/migrate.js`
- `server/index.js`
- `src/App.jsx`
- `src/admin/AdminLayout.jsx`
- `src/admin/pages/Records.jsx`
- `src/components/DirectoryListings.jsx`
- `src/components/Header/Header.jsx`
- `src/components/Search/searchItems.js`
- `src/data/about.js`
- `src/data/navigation.js`
- `src/i18n/translations.js`
- `src/pages/AboutProject.css`
- `src/pages/AboutProject.jsx`
- `src/pages/CaregiverSupport.css`
- `src/pages/CaregiverSupport.jsx`

### New

- `database/031_volunteer_resource_pool.sql`
- `docs/WEEK12_LIM_CHANGES.md`
- `docs/WEEK12_RCBC_FOLLOW_UP.md`
- `server/volunteers.js`
- `shared/volunteer.js`
- `src/admin/pages/VolunteerManagement.jsx`
- `src/i18n/caregiverDraft.js`
- `src/pages/CaregiverTopics.jsx`
- `src/pages/VolunteerRegistration.jsx`
- `tests/browser/caregiver-navigation.spec.js`
- `tests/volunteer-draft02.test.js`

## Setup (Windows PowerShell)

1. In GitHub Desktop fetch origin, update `main`, then create a feature branch (suggested `feature/week12-caregiver-about-volunteer`). If PR #86 or other teammates' work has merged, **do not blindly replace shared files**. Compare with the supplied baseline and integrate only the relevant lines, preserving both sets of changes.
2. Extract `Week12_Lim_Final_Changed_Files.zip` into the repository root (the folder containing package.json); preserve all paths. This consolidated package supersedes the original update and both visual refinement ZIPs. Replace `docs/WEEK12_LIM_CHANGES.md` with this final revision if using the previously downloaded package. Do not copy an outer wrapper directory into the repo. No deletions are required.
3. With the local `.env` configured for a **local test database**, run:

```powershell
npm.cmd ci
npm.cmd run db:migrate
npm.cmd test
npm.cmd run build
npm.cmd run lint
```

4. In separate terminals, run `npm.cmd run server` and `npm.cmd run dev`. Open http://localhost:5173. Verify `/api/health/database` on port 3001.
5. For local-only multilingual previews, retain the existing `VITE_PREVIEW_BUNDLED_TRANSLATIONS=true` setting in `.env` and restart Vite. No production translation approval is bypassed. In Admin → Language & Translations, review new `ui/caregiverDraft/...` and header keys; approved source matching governs display.
6. The volunteer feature is disabled by default. **Only for local fake-data testing** add these to `.env`, then restart the API:

```dotenv
VOLUNTEER_REGISTRATION_ENABLED=true
VOLUNTEER_CONSENT_VERSION=local-test-only-v1
```

Do not turn on registration in the deployed review site or production until RCBC approves the policy and the exact consent text, the deployment is secured and migration/integration checks pass. Replace the consent wording in `src/i18n/caregiverDraft.js` and use a version corresponding to the approved wording; never use the test version for real applicants. No real personal data should be used in tests. Admin portal remains English, matching existing portal conventions. The local test feature gate is not an approval workflow itself.

## Integration notes

- Shared files needing special merge attention: `src/App.jsx`, `src/components/Header/Header.jsx`, `src/data/navigation.js`, `src/components/DirectoryListings.jsx`, `src/admin/AdminLayout.jsx`, `src/admin/pages/Records.jsx`, `src/i18n/translations.js`, `server/index.js`, `scripts/migrate.js`. Keep the final MFA-related `currentUser`/session rules, and register the volunteer handler before generic `/api/admin/` and `/api/public/` handlers. Keep all migration filenames from other PRs; migration numbering is not assumed to be globally unique. If `031_volunteer_resource_pool.sql` conflicts with another filename, coordinate and update the migration list (do not rename already-applied migrations).
- Uses existing `published_directory` API, not a new organisation table. The shared application link remains a Contact link until the assigned listing-application implementation is available.
- The baseline contains `dcs_certificates` but not Ming Hui's final central registry. Verify checks exact case-insensitive name and certificate reference, valid status, and normalised DCS–Family programme name. No automatic verification from just a supplied certificate number. No matching record means pending; administrators can explicitly mark not verified. Confirm final schema and programme naming with Ming Hui. Existing certificate records/API are retained. The old caregiver public verification URL redirects to physical education until a stable Participant Search URL exists; update the redirect after integration.
- Public GET `/api/public/volunteer-registrations` reveals only whether intake is enabled. Public POST stores input with consent version/time. GET/PATCH `/api/admin/volunteers` require an authenticated admin and do not expose data through any public route. Updates use an origin check and audit decisions. Rate limit uses process-local IP tracking; deploy appropriate proxy-level rate limiting and check shared-IP behaviour before launch. No automatic matching, assignment, public resource pool or deployment. Withdrawal/archival retain data; retention/deletion policy must be agreed with RCBC.
- Existing admin content record approval rules apply. Use the shortcuts under Content & Resources / Content Pages; enter English source text, reviewer, source, review date, and publish after review. Content slugs: `caregiver-guidance-{home-safety,daily-care,communication,behaviour,activities}`, `caregiver-wellbeing-1` through `-6`, `caregiver-family-1` through `-6`. Existing general guidance remains as baseline copy; approved CMS entries add reviewed details and references. Learning Resources: set `topic` to `caregiver-wellbeing-resource-1` through `-3`, or `caregiver-family-resource-1` through `-5`, set a permitted HTTP(S) URL and publication metadata. Actual tools not supplied. Use `about-objectives`, `about-phase-1`, `about-phase-2`, `about-advisors`, `about-supported`, `about-acknowledgements`; do not publish Phase 3 specifics. Contributor records use existing section text CMS; structured logo/profile uploads are not added in this change.
- Caregiver guidance and resource content uses existing public records endpoint, which returns published non-archived records. Review dates and references appear once records are provided; no fabricated dates. All new public strings have draft Malay/Chinese suggestions, subject to the existing review workflow.

## Tests

Run focused tests with `node --test tests/volunteer-draft02.test.js tests/bundled-preview.test.js tests/translation-review.test.js tests/inline-translation-approval.test.js tests/translation-coverage.test.js tests/translation-workspace.test.js`.

### Recorded verification

| Check                                                                    | Result                                                                                                                                                     |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial focused dependency-free tests                                    | 26/26 passed (reported during implementation; not the full suite).                                                                                         |
| Initial syntax checks                                                    | 20 JS/JSX files checked; no syntax errors reported.                                                                                                        |
| Visual and navigation refinement checks                                  | Focused regressions 4/4 passed at each refinement stage; final navigation JSX/JS syntax 6/6 and CSS parsing 2/2 passed, as reported during implementation. |
| Local manual visual review                                               | User confirmed the final visual/navigation changes look fine after testing.                                                                                |
| Playwright browser tests                                                 | Three scenarios added; local run stopped at Chromium launch for all three because the browser executable was missing. No browser assertions were executed. |
| Full build, lint, PostgreSQL migration and authenticated API integration | Not confirmed in the available record.                                                                                                                     |

In the implementation environment, `npm ci` could not install dependencies (cache miss / registry unavailable). The existing reuse-translations test also could not load its dependencies. Syntax checks and dependency-free tests do not replace integration tests. The final documentation revision does not rerun or claim additional tests.

### Browser regression tests

`tests/browser/caregiver-navigation.spec.js` covers distinct overview/guidance pages and legacy links; consistent training-card styling, hover and click behaviour; and the About navigation offset, active section and mobile layout. It mocks API responses and therefore is not a database or authentication integration test.

Install the missing browser once, then rerun from the repository root:

```powershell
npx.cmd playwright install chromium
npm.cmd run test:browser -- caregiver-navigation.spec.js
```

Exclude generated `test-results/`, `playwright-report/` and `node_modules/` from Git. Retain the test source. The missing browser is a local setup issue, not evidence of a failed website assertion.

### Manual checks before PR approval

- `/caregiver-support`: six clickable pathways, consistent resting and hover/focus styles, no detailed guidance panel, no Certificate Verification navigation, no old volunteer opportunities. `/caregiver-support/guidance`: five interactive topics, return link, and working legacy hash/query redirects. `/caregiver-support/training`: consistent card styling, working webinar/course links and purple hover/focus states. `/caregiver-support/wellbeing` and `/caregiver-support/family`: all topics and resource slots, approved CMS content and references, no scoring functionality.
- `/caregiver-support/support-groups`: published test records only, city/type combined filters, reset, empty/error cases, four contact fields. Verify Resource Finder is unchanged.
- `/about`: objectives and correct advisor names, separate roles, Phase 3 heading only in EN/BM/Chinese, contents rail visible below header, correct section scrolling and active indicator; compact layout on mobile. Review existing published content and other teammates' pages for stale Phase 3 references.
- `/caregiver-support/volunteer`: disabled by default; enable locally, try invalid data, missing consent, valid fake submission. Submit via API directly while disabled and confirm 503. Verify no PII in public GET. Sign out and request `/api/admin/volunteers` → 401; trainer account → 403. Confirm authorised admin sees test record, status filtering works, unmatched certificate is not verified, valid DCS–Family test certificate can verify, withdrawn/archived records are not active and audit decisions are recorded. Check revoked and wrong-programme cases. Confirm final MFA path after PR #86 merges.
- Review 100%/150% desktop and mobile, keyboard tab/focus, zoom, and translated content. Use existing translation approval UI and confirm English fallback for unapproved entries.
- Verify old certificate links redirect appropriately and replace provisional redirect when public DCS Participant Search lands.

## Suggested PR

**Title:** Implement Draft 02 caregiver support, About and private volunteer registration (SCRUM-243–248)

**Description:**

- Reorganise Caregiver Support into a dedicated overview and separate Guidance page; add wellbeing and family sections with CMS resource slots.
- Refine caregiver page styling, whole-card links and consistent hover/focus states; fix About contents navigation clipping and active-section feedback.
- Simplify the support groups view without changing the shared organisation backend.
- Update About objectives, phases, advisor names and contributor sections.
- Add gated volunteer interest intake, private admin resource pool, validation and certificate verification against the baseline registry.
- Provide EN/BM/Chinese translation suggestions, focused tests, browser regression scenarios and RCBC clarification checklist.
- Final visual refinements manually reviewed locally; browser automation still needs Chromium installed.
- Follow-up: RCBC content/consent approval, final central registry integration and full local test/build; keep volunteer intake closed until approved.

Request a teammate review and approval; do not self-merge. Verify migration and all shared-file changes after the latest main is merged.
