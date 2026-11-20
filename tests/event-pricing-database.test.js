import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {Readable} from 'node:stream';
import pg from 'pg';
import {pool} from '../server/db.js';
import {digest} from '../server/auth.js';
import {portalHandler} from '../server/portal.js';
import {participantsHandler} from '../server/participants.js';
import {filesHandler} from '../server/uploads.js';
import {eventRegistrationHandler} from '../server/event-registration.js';

test('event pricing saves/reopens all modes and preserves payment safeguards',{skip:!process.env.TEST_DATABASE_URL},async()=>{
 const root=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});
 const schema='pricing_test_'+randomUUID().replaceAll('-','');
 await root.query('CREATE SCHEMA '+schema);
 const connection=new URL(process.env.TEST_DATABASE_URL);connection.searchParams.set('options','-c search_path='+schema+',public');
 const db=new pg.Pool({connectionString:connection.toString()});
 const originalQuery=pool.query,originalConnect=pool.connect;
 try{
  const migrationScript=await readFile(new URL('../scripts/migrate.js',import.meta.url),'utf8');
  let legacyActivity;
  for(const match of migrationScript.matchAll(/'(\d{3}_[^']+\.sql)'/g)){
   if(match[1]==='022_registration_feedback.sql'){
    const owner=randomUUID();legacyActivity=randomUUID();
    await db.query("INSERT INTO users(id,email,password_hash,name,role) VALUES($1,'legacy-admin@example.test','unused','Legacy admin','admin')",[owner]);
    await db.query("INSERT INTO activities(id,created_by,title,starts_at,type,mode,language,audience,description,planned_hours) VALUES($1,$2,'Legacy event','2099-01-01','Workshop','Physical','English','Families','Test',1)",[legacyActivity,owner]);
    await db.query("INSERT INTO event_registration_settings(activity_id,paid) VALUES($1,false)",[legacyActivity]);
    await db.query("INSERT INTO event_participants(activity_id,name,email,phone) VALUES($1,'Legacy A','legacy-a@example.test','0123456789'),($1,'Legacy B','legacy-b@example.test','+60123456789')",[legacyActivity]);
   }
   await db.query(await readFile(new URL('../database/'+match[1],import.meta.url),'utf8'));
  }
  const legacyRows=(await db.query('SELECT * FROM event_participants WHERE activity_id=$1',[legacyActivity])).rows;
  assert.equal(legacyRows.length,2);assert.equal(legacyRows.filter(p=>p.legacy_shared_phone).length,1);
  assert.ok(legacyRows.every(p=>p.registration_state==='confirmed'));
  await assert.rejects(db.query("INSERT INTO event_participants(activity_id,name,email,phone) VALUES($1,'New','legacy-c@example.test','0123456789')",[legacyActivity]),e=>e.code==='23505');
  await db.query('DELETE FROM event_participants WHERE activity_id=$1',[legacyActivity]);

  pool.query=db.query.bind(db);pool.connect=db.connect.bind(db);
  const admin=randomUUID(),token='pricing-test-token';
  await db.query("INSERT INTO users(id,email,password_hash,name,role) VALUES($1,$2,'unused','Pricing test admin','admin')",[admin,admin+'@example.test']);
  await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest(token),admin]);
  async function call(handler,path,data=null,authenticated=true){
   const req=Readable.from(data?[JSON.stringify(data)]:[]);req.method=data?'POST':'GET';req.headers=authenticated?{cookie:'rcbc_session='+token}:{};
   req.socket={remoteAddress:'pricing-integration'};
   let result;await handler(req,{},new URL('http://localhost'+path),(_r,status,body)=>{result={status,body};});return result;
  }
  const saved=[];
  for(const mode of ['Online','Physical'])for(const pricing of ['free','paid']){
   const id=randomUUID(),activity={id,title:pricing+' '+mode,date:'2099-02-11T09:00',mode,type:'Workshop',venue:mode==='Online'?'Online':'Test venue',city:'Kuching',language:'English',audience:'Families',description:'Pricing test',plannedHours:1,status:'published',trainers:[],registrationType:pricing,registrationMethod:'website',registrationFee:pricing==='paid'?'RM 120':'stale fee',paymentInstructions:pricing==='paid'?'RCBC checks payment':'stale payment instructions',registrationInstructions:'General registration guidance'};
   assert.equal((await call(portalHandler,'/api/portal/actions',{type:'ACTIVITY_SAVE',activity})).status,200);
   const stored=(await db.query('SELECT * FROM event_registration_settings WHERE activity_id=$1',[id])).rows[0];
   assert.equal(stored.paid,pricing==='paid');
   assert.equal(stored.fee,pricing==='paid'?'RM 120':'');
   assert.equal(stored.instructions,pricing==='paid'?'RCBC checks payment':'');
   assert.equal(stored.general_instructions,'General registration guidance');
   const pub=(await call(eventRegistrationHandler,'/api/public/event-registration?activity='+id,null,false)).body;
   assert.equal(pub.settings.paid,pricing==='paid');assert.equal(pub.settings.enabled,true);
   const snapshot=(await call(portalHandler,'/api/portal')).body.activities.find(a=>a.id===id);
   assert.equal(snapshot.registrationType,pricing);assert.equal(snapshot.mode,mode);
   // Free registrations confirm automatically; paid registrations require payment review.
   await call(eventRegistrationHandler,'/api/public/event-registration?activity='+id,{name:'Test participant',email:'shared@example.test',phone:'0123456789',notes:'Question for the speaker',consent:true},false);
   const participant=(await db.query('SELECT * FROM event_participants WHERE activity_id=$1',[id])).rows[0];
   assert.equal(participant.registration_state,pricing==='paid'?'submitted':'confirmed');
   assert.equal(participant.notes,'Question for the speaker');
   if(pricing==='paid')await assert.rejects(call(eventRegistrationHandler,'/api/admin/event-registration?activity='+id,{action:'confirm',id:participant.id}),/verify payment/);
   else assert.equal((await call(eventRegistrationHandler,'/api/admin/event-registration?activity='+id,{action:'confirm',id:participant.id})).status,200);
   // Changing price classification after registrations is rejected and rolled back.
   await assert.rejects(call(portalHandler,'/api/portal/actions',{type:'ACTIVITY_SAVE',activity:{...activity,registrationType:pricing==='paid'?'free':'paid'}}),/after registrations exist/);
   assert.equal((await db.query('SELECT paid FROM event_registration_settings WHERE activity_id=$1',[id])).rows[0].paid,pricing==='paid');
   saved.push(activity);
  }

  const free=saved[0],paid=saved[1];
  await db.query('UPDATE activities SET capacity=1 WHERE id=$1',[free.id]);
  const submit=(id,phone)=>call(eventRegistrationHandler,'/api/public/event-registration?activity='+id,{name:'Another person',email:'shared@example.test',phone,notes:'Prepare this answer',consent:true},false);
  assert.equal((await submit(free.id,'0133456789')).status,200);
  assert.equal((await submit(free.id,'+60 12 3456789')).body.code,'duplicate-phone');
  const importPath='/api/admin/participants?activity='+free.id;
  assert.equal((await call(participantsHandler,importPath,{action:'import',rows:[{name:'CSV person',email:'shared@example.test',phone:'0143456789',notes:'CSV question'}]})).body.added,1);
  let listing=(await call(participantsHandler,importPath)).body;
  assert.equal(listing.capacitySummary.confirmed,3);assert.equal(listing.capacitySummary.exceeded,2);
  const removed=listing.participants.find(p=>p.phone==='0143456789');
  assert.equal(removed.notes,'CSV question');
  await call(participantsHandler,importPath,{action:'status',id:removed.id,status:'cancelled'});
  assert.equal((await call(participantsHandler,importPath)).body.capacitySummary.exceeded,1);
  await call(participantsHandler,importPath,{action:'status',id:removed.id,status:'registered'});
  await call(participantsHandler,importPath,{action:'status',id:removed.id,status:'cancelled'});
  await submit(free.id,'0143456789');
  await assert.rejects(call(participantsHandler,importPath,{action:'status',id:removed.id,status:'registered'}),/Cannot restore/);
  // Database index also prevents bypassing the API's duplicate-phone checks.
  await assert.rejects(db.query("INSERT INTO event_participants(activity_id,name,email,phone) VALUES($1,'Bypass','other@example.test','+60 12 3456789')",[free.id]),e=>e.code==='23505');
  await call(participantsHandler,'/api/admin/participants?activity='+paid.id,{action:'import',rows:[{name:'Paid CSV person',email:'shared@example.test',phone:'0173456789',notes:'Paid question'}]});
  const paidListing=(await call(participantsHandler,'/api/admin/participants?activity='+paid.id)).body;
  assert.equal(paidListing.capacitySummary.confirmed,0);
  assert.ok(paidListing.participants.every(p=>p.registration_state==='submitted'));
  const paidPath='/api/admin/event-registration?activity='+paid.id;
  const applicant=(await db.query('SELECT * FROM event_participants WHERE activity_id=$1',[paid.id])).rows[0];
  await call(eventRegistrationHandler,paidPath,{action:'pending',id:applicant.id});
  const upload=Readable.from([Buffer.from('%PDF-1.4 test evidence')]);upload.method='POST';upload.headers={cookie:'rcbc_session='+token,'x-file-name':'receipt.pdf'};
  let file;await filesHandler(upload,{},new URL('http://localhost/api/uploads?kind=payment-evidence'),(_r,status,result)=>{assert.equal(status,201);file=result;});
  await assert.rejects(filesHandler({method:'GET',headers:{}},{},new URL('http://localhost'+file.url),()=>{}),e=>e.status===403);
  assert.equal((await db.query('SELECT payment_verified_at FROM event_participants WHERE id=$1',[applicant.id])).rows[0].payment_verified_at,null);
  await call(eventRegistrationHandler,paidPath,{action:'verify-payment',id:applicant.id,evidenceFileId:file.id});
  await call(eventRegistrationHandler,paidPath,{action:'confirm',id:applicant.id});
  assert.equal((await db.query('SELECT registration_state FROM event_participants WHERE id=$1',[applicant.id])).rows[0].registration_state,'confirmed');
  // Legacy input types decode to the original price flag without controlling delivery mode.
  const legacy={...saved[0],id:randomUUID(),registrationType:'free-online',mode:'Physical',venue:'Test venue'};
  assert.equal((await call(portalHandler,'/api/portal/actions',{type:'ACTIVITY_SAVE',activity:legacy})).status,200);
  assert.equal((await call(portalHandler,'/api/portal')).body.activities.find(a=>a.id===legacy.id).registrationType,'free');
 }finally{
  pool.query=originalQuery;pool.connect=originalConnect;
  await db.end();await root.query('DROP SCHEMA '+schema+' CASCADE');await root.end();
 }
});
