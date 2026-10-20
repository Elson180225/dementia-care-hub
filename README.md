# Dementia Care Connect

A platform supporting people living with dementia, caregivers and families, with public resources, event information and trainer/admin portals.

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

Some database integration tests require `TEST_DATABASE_URL` and are skipped when it is absent.

`npm run preview` previews the frontend build locally; it does not start the API or replace a production server.
