import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {validateAttendance} from '../shared/participants.js';
import {registrationAvailability,participantExport} from '../shared/event-registration.js';
import {participantsHandler} from '../server/participants.js';
import {eventRegistrationHandler} from '../server/event-registration.js';
import {pool} from '../server/db.js';

const activityId='11111111-1111-4111-8111-111111111111';
const participantId='22222222-2222-4222-8222-222222222222';
function request(method,data,admin=false){
 const req=Readable.from(data?[JSON.stringify(data)]:[]);
 req.method=method;req.headers=admin?{cookie:'rcbc_session=test'}:{};
 req.socket={remoteAddress:'registration-stages-test'};
 return req;
}

test('attendance is independent of payment and confirmation, with eligibility checked',()=>{
 const confirmed={status:'registered',registration_state:'confirmed'};
 for(const value of ['not-recorded','attended','absent'])assert.equal(validateAttendance(confirmed,value),value);
 for(const participant of [{...confirmed,status:'cancelled'},{...confirmed,registration_state:'submitted'},{...confirmed,registration_state:'pending-payment',payment_verified_at:'now'}]){
  assert.throws(()=>validateAttendance(participant,'attended'),/active confirmed/);
  assert.equal(validateAttendance(participant,'not-recorded'),'not-recorded');
 }
 for(const value of ['confirmed','completed','',null])assert.throws(()=>validateAttendance(confirmed,value),/valid attendance/);
});

test('attendance writes lock the scoped participant, timestamp the actor and audit changes; removal history survives',async()=>{
 const query=pool.query,connect=pool.connect;
 const participant={id:participantId,status:'registered',registration_state:'confirmed',attendance_status:'not-recorded',confirmed_at:'kept',payment_verified_at:'kept'};
 const calls=[];
 pool.query=async(sql)=>{
  if(sql.includes('FROM sessions'))return {rows:[{id:'admin',role:'admin'}]};
  if(sql.includes('FROM activities'))return {rows:[{id:activityId}]};
  throw Error('Unexpected query: '+sql);
 };
 pool.connect=async()=>({release(){},async query(sql,args){
  calls.push({sql,args});
  if(sql.startsWith('SELECT * FROM event_participants'))return {rows:[{...participant}]};
  if(sql.startsWith('UPDATE event_participants SET attendance_status'))participant.attendance_status=args[1];
  return {rows:[],rowCount:1};
 }});
 async function record(attendance){
  let result;
  await participantsHandler(request('POST',{action:'attendance',id:participantId,attendance},true),{},new URL('http://localhost/api/admin/participants?activity='+activityId),(_res,status,value)=>{result={status,value};});
  return result;
 }
 try{
  assert.equal((await record('attended')).status,200);
  const update=calls.find(c=>c.sql.startsWith('UPDATE'));
  assert.match(update.sql,/attendance_recorded_at=now\(\),attendance_recorded_by=\$3/);
  assert.deepEqual(update.args,[participantId,'attended','admin']);
  assert.deepEqual(calls.find(c=>c.sql.startsWith('SELECT * FROM event_participants')).args,[participantId,activityId]);
  assert.ok(calls.some(c=>c.sql.includes('FOR UPDATE')));
  const audit=calls.find(c=>c.sql.startsWith('INSERT INTO audit_log'));
  assert.deepEqual(audit.args.slice(-2),['not-recorded','attended']);
  calls.length=0;
  await record('attended');assert.ok(!calls.some(c=>c.sql.startsWith('UPDATE')||c.sql.startsWith('INSERT INTO audit_log')));
  participant.status='cancelled';
  await assert.rejects(record('attended'),/active confirmed/);
  assert.equal(participant.attendance_status,'attended');
  assert.ok(calls.some(c=>c.sql==='ROLLBACK'));
  assert.equal((await record('not-recorded')).status,200);
  assert.equal(participant.confirmed_at,'kept');assert.equal(participant.payment_verified_at,'kept');
 }finally{pool.query=query;pool.connect=connect;}
});

test('public GET and POST reject unapproved content even when published, before registration data access',async()=>{
 const query=pool.query;
 try{
  for(const approval of ['pending',null,undefined,'rejected'])for(const method of ['GET','POST']){
   pool.query=async(sql)=>{
    assert.match(sql,/SELECT \* FROM activities/);
    return {rows:[{id:activityId,status:'published',published_at:'2026-01-01',content_approval_status:approval}]};
   };
   await assert.rejects(eventRegistrationHandler(request(method,method==='POST'?{}:null),{},new URL('http://localhost/api/public/event-registration?activity='+activityId),()=>assert.fail('Must not expose registration')),e=>e.status===404);
  }
 }finally{pool.query=query;}
});

