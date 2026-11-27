import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { matchesAudience,reminderIdempotencyKey,reminderMessage,reminderSettings,runReminders,startReminderWorker } from '../server/reminders.js';
import { eventCalendar, eventCalendarHandler } from '../server/event-calendar.js';
import { verifyUnsubscribeToken,unsubscribeToken } from '../server/subscriber-tokens.js';
import { migrateSubscriberDatabase } from '../server/subscriber-migrations.js';
import { BrevoError,createBrevo } from '../server/brevo.js';
import { audienceQuery,subscriberCsv,syncBrevo } from '../server/subscriber-export.js';
import { normalizePortalState } from '../src/trainer-portal/portalState.js';

const env={BREVO_API_KEY:'test-key',BREVO_SENDER_EMAIL:'sender@example.com',APP_BASE_URL:'https://example.com',SUBSCRIBER_TOKEN_SECRET:'a'.repeat(64),BREVO_LIST_ID:'12'};
const subscriber={id:randomUUID(),name:'Test <reader>',email:'test@example.com',language:'English',city:'Bintulu',consent_at:new Date()};
const activity={id:randomUUID(),title:'<script>Test</script>',language:'English',mode:'Physical',city:'bintulu',starts_at:new Date(Date.now()+3600000),description:'<img src=x>',registration_link:'javascript:bad'};

