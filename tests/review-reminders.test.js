import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { BrevoError } from '../server/brevo.js';
import { maintenanceCounts } from '../server/content-review.js';
import { reviewReminderHandler, runReviewReminder } from '../server/review-reminders.js';

test('the reminder endpoint requires a secret and an explicit run mode', async () => {
 const env = { REVIEW_REMINDER_SECRET: 'a'.repeat(64) };
 const run = async ({ dryRun }) => {
  assert.equal(dryRun, true);
  return { status: 'previewed', count: 1 };
 };
 const call = (mode, secret) => reviewReminderHandler(
  { method: 'POST', headers: { authorization: `Bearer ${secret}` } },
  {}, new URL(`https://care.example/api/admin/review-reminder${mode}`),
  (_res, status, payload) => ({ status, payload }),
  { env, run, logger: { log() {} } },
 );
 assert.equal((await call('?mode=live', 'wrong')).status, 401);
 assert.equal((await call('', env.REVIEW_REMINDER_SECRET)).status, 400);
 assert.equal((await call('?mode=preview', env.REVIEW_REMINDER_SECRET)).payload.status, 'previewed');
});

test('review digest matches Maintenance and claims one Brevo send per Malaysia day',
 { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const db = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  await db.connect();
  try {
   await db.query('BEGIN');
   await db.query(`
    CREATE TEMP TABLE organisations (name text, review_status text, next_review_at timestamptz, id uuid DEFAULT gen_random_uuid());
    CREATE TEMP TABLE directory_services (organisation_id uuid, service_type text, review_status text, next_review_at timestamptz);
    CREATE TEMP TABLE learning_resources (title text, review_status text, next_review_at timestamptz);
    CREATE TEMP TABLE content_pages (LIKE learning_resources);
    CREATE TEMP TABLE faqs (question text, review_status text, next_review_at timestamptz);
    CREATE TEMP TABLE enquiries (status text);
    CREATE TEMP TABLE users (email text, name text, role text, enabled boolean);
   `);
   const migration = await readFile(new URL('../database/026_review_reminder_deliveries.sql', import.meta.url), 'utf8');
   await db.query(migration.replace('CREATE TABLE', 'CREATE TEMP TABLE'));

   const env = {
    APP_BASE_URL: 'https://care.example', BREVO_API_KEY: 'simulated',
    BREVO_SENDER_EMAIL: 'sender@care.example', REVIEW_REMINDER_ENABLED: 'true',
   };
   const messages = [];
   const preview = [];
   const options = {
    db, env, now: new Date('2026-01-01T18:00:00Z'),
    request: async (_path, { data }) => {
     messages.push(data);
     return { messageId: 'simulated-id' };
    },
    logger: { log: message => preview.push(message) },
   };

   assert.equal((await runReviewReminder({ ...options, env: {} })).status, 'disabled');
   assert.equal((await runReviewReminder(options)).status, 'nothing-due');
   await db.query(`
    INSERT INTO organisations(name,review_status,next_review_at) VALUES
     ('Clinic', 'current', '2020-01-01T19:00:00Z'),
     ('Archived clinic', 'archived', '2020-01-01'),
     ('Future clinic', 'current', '2099-01-01');
    INSERT INTO learning_resources VALUES ('Learning guide', 'needs review', NULL);
    INSERT INTO content_pages VALUES ('About dementia', 'current', '2020-01-01');
    INSERT INTO faqs VALUES ('What is dementia?', 'needs review', '2099-01-01');
    INSERT INTO enquiries VALUES ('new');
    INSERT INTO users VALUES
     ('admin@care.example', 'Admin', 'admin', true),
     ('trainer@care.example', 'Trainer', 'trainer', true),
     ('disabled@care.example', 'Disabled', 'admin', false);
   `);

   assert.deepEqual((await maintenanceCounts(db)).map(row => row.count), [1, 1, 2, 1]);
   assert.deepEqual(await runReviewReminder({ ...options, dryRun: true }), { status: 'previewed', count: 4 });
   assert.match(preview[0], /Clinic \| Organisation \| 2 Jan 2020/);
   assert.match(preview[0], /Learning guide \| Learning resource \| No due date set/);
   assert.match(preview[0], /About dementia \| Content page/);
   assert.match(preview[0], /What is dementia\? \| FAQ/);
   assert.match(preview[0], /https:\/\/care.example\/admin/);
   assert.doesNotMatch(preview[0], /Archived clinic|Future clinic|Enquiries/);
   assert.equal(messages.length, 0);

   const retryable = new BrevoError('Rate limited', 429, { retryable: true });
   await assert.rejects(runReviewReminder({ ...options, request: async () => { throw retryable; } }), retryable);
   const results = await Promise.all([runReviewReminder(options), runReviewReminder(options)]);
   assert.equal(results.filter(result => result.status === 'sent').length, 1);
   assert.equal((await runReviewReminder(options)).status, 'already-sent');
   assert.equal(messages.length, 1);
   assert.deepEqual(messages[0].to, [{ email: 'admin@care.example', name: 'Admin' }]);
   assert.equal((await db.query('SELECT review_day::text FROM review_reminder_deliveries')).rows[0].review_day, '2026-01-02');

   const tomorrow = { ...options, now: new Date('2026-01-02T18:00:00Z') };
   await assert.rejects(runReviewReminder({ ...tomorrow, request: async () => ({}) }), /receipt missing/);
   assert.equal((await runReviewReminder(tomorrow)).status, 'delivery-pending');
   assert.equal(messages.length, 1);
  } finally {
   await db.end();
  }
 });
