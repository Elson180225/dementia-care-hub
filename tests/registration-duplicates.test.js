import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {normaliseEmail,normalisePhone,registrationDuplicates} from '../shared/registration-duplicates.js';
import {validateParticipants} from '../shared/participants.js';
import {eventRegistrationHandler} from '../server/event-registration.js';
import {pool} from '../server/db.js';

test('contact comparisons normalize Malaysian formats and ignore blank numbers',()=>{
 assert.equal(normaliseEmail(' MEI@Example.com '),'mei@example.com');
 for(const value of ['012-345 6789','+60 12 3456789','0060123456789'])assert.equal(normalisePhone(value),'60123456789');
 assert.equal(normalisePhone('+44 123456789'),'44123456789');
 assert.equal(registrationDuplicates({email:'new@example.com',phone:''},[{email:'old@example.com',phone:''}]).phone,undefined);
});
test('import preview excludes existing emails and History and warns on shared numbers within file',()=>{
 const existing=[{email:'MEI@example.com',phone:'+60123456789',status:'cancelled'}];
 const rows=validateParticipants([{name:'Mei',email:'mei@example.com',phone:'0123456789'},{name:'Tan',email:'tan@example.com',phone:'0123456789'},{name:'Lin',email:'lin@example.com',phone:'0060123456789'}],existing);
 assert.match(rows[0].error,/History/);
 assert.equal(rows[1].error,'');assert.match(rows[1].warning,/Shared/);
 assert.match(rows[2].warning,/Shared/);
 assert.equal(existing.length,1);
});
test('website rejects existing emails, challenges shared phones, and leaves original states untouched',async()=>{
 const originalQuery=pool.query,originalConnect=pool.connect;
 const intake='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
 const existing={activity_id:intake,email:'MEI@example.com',phone:'+60123456789',status:'cancelled',payment_verified_at:'retained',registration_state:'confirmed'};
 const rows=[existing];let locks=0;
 pool.query=async(sql,args)=>{
  if(sql.includes('SELECT * FROM activities'))return {rows:[{id:args[0],title:'Test intake',starts_at:'2099-01-01T00:00:00Z',published_at:'2026-01-01',status:'published'}]};
  if(sql.includes('SELECT * FROM event_registration_settings'))return {rows:[{activity_id:args[0],enabled:true,website_enabled:true,ask_phone:true,paid:true}]};
  throw Error('Unexpected pool query');
 };
 pool.connect=async()=>({release(){},async query(sql,args){
  if(sql.includes('FOR UPDATE')){locks++;return {rows:[]};}
  if(sql.startsWith('SELECT email'))return {rows:rows.filter(r=>r.activity_id===args[0])};
  if(sql.startsWith('INSERT INTO event_participants')){rows.push({activity_id:args[0],name:args[1],email:args[2],phone:args[3],registration_state:'submitted'});return {rowCount:1,rows:[{id:'new'}]};}
  return {rows:[]};
 }});
 async function submit(patch={},id=intake){
  const req=Readable.from([JSON.stringify({name:'Mei',email:'mei@example.com',phone:'0123456789',consent:true,...patch})]);
  req.method='POST';req.headers={};req.socket={remoteAddress:'duplicate-test'};
  let result;
  await eventRegistrationHandler(req,{},new URL('http://localhost/api/public/event-registration?activity='+id),(_res,status,body)=>{result={status,body};});
  return result;
 }
 try{
  const duplicate=await submit();
  assert.equal(duplicate.status,409);assert.equal(duplicate.body.code,'duplicate-registration');
  assert.doesNotMatch(JSON.stringify(duplicate.body),/MEI@|payment_verified_at|registration_state|cancelled/);
  const phone=await submit({email:'new@example.com'});
  assert.equal(phone.status,409);assert.equal(phone.body.code,'shared-phone');assert.equal(rows.length,1);
  assert.equal((await submit({email:'new@example.com',acknowledgeSharedPhone:true})).status,200);
  assert.equal(rows[1].registration_state,'submitted');
  assert.equal((await submit({},other)).status,200);
  assert.equal(existing.status,'cancelled');assert.equal(existing.payment_verified_at,'retained');assert.equal(existing.registration_state,'confirmed');
  assert.equal(locks,4);
 }finally{pool.query=originalQuery;pool.connect=originalConnect;}
});
