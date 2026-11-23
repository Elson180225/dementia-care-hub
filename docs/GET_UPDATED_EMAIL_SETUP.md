# Get Updated and automatic activity reminders

## Database connections

The website, admin accounts, trainers, events and enquiries use local PostgreSQL through `DATABASE_URL`. Signup, unsubscribe, subscriber admin records, Brevo sync, subscriber audits and reminder delivery tracking use `SUBSCRIBER_DATABASE_URL` (Supabase PostgreSQL). Blank subscriber URL preserves the original single-database installation; a configured but unavailable subscriber database never falls back locally.

```dotenv
DATABASE_URL="postgresql://rcbc_app:LOCAL_PASSWORD@127.0.0.1:5432/dementia_care_hub"
SUBSCRIBER_DATABASE_URL="YOUR_SUPABASE_POSTGRESQL_URI"
PUBLIC_ORIGIN=http://localhost:5173
APP_BASE_URL=http://localhost:5173
API_PORT=3001
BREVO_API_KEY="YOUR_NORMAL_BREVO_API_KEY"
BREVO_LIST_ID=12
BREVO_SENDER_EMAIL="verified-sender@your-domain.example"
BREVO_SENDER_NAME="RCBC Dementia Care"
SUBSCRIBER_TOKEN_SECRET="GENERATE_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS_LONG"
REMINDERS_ENABLED=false
REMINDER_INVITE_LEAD_HOURS=504
REMINDER_LAST_CALL_ENABLED=false
REMINDER_BATCH_SIZE=100
```

