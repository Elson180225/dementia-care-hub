# Dementia Care Connect — Handover Guide for RCBC

This guide tells RCBC what the system is made of, who controls each part, and how to keep it running after the Swinburne student team (Team 11, 2026) finishes. It follows RCBC's Admin Portal Draft 02, section 21 (System Documentation, Development Continuity & Handover).

> **Status (2026):** functional foundation built and running on a **review link with test data**. Not yet approved for public launch. See [Known limitations](#known-limitations).

---

## 1. What the system is

| Part | What it does | Where |
| --- | --- | --- |
| Public website | Understanding Dementia, Find Help & Support, Caregiver Support, Education & Events, About, Contact, Get Updated | `/` |
| Trainer Portal | Verified trainers manage profile, training activities, completed activities and training records | `/trainer-portal` |
| Admin Portal | RCBC administrators approve, publish and maintain everything | `/admin` |
| API server | Node.js server for sign-in, approvals, content, emails, uploads | same address, `/api/...` |
| Database | PostgreSQL: all records, accounts, translations, audit history | Neon |

Review link: **https://dementia-care-connect.onrender.com**

## 2. Accounts and services RCBC must own

Every service below must be owned by an **RCBC account** (not a student's personal account) before handover. Transfer ownership, or create the service again under RCBC and move the data.

| Service | Used for | Owner today | Action at handover |
| --- | --- | --- | --- |
| **GitHub** — repository `dementia-care-hub` | Source code, issues, automatic daily reminder (GitHub Actions) | Student account | Transfer repository to an RCBC GitHub account or organisation |
| **Render** — web service `dementia-care-connect` | Hosts the website and API | Student account | Transfer the service or recreate it under RCBC; reconnect the GitHub repo |
| **Neon** — PostgreSQL | Database | Student account | Transfer the project to RCBC; rotate the password |
| **Brevo** | Sends website emails (password reset, registrations, reminders) and holds the Get Updated contact list | Team member account | Move to an RCBC Brevo account; use a verified **RCBC sender address**; create a new API key |
| **Domain name** (future) | A permanent address instead of `onrender.com` | Not bought yet | RCBC buys it and points it to Render; renew yearly |

**Hand over credentials securely**, never as plain text in chat, email or documents. Use a password manager share or tell the person directly, then **change every password and key** once RCBC has access.

## 3. Settings (environment variables)

Settings live in **Render → service → Environment**, never in the code. Names only are listed here; values are secret. The full list with explanations is in [`.env.example`](../.env.example).

| Setting | Purpose |
| --- | --- |
| `DATABASE_URL` | Connection to the Neon database (secret) |
| `APP_BASE_URL`, `PUBLIC_ORIGIN` | The live website address; used in email links and to block requests from other sites |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `BREVO_LIST_ID` | Email sending and the Get Updated list |
| `SUBSCRIBER_TOKEN_SECRET` | Signs unsubscribe links (secret) |
| `REMINDERS_ENABLED` | Event reminder emails to subscribers (`true` / `false`) |
| `REVIEW_REMINDER_ENABLED`, `REVIEW_REMINDER_SECRET` | Daily "content due for review" email to admins; the secret must match the GitHub Actions secret |
| `ENQUIRY_ADMIN_EMAIL` | Where Contact Us enquiries are sent |
| `PASSWORD_BREACH_CHECK` | Refuse passwords found in data breaches (on by default in production) |
| `ADMIN_MFA` | Two-step sign-in for admins (on by default in production once PR #86 is merged; `off` to disable) |

After changing a setting, click **Save, rebuild, and deploy**.

## 4. Deploying a change

1. Changes are made on a branch and merged into `main` on GitHub through a pull request.
2. In Render, open the service and click **Manual Deploy → Deploy latest commit** (automatic deploys are off).
3. Render runs the build (`npm ci --include=dev && npm run build`) and starts with
   `npm run db:migrate && npm run db:migrate:subscribers && npm run server`, so database updates apply automatically.
4. Check the deploy shows **Live**, then open the website.

To undo a bad deploy: Render → **Events** → choose the previous deploy → **Rollback**.

## 5. Database

- **Migrations** (database structure changes) are the numbered files in [`database/`](../database). They run automatically on deploy. Never edit an old migration; add a new numbered file and list it in `scripts/migrate.js`.
- **Backups:** Neon keeps point-in-time history (length depends on the plan). Before any large change, create a Neon **branch** as a snapshot. For an offline copy, run `pg_dump` with the connection string and store the file securely.
- **Restoring:** restore into a new Neon branch first, check it, then point `DATABASE_URL` at it.
- The review database holds **test data only**. Clear it and load approved content before launch.

## 6. Everyday administration (Admin Portal)

| Task | Where |
| --- | --- |
| See what needs attention | Overview, Approvals |
| Edit website text, FAQs, pages | Content & Resources |
| Approve translations (Bahasa Malaysia, 中文) | Language & Translations |
| Service directory and support groups | Directory Management |
| Webinars, courses, events, registrations | Education & Events; Registrations & Participants |
| Approve trainers and public profiles | Approvals; Trainer Management |
| Enquiries and Get Updated subscribers | Enquiries & Subscribers |
| Annual training report (Excel) and trainer hours | Trainer Hours & Reports |
| Admin accounts and access | Users & Access |

### Command-line tasks (run by the technical maintainer)

| Command | What it does |
| --- | --- |
| `npm run admin:invite -- person@rcbc.example` | Create a 24-hour invitation link for a new administrator |
| `npm run admin:reset-mfa -- person@rcbc.example` | Reset a lost authenticator (after PR #86 is merged) |
| `npm run brevo:check` | Check the Brevo email connection |
| `npm run reminders:preview` / `npm run review-reminders:preview` | Preview reminder emails without sending |
| `npm run db:migrate` | Apply database updates |

Run these on a computer with the project and a `.env` file holding the production settings, or in Render's **Shell**.

## 7. Security in place

- Admin accounts by invitation only; trainers verified by RCBC before access.
- Passwords stored as salted scrypt hashes; at least 15 characters; leaked passwords refused.
- Sign-in attempts rate-limited; sessions end after 5 minutes of inactivity.
- Requests from other websites are refused (origin check).
- Permissions checked on the server, not only by hiding menu items.
- Two-step sign-in (authenticator app) for admins once PR #86 is merged.

Keep at least **two** RCBC System Administrators so access is never lost. When someone leaves, disable their account in **Users & Access** and change any shared keys they knew.

## 8. Costs

| Item | Today | For public launch |
| --- | --- | --- |
| Render | Free plan (sleeps when idle; first visit can take about a minute) | Paid plan recommended so the site is always awake |
| Neon | Free plan | Check storage and history limits; paid plan if needed |
| Brevo | Free plan (daily sending limit) | Check limits against subscriber numbers |
| GitHub | Free | Free |
| Domain | — | Yearly renewal |

Check each provider's current pricing before launch; prices change.

## 9. Known limitations

- Review link uses **test data**; real content, statistics, logos and translations need RCBC approval.
- **Privacy Policy** and **Terms of Use** show agreed working wording; final legal text must be approved **before collecting public personal data**.
- Event reminder emails and the daily admin review reminder are currently **switched off**.
- RCBC Draft 02 items still planned: DCS Training & Certification Registry with public participant search, Volunteer Resource Pool, shared organisation records, listing applications.
- Render free plan delay on first visit.

## 10. Further documents in this repository

| Topic | Document |
| --- | --- |
| Emails and Get Updated | [`docs/GET_UPDATED_EMAIL_SETUP.md`](GET_UPDATED_EMAIL_SETUP.md) |
| Daily review reminder | [`docs/ADMIN_REVIEW_REMINDER_DEPLOYMENT.md`](ADMIN_REVIEW_REMINDER_DEPLOYMENT.md) |
| Translations | [`docs/translation-review.md`](translation-review.md), [`docs/TRANSLATION_UPDATE_HANDOVER.md`](TRANSLATION_UPDATE_HANDOVER.md) |
| Trainer rules | [`docs/certified-trainer-governance.md`](certified-trainer-governance.md) |
| API | [`docs/api-spec.md`](api-spec.md), [`docs/portal-api.md`](portal-api.md) |
| Database design | [`docs/shared-records-erd.md`](shared-records-erd.md) |

RCBC's roadmap: 2026 build (this phase) → 2027 content, review and operational preparation → 2028 testing, pilot and public launch. Update this guide whenever hosting, settings or responsibilities change.
