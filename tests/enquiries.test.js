import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { enquiryHandler } from '../server/enquiries.js';

async function fixture(t, options = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'contact-test-'));
  const server = createServer(enquiryHandler({ inbox: directory, ...options }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); });
  const url = `http://127.0.0.1:${server.address().port}/api/enquiries`;
  const payload = { id: randomUUID(), name: 'Test Visitor', email: 'visitor@example.org', type: 'Collaboration', message: 'A project enquiry.', website: '', startedAt: Date.now() - 3000 };
  const send = (data = payload, headers = {}) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });
  return { directory, send, payload };
}

test('valid enquiries persist; concurrent retries and identical contents are deduplicated', async t => {
  const { directory, send, payload } = await fixture(t);
  const responses = await Promise.all([send(), send(), send({ ...payload, id: randomUUID() })]);
  assert.ok(responses.every(response => response.status === 200));
  const files = await readdir(directory);
  assert.equal(files.length, 1);
  const record = JSON.parse(await readFile(join(directory, files[0]), 'utf8'));
  assert.equal(record.message, payload.message);
  assert.equal(record.email, payload.email);
});

test('invalid fields report errors without creating records', async t => {
  const { directory, send, payload } = await fixture(t);
  const response = await send({ ...payload, name: ' ', email: 'invalid', type: 'Referral', message: '' });
  assert.equal(response.status, 422);
  assert.deepEqual(Object.keys((await response.json()).errors), ['name', 'email', 'type', 'message']);
  assert.deepEqual(await readdir(directory), []);
});

test('spam fields, instant submissions and cross-origin requests are rejected', async t => {
  const { send, payload } = await fixture(t);
  assert.equal((await send({ ...payload, website: 'spam' })).status, 400);
  assert.equal((await send({ ...payload, startedAt: Date.now() })).status, 400);
  assert.equal((await send(payload, { Origin: 'https://untrusted.example' })).status, 403);
});

test('unavailable workflow fails and can be retried once storage is repaired', async t => {
  const root = await mkdtemp(join(tmpdir(), 'contact-storage-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const blocked = join(root, 'inbox');
  await writeFile(blocked, 'blocked');
  const { send } = await fixture(t, { inbox: blocked });
  assert.equal((await send()).status, 503);
  await rm(blocked);
  assert.equal((await send()).status, 200);
  const { send: unconfigured } = await fixture(t, { inbox: '' });
  assert.equal((await unconfigured()).status, 503);
});

test('excessive requests are rate limited', async t => {
  const { send } = await fixture(t);
  for (let i = 0; i < 10; i++) assert.equal((await send()).status, 200);
  assert.equal((await send()).status, 429);
});
