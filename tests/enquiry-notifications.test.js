import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enquiryNotificationMessage, runEnquiryNotifications } from '../server/enquiry-notifications.js';
const env = { ENQUIRY_ADMIN_EMAIL: 'admin@example.org', BREVO_SENDER_EMAIL: 'sender@example.org', BREVO_API_KEY: 'test', APP_BASE_URL: 'https://example.org' };
const row = { id: '12345678-1234-1234-1234-123456789012', name: 'Visitor', email: 'visitor@example.org', type: 'Collaboration', message: 'Please contact me.' };
function database() {
 const updates = [];
 let claimed = false;
 return { updates, async query(sql, values) {
  if (sql.includes('RETURNING *')) { if (claimed) return { rows: [] }; claimed = true; return { rows: [row] }; }
  if (values) updates.push(values);
  return { rows: [] };
 } };
}
test('notification goes only to designated RCBC recipient and supports replying to visitor', () => {
 const message = enquiryNotificationMessage(row, env);
 assert.deepEqual(message.to, [{email: env.ENQUIRY_ADMIN_EMAIL}]);
 assert.equal(message.replyTo.email, row.email);
 assert.ok(message.textContent.includes(row.message));
 assert.equal(message.headers.idempotencyKey, row.id);
 assert.throws(() => enquiryNotificationMessage(row, {...env, ENQUIRY_ADMIN_EMAIL: 'invalid'}));
});
test('unconfigured email leaves enquiries queued without attempting delivery', async () => {
 const result = await runEnquiryNotifications({env: {}, db: { query() { assert.fail('Must not claim rows'); } }});
 assert.equal(result.configured, false);
});
test('receipt is recorded and repeated scans do not send the same claimed enquiry', async () => {
 const db = database(); let calls = 0;
 const request = async () => { calls++; return {messageId:'receipt-1'}; };
 await runEnquiryNotifications({db, request, env});
 await runEnquiryNotifications({db, request, env});
 assert.equal(calls, 1);
 assert.deepEqual(db.updates[0], [row.id, 'sent', 'receipt-1', null]);
});
test('ambiguous provider outcomes are held for inspection rather than automatically retried', async () => {
 for (const request of [async () => ({}), async () => { throw Object.assign(new Error(), {uncertain:true}); }]) {
  const db = database();
  await runEnquiryNotifications({db, request, env});
  assert.equal(db.updates[0][1], 'uncertain');
 }
});
test('confirmed provider rejection is recorded as failed for admin retry', async () => {
 const db = database();
 await runEnquiryNotifications({db,env,request:async () => { throw Object.assign(new Error(), {providerStatus:401}); }});
 assert.equal(db.updates[0][1], 'failed');
 assert.match(db.updates[0][3], /401/);
});

test('branded HTML includes logos, safe visitor text, and Malaysian receipt time', () => {
 const hostile = { ...row, name: '<script>alert(1)</script>', message: 'First line\n<img src=x onerror=alert(1)>', received_at: '2026-11-09T14:18:10Z' };
 const message = enquiryNotificationMessage(hostile, { ...env, EMAIL_ASSET_BASE_URL: 'https://images.example.org' });
 assert.match(message.htmlContent, /https:\/\/images\.example\.org\/email\/rcbc-alzheimers-care-logo\.png/);
 assert.match(message.htmlContent, /https:\/\/images\.example\.org\/email\/rotary-logo\.jpeg/);
 assert.match(message.htmlContent, /&lt;script&gt;/);
 assert.match(message.htmlContent, /First line<br>&lt;img/);
 assert.ok(!message.htmlContent.includes('<script>'));
 assert.match(message.htmlContent, /Malaysia time, UTC\+8/);
 assert.match(message.htmlContent, /https:\/\/example\.org\/admin\/records/);
 assert.ok(message.textContent.includes(hostile.message));
 assert.match(message.textContent, /record your follow-up notes/);
 assert.throws(() => enquiryNotificationMessage(row, { ...env, EMAIL_ASSET_BASE_URL: 'javascript:alert(1)' }));
});
