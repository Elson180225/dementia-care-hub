import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { changeSubscription } from '../server/subscriptions.js';
import { enquiryTypes, validateEnquiry } from '../shared/enquiry.js';

test('enquiries accept 2,000 characters and reject historical categories on new submissions', () => {
  const details = { name: 'Visitor', email: 'visitor@example.test', type: enquiryTypes[1], message: '文'.repeat(2000) };
  assert.deepEqual(validateEnquiry(details), {});
  assert.ok(validateEnquiry({ ...details, message: details.message + '文' }).message);
  assert.ok(validateEnquiry({ ...details, type: 'Others' }).type);
});

test('renewed consent requires the email link and retains existing subscriber details',
  { skip: !process.env.TEST_DATABASE_URL }, async () => {
    const db = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
    await db.connect();
    try {
      await db.query(`BEGIN;
        CREATE TEMP TABLE subscribers (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text, email text, city text, state text, language text NOT NULL DEFAULT 'English',
          consent_version text, consent_at timestamptz, confirmed_at timestamptz, unsubscribed_at timestamptz, unsubscribe_hash text
        );
        CREATE UNIQUE INDEX subscriber_email_test ON subscribers(lower(email));`);
      await db.query(await readFile(new URL('../database/subscribers/004_subscriber_country.sql', import.meta.url), 'utf8'));
      const env = { BREVO_API_KEY: 'simulated', BREVO_SENDER_EMAIL: 'sender@example.test', APP_BASE_URL: 'https://project.example.test' };
      const messages = [];
      const options = { env, request: async (path, payload) => { assert.equal(path, '/smtp/email'); messages.push(payload.data); } };
      const signup = { name: 'Visitor', email: 'Visitor@Example.test', country: 'Malaysia', city: 'Bintulu', state: 'Sarawak', consent: true };
      await assert.rejects(changeSubscription('subscribe', { ...signup, country: '' }, db, options), /country/);
      const first = await changeSubscription('subscribe', signup, db, options);
      assert.equal(first.status, 'subscribed');
      assert.match(messages[0].textContent, /Unsubscribe: https:\/\/project.example.test\/get-updated\?unsubscribe=/);
      assert.equal((await changeSubscription('subscribe', { ...signup, name: 'Changed' }, db, options)).status, 'existing');
      assert.equal(messages.length, 1);
      await changeSubscription('unsubscribe', { token: new URL(first.unsubscribeLink, env.APP_BASE_URL).searchParams.get('unsubscribe') }, db, options);
      await changeSubscription('subscribe', { ...signup, name: 'Changed', country: 'Singapore' }, db, options);
      assert.equal(messages.length, 2);
      assert.ok((await db.query('SELECT unsubscribed_at FROM subscribers')).rows[0].unsubscribed_at);
      const token = new URL(messages[1].textContent.match(/https:\/\/\S+/)[0]).searchParams.get('resubscribe');
      assert.equal((await changeSubscription('resubscribe', { token }, db, options)).status, 'subscribed');
      await assert.rejects(changeSubscription('resubscribe', { token }, db, options), /invalid or has expired/);
      assert.deepEqual((await db.query('SELECT name,country,unsubscribed_at,consent_version FROM subscribers')).rows,
        [{ name: 'Visitor', country: 'Malaysia', unsubscribed_at: null, consent_version: 'email-updates-v2' }]);
    } finally {
      await db.query('ROLLBACK');
      await db.end();
    }
  });
