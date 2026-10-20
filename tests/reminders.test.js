import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { matchesAudience,reminderMessage,reminderSettings,runReminders,startReminderWorker } from '../server/reminders.js';
import { verifyUnsubscribeToken,unsubscribeToken } from '../server/subscriber-tokens.js';
import { migrateSubscriberDatabase } from '../server/subscriber-migrations.js';
import { BrevoError,createBrevo } from '../server/brevo.js';
import { audienceQuery,subscriberCsv,syncBrevo } from '../server/subscriber-export.js';
import { normalizePortalState } from '../src/trainer-portal/portalState.js';

const env={BREVO_API_KEY:'test-key',BREVO_SENDER_EMAIL:'sender@example.com',APP_BASE_URL:'https://example.com',SUBSCRIBER_TOKEN_SECRET:'a'.repeat(64),BREVO_LIST_ID:'12'};
const subscriber={id:randomUUID(),name:'Test <reader>',email:'test@example.com',language:'English',city:'Bintulu',consent_at:new Date()};
const activity={id:randomUUID(),title:'<script>Test</script>',language:'English',mode:'Physical',city:'bintulu',starts_at:new Date(Date.now()+3600000),description:'<img src=x>',registration_link:'javascript:bad'};

test('recipient selection requires consent, language and physical locality',()=>{
 assert.equal(matchesAudience(activity,subscriber),true);
 assert.equal(matchesAudience(activity,{...subscriber,consent_at:null}),false);
 assert.equal(matchesAudience(activity,{...subscriber,unsubscribed_at:new Date()}),false);
 assert.equal(matchesAudience(activity,{...subscriber,language:'Chinese'}),false);
 assert.equal(matchesAudience(activity,{...subscriber,city:'Kuching'}),false);
 assert.equal(matchesAudience({...activity,mode:'Online'},{...subscriber,city:'Kuching'}),true);
});
test('email template escapes HTML, uses safe links and includes a signed opt-out',()=>{
 const message=reminderMessage(activity,subscriber,env);
 assert.equal(message.headers.idempotencyKey.length,36);
 assert.match(message.headers.idempotencyKey,/^[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-8[a-f0-9]{3}-[a-f0-9]{12}$/);
 assert.ok(!message.htmlContent.includes('<script>'));
 assert.ok(!message.htmlContent.includes('javascript:'));
 assert.match(message.textContent,/Malaysia time/);
 assert.match(message.textContent,/not confirmation of event registration/);
 const link=new URL(message.textContent.split('Unsubscribe: ')[1]);
 assert.equal(verifyUnsubscribeToken(link.searchParams.get('unsubscribe'),env.SUBSCRIBER_TOKEN_SECRET),subscriber.id);
 assert.equal(message.headers.idempotencyKey,reminderMessage(activity,subscriber,env).headers.idempotencyKey);
 assert.notEqual(message.headers.idempotencyKey,reminderMessage({...activity,starts_at:new Date(Date.now()+7200000)},subscriber,env).headers.idempotencyKey);
});
test('signed unsubscribe links reject tampering and incorrect secrets',()=>{
 const token=unsubscribeToken(subscriber.id,env.SUBSCRIBER_TOKEN_SECRET);
 assert.equal(verifyUnsubscribeToken(token,'b'.repeat(64)),null);
 assert.equal(verifyUnsubscribeToken('x'+token,env.SUBSCRIBER_TOKEN_SECRET),null);
 assert.throws(()=>unsubscribeToken(subscriber.id,'short'));
});
test('scheduler stays disabled until configured; invalid settings are rejected',()=>{
 assert.deepEqual(reminderSettings({}),{hours:24,limit:100});
 assert.throws(()=>reminderSettings({REMINDER_LEAD_HOURS:'0'}));
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
 assert.equal(calls[0].data.emailBlacklisted,true);
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
  try {await setup.query('BEGIN');await migrateSubscriberDatabase(setup);await migrateSubscriberDatabase(setup);await setup.query('COMMIT');}finally{setup.release();}
  await website.query('CREATE TABLE activities(id uuid PRIMARY KEY,title text,starts_at timestamptz,type text,mode text,city text,language text,status text,cancelled_at timestamptz,venue text,description text,registration_link text)');
  assert.equal((await website.query("SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_name='subscribers'",[schemas[0]])).rowCount,0);
  async function addSubscriber(email,extra={}) {
   const s={...subscriber,id:randomUUID(),email,...extra};
   await subscribers.query('INSERT INTO subscribers(id,email,name,city,state,language,consent_version,consent_at,unsubscribed_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[s.id,s.email,s.name,s.city,'Sarawak',s.language,'v1',s.consent_at,s.unsubscribed_at || null]);return s;
  }
  const good=await addSubscriber('good@example.com');
  await addSubscriber('optout@example.com',{unsubscribed_at:new Date()});
  await addSubscriber('other-language@example.com',{language:'Chinese'});
  await addSubscriber('other-city@example.com',{city:'Kuching'});
  await addSubscriber('blocked@example.com');
  async function addActivity(extra={}) {
   const a={...activity,id:randomUUID(),status:'published',type:'Seminar',...extra};
   await website.query('INSERT INTO activities(id,title,starts_at,type,mode,city,language,status,cancelled_at,description) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[a.id,a.title,a.starts_at,a.type,a.mode,a.city,a.language,a.status,a.cancelled_at || null,a.description]);return a;
  }
  const due=await addActivity();
  await addActivity({status:'approved'});await addActivity({status:'draft'});
  await addActivity({cancelled_at:new Date()});await addActivity({starts_at:new Date(Date.now()+26*3600000)});
  await addActivity({starts_at:new Date(Date.now()-3600000)});await addActivity({type:'Workshop'});
  let sends=0;
  const request=async(path,{data}={})=>{
   if(path.startsWith('/contacts/'))return {emailBlacklisted:path.includes('blocked')};
   sends++;assert.equal(data.to[0].email,good.email);return {messageId:'receipt-'+sends};
  };
  const options={website,subscribers,request,env};
  const preview=await runReminders({...options,dryRun:true});assert.equal(preview.activities,1);assert.equal(sends,0);
  assert.equal((await subscribers.query('SELECT * FROM reminder_deliveries')).rowCount,0);
  await Promise.all([runReminders(options),runReminders(options)]);await runReminders(options);
  assert.equal(sends,1);
  assert.equal((await subscribers.query("SELECT * FROM reminder_deliveries WHERE status='sent'")).rowCount,1);
  assert.equal((await subscribers.query("SELECT * FROM reminder_deliveries WHERE status='suppressed'")).rowCount,1);
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
  assert.ok(due.id);
 } finally {
  for(const p of pools)await p.end();
  for(const schema of schemas)await root.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await root.end();
 }
});
