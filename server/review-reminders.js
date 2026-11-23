import { createHash, timingSafeEqual } from 'node:crypto';
import { BrevoError, createBrevo } from './brevo.js';
import { dueContentItems } from './content-review.js';
import { pool } from './db.js';

const malaysia = 'Asia/Kuala_Lumpur';
const reviewDay = new Intl.DateTimeFormat('sv-SE', { timeZone: malaysia });
const dueDate = new Intl.DateTimeFormat('en-MY', { timeZone: malaysia, dateStyle: 'medium' });

export async function runReviewReminder({
 db = pool, env = process.env, request = createBrevo({ env }), logger = console,
 dryRun = false, now = new Date(),
} = {}) {
 if (!dryRun && env.REVIEW_REMINDER_ENABLED !== 'true') return { status: 'disabled' };

 const items = await dueContentItems(db);
 const count = items.length;
 if (!count) return { status: 'nothing-due', count };

 const dashboard = new URL('/admin', env.APP_BASE_URL);
 if (!['https:', 'http:'].includes(dashboard.protocol)) throw new Error('APP_BASE_URL must use HTTP or HTTPS');
 const day = reviewDay.format(now);
 const subject = 'Dementia Care Hub content review reminder';
 const textContent = [
  `${count} content item${count === 1 ? ' is' : 's are'} due for review.`,
  '',
  ...items.map(item => {
   const date = item.next_review_at ? dueDate.format(item.next_review_at) : 'No due date set';
   return `- ${item.title} | ${item.type} | ${date}`;
  }),
  '',
  `Admin Dashboard: ${dashboard.href}`,
 ].join('\n');

 if (dryRun) {
  logger.log(`Review reminder preview — ${subject}\n${textContent}`);
  return { status: 'previewed', count };
 }

 const { rows: admins } = await db.query("SELECT email, name FROM users WHERE role = 'admin' AND enabled ORDER BY email");
 if (!admins.length) return { status: 'no-admins', count };
 if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
  throw new Error('Configure BREVO_API_KEY and BREVO_SENDER_EMAIL before enabling review reminders');
 }

 // Reserve this Malaysia calendar day before calling Brevo so retries and concurrent runs share one send.
 const claim = await db.query(
  "INSERT INTO review_reminder_deliveries (review_day, status) VALUES ($1, 'sending') ON CONFLICT DO NOTHING",
  [day],
 );
 if (!claim.rowCount) {
  const { rows: [delivery] } = await db.query('SELECT status FROM review_reminder_deliveries WHERE review_day = $1', [day]);
  const status = delivery?.status === 'sent' ? 'already-sent' : 'delivery-pending';
  return { status, count };
 }

 let receipt;
 try {
  receipt = await request('/smtp/email', {
   method: 'POST',
   data: {
    sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME || 'RCBC Dementia Care' },
    to: admins, subject, textContent, tags: ['admin-content-review'],
   },
  });
 } catch (error) {
  if (error instanceof BrevoError && error.providerStatus >= 400 && error.providerStatus < 500 && !error.uncertain) {
   // Brevo explicitly rejected the request. A later run can claim the day again.
   await db.query('DELETE FROM review_reminder_deliveries WHERE review_day = $1', [day]);
  } else {
   await markUncertain(db, day);
  }
  throw error;
 }
 if (!receipt?.messageId) {
  await markUncertain(db, day);
  throw new Error('Brevo receipt missing. Check Brevo logs before retrying.');
 }
 await db.query(
  "UPDATE review_reminder_deliveries SET status = 'sent', sent_at = now(), provider_message_id = $2 WHERE review_day = $1",
  [day, receipt.messageId],
 );
 return { status: 'sent', count };
}

async function markUncertain(db, day) {
 await db.query("UPDATE review_reminder_deliveries SET status = 'uncertain' WHERE review_day = $1", [day]);
}

const digest = value => createHash('sha256').update(value).digest();

export async function reviewReminderHandler(req, res, url, send, {
 env = process.env, run = runReviewReminder, logger = console,
} = {}) {
 if (req.method !== 'POST') {
  res.setHeader('Allow', 'POST');
  return send(res, 405, { error: 'Use POST' });
 }
 const secret = env.REVIEW_REMINDER_SECRET || '';
 if (secret.length < 32 || !timingSafeEqual(digest(req.headers.authorization || ''), digest(`Bearer ${secret}`))) {
  return send(res, 401, { error: 'Unauthorized' });
 }
 const mode = url.searchParams.get('mode');
 if (mode !== 'preview' && mode !== 'live') return send(res, 400, { error: 'Use mode=preview or mode=live' });

 try {
  const result = await run({ env, logger, dryRun: mode === 'preview' });
  logger.log('Review reminder:', JSON.stringify(result));
  const status = result.status === 'delivery-pending' ? 409 : result.status === 'no-admins' ? 422 : 200;
  return send(res, status, result);
 } catch (error) {
  logger.error('Review reminder failed:', error instanceof BrevoError ? error.message : error.code || error.message);
  return send(res, 502, { error: 'Review reminder failed. Check the Render service logs.' });
 }
}
