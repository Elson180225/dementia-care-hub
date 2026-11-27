import { pool } from './db.js';
import { subscriberPool } from './subscriber-db.js';
import { createBrevo } from './brevo.js';
import { registrationTarget, reminderMessage } from './event-reminder-email.js';

export { reminderMessage, reminderIdempotencyKey } from './event-reminder-email.js';

const hour = 3600000;
const earlyDeadlineHours = 336;
export const lastCallHours = 168;
export const finalHours = 72;
const lastCallSpacing = 48 * hour;
const stages = ['final', 'last-call', 'invite'];

export function reminderSettings(env = process.env) {
 const hours = Number(env.REMINDER_INVITE_LEAD_HOURS || 504);
 const limit = Number(env.REMINDER_BATCH_SIZE || 100);
 if (!Number.isFinite(hours) || hours <= 0 || hours > 504 || !Number.isInteger(limit) || limit < 1 || limit > 1000) {
  throw new Error('Invalid event invite lead hours or reminder batch size');
 }
 return { hours, limit, lastCall: env.REMINDER_LAST_CALL_ENABLED === 'true' };
}

export function matchesAudience(activity, subscriber) {
 return !!subscriber.consent_at && !subscriber.unsubscribed_at
  && (activity.language === 'All' || activity.language === subscriber.language)
  && (activity.mode === 'Online' || !activity.city?.trim() || activity.city.trim().toLowerCase() === subscriber.city?.trim().toLowerCase());
}

export function validateReminderConfig(env = process.env) {
 reminderSettings(env);
 if (!env.BREVO_API_KEY || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.BREVO_SENDER_EMAIL || '')) {
  throw new Error('Set BREVO_API_KEY and verified BREVO_SENDER_EMAIL before enabling reminders');
 }
 reminderMessage({ id: 'config-check', title: 'Check', starts_at: new Date(), mode: 'Online' },
  { id: '00000000-0000-0000-0000-000000000000', email: 'check@example.invalid', name: 'Check' }, env);
}

const eventSql = `
 SELECT a.*, statement_timestamp() AS checked_at,
  s.enabled AS registration_enabled, s.website_enabled, s.google_url, s.general_instructions,
  (SELECT programme FROM jsonb_array_elements(cms.data #> '{physicalEducation,programmes}') AS programme
   WHERE programme->>'id' = a.programme_id LIMIT 1) AS programme,
  (SELECT count(*) FROM event_participants p WHERE p.activity_id = a.id
   AND p.status = 'registered' AND p.registration_state = 'confirmed') AS confirmed
 FROM activities a
 LEFT JOIN event_registration_settings s ON s.activity_id = a.id
 LEFT JOIN learn_events_content cms ON a.programme_id IS NOT NULL AND cms.id = 'main'
 WHERE a.status = 'published' AND a.published_at IS NOT NULL AND a.cancelled_at IS NULL AND a.postponed_at IS NULL AND a.content_approval_status='approved'`;

function due(event, stage, now, settings) {
 const untilStart = new Date(event.starts_at) - now;
 if (untilStart <= 0) return false;
 if (stage === 'final') return untilStart <= finalHours * hour && Number(event.confirmed) > 0;
 if (!registrationTarget(event) || (event.capacity && Number(event.confirmed) >= event.capacity)) return false;
 const untilClose = event.registration_deadline
  ? Math.min(untilStart, new Date(event.registration_deadline) - now) : untilStart;
 if (untilClose <= 0) return false;
 if (stage === 'last-call') return settings.lastCall && untilClose <= lastCallHours * hour;
 const registrationLead = Math.min(settings.hours, earlyDeadlineHours);
 return untilStart <= settings.hours * hour || untilClose <= registrationLead * hour;
}

const participantSql = `SELECT id,name,email,registration_state FROM event_participants
 WHERE activity_id = $1 AND status = 'registered'`;

