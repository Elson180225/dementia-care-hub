import { createHash } from 'node:crypto';

// Password rules agreed in RCBC's Trainer Portal and Admin Portal Draft 02:
// at least 15 characters, at least 64 supported (we allow 256), passphrases
// welcome, and passwords known from data breaches are refused.
export const PASSWORD_MIN = 15;
export const PASSWORD_MAX = 256;

// Very common choices that are long enough to pass the length rule.
const COMMON = new Set([
  '123456789012345', '1234567890123456', 'passwordpassword', 'password1234567',
  'qwertyuiopasdfgh', 'iloveyouiloveyou', 'aaaaaaaaaaaaaaa', 'dementiacareconnect',
  'alzheimerscare2024', 'rotaryclubbintulucentral',
]);

/** Returns a message describing what is wrong with a new password, or null. */
export function passwordProblem(password, { email = '', name = '' } = {}) {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
    return `Use a password of at least ${PASSWORD_MIN} characters. A short phrase of 3–4 words works well.`;
  }
  if (password.length > PASSWORD_MAX) return `Use a password of no more than ${PASSWORD_MAX} characters.`;
  const plain = password.toLowerCase().replace(/[\s\W_]+/g, '');
  if (COMMON.has(plain) || /^(.)\1+$/.test(plain)) return 'This password is too easy to guess. Choose a different one.';
  const local = String(email).toLowerCase().split('@')[0];
  if ((local.length >= 4 && plain.includes(local.replace(/\W+/g, ''))) ||
      (String(name).trim().length >= 4 && plain === String(name).toLowerCase().replace(/[\s\W_]+/g, ''))) {
    return 'Do not use your name or email address as your password.';
  }
  return null;
}

/**
 * Checks Have I Been Pwned using k-anonymity: only the first 5 characters of the
 * password's SHA-1 hash leave the server, never the password itself. If the service
 * cannot be reached the check is skipped, so a provider outage never locks people out.
 * Runs in production, or anywhere PASSWORD_BREACH_CHECK=on; PASSWORD_BREACH_CHECK=off disables it.
 */
export async function isBreachedPassword(password, { env = process.env, fetcher = fetch } = {}) {
  const enabled = env.PASSWORD_BREACH_CHECK === 'on' ||
    (env.NODE_ENV === 'production' && env.PASSWORD_BREACH_CHECK !== 'off');
  if (!enabled) return false;
  const hash = createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  try {
    const response = await fetcher(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true', 'User-Agent': 'dementia-care-connect-password-check' },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return false;
    const body = await response.text();
    return body.split('\n').some((line) => {
      const [candidate, count] = line.trim().split(':');
      return candidate === suffix && Number(count) > 0;
    });
  } catch {
    console.warn('Password breach check unavailable; continuing without it.');
    return false;
  }
}

/** Full check for any new password. Returns an error message, or null when it is acceptable. */
export async function newPasswordProblem(password, context = {}, options = {}) {
  const problem = passwordProblem(password, context);
  if (problem) return problem;
  if (await isBreachedPassword(password, options)) {
    return 'This password has appeared in a known data breach. Choose a different one.';
  }
  return null;
}
