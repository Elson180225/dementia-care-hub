import { enquiryEmailContent } from './enquiry-email.js';
import { pool } from './db.js';
import { createBrevo } from './brevo.js';

const email = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');
export function enquiryNotificationMessage(row, env = process.env) {
 if (!email(env.ENQUIRY_ADMIN_EMAIL) || !email(env.BREVO_SENDER_EMAIL)) throw new Error('Configure ENQUIRY_ADMIN_EMAIL and BREVO_SENDER_EMAIL');
 const base = new URL(env.APP_BASE_URL);
 if (!['http:', 'https:'].includes(base.protocol)) throw new Error('APP_BASE_URL must use HTTP or HTTPS');
 return {
  sender: { name: env.BREVO_SENDER_NAME || 'RCBC Dementia Care', email: env.BREVO_SENDER_EMAIL },
  to: [{ email: env.ENQUIRY_ADMIN_EMAIL }], replyTo: { email: row.email, name: row.name },
  subject: 'New project enquiry',
  ...enquiryEmailContent(row, env),
  tags: ['project-enquiry'], headers: { idempotencyKey: row.id }
 };
}

export async function runEnquiryNotifications({ db = pool, request = createBrevo(), env = process.env } = {}) {
 if (!env.ENQUIRY_ADMIN_EMAIL || !env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL || !env.APP_BASE_URL) return { configured: false };
 // Validate before claiming so configuration errors leave the message queued.
 enquiryNotificationMessage({ id: 'check', email: 'check@example.org' }, env);
 // A crashed worker may have sent its message. Never automatically resend an ambiguous delivery.
 await db.query("UPDATE enquiries SET notification_status='uncertain',notification_error='Delivery interrupted. Check Brevo logs before retrying.' WHERE notification_status='sending' AND notification_attempted_at < now()-interval '10 minutes'");
 const rows = (await db.query(`UPDATE enquiries SET notification_status='sending',notification_attempted_at=now(),notification_error=NULL
 WHERE id IN (SELECT id FROM enquiries WHERE notification_status='pending' ORDER BY received_at LIMIT 10 FOR UPDATE SKIP LOCKED) RETURNING *`)).rows;
 for (const row of rows) {
  let status, receipt, error;
  try {
   receipt = await request('/smtp/email', { method: 'POST', data: enquiryNotificationMessage(row, env) });
   status = receipt?.messageId ? 'sent' : 'uncertain';
   if (status === 'uncertain') error = 'Provider receipt missing. Check Brevo logs before retrying.';
  } catch (failure) {
   status = failure.uncertain || !failure.providerStatus ? 'uncertain' : 'failed';
   error = status === 'uncertain' ? 'Delivery outcome unknown. Check Brevo logs before retrying.' : `Email provider rejected delivery (${failure.providerStatus}).`;
  }
  await db.query("UPDATE enquiries SET notification_status=$2,notification_message_id=$3,notification_error=$4,notification_sent_at=CASE WHEN $2='sent' THEN now() ELSE NULL END WHERE id=$1", [row.id, status, receipt?.messageId || null, error || null]);
 }
 return { configured: true, processed: rows.length };
}

export function startEnquiryNotificationWorker({ run = runEnquiryNotifications, logger = console } = {}) {
 let running = false;
 const tick = async () => {
  if (running) return;
  running = true;
  try { await run(); } catch { logger.error('Enquiry notification scan failed. Check configuration and database migration.'); }
  finally { running = false; }
 };
 const timer = setInterval(tick, 60000); timer.unref(); void tick();
 return () => clearInterval(timer);
}