async function candidates(website, db, activity, stage, now) {
 const { rows: participants } = await website.query(participantSql + ' ORDER BY id', [activity.id]);
 if (stage === 'final') return participants.filter(p => p.registration_state === 'confirmed');

 const registered = new Set(participants.map(p => p.email.trim().toLowerCase()));
 const { rows: subscribers } = await db.query(
  'SELECT id,name,email,city,language,consent_at,unsubscribed_at FROM subscribers WHERE consent_at IS NOT NULL AND unsubscribed_at IS NULL ORDER BY id',
 );
 const audience = subscribers.filter(s => matchesAudience(activity, s) && !registered.has(s.email.trim().toLowerCase()));
 if (stage !== 'last-call') return audience;

 const { rows: invites } = await db.query(`SELECT subscriber_id FROM reminder_deliveries
  WHERE activity_id=$1 AND starts_at=$2 AND stage='invite' AND status='sent' AND sent_at <= $3`,
  [activity.id, activity.starts_at, new Date(now - lastCallSpacing)]);
 const invited = new Set(invites.map(row => row.subscriber_id));
 return audience.filter(s => invited.has(s.id));
}

async function refresh(website, db, original, recipient, stage, settings) {
 const { rows: [activity] } = await website.query(eventSql + ' AND a.id=$1 AND a.starts_at=$2',
  [original.id, original.starts_at]);
 if (!activity || !due(activity, stage, activity.checked_at, settings)) return null;

 if (stage === 'final') {
  const { rows: [participant] } = await website.query(participantSql + " AND id=$2 AND registration_state='confirmed'",
   [activity.id, recipient.id]);
  return participant ? { activity, recipient: participant } : null;
 }

 const { rows: [subscriber] } = await db.query('SELECT * FROM subscribers WHERE id=$1', [recipient.id]);
 if (!subscriber || !matchesAudience(activity, subscriber)) return null;
 const registered = await website.query(participantSql + ' AND lower(trim(email))=$2 LIMIT 1',
  [activity.id, subscriber.email.trim().toLowerCase()]);
 return registered.rowCount ? null : { activity, recipient: subscriber };
}

async function claimDelivery(db, activity, recipient, stage) {
 const final = stage === 'final';
 const table = final ? 'event_attendance_reminders' : 'reminder_deliveries';
 const fields = final ? ['activity_id', 'starts_at', 'participant_id'] : ['activity_id', 'starts_at', 'subscriber_id', 'stage'];
 const key = [activity.id, activity.starts_at, recipient.id];
 if (!final) key.push(stage);
 const columns = fields.join(',');
 const placeholders = fields.map((_, index) => '$' + (index + 1)).join(',');
 const { rows: [claim] } = await db.query(`INSERT INTO ${table}(${columns},status) VALUES(${placeholders},'sending')
  ON CONFLICT(${columns}) DO UPDATE SET status='sending',attempts=${table}.attempts+1,attempted_at=now(),next_attempt_at=NULL,error=NULL
  WHERE ${table}.attempts<5 AND (${table}.status='cancelled' OR (${table}.status='retry' AND ${table}.next_attempt_at<=now()))
  RETURNING attempts`, key);
 if (!claim) return null;

 const match = fields.map((field, index) => `${field}=$${index + 4}`).join(' AND ');
 const finish = (status, error = null, messageId = null) => db.query(`UPDATE ${table}
  SET status=$1,error=$2,provider_message_id=$3,sent_at=CASE WHEN $1='sent' THEN now() ELSE sent_at END,
  next_attempt_at=CASE WHEN $1='retry' THEN now()+interval '5 minutes' ELSE NULL END WHERE ${match}`,
  [status, error, messageId, ...key]);
 return { attempts: claim.attempts, finish };
}