test('recipient selection requires consent and physical locality',()=>{
 assert.equal(matchesAudience(activity,subscriber),true);
 assert.equal(matchesAudience(activity,{...subscriber,consent_at:null}),false);
 assert.equal(matchesAudience(activity,{...subscriber,unsubscribed_at:new Date()}),false);
 assert.equal(matchesAudience(activity,{...subscriber,language:'Chinese'}),true);
 assert.equal(matchesAudience(activity,{...subscriber,city:'Kuching'}),false);
 assert.equal(matchesAudience({...activity,mode:'Online'},{...subscriber,city:'Kuching'}),true);
});
test('email template escapes HTML, uses safe links and includes a signed opt-out',()=>{
 const message=reminderMessage({...activity,registration_enabled:true,website_enabled:true,planned_hours:2,
  registration_deadline:new Date('2026-11-24T00:30:00Z')},subscriber,env);
 assert.equal(message.headers.idempotencyKey.length,36);
 assert.match(message.headers.idempotencyKey,/^[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-8[a-f0-9]{3}-[a-f0-9]{12}$/);
 assert.ok(!message.htmlContent.includes('<script>'));
 assert.ok(!message.htmlContent.includes('javascript:'));
 assert.match(message.textContent,/Malaysia time/);
 assert.match(message.textContent,/Register by: Tuesday, 24 November 2026 at 8:30 am/i);
 assert.ok(message.textContent.includes('https://example.com/learn-events/event/'+activity.id));
 assert.match(message.textContent,/not confirmation of event registration/);
 assert.match(message.textContent,/Add to Google Calendar: https:\/\/calendar.google.com/);
 assert.match(message.textContent,/Download calendar file for Apple Calendar or Outlook/);
 const link=new URL(message.textContent.match(/Unsubscribe: (\S+)/)[1]);
 assert.equal(verifyUnsubscribeToken(link.searchParams.get('unsubscribe'),env.SUBSCRIBER_TOKEN_SECRET),subscriber.id);
 assert.equal(message.headers.idempotencyKey,reminderMessage(activity,subscriber,env).headers.idempotencyKey);
 assert.notEqual(message.headers.idempotencyKey,reminderMessage({...activity,starts_at:new Date(Date.now()+7200000)},subscriber,env).headers.idempotencyKey);
 assert.notEqual(message.headers.idempotencyKey,reminderIdempotencyKey(activity,subscriber,'last-call'));
 const final=reminderMessage({...activity,general_instructions:'Parking: enter via the main gate.'},subscriber,env,'final');
 assert.match(final.textContent,/registration is confirmed/i);
 assert.match(final.textContent,/Parking: enter via the main gate/);
 assert.doesNotMatch(final.textContent,/Unsubscribe|View event and register/);
});
test('calendar files preserve Malaysia dates, fold Unicode and escape newlines',async()=>{
 const event={...activity,title:'照护'.repeat(40)+'; Care',description:'Arrival\nPlease use gate A.',
  starts_at:new Date('2026-11-24T00:30:00Z'),planned_hours:2};
 const calendar=eventCalendar(event,env.APP_BASE_URL,new Date('2026-11-20T00:00:00Z'));
 assert.ok(calendar.split('\r\n').every(line=>Buffer.byteLength(line)<=75));
 const unfolded=calendar.replaceAll('\r\n ','');
 assert.match(unfolded,/DTSTART:20261124T003000Z\r\nDTEND:20261124T023000Z/);
 assert.ok(unfolded.includes('SUMMARY:'+event.title.replace(';','\\;')));
 assert.ok(unfolded.includes('DESCRIPTION:Arrival\\nPlease use gate A.'));
 const url=new URL('/api/public/event-calendar?activity='+event.id,env.APP_BASE_URL);
 const db={query:async(sql,params)=>{assert.match(sql,/status='published'.*cancelled_at IS NULL/);assert.deepEqual(params,[event.id]);return {rows:[event]};}};
 const response={writeHead:(status,headers)=>{assert.equal(status,200);assert.match(headers['Content-Type'],/text\/calendar/);},end:body=>body};
 assert.match(await eventCalendarHandler({method:'GET'},response,url,assert.fail,db),/BEGIN:VCALENDAR/);
});
test('signed unsubscribe links reject tampering and incorrect secrets',()=>{
 const token=unsubscribeToken(subscriber.id,env.SUBSCRIBER_TOKEN_SECRET);
 assert.equal(verifyUnsubscribeToken(token,'b'.repeat(64)),null);
 assert.equal(verifyUnsubscribeToken('x'+token,env.SUBSCRIBER_TOKEN_SECRET),null);
 assert.throws(()=>unsubscribeToken(subscriber.id,'short'));
});
test('scheduler stays disabled until configured; invalid settings are rejected',()=>{
 assert.deepEqual(reminderSettings({}),{hours:504,limit:100,lastCall:false});
 assert.equal(reminderSettings({REMINDER_INVITE_LEAD_HOURS:'168'}).hours,168);
 assert.throws(()=>reminderSettings({REMINDER_INVITE_LEAD_HOURS:'0'}));
 assert.throws(()=>reminderSettings({REMINDER_BATCH_SIZE:'NaN'}));
 assert.equal(typeof startReminderWorker({env:{}}),'function');
 assert.throws(()=>startReminderWorker({env:{REMINDERS_ENABLED:'true'}}),/Set BREVO/);
});
test('Brevo reports IP restrictions without echoing sensitive provider responses',async()=>{
 const request=createBrevo({env,fetcher:async()=>({ok:false,status:401,json:async()=>({message:'unrecognised IP SECRET'})})});
 await assert.rejects(request('/contacts'),error=>error.message.includes('authorised_ips')&&!error.message.includes('SECRET'));
});
test('Brevo distinguishes ambiguous sends from explicit retryable rejection',async()=>{
 const timedOut=createBrevo({env,fetcher:async()=>{throw new Error('network');}});
 await assert.rejects(timedOut('/smtp/email',{method:'POST',data:{}}),error=>error.uncertain===true);
 const throttled=createBrevo({env,fetcher:async()=>({ok:false,status:429,json:async()=>({})})});
 await assert.rejects(throttled('/smtp/email',{method:'POST',data:{}}),error=>error.retryable&&!error.uncertain);
});
test('manual sync applies opt-outs first and never resets Brevo blocks',async()=>{
 const calls=[];await syncBrevo([subscriber],[{email:'out@example.com'}],{env,request:async(path,options)=>calls.push({path,...options})});
 assert.deepEqual(calls[0].data.unlinkListIds,[12]);
 assert.equal(calls[1].data.emailBlacklisted,undefined);
 assert.deepEqual(calls[1].data.listIds,[12]);
 const query=audienceQuery({city:"x' OR true--"});
 assert.ok(!query.text.includes("x'"));assert.match(query.text,/unsubscribed_at IS NULL/);
 assert.ok(subscriberCsv([{...subscriber,name:'=formula'}]).includes('"\'=formula"'));
});
test('partial snapshots retain arrays after login refresh',()=>{
 assert.deepEqual(normalizePortalState({adminSession:{id:'a'}},{}).records.filter(Boolean),[]);
});

test('split-database reminder integration: idempotency, suppression, retry and cancellation',{skip:!process.env.TEST_DATABASE_URL},async()=>{
 const root=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});
 const prefix='reminder_test_'+randomUUID().replaceAll('-','');
 const schemas=[prefix+'_site',prefix+'_subs'];
 const pools=[];
 try {
  for(const schema of schemas) {
   await root.query(`CREATE SCHEMA ${schema}`);
   const url=new URL(process.env.TEST_DATABASE_URL);url.searchParams.set('options',`-c search_path=${schema},public`);
   pools.push(new pg.Pool({connectionString:url.toString()}));
  }
  const [website,subscribers]=pools;
  const setup=await subscribers.connect();
  try {
   await setup.query('BEGIN');
   await setup.query('CREATE TABLE subscriber_schema_migrations(name text PRIMARY KEY,applied_at timestamptz DEFAULT now())');
   for (const migration of ['001_subscribers.sql','002_reminders.sql']) {
    await setup.query(await readFile(new URL('../database/subscribers/'+migration,import.meta.url),'utf8'));
    await setup.query('INSERT INTO subscriber_schema_migrations(name) VALUES($1)',[migration]);
   }
   const legacyId=randomUUID();
   await setup.query(`INSERT INTO subscribers(id,name,email,city,state,language,consent_version,consent_at,unsubscribed_at)
    VALUES($1,'Previously notified','legacy@example.com','Bintulu','Sarawak','English','v1',now(),now())`,[legacyId]);
   await setup.query("INSERT INTO reminder_deliveries(activity_id,starts_at,subscriber_id,status) VALUES($1,now(),$2,'sent')",[randomUUID(),legacyId]);
   await migrateSubscriberDatabase(setup);
   await migrateSubscriberDatabase(setup);
   assert.deepEqual((await setup.query('SELECT stage,status FROM reminder_deliveries WHERE subscriber_id=$1',[legacyId])).rows,
    [{stage:'invite',status:'sent'}]);
   await setup.query('DELETE FROM reminder_deliveries WHERE subscriber_id=$1',[legacyId]);
   await setup.query('COMMIT');
  } finally { setup.release(); }
  await website.query(`
   CREATE TABLE activities(id uuid PRIMARY KEY,title text,starts_at timestamptz,type text,mode text,city text,
    language text,status text,published_at timestamptz,cancelled_at timestamptz,venue text,description text,
    registration_link text,registration_deadline timestamptz,programme_id text,capacity int,planned_hours numeric);
   CREATE TABLE event_registration_settings(activity_id uuid PRIMARY KEY, enabled boolean, website_enabled boolean, google_url text, general_instructions text);
   CREATE TABLE event_participants(id uuid PRIMARY KEY,activity_id uuid,name text,email text,status text,registration_state text);
   CREATE TABLE learn_events_content(id text PRIMARY KEY, data jsonb);
   INSERT INTO learn_events_content VALUES ('main','{"physicalEducation":{"programmes":[{"id":"planned-programme","availability":"planned"}]}}');
  `);
  await website.query(await readFile(new URL('../database/027_event_attendance_reminders.sql',import.meta.url),'utf8'));
  assert.equal((await website.query("SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_name='subscribers'",[schemas[0]])).rowCount,0);
  async function addSubscriber(email,extra={}) {
   const s={...subscriber,id:randomUUID(),email,...extra};
   await subscribers.query('INSERT INTO subscribers(id,email,name,city,state,language,consent_version,consent_at,unsubscribed_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[s.id,s.email,s.name,s.city,'Sarawak',s.language,'v1',s.consent_at,s.unsubscribed_at || null]);return s;
  }
  const good=await addSubscriber('good@example.com');
  await addSubscriber('optout@example.com',{unsubscribed_at:new Date()});
  await addSubscriber('other-city@example.com',{city:'Kuching'});
  await addSubscriber('blocked@example.com');
  async function addActivity(extra={}) {
   const a={...activity,id:randomUUID(),status:'published',published_at:new Date(),type:'Seminar',...extra};
   await website.query(`INSERT INTO activities(id,title,starts_at,type,mode,city,language,status,published_at,cancelled_at,
    description,registration_deadline,registration_link,programme_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [a.id,a.title,a.starts_at,a.type,a.mode,a.city,a.language,a.status,a.published_at,a.cancelled_at,a.description,
     a.registration_deadline,a.registration_link,a.programme_id]);
   if(a.settings !== null) await website.query('INSERT INTO event_registration_settings VALUES($1,$2,$3,$4,$5)',
    [a.id,a.settings?.enabled ?? true,a.settings?.website ?? true,a.settings?.url ?? '',a.settings?.instructions ?? '']);
   return a;
  }
  const daysFromNow = days => new Date(Date.now()+days*86400000);
  const due=await addActivity({type:'Workshop',starts_at:daysFromNow(12),registration_deadline:daysFromNow(6)});
  await addActivity({status:'approved'});await addActivity({status:'draft'});
  await addActivity({cancelled_at:new Date()});await addActivity({starts_at:daysFromNow(8)});
  await addActivity({starts_at:daysFromNow(-1)});
  await addActivity({registration_deadline:daysFromNow(-1)});
  await addActivity({settings:{enabled:false},registration_link:'https://example.com/stale-form'});
  await addActivity({settings:{website:false,url:'javascript:bad'}});
  await addActivity({programme_id:'planned-programme'});
  await addActivity({published_at:null});
  let sends=0;
  const request=async(path,{data}={})=>{
   if(path.startsWith('/contacts/'))return {emailBlacklisted:path.includes('blocked')};
   sends++;assert.equal(data.to[0].email,good.email);
   if(sends===1) {
    assert.match(data.textContent,/Register by:/);
    assert.ok(data.textContent.includes('https://example.com/learn-events/event/'+due.id));
   }
   return {messageId:'receipt-'+sends};
  };
  const options={website,subscribers,request,env:{...env,REMINDER_INVITE_LEAD_HOURS:'168'}};
  const preview=await runReminders({...options,dryRun:true});assert.equal(preview.activities,1);assert.equal(sends,0);
  assert.equal((await subscribers.query('SELECT * FROM reminder_deliveries')).rowCount,0);
  await Promise.all([runReminders(options),runReminders(options)]);await runReminders(options);
  assert.equal(sends,1);
  assert.equal((await subscribers.query("SELECT * FROM reminder_deliveries WHERE status='sent'")).rowCount,1);
  assert.equal((await subscribers.query("SELECT * FROM reminder_deliveries WHERE status='suppressed'")).rowCount,1);
  await addActivity({type:'Public Talk',settings:null,registration_link:'https://example.com/legacy-form'});
  await addActivity({settings:{website:false,url:'https://example.com/new-form'}});
  const noDeadline=await addActivity({starts_at:daysFromNow(6)});
  assert.equal((await runReminders({...options,dryRun:true})).activities,4);
  const links=[];
  await runReminders({...options,request:async(path,{data}={})=>{
   if(path.startsWith('/contacts/'))return {emailBlacklisted:path.includes('blocked')};
   links.push(data.textContent.match(/View event and register: (\S+)/)[1]);return {messageId:'other-event'};
  }});
  assert.deepEqual(links.sort(),['https://example.com/legacy-form','https://example.com/new-form',
   'https://example.com/learn-events/event/'+noDeadline.id].sort());
  // A crash/timeout after dispatch must never resend automatically.
  await website.query("UPDATE activities SET status='archived'");
  const uncertain=await addActivity();
  let uncertainSends=0;
  const ambiguous=async(path)=>{if(path.startsWith('/contacts/'))return {emailBlacklisted:path.includes('blocked')};uncertainSends++;throw new BrevoError('Timeout',0,{uncertain:true});};
  await runReminders({...options,request:ambiguous});await runReminders({...options,request:ambiguous});
  assert.equal(uncertainSends,1);
  assert.equal((await subscribers.query("SELECT * FROM reminder_deliveries WHERE activity_id=$1 AND status='uncertain'",[uncertain.id])).rowCount,1);
  // Explicit quota rejection can retry, and a cancellation prevents that retry.
  await website.query("UPDATE activities SET status='archived'");
  const retry=await addActivity();
  await runReminders({...options,request:async(path)=>{if(path.startsWith('/contacts/'))return {emailBlacklisted:path.includes('blocked')};throw new BrevoError('Rate limited',429,{retryable:true});}});
  assert.equal((await subscribers.query("SELECT * FROM reminder_deliveries WHERE activity_id=$1 AND status='retry'",[retry.id])).rowCount,1);
  await subscribers.query("UPDATE reminder_deliveries SET next_attempt_at=now()-interval '1 minute' WHERE activity_id=$1",[retry.id]);
  await website.query('UPDATE activities SET cancelled_at=now() WHERE id=$1',[retry.id]);
  await runReminders(options);assert.equal(sends,1);
  // A still-active event must respect a fresh opt-out on retry.
  await website.query('UPDATE activities SET cancelled_at=NULL WHERE id=$1',[retry.id]);
  await subscribers.query('UPDATE subscribers SET unsubscribed_at=now() WHERE id=$1',[good.id]);
  await runReminders(options);assert.equal(sends,1);
  // A definitive rejection may retry successfully once the provider recovers.
  await website.query("UPDATE activities SET status='archived'");
  await subscribers.query('UPDATE subscribers SET unsubscribed_at=NULL WHERE id=$1',[good.id]);
  const recovered=await addActivity();
  await runReminders({...options,request:async(path)=>{if(path.startsWith('/contacts/'))return {emailBlacklisted:path.includes('blocked')};throw new BrevoError('Rate limited',429,{retryable:true});}});
  await subscribers.query("UPDATE reminder_deliveries SET next_attempt_at=now()-interval '1 minute' WHERE activity_id=$1",[recovered.id]);
  await runReminders(options);await runReminders(options);assert.equal(sends,2);
  const receipt=(await subscribers.query('SELECT status,attempts FROM reminder_deliveries WHERE activity_id=$1 AND subscriber_id=$2',[recovered.id,good.id])).rows[0];
  assert.deepEqual(receipt,{status:'sent',attempts:2});
  // Cancellation while checking the provider is caught by the final event read.
  await website.query("UPDATE activities SET status='archived'");
  const changed=await addActivity();
  await runReminders({...options,request:async(path)=>{
   assert.ok(path.startsWith('/contacts/'));
   await website.query('UPDATE activities SET cancelled_at=now() WHERE id=$1',[changed.id]);
   return {};
  }});
  assert.equal(sends,2);
  // A deadline reached while looking up Brevo consent prevents dispatch.
  await website.query("UPDATE activities SET status='archived'");
  const closing=await addActivity({registration_deadline:new Date(Date.now()+1800000)});
  await runReminders({...options,request:async(path)=>{
   assert.ok(path.startsWith('/contacts/'));
   await website.query("UPDATE activities SET registration_deadline=now()-interval '1 second' WHERE id=$1",[closing.id]);
   return {};
  }});
  assert.equal((await subscribers.query('SELECT status FROM reminder_deliveries WHERE activity_id=$1 AND subscriber_id=$2',[closing.id,good.id])).rows[0].status,'cancelled');
  await website.query("UPDATE activities SET registration_deadline=now()+interval '30 minutes' WHERE id=$1",[closing.id]);
  await runReminders(options);
  assert.equal(sends,3);

  await website.query("UPDATE activities SET status='archived'");
  const other = await addSubscriber('other-good@example.com');
  const staged = await addActivity({starts_at:daysFromNow(25),registration_deadline:daysFromNow(13)});
  await addActivity({starts_at:daysFromNow(22),registration_deadline:daysFromNow(16)});
  const notices = [];
  const timeline = {...options,env,request:async(path,{data}={})=>{
   if(path.startsWith('/contacts/'))return {emailBlacklisted:path.includes('blocked')};
   notices.push(data);return {messageId:'stage-'+notices.length};
  }};
  await runReminders(timeline);
  assert.deepEqual(notices.map(m=>m.to[0].email).sort(),[good.email,other.email].sort());
  assert.ok(notices.every(m=>m.subject.startsWith('Invitation:')));
  await website.query("UPDATE activities SET registration_deadline=now()+interval '6 days' WHERE id=$1",[staged.id]);
  await runReminders({...timeline,env:{...env,REMINDER_LAST_CALL_ENABLED:'true'}});
  assert.equal(notices.length,2);
  await subscribers.query("UPDATE reminder_deliveries SET sent_at=now()-interval '3 days' WHERE activity_id=$1",[staged.id]);
  const addParticipant = (event,email,state,status='registered') => website.query(
   'INSERT INTO event_participants VALUES($1,$2,$3,$4,$5,$6)',
   [randomUUID(),event.id,'Participant',email,status,state]);
  await addParticipant(staged,good.email.toUpperCase(),'submitted');
  await runReminders(timeline);
  assert.equal(notices.length,2);
  const lastCall = {...timeline,env:{...env,REMINDER_LAST_CALL_ENABLED:'true'}};
  await runReminders(lastCall);
  await runReminders(lastCall);
  assert.equal(notices.length,3);
  assert.equal(notices[2].to[0].email,other.email);
  assert.match(notices[2].subject,/^Registration reminder:/);
  assert.notEqual(notices[2].headers.idempotencyKey,
   notices.slice(0,2).find(m=>m.to[0].email===other.email).headers.idempotencyKey);

  const imminent = await addActivity({starts_at:daysFromNow(2),registration_deadline:daysFromNow(-1),
   settings:{enabled:false,instructions:'Drop-off at the main gate.'}});
  await addParticipant(imminent,'optout@example.com','confirmed');
  await addParticipant(imminent,'pending@example.com','pending-payment');
  await addParticipant(imminent,'cancelled@example.com','confirmed','cancelled');
  await Promise.all([runReminders(lastCall),runReminders(lastCall)]);
  await runReminders(lastCall);
  assert.equal(notices.length,4);
  assert.equal(notices[3].to[0].email,'optout@example.com');
  assert.match(notices[3].subject,/^Final event reminder:/);
  assert.match(notices[3].textContent,/Drop-off at the main gate/);
  assert.equal((await website.query("SELECT id FROM event_attendance_reminders WHERE status='sent'")).rowCount,1);
 } finally {
  for(const p of pools)await p.end();
  for(const schema of schemas)await root.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await root.end();
 }
});
