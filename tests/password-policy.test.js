import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { passwordProblem, isBreachedPassword, newPasswordProblem, PASSWORD_MIN } from '../server/password-policy.js';

const on = { PASSWORD_BREACH_CHECK: 'on' };
const sha1 = (value) => createHash('sha1').update(value).digest('hex').toUpperCase();
// A fake Have I Been Pwned range response, so tests never reach the internet.
const rangeFor = (password, count) => async (url) => {
  const hash = sha1(password);
  assert.equal(url, `https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`);
  return { ok: true, text: async () => `0000000000000000000000000000000000A:3\r\n${hash.slice(5)}:${count}\r\n` };
};

test('new passwords need at least 15 characters and allow long passphrases', () => {
  assert.equal(PASSWORD_MIN, 15);
  assert.match(passwordProblem('fourteen chars'), /at least 15/);
  assert.equal(passwordProblem('fifteen chars!!'), null);
  assert.equal(passwordProblem('correct horse battery staple'), null);
  assert.equal(passwordProblem('x'.repeat(64).replace(/x/g, (_, i) => 'abc'[i % 3])), null);
  assert.match(passwordProblem('y'.repeat(257)), /no more than 256/);
});

test('obvious and personal passwords are refused', () => {
  assert.match(passwordProblem('123456789012345'), /too easy/);
  assert.match(passwordProblem('aaaaaaaaaaaaaaaaaa'), /too easy/);
  assert.match(passwordProblem('Pass-trainer.lee-2026', { email: 'trainer.lee@example.test' }), /name or email/);
  assert.match(passwordProblem('Siti Aminah Binti', { name: 'Siti Aminah Binti' }), /name or email/);
});

test('breached passwords are refused using only a 5-character hash prefix', async () => {
  const password = 'a perfectly long phrase';
  assert.equal(await isBreachedPassword(password, { env: on, fetcher: rangeFor(password, 42) }), true);
  assert.equal(await isBreachedPassword(password, { env: on, fetcher: rangeFor(password, 0) }), false);
  assert.match(await newPasswordProblem(password, {}, { env: on, fetcher: rangeFor(password, 7) }), /data breach/);
});

test('the breach check is skipped when off, outside production, or when the service is down', async () => {
  const never = async () => { throw new Error('should not be called'); };
  assert.equal(await isBreachedPassword('a perfectly long phrase', { env: {}, fetcher: never }), false);
  assert.equal(await isBreachedPassword('a perfectly long phrase', { env: { NODE_ENV: 'production', PASSWORD_BREACH_CHECK: 'off' }, fetcher: never }), false);
  const down = async () => { throw new Error('network down'); };
  assert.equal(await isBreachedPassword('a perfectly long phrase', { env: on, fetcher: down }), false);
});