Use Supabase Connect to copy the exact URI. Direct connection works with IPv6 or the IPv4 add-on. Session pooler is suitable for IPv4 and this persistent Node server. Do not use transaction-pooling mode: the worker uses a session advisory lock. Retain TLS verification and URL-encode special characters in the database password. This implementation uses PostgreSQL directly, not Supabase Auth or its REST client. [Supabase connection documentation](https://supabase.com/docs/guides/database/connecting-to-postgres).

Run:

```powershell
npm install
npm run db:migrate
npm run db:migrate:subscribers
```

The first migration targets local website tables. The second targets subscriber storage and adds `reminder_deliveries`. It supports previous successful standalone migrations. Compatible existing subscriber tables are adopted. Recognised empty legacy tables using `full_name`, `city_state`, and `preferred_language` are preserved in an archive schema; populated legacy or unknown schemas stop migration without deleting data. Existing local subscribers are not copied automatically. Preserve consent timestamps, opt-outs, IDs and unsubscribe hashes when migrating real data.

The standalone schema enables RLS and removes browser API grants. Use the migration owner initially; a restricted runtime role needs explicit table/sequence grants and suitable RLS policies. Subscriber audit actor UUIDs refer to authenticated admins from the local database without a cross-database foreign key.

## Brevo setup and verification

1. Create/activate a Brevo account. Add and verify the approved RCBC sender, and authenticate its domain following the DNS records Brevo supplies. Use that exact sender email in `BREVO_SENDER_EMAIL`.
2. Create a dedicated Get Updated contact list. Put its numeric list ID in `BREVO_LIST_ID`.
3. Generate a normal API key under Settings > SMTP & API > API Keys & MCP. Do not use an SMTP password or convert it to an MCP key. Store it only on the backend.
4. Create normal text attributes `NAME`, `CITY`, `STATE`, `LANGUAGE`. `EMAIL` already exists. Alternatively, `npm run brevo:setup` creates missing text attributes and verifies the sender/list. It preserves existing attributes and does not send email.
5. Run `npm run brevo:check` to verify the configuration without changes. If Brevo blocks the server IP, review [Authorised IPs](https://app.brevo.com/security/authorised_ips), recognise the server IP, and authorise it. A dynamic IP may need authorising again.

The setup/check scripts also validate `APP_BASE_URL`, sender settings and the unsubscribe secret. Generate the secret once in a private terminal:

```powershell
node --input-type=module -e "import {randomBytes} from 'node:crypto'; console.log(randomBytes(32).toString('hex'))"
```

Copy it into `.env` and retain it. Changing it invalidates previously emailed unsubscribe links. Do not share API keys, database passwords or this secret in messages/screenshots. The project `.env` is gitignored.

References: [Brevo API keys](https://help.brevo.com/hc/en-us/articles/209467485-Create-and-manage-your-API-keys), [contact attributes](https://help.brevo.com/hc/en-us/articles/10617359589906-Create-and-manage-custom-contact-attributes), [email API](https://developers.brevo.com/docs/send-a-transactional-email).

## Signup, admin access and manual campaigns

Start `npm run server` and, in another terminal, `npm run dev`. Visit `/get-updated`, submit your own email with name, city, state, preferred language and explicit consent, and save the website unsubscribe link returned on the first signup. Repeated signup preserves existing preferences, including opt-outs. There is no automatic welcome or double-opt-in message.

Verify both connections:

```powershell
Invoke-RestMethod 'http://127.0.0.1:3001/api/health/database'
Invoke-RestMethod 'http://127.0.0.1:3001/api/health/subscribers'
```

If needed, create a first administrator with `npm run admin:invite -- your-approved-admin@example.com`. Open the private printed invitation URL, register with the invited email and a password of at least 12 characters, then sign in at `/admin`.

Content and records retains the merged database editor. Its Get Updated panel adds manual audience sync, CSV export, and reminder status. Subscriber editor operations use Supabase; other record types stay local. Login/refresh state retains empty arrays for fields omitted by the API.

For manual campaigns, sync before every send. Local website opt-outs are blocked in Brevo before contacts are added. Existing provider blocks are never cleared. Sync filters match locality exactly ignoring case; they add contacts to the list rather than removing earlier contacts. Choose the corresponding Brevo recipient segment before sending a manual campaign. Sync itself does not send email. Active-only CSV export is an alternative, but imports alone do not revoke contacts previously imported: reconcile all website opt-outs manually if not using API sync.

## Automatic reminder rules

With `REMINDERS_ENABLED=true`, the running API scans immediately after startup and every 60 seconds:

| Email | Timing | Recipients |
| --- | --- | --- |
| Initial invite | 21 days before the event by default, or up to 14 days before an early registration cutoff if that comes first | Matching Get Updated subscribers without an active registration recorded for that event |
| Optional last call | Within seven days of registration closing, or seven days before the event if there is no earlier deadline. The invite must have been accepted by Brevo at least 48 hours earlier. | Matching subscribers who received the invite and still have no active registration recorded |
| Final event reminder | Within 72 hours of the event starting, including after registration closes | Confirmed participants with an active registration |

Only published, uncancelled events qualify. Invitations and last calls require open registration and skip events whose recorded confirmed registrations have reached capacity. Events can use website registration or a valid external form. A late publication or a late confirmation can qualify for its email on the next scan while the relevant window remains open.

Subscriber invitations and last calls require consent, matching language, and matching city for in-person events that have a city. They use Brevo’s contact blocklist and include a site unsubscribe link. Final reminders use the participant list and do not require a Get Updated subscription. For Google Forms events, import registrations and confirm participants in the portal so the system can identify them for the final reminder and skip them when sending registration emails. Brevo’s transactional suppression still applies.

In the event editor, use **Venue** for the exact address and **Registration instructions** for parking, drop-off, caregiver stay requirements, and any respite arrangements. The emails include the available information, start and end times in Malaysia time, and calendar links. Subscriber emails also put the registration deadline near the top when it is set. Recipients can open Google Calendar directly or download a calendar file for Apple Calendar or Outlook.

Each subscriber can receive one email per stage and event occurrence. Existing subscriber delivery records are treated as invites, preserving duplicate protection on upgrade. Final reminders are tracked per confirmed participant and event occurrence. A changed start time creates a new occurrence. Check subscriber sends in **Get Updated → Check event reminder emails** and final sends in **Participants → Reminder history**.

On Render, run both `npm run db:migrate` and `npm run db:migrate:subscribers` before starting the updated server. After testing, set `REMINDERS_ENABLED=true`. The 21-day default uses `REMINDER_INVITE_LEAD_HOURS=504`, which replaces the old `REMINDER_LEAD_HOURS` setting. Set `REMINDER_LAST_CALL_ENABLED=true` only if you want the optional last call. Once configured, the [daily GitHub workflow](ADMIN_REVIEW_REMINDER_DEPLOYMENT.md) can wake a sleeping Free web service for a startup scan even when admin review email delivery is disabled.

An advisory lock prevents concurrent workers from sending the same queue. Durable `sending` claims are recorded before dispatch. A successful provider receipt is recorded as `sent` with its message ID; this means provider acceptance, not confirmed inbox delivery. Check Brevo's transactional delivery logs for delivery/bounces. Brevo receives a stable idempotency key as an additional safeguard; the durable database ledger remains the long-term source of deduplication.

Explicit rate-limit rejection retries after five minutes, up to five attempts. Preparation/lookup failures also retry within that limit. Definite nonretryable rejection becomes `failed`. Network timeouts/server errors during dispatch or unreadable receipts become `uncertain`; a process crash can leave `sending`. Neither is automatically resent, because the provider might already have accepted the email. This favours avoiding duplicate sends over automatic recovery from every failure. There remains an unavoidable small race if an event/consent changes after the last read and before provider acceptance; already accepted mail cannot be recalled.

## Test without sending email

```powershell
npm run brevo:check
npm run reminders:preview
npm test
npm run build
npm run lint
```

Preview reports eligible subscriber and participant counts under `eligibleByStage` without writing delivery claims or calling Brevo. Counts can include people already reminded.

Database integration tests use `TEST_DATABASE_URL` to create and remove isolated schemas, with a simulated email provider. They exercise concurrency, opt-out filtering, duplicate prevention, ambiguous sends and cancellation without sending real messages. Never point `TEST_DATABASE_URL` at a database where the test role cannot safely create isolated schemas.

## Test one real reminder

1. Keep `REMINDERS_ENABLED=false` while preparing the test. Restart the API if changing `.env`.
2. Use only subscribers you intend to contact. In the admin subscriber editor, verify your own consented test email and language/locality. The reminder worker reads Supabase subscribers directly, not just the configured Brevo list.
3. Create a workshop or seminar for about 24 days from now with open registration and a deadline 17 days from now. Choose a matching language and city, then approve and publish it. The event should be outside the invite window.
4. Move the event inside 21 days of its start or move its registration deadline within 14 days. The preview should count the invitation. To test a final reminder, create a separate event that starts within 72 hours and confirm only your own test registration.
5. Set `REMINDERS_ENABLED=true`, then restart the API. Startup scans immediately; subsequent scans run every minute. You can also run `npm run reminders:run` for a one-time live scan. Both paths use the same lock/ledger.
6. Open Content and records > Check automatic reminders. Confirm a `sent` entry, then check Brevo's transactional logs and your inbox/spam folder. If tracking remains `retry`/`failed`, inspect sender approval, key/IP restrictions, available quota and provider logs.
7. Run a second scan and confirm each stage sends only once for the same occurrence. In the email, open the event link and test the calendar links.
8. Using a second intended test event, verify draft/approved-only/cancelled events are excluded. Use your received unsubscribe link, confirm the action on the website, and verify no reminder is sent for another occurrence.

The API needs access to both databases while it scans. Use the public HTTPS origin for `APP_BASE_URL` so recipients can open the event, calendar and unsubscribe links. `REMINDER_BATCH_SIZE` caps each scan, while Brevo applies its account sending allowance.

## Inspect and recover tracking

Run this in Supabase SQL Editor (or the subscriber database):

```sql
SELECT activity_id, starts_at, stage, status, attempts, attempted_at, sent_at,
       provider_message_id, error
FROM reminder_deliveries
ORDER BY attempted_at DESC
LIMIT 50;
```

Final delivery history is stored in `event_attendance_reminders` in the website database. Keep both ledgers across restarts and deployments. Investigate `sending` or `uncertain` in Brevo logs before considering a manual resend. For a definite subscriber delivery failure, fix the cause and requeue only the selected activity, subscriber and stage:

```sql
UPDATE reminder_deliveries
SET status = 'retry', attempts = 0, next_attempt_at = now()
WHERE activity_id = 'ACTIVITY_UUID'
  AND subscriber_id = 'SUBSCRIBER_UUID'
  AND starts_at = 'EXACT_OCCURRENCE_TIMESTAMP'
  AND stage = 'invite'
  AND status = 'failed';
```

Do not apply this to `sent`, `sending` or `uncertain`. The event must still be published, uncancelled and future-dated, and consent is checked again before dispatch.

## Common problems

| Problem | Check |
| --- | --- |
| Port 3001 already in use | Stop the existing project API before restarting; do not launch a second copy on the same port. |
| `subscribers` already exists | Run the current standalone migration, which handles compatible schemas; do not drop real subscriber data. |
| `reminder_deliveries` missing | Run `npm run db:migrate:subscribers` against the connection used by the API. |
| No reminder | Check the enabled setting, published status, stage window and delivery history. Check registration availability and subscriber preferences for invites, or participant confirmation for final reminders. |
| Empty Brevo list | Signup does not automatically sync; use the admin sync panel. Reminder sending is a separate workflow. |
| Unknown server IP | Review Brevo's authorised IP settings for the actual backend IP. |
| Sender rejected | Use an active verified Brevo sender, then run `npm run brevo:check`. |
| Unsubscribe link fails | Keep the same `SUBSCRIBER_TOKEN_SECRET` and use the public API website URL as `APP_BASE_URL`. |

Appoint RCBC owners for approvals, sender identity, privacy notice, subscriber retention and delivery-log review. No phone number or public user account is collected for Get Updated.