async function deliver({ website, db, activity, recipient, stage, settings, request, env, result }) {
 const final = stage === 'final';
 const claim = await claimDelivery(final ? website : db, activity, recipient, stage);
 if (!claim) return false;
 const { finish, attempts } = claim;
 result.claimed++;
 let sending = false;
 try {
  let current = await refresh(website, db, activity, recipient, stage, settings);
  if (!current) { await finish('cancelled'); return false; }
  if (!final) {
   const email = current.recipient.email;
   const contact = await request('/contacts/' + encodeURIComponent(email), { missing: true });
   if (contact?.emailBlacklisted) { await finish('suppressed'); result.suppressed++; return false; }
   current = await refresh(website, db, activity, recipient, stage, settings);
   if (!current || current.recipient.email !== email) { await finish('cancelled'); return false; }
  }

  const message = reminderMessage(current.activity, current.recipient, env, stage);
  sending = true;
  const receipt = await request('/smtp/email', { method: 'POST', data: message });
  if (!receipt?.messageId) {
   await finish('uncertain', 'Provider receipt missing; inspect Brevo logs before any manual retry.');
   result.uncertain++;
   return false;
  }
  await finish('sent', null, receipt.messageId);
  result.sent++;
  return false;
 } catch (error) {
  const uncertain = sending && (error.uncertain || !error.providerStatus);
  const retry = !uncertain && (error.retryable || !sending) && attempts < 5;
  const status = uncertain ? 'uncertain' : retry ? 'retry' : 'failed';
  await finish(status, uncertain ? 'Send outcome unknown; inspect Brevo logs.'
   : error.providerStatus ? `Brevo request failed (${error.providerStatus}).` : 'Reminder preparation failed.');
  result[uncertain ? 'uncertain' : 'failed']++;
  return error.providerStatus === 401 || error.providerStatus === 429;
 }
}

export async function runReminders({
 website = pool, subscribers = subscriberPool, env = process.env, request = createBrevo({ env }),
 now = new Date(), dryRun = false,
} = {}) {
 const settings = reminderSettings(env);
 if (!dryRun) validateReminderConfig(env);
 const db = await subscribers.connect();
 let locked = false;
 const result = { activities: 0, eligible: 0, sent: 0, suppressed: 0, failed: 0, uncertain: 0, claimed: 0, dryRun,
  eligibleByStage: { invite: 0, 'last-call': 0, final: 0 } };
 try {
  locked = (await db.query('SELECT pg_try_advisory_lock(718423) AS locked')).rows[0].locked;
  if (!locked) return { ...result, busy: true };
  const horizon = Math.max(settings.hours, finalHours, settings.lastCall ? lastCallHours : 0);
  const { rows: events } = await website.query(eventSql + `
   AND a.starts_at > $1
   AND least(a.starts_at, a.registration_deadline) <= $1::timestamptz + ($2::double precision * interval '1 hour')
   ORDER BY a.starts_at,a.id`, [now, horizon]);
  const dueEvents = events.map(activity => ({ activity, stages: stages.filter(stage => due(activity, stage, now, settings)) }));
  result.activities = dueEvents.filter(event => event.stages.length).length;
  for (const stage of stages) {
   for (const event of dueEvents) {
    if (!event.stages.includes(stage)) continue;
    const { activity } = event;
    const recipients = await candidates(website, db, activity, stage, now);
    result.eligible += recipients.length;
    result.eligibleByStage[stage] += recipients.length;
    if (dryRun) continue;
    for (const recipient of recipients) {
     if (result.claimed >= settings.limit) return result;
     if (await deliver({ website, db, activity, recipient, stage, settings, request, env, result })) return result;
    }
   }
  }
  return result;
 } finally {
  try {
   if (locked) await db.query('SELECT pg_advisory_unlock(718423)');
  } finally {
   db.release();
  }
 }
}

export function startReminderWorker({ env = process.env, run = () => runReminders({ env }), logger = console } = {}) {
 if (env.REMINDERS_ENABLED !== 'true') return () => {};
 validateReminderConfig(env);
 let running = false, stopped = false;
 const tick = async () => {
  if (running || stopped) return;
  running = true;
  try {
   const result = await run();
   if (result.claimed || result.activities) logger.log('Reminder scan:', JSON.stringify(result));
  } catch {
   logger.error('Reminder scan failed. Check database migrations, connectivity and Brevo configuration.');
  } finally {
   running = false;
  }
 };
 const timer = setInterval(tick, 60000);
 timer.unref();
 void tick();
 return () => { stopped = true; clearInterval(timer); };
}
