import { randomBytes } from 'node:crypto';
import { digest, fail } from './auth.js';
import { createBrevo } from './brevo.js';
import { verifyUnsubscribeToken } from './subscriber-tokens.js';

const consentVersion = 'email-updates-v2';
const makeToken = () => randomBytes(32).toString('hex');
const validToken = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');
const fields = { name: 'your name', email: 'a valid email address', country: 'your country', state: 'your state, province or region', city: 'your city or town' };

async function sendSubscriptionEmail(recipient, path, renewal, { env, request }) {
  if (!env.BREVO_API_KEY || !validEmail(env.BREVO_SENDER_EMAIL) || !env.APP_BASE_URL) return;
  try {
    const link = new URL(path, env.APP_BASE_URL);
    if (!['http:', 'https:'].includes(link.protocol)) return;
    await request('/smtp/email', {
      method: 'POST',
      data: {
        sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME || 'Dementia Care Connect' },
        to: [{ email: recipient }],
        subject: renewal ? 'Confirm your Dementia Care Connect resubscription' : 'You’re subscribed to Dementia Care Connect updates',
        textContent: renewal
          ? `To confirm your request to receive project updates again, open this link within 24 hours:\n${link.href}\n\nIf you did not request this, you can ignore this email.`
          : `Thank you for subscribing. We look forward to keeping you informed about upcoming webinars, education, training and project activities.\n\nUnsubscribe: ${link.href}`,
        tags: [renewal ? 'subscription-renewal' : 'subscription-confirmation'],
      },
    });
  } catch {
    console.error('Subscription email failed. Check the Brevo transactional logs and sender settings.');
  }
}

export async function changeSubscription(kind, data, db, { env = process.env, request = createBrevo({ env }) } = {}) {
  if (kind === 'unsubscribe') {
    const id = verifyUnsubscribeToken(data.token, env.SUBSCRIBER_TOKEN_SECRET);
    if (!id && !validToken(data.token)) fail('Invalid unsubscribe link');
    const result = await db.query(`UPDATE subscribers
      SET unsubscribed_at=coalesce(unsubscribed_at,now()), renewal_hash=NULL, renewal_expires_at=NULL
      WHERE ${id ? 'id' : 'unsubscribe_hash'}=$1 RETURNING id`, [id || digest(data.token)]);
    if (!result.rowCount) fail('Invalid unsubscribe link');
    return { ok: true };
  }

  const token = makeToken();
  const unsubscribeLink = `/get-updated?unsubscribe=${token}`;
  if (kind === 'resubscribe') {
    if (!validToken(data.token)) fail('Invalid resubscription link');
    const result = await db.query(`UPDATE subscribers SET unsubscribed_at=NULL, consent_version=$2,
      consent_at=now(), confirmed_at=now(), unsubscribe_hash=$3, renewal_hash=NULL, renewal_expires_at=NULL
      WHERE renewal_hash=$1 AND renewal_expires_at>now() AND unsubscribed_at IS NOT NULL RETURNING email`,
    [digest(data.token), consentVersion, digest(token)]);
    if (!result.rowCount) fail('This resubscription link is invalid or has expired. Please try signing up again.');
    await sendSubscriptionEmail(result.rows[0].email, unsubscribeLink, false, { env, request });
    return { ok: true, status: 'subscribed', unsubscribeLink };
  }

  const values = {};
  for (const [field, description] of Object.entries(fields)) {
    const value = typeof data[field] === 'string' ? data[field].trim() : '';
    if (!value || value.length > (field === 'email' ? 254 : 150)) fail(`Enter ${description}.`);
    values[field] = value;
  }
  if (!validEmail(values.email)) fail('Enter a valid email address.');
  if (data.consent !== true) fail('Agree to receive project updates to subscribe.');

  const { name, country, state, city } = values;
  const email = values.email.toLowerCase();
  const inserted = await db.query(`INSERT INTO subscribers(name,email,country,state,city,consent_version,consent_at,unsubscribe_hash)
    VALUES($1,$2,$3,$4,$5,$6,now(),$7) ON CONFLICT (lower(email)) DO NOTHING RETURNING id`,
  [name, email, country, state, city, consentVersion, digest(token)]);
  if (inserted.rowCount) {
    await sendSubscriptionEmail(email, unsubscribeLink, false, { env, request });
    return { ok: true, status: 'subscribed', unsubscribeLink };
  }

  if (env.BREVO_API_KEY && validEmail(env.BREVO_SENDER_EMAIL) && env.APP_BASE_URL) {
    const renewal = await db.query(`UPDATE subscribers SET renewal_hash=$2, renewal_expires_at=now()+interval '24 hours'
      WHERE lower(email)=$1 AND unsubscribed_at IS NOT NULL
      AND (renewal_expires_at IS NULL OR renewal_expires_at < now()+interval '23 hours 55 minutes') RETURNING id`,
    [email, digest(token)]);
    if (renewal.rowCount) await sendSubscriptionEmail(email, `/get-updated?resubscribe=${token}`, true, { env, request });
  }
  return { ok: true, status: 'existing' };
}
