import test from 'node:test';
import assert from 'node:assert/strict';
import { base32Encode, base32Decode, generateSecret, codeForStep, currentStep, verifyCode, otpauthUrl } from '../server/totp.js';
import { adminMfaRequired } from '../server/auth.js';

// RFC 6238 Appendix B test secret ("12345678901234567890"), SHA-1.
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890'));

test('base32 round-trips and new secrets are 160-bit', () => {
  assert.equal(RFC_SECRET, 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
  assert.equal(base32Decode(RFC_SECRET).toString(), '12345678901234567890');
  assert.equal(base32Decode(generateSecret()).length, 20);
});

test('codes match the RFC 6238 test vectors (last 6 digits)', () => {
  assert.equal(codeForStep(RFC_SECRET, currentStep(59 * 1000)), '287082');
  assert.equal(codeForStep(RFC_SECRET, currentStep(1111111109 * 1000)), '081804');
  assert.equal(codeForStep(RFC_SECRET, currentStep(2000000000 * 1000)), '279037');
});

test('verification allows one step of clock drift and refuses reused or wrong codes', () => {
  const now = 1111111109 * 1000;
  const step = currentStep(now);
  assert.equal(verifyCode(RFC_SECRET, '081804', { now }), step);
  assert.equal(verifyCode(RFC_SECRET, codeForStep(RFC_SECRET, step - 1), { now }), step - 1);
  assert.equal(verifyCode(RFC_SECRET, codeForStep(RFC_SECRET, step - 2), { now }), null);
  assert.equal(verifyCode(RFC_SECRET, '081804', { now, lastStep: step }), null);
  assert.equal(verifyCode(RFC_SECRET, '000000', { now }), null);
  assert.equal(verifyCode(RFC_SECRET, 'abc', { now }), null);
});

test('authenticator link and when MFA is required', () => {
  assert.match(otpauthUrl(RFC_SECRET, 'admin@rcbc.example'), /^otpauth:\/\/totp\/Dementia%20Care%20Connect%3Aadmin%40rcbc\.example\?secret=GEZD/);
  assert.equal(adminMfaRequired({ NODE_ENV: 'production' }), true);
  assert.equal(adminMfaRequired({ NODE_ENV: 'production', ADMIN_MFA: 'off' }), false);
  assert.equal(adminMfaRequired({}), false);
  assert.equal(adminMfaRequired({ ADMIN_MFA: 'on' }), true);
});