test('postponement blocks free and paid public registration; capacity remains advisory',async()=>{
 const query=pool.query,connect=pool.connect;
 const activity={id:activityId,status:'published',published_at:'2026-01-01',content_approval_status:'approved',starts_at:'2099-01-01',postponed_at:'2026-01-01',capacity:1};
 try{
  pool.connect=async()=>assert.fail('Closed registration must not start a write');
  for(const paid of [true,false]){
   const settings={activity_id:activityId,enabled:true,website_enabled:true,paid};
   pool.query=async(sql)=>({rows:[sql.includes('FROM activities')?activity:settings]});
   let result;
   await eventRegistrationHandler(request('GET'),{},new URL('http://localhost/api/public/event-registration?activity='+activityId),(_res,_status,data)=>{result=data;});
   assert.equal(result.settings.enabled,false);assert.match(result.closedReason,/postponed/);
   await assert.rejects(eventRegistrationHandler(request('POST',{}),{},new URL('http://localhost/api/public/event-registration?activity='+activityId),()=>assert.fail()),/postponed/);
   assert.equal(registrationAvailability({...activity,postponed_at:null},settings),'');
  }
 }finally{pool.query=query;pool.connect=connect;}
});

test('CSV export keeps actual attendance and its audit separate from registration',()=>{
 const csv=participantExport([{name:'Mei',registration_state:'confirmed',attendance_status:'absent',attendance_recorded_at:'2026-11-26',attendance_recorded_by_name:'RCBC admin'}]);
 for(const field of ['registration_state','attendance_status','attendance_recorded_at','attendance_recorded_by_name','absent','RCBC admin'])assert.ok(csv.includes(field));
});

test('website and external imports keep free auto-confirmation and paid review even above capacity',async()=>{
 const query=pool.query,connect=pool.connect;
 let paid=false,insert;
 const activity={id:activityId,status:'published',published_at:'2026-01-01',content_approval_status:'approved',starts_at:'2099-01-01',capacity:1};
 const existing=[{email:'family@example.com',phone:'0143456789',status:'registered',registration_state:'confirmed'},{email:'family@example.com',phone:'0153456789',status:'registered',registration_state:'confirmed'}];
 pool.query=async(sql)=>({rows:[sql.includes('FROM sessions')?{id:'admin',role:'admin'}:sql.includes('FROM activities')?activity:{activity_id:activityId,enabled:true,website_enabled:true,paid}]});
 pool.connect=async()=>({release(){},async query(sql,args){
  if(sql.includes('SELECT email,phone,status'))return {rows:existing.map(row=>({...row}))};
  if(sql.includes('SELECT paid FROM'))return {rows:[{paid}]};
  if(sql.includes('INSERT INTO participant_imports'))return {rows:[{id:'import'}]};
  if(sql.includes('INSERT INTO event_participants')){insert={sql,args};return {rows:[],rowCount:1};}
  return {rows:[],rowCount:1};
 }});
 try{
  for(paid of [false,true])for(const source of ['website','import']){
   insert=null;let result;
   const values={name:'Mei',email:'family@example.com',phone:'0123456789',notes:'An accessible seat please'};
   const handler=source==='website'?eventRegistrationHandler:participantsHandler;
   const path=source==='website'?'/api/public/event-registration':'/api/admin/participants';
   await handler(request('POST',source==='website'?{...values,consent:true,attendance_status:'attended',registration_state:'confirmed',payment_verified_at:'forged'}:{action:'import',rows:[values]},source==='import'),{},new URL('http://localhost'+path+'?activity='+activityId),(_res,status,data)=>{result={status,data};});
   assert.equal(result.status,200);
   assert.ok(insert,'Capacity warning must not block an insert');
   assert.doesNotMatch(insert.sql,/attendance_status|payment_verified_at/);
   assert.ok(insert.args.includes(paid?'submitted':'confirmed'));
   assert.equal(insert.args.at(-1),!paid,'Only free submissions receive an automatic confirmation timestamp');
   assert.ok(insert.args.includes(values.notes));
   if(source==='website')assert.equal(result.data.confirmed,!paid);
   else assert.equal(result.data.added,1);
  }
 }finally{pool.query=query;pool.connect=connect;}
});
