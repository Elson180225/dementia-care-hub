import { createHash } from 'node:crypto';
import { pool } from './db.js';
import { subscriberPool } from './subscriber-db.js';
import { createBrevo } from './brevo.js';
import { unsubscribeToken } from './subscriber-tokens.js';

export const reminderTypes=['Seminar','RCBC Webinar','CT Webinar'];
export function reminderSettings(env=process.env) {
 const hours=Number(env.REMINDER_LEAD_HOURS || 24);
 const limit=Number(env.REMINDER_BATCH_SIZE || 100);
 if(!Number.isFinite(hours)||hours<=0||hours>168||!Number.isInteger(limit)||limit<1||limit>1000) throw new Error('Invalid reminder lead hours or batch size');
 return {hours,limit};
}
export function matchesAudience(activity,subscriber) {
 return !!subscriber.consent_at && !subscriber.unsubscribed_at
  && (activity.language==='All' || activity.language===subscriber.language)
  && (activity.mode==='Online' || !activity.city?.trim() || activity.city.trim().toLowerCase()===subscriber.city?.trim().toLowerCase());
}
const escape=s=>String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function reminderIdempotencyKey(activity,subscriber) {
 const hash=createHash('sha256').update(activity.id+'|'+new Date(activity.starts_at).toISOString()+'|'+subscriber.id).digest('hex');
 // Brevo accepts a UUID-sized key, not a full 64-character SHA-256 hex string.
 return [hash.slice(0,8),hash.slice(8,12),'5'+hash.slice(13,16),'8'+hash.slice(17,20),hash.slice(20,32)].join('-');
}
export function reminderMessage(activity,subscriber,env=process.env) {
 const base=new URL(env.APP_BASE_URL);
 if(!['https:','http:'].includes(base.protocol))throw new Error('APP_BASE_URL must use HTTP or HTTPS');
 const unsubscribe=new URL('/get-updated',base);
 unsubscribe.searchParams.set('unsubscribe',unsubscribeToken(subscriber.id,env.SUBSCRIBER_TOKEN_SECRET));
 let details=new URL('/learn-events/upcoming-calendar',base).href;
 try {const url=new URL(activity.registration_link);if(['https:','http:'].includes(url.protocol))details=url.href;} catch { /* Use public calendar. */ }
 const time=new Date(activity.starts_at).toLocaleString('en-MY',{timeZone:'Asia/Kuala_Lumpur',dateStyle:'full',timeStyle:'short'})+' (Malaysia time, UTC+8)';
 const lines=[`Hello ${subscriber.name},`,`Reminder: ${activity.title}`,time,`${activity.mode}: ${activity.venue || activity.city || 'See activity details'}`,activity.description || '',`Details / registration: ${details}`,'You receive this project activity reminder because you opted in to RCBC email updates. This is not confirmation of event registration.',`Unsubscribe: ${unsubscribe.href}`];
 return {sender:{name:env.BREVO_SENDER_NAME || 'RCBC Dementia Care',email:env.BREVO_SENDER_EMAIL},to:[{email:subscriber.email,name:subscriber.name}],subject:`Upcoming activity: ${activity.title}`,
  textContent:lines.join('\n\n'),htmlContent:lines.map(line=>`<p>${escape(line)}</p>`).join('')+`<p><a href="${escape(details)}">Activity details</a> | <a href="${escape(unsubscribe.href)}">Unsubscribe from project updates</a></p>`,
  tags:['project-activity-reminder'],headers:{idempotencyKey:reminderIdempotencyKey(activity,subscriber)}};
}
export function validateReminderConfig(env=process.env) {
 reminderSettings(env);
 if(!env.BREVO_API_KEY || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.BREVO_SENDER_EMAIL || '')) throw new Error('Set BREVO_API_KEY and verified BREVO_SENDER_EMAIL before enabling reminders');
 reminderMessage({id:'config-check',title:'Check',starts_at:new Date(),mode:'Online'},{id:'00000000-0000-0000-0000-000000000000',email:'check@example.invalid',name:'Check'},env);
}
const dueSql="SELECT * FROM activities WHERE status='published' AND cancelled_at IS NULL AND type=ANY($1::text[]) AND starts_at>$2 AND starts_at<=$2::timestamptz+($3::double precision * interval '1 hour') ORDER BY starts_at,id";
export async function runReminders({website=pool,subscribers=subscriberPool,request=createBrevo(),env=process.env,now=new Date(),dryRun=false}={}) {
 const {hours,limit}=reminderSettings(env);
 if(!dryRun)validateReminderConfig(env);
 const db=await subscribers.connect();let locked=false;
 const result={activities:0,eligible:0,sent:0,suppressed:0,failed:0,uncertain:0,claimed:0,dryRun};
 try {
  locked=(await db.query('SELECT pg_try_advisory_lock(718423) AS locked')).rows[0].locked;
  if(!locked)return {...result,busy:true};
  const activities=(await website.query(dueSql,[reminderTypes,now,hours])).rows;
  result.activities=activities.length;
  for(const activity of activities) {
   const audience=(await db.query('SELECT id,name,email,city,state,language,consent_at,unsubscribed_at FROM subscribers WHERE consent_at IS NOT NULL AND unsubscribed_at IS NULL ORDER BY id')).rows;
   for(const subscriber of audience) {
    if(!matchesAudience(activity,subscriber))continue;
    result.eligible++;
    if(dryRun)continue;
    if(result.claimed>=limit)return result;
    // A durable claim is committed before any external send. Ambiguous sends are
    // never automatically retried, including after process death or DB failure.
    const key=[activity.id,activity.starts_at,subscriber.id];
    const claim=await db.query(`INSERT INTO reminder_deliveries(activity_id,starts_at,subscriber_id,status) VALUES($1,$2,$3,'sending')
     ON CONFLICT(activity_id,starts_at,subscriber_id) DO UPDATE SET status='sending',attempts=reminder_deliveries.attempts+1,attempted_at=now(),next_attempt_at=NULL,error=NULL
     WHERE reminder_deliveries.status='retry' AND reminder_deliveries.next_attempt_at<=now() AND reminder_deliveries.attempts<5 RETURNING attempts`,key);
    if(!claim.rowCount)continue;
    result.claimed++;
    let sending=false;
    const finish=(status,error=null,messageId=null)=>db.query(`UPDATE reminder_deliveries SET status=$4,error=$5,provider_message_id=$6,
     sent_at=CASE WHEN $4='sent' THEN now() ELSE sent_at END,next_attempt_at=CASE WHEN $4='retry' THEN now()+interval '5 minutes' ELSE NULL END
     WHERE activity_id=$1 AND starts_at=$2 AND subscriber_id=$3`,[...key,status,error,messageId]);
    try {
     const freshActivity=(await website.query(dueSql.replace(' ORDER BY starts_at,id',' AND id=$4 AND starts_at=$5'),[reminderTypes,new Date(),hours,activity.id,activity.starts_at])).rows[0];
     const fresh=(await db.query('SELECT * FROM subscribers WHERE id=$1',[subscriber.id])).rows[0];
     if(!freshActivity || !fresh || !matchesAudience(freshActivity,fresh)){await finish('cancelled');continue;}
     const contact=await request('/contacts/'+encodeURIComponent(fresh.email),{missing:true});
     if(contact?.emailBlacklisted){await finish('suppressed');result.suppressed++;continue;}
     // Provider checks may take time: reread event and consent before dispatch.
     const finalActivity=(await website.query(dueSql.replace(' ORDER BY starts_at,id',' AND id=$4 AND starts_at=$5'),[reminderTypes,new Date(),hours,activity.id,activity.starts_at])).rows[0];
     const finalSubscriber=(await db.query('SELECT * FROM subscribers WHERE id=$1',[fresh.id])).rows[0];
     if(!finalActivity || !finalSubscriber || finalSubscriber.email!==fresh.email || !matchesAudience(finalActivity,finalSubscriber)){await finish('cancelled');continue;}
     const message=reminderMessage(finalActivity,finalSubscriber,env);
     sending=true;
     const receipt=await request('/smtp/email',{method:'POST',data:message});
     if(!receipt?.messageId) {await finish('uncertain','Provider receipt missing; inspect Brevo logs before any manual retry.');result.uncertain++;continue;}
     await finish('sent',null,receipt.messageId);result.sent++;
    } catch(error) {
     const uncertain=sending && (error.uncertain || !error.providerStatus);
     const retry=!uncertain && (error.retryable || !sending) && claim.rows[0].attempts<5;
     const status=uncertain?'uncertain':retry?'retry':'failed';
     await finish(status,uncertain?'Send outcome unknown; inspect Brevo logs.':error.providerStatus?'Brevo request failed ('+error.providerStatus+').':'Reminder preparation failed.');
     result[uncertain?'uncertain':'failed']++;
     if(error.providerStatus===401 || error.providerStatus===429) return result;
    }
   }
  }
  return result;
 } finally {if(locked)await db.query('SELECT pg_advisory_unlock(718423)');db.release();}
}

export function startReminderWorker({env=process.env,run=runReminders,logger=console}={}) {
 if(env.REMINDERS_ENABLED!=='true')return ()=>{};
 validateReminderConfig(env);
 let running=false,stopped=false;
 const tick=async()=>{
  if(running || stopped)return;
  running=true;
  try {const result=await run();if(result.claimed || result.activities)logger.log('Reminder scan:',JSON.stringify(result));}
  catch {logger.error('Reminder scan failed. Check database migrations, connectivity and Brevo configuration.');}
  finally {running=false;}
 };
 const timer=setInterval(tick,60000);timer.unref();void tick();
 return ()=>{stopped=true;clearInterval(timer);};
}
