# Client preview content and translation deployment

## What changed

Learn & Events CMS data now lives in PostgreSQL (`learn_events_content`), not a writable repository JSON file. Each save checks the current revision and retains the previous content in `learn_events_content_history`. Admins must reload rather than overwrite another editor's newer save. Database changes remain after web-service redeployment.

Migration 025 inserts a clean initial snapshot once. It does not replace existing CMS data on later deployments. Programme IDs are preserved so intake links and translation keys remain stable.

Historical webinars are seeded after the first admin registration and on subsequent migration runs. The repeatable seed inserts only missing IDs and never replaces edited webinars. This repairs installations where migrations 010/011 ran before an admin existed. The existing 12 historical webinar definitions are retained; no new trainer teaching/publication permissions are granted.

Migration `035_historical_demo_approval.sql` marks those seeded RCBC/CT historical activity IDs and their linked Grouped Q&amp;A learning resources as **RCBC content-approved and published** so client demonstrations show a full public archive. Anything admins create later still goes through **Publication &amp; webinar library** and **Content &amp; records** review before it is public.

Public event cards and CMS lists use the database. An empty published event list stays empty; API failures display a loading error instead of substituting sample events. Example organisation records remain available to administrators but are excluded from public directory and translation sources.

## Explicit test exclusions

The user identified these entries as testing data:

- Events: Testing 1, Testing 2, Dementia Care skill, Dementia workshop, Waka Waka Ei Ei.
- Topic: `topic-1793265675178` (Dementia Workshop).
- Programme: `dcs-track-1794038842414` (Track 04, DCS, Testing, Student).
- Outreach pillar: `pillar-1794042812642` (Working together / To be brave).

These are excluded from the clean bootstrap and export/import. Local operational testing events are not deleted. Their participant and payment records are not transferred. Future ambiguous entries are not removed by a broad keyword filter. A pre-migration copy of the original local JSON was saved under ignored `tmp/cms-before-postgres.local`.

## Registration starts closed

No existing registration settings are trusted for deployment. Export strips external registration links, Google Form links, fees, payment instructions and related registration translations; it exports no registration settings rows. Import enforces this even for older bundles.

Newly imported events have no registration link and no settings row. The backend treats this as **registration closed** and **pricing not configured**, rather than incorrectly labelling the event free. CMS programme cards use “Programme information”; old “Open for Registration” badges and test form links are cleared from deployment content. Genuine titles, dates, descriptions and posters remain.

After deployment, an administrator opens the event editor, enters RCBC-confirmed free/paid classification, fee and instructions if applicable, chooses Website or Google Form registration, and explicitly opens registration. Re-import never overwrites settings already configured in the destination. It does not delete existing destination testing submissions; the exclusion rule prevents transferring source testing submissions.

Public cards without a real link show “Registration not open yet”, rather than linking to a generic Google Forms homepage.

## Deploy code first

Deploy the updated branch with:

- Build: `npm ci --include=dev && npm run build`
- Start: `npm run db:migrate && npm run server`

Keep the existing preview database and set the web service's DATABASE_URL to that database. Do not create a fresh database for each deployment. Check the public event endpoint and admin event list after migration.

A public repository URL deployment needs **Manual Deploy → Deploy latest commit**. The code must first be pushed to the branch Render is configured to deploy. These changes are not automatically pushed or merged.

## Transfer actual local content

A deployment does not automatically copy local database content. The transfer command exports published non-test event information (registration closed), published non-example directory/content/resource records, their referenced uploads, cleaned CMS data, matching translations and review provenance. It excludes accounts, passwords, sessions, all registration submissions and participant records (including History), payment evidence, payment/confirmation statuses, confirmation deliveries, participant CSV import logs, reminder history, subscriber/contact submissions and certificate records. All existing registrations are user-confirmed testing data. Unpublished drafts are not operational event imports.

Use a terminal with DATABASE_URL pointing to the **local source**, and a different explicit PREVIEW_DATABASE_URL for the **preview destination**. Do not reuse the existing production database. External Render URLs require TLS; `sslmode=verify-full` explicitly requests certificate verification. Keep URLs and bundles private.

1. Export to a new, ignored file (the command refuses to overwrite existing files):

   `npm run content:transfer -- --export --file tmp/client-preview.local`

2. Set PREVIEW_DATABASE_URL privately in that terminal. It is never inferred from DATABASE_URL. Ensure the preview administrator exists and migration 025 has run.

3. Run the dry run:

   `npm run content:transfer -- --import --file tmp/client-preview.local --admin-email YOUR_PREVIEW_ADMIN_EMAIL`

   Review excluded events, inserted record counts, source differences, translation outcomes and **targetCmsRevision**. Dry run makes proposed changes inside a transaction and rolls them all back.

4. Obtain a full database backup before applying. The tool additionally saves the existing rows from the tables it updates in an exclusive local backup file; this is a content snapshot, not a complete PostgreSQL backup.

5. Apply the reviewed bundle using the exact reported revision:

   `npm run content:transfer -- --import --file tmp/client-preview.local --admin-email YOUR_PREVIEW_ADMIN_EMAIL --cms-revision N --backup tmp/preview-before-import.local --apply`

   Apply rejects a changed CMS revision. It replaces CMS only as explicitly requested, inserts missing event/resource/file records, and leaves existing IDs and translations unchanged. It does not delete target records. Re-importing does not duplicate records. Run imports during a quiet preview testing window so concurrent edits do not race with the transfer.

Do not commit `.local` files. They contain private review information. Close the terminal after finishing to clear temporary environment variables.

## Translation safety and count differences

The catalogue count depends on the deployed English UI code, CMS items, published events, registration instructions and published directory/content/resource records. Removing test content changes the count intentionally. Compare the same deployed commit and imported content before comparing local/preview totals.

The transfer reports missing English keys, changed English and target-only keys, plus per-page target source counts. It does not translate or approve new wording automatically.

An approved translation remains approved only if:

- Its source key exists and English text matches exactly.
- Its review category matches the destination's requirement.
- The original approver maps by email to an active destination admin and an approval date exists.
- Medical/professional entries have an original, separate expert review with its date, and that reviewer maps to a designated destination expert in the relevant scope.

Do not create fake reviewer accounts or assign expert permissions merely to preserve approvals. Unverifiable approvals become pending review; changed English becomes needs-review; removed/test sources are excluded. Original entry and available review history are retained as import provenance under the importing admin, without pretending that admin performed the historical approval.

Existing target translations and page review requirements are never overwritten or relaxed. Missing users/expert assignments can therefore leave fewer published translations on the preview than locally. The public website continues to use approved English until review is complete.

### Bundled translations on the public site

`npm run db:migrate` publishes bundled Malay/Chinese catalogue entries (UI, CMS suggestions) as **approved** in `translation_entries`. The public API always merges bundled wording with database approvals, so language switching works in production builds without a separate preview flag. Admin changes in **Language & translations** override bundled text. Re-run `npm run translations:demo-publish` after large English catalogue updates.

## Verification

- Edit a CMS heading, reload and restart the service: the saved value remains.
- Save from two editor tabs: the stale save receives a reload message.
- Check that public and admin published event IDs match, and no excluded test events appear after import.
- Confirm historical seed reruns do not replace edited webinar titles or create duplicates.
- Check correct source and approval status in Language & Translation; changed/unverified items must not publish.
- Confirm existing local participants, payments and trainer permissions are unchanged.
