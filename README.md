# Dementia Care Connect

A platform supporting people living with dementia, caregivers and families, with public resources, event information and trainer/admin portals.

> **Handing over to RCBC?** Start with the [Handover Guide](docs/HANDOVER.md): accounts to transfer, settings, deploying, backups, costs and known limitations.

## Local setup

Install a current Node.js LTS release and PostgreSQL. From the project folder, install dependencies:

```powershell
npm ci
```

For a new checkout, copy the example configuration:

```powershell
Copy-Item .env.example .env
```

If `.env` already exists, edit it instead of overwriting it. Fill in your own connection settings and keep credentials out of Git.

`DATABASE_URL` connects to the website database. `SUBSCRIBER_DATABASE_URL` connects to the subscriber database, which can be hosted on Supabase; leaving it blank uses the website database. Keep `REMINDERS_ENABLED=false` during initial setup to avoid sending automatic reminders.

After configuring the connections, create/update the database tables:

```powershell
npm run db:migrate
npm run db:migrate:subscribers
```

See [Get Updated and email setup](docs/GET_UPDATED_EMAIL_SETUP.md) for Supabase connections, Brevo configuration and reminder testing.

See [Daily admin review reminder deployment](docs/ADMIN_REVIEW_REMINDER_DEPLOYMENT.md) for the Render settings, GitHub Actions schedule and preview steps.

See [Client feedback implementation and testing](docs/client-feedback-implementation-and-testing.md) for trainer consent, contact follow-up, subscription, Resource Finder and About page acceptance tests.

## Run the website

Both the API and frontend must be running. Open two terminals in the project folder.

**Terminal 1 — API:**

```powershell
npm run server
```

Wait for the API to report that it is listening on `http://127.0.0.1:3001` (the default port).

**Terminal 2 — frontend:**

```powershell
npm run dev
```

Open the local URL printed by Vite, normally <http://localhost:5173/>. Keep both terminals running. Use `Ctrl+C` to stop each process. Restart the API after changing `.env`.

If Vite reports `ECONNREFUSED 127.0.0.1:3001`, the API is unavailable: start it in the other terminal and check its output. A reminder scan error is separate from API startup; check the database connections and email setup guide.

## Checks and production build

```powershell
npm test
npm run lint
npm run build
```

`npm test` runs the maintained `*.test.js` files under `tests/`. PostgreSQL integration tests run when `TEST_DATABASE_URL` points to a dedicated test database. They create and remove temporary schemas, so use a database you have set aside for testing.

To run the browser tests for site search, WhatsApp sharing, event structured data, and review dates:

```powershell
npx playwright install chromium
npm run test:browser
```

Playwright starts Vite and serves sample API responses, so these tests run without `.env` credentials or a running API. Add `-- --headed` to `npm run test:browser` to watch the tests in Chromium.

For a manual check with your own published data, start `npm run server` and `npm run dev` as described above. Then:

1. Open search and try `support carer`, `HEALTH hosp`, and `caregiver xyzunknown`. Check for Caregiver Wellbeing, Healthcare Resources, and the empty state, respectively. Press Escape and check that focus returns to the search button.
2. Search for a published event using its city and part of its title. Open it and reload to confirm the URL works directly. Inspect `script[type="application/ld+json"]` in DevTools and check the event name, start date, and venue against the page.
3. Click **Share on WhatsApp** on that event and on a public information page. Check the prefilled message and URL before choosing a recipient.
4. Open a published learning resource or directory record with a recorded review date. Check that the **Last reviewed** stamp shows the Malaysia date. A record without a review date should have no stamp.

`npm run preview` previews the frontend build locally; it does not start the API or replace a production server.

# Education & Events review workflow (November 2026)

Run `npm run db:migrate` before restarting the API after updating this version. Migrations 028-032 add the DCS registry, activity contributions, publication review, actual attendance and a shared learning-resource master. Deployment must run the same migration command against its own database before starting the updated server.

- **Education & Events → Publication & webinar library:** approve source information and publication permissions. Historical seeded activities remain private pending RCBC review; completion alone never makes them public. RCBC still needs to identify and approve the intended ten historical webinars.
- **Physical Education:** edit a permanent programme and its linked dated intakes. To activate a future programme, prepare an intake with registration closed, review and publish that intake, then activate the programme. DCS-Family is the prerequisite for either advanced pathway.
- **Online Education → Learning resources:** use the shared resource editor. Previous CMS resources are preserved and copied as unapproved reference records, not automatically published. Link resources to an approved activity and record source, review date and publication permission.
- **Event registrations & participants:** website and external forms are supported, including both on one activity. External records use CSV import; this is not automatic Google Forms synchronisation. Free records are confirmed automatically; paid records require payment verification and confirmation. Shared email is allowed, active duplicate phone numbers are blocked, and capacity excess is advisory. Mark actual attendance separately. Completion and certificates belong in the DCS registry.
- **DCS training registry:** create or import CSV/XLSX template records, preview validation, then verify identity/training information. Verification, public consent and public-display approval are three separate choices. Unknown participant records and test registrations are never automatically migrated or published. Excel imports read the first sheet, accept values rather than formulas, and are limited to 500 records/1 MB.
- **Completion reviews / Training reports & records:** record actual net duration, attendance and each trainer's delivered topic/hours. Trainers confirm their contributions, or admin records their documented offline confirmation. Review contributions individually. Verified completion can be reopened with a reason for correction. Annual exports contain five worksheets; attendances are counted once per activity and pending contributions do not enter verified hours.
- **Language & translations:** new public wording is under Education & Events. It remains English until translations receive the required review and approval.

## Verification

`npm test`, `npm run build` and `npm run lint` run the normal checks. Database-dependent tests require their explicitly configured test databases; never point those variables at production.

For a disposable PostgreSQL-engine integration check that does not use your configured database:

```powershell
npm install --prefix tmp/feedback-test-db --no-save --package-lock=false @electric-sql/pglite
node scripts/verify-education-isolated.mjs
```

This creates only an in-memory database, applies migrations, and exercises publication guards, registration/import, payment verification, registry privacy, actual completion and individual contribution reporting with synthetic records. Browser coverage is in `tests/browser/education-feedback.spec.js`; use `npx playwright test` after installing the supported browser, or configure an installed Edge/Chrome channel.
