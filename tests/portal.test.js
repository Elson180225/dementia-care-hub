import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { digest, hashPassword, checkPassword } from '../server/auth.js';
import { recordTypes } from '../shared/admin-records.js';

test('passwords use salted hashes',()=>{
 const a=hashPassword('a long test password');
 assert.notEqual(a,hashPassword('a long test password'));
 assert.ok(checkPassword('a long test password',a));
 assert.ok(!checkPassword('wrong',a));
});

test('PostgreSQL portal and administrative workflows',{skip:!process.env.TEST_DATABASE_URL},async()=>{
 const root=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});
 const schema='test_'+randomUUID().replaceAll('-','');await root.query(`CREATE SCHEMA ${schema}`);
 const connection=new URL(process.env.TEST_DATABASE_URL);connection.searchParams.set('options',`-c search_path=${schema},public`);
 const db=new pg.Pool({connectionString:connection.toString()});let server;
 try {
  for(const name of ['001_shared_records.sql','003_admin_auth.sql','004_record_details.sql','005_admin_workflow.sql','006_portal_operations.sql','007_content_feedback.sql','008_idle_sessions.sql']) await db.query(await readFile(new URL('../database/'+name,import.meta.url),'utf8'));
  server=spawn(process.execPath,['server/index.js'],{env:{...process.env,DATABASE_URL:connection.toString(),API_PORT:'3098'},stdio:['ignore','pipe','pipe']});
  let serverErrors='';server.stderr.on('data',d=>{serverErrors+=d;});
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',()=>reject(new Error('Test API exited: '+serverErrors)));});
  async function request(path,data,cookie='',method) {
   const r=await fetch('http://127.0.0.1:3098/api/'+path,{headers:{'Content-Type':'application/json',cookie},...(data?{method:method || 'POST',body:JSON.stringify(data)}:{})});
   return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
  }
  function ok(result,status=200){assert.equal(result.status,status,JSON.stringify(result.data));return result;}
  const credentials={name:'Test Trainer',email:'trainer@test.example',password:'a sufficiently long password',city:'Bintulu',certificateRef:'CLAIM-1'};
  ok(await request('auth/register',credentials),201);ok(await request('auth/register',credentials),409);
  ok(await request('auth/login',credentials),403);
  ok(await request('auth/admin-register',{...credentials,email:'admin@test.example'}),403);
  await db.query('INSERT INTO admin_invitations(token_hash,email) VALUES($1,$2)',[digest('test-invite'),'admin@test.example']);
  const adminData={...credentials,email:'admin@test.example',invitation:'test-invite'};
  ok(await request('auth/admin-register',adminData),201);ok(await request('auth/admin-register',adminData),403);
  const admin=ok(await request('auth/login',{...adminData,role:'admin'}));
  const action=(data,cookie=admin.cookie)=>request('portal/actions',data,cookie);
  const pending=ok(await request('auth/application',credentials)).data.application;
  ok(await action({type:'ADMIN_REVIEW',target:'access',id:pending.id,decision:'returned',comment:'Confirm the reference'}));
  assert.equal(ok(await request('auth/application',credentials)).data.application.status,'returned');
  ok(await request('auth/resubmit',{...credentials,certificateRef:'CLAIM-CORRECTED'}));
  ok(await action({type:'ADMIN_REVIEW',target:'access',id:pending.id,decision:'approved',certificateRef:'OFFICIAL-1'}));
  const trainer=ok(await request('auth/login',{...credentials,role:'trainer'}));const trainerId=trainer.data.user.id;
  ok(await request('portal'),401);ok(await request('admin/records/faqs',null,trainer.cookie),403);
  ok(await action({type:'ADMIN_REVIEW',target:'access',id:pending.id,decision:'rejected',comment:'test'},trainer.cookie),403);
  const profile={city:'Bintulu',language:'English',shortProfile:'Test profile',qualifications:'Test qualification',experience:'Test experience'};
  ok(await action({type:'PROFILE_SAVE',values:profile},trainer.cookie));
  async function upload(kind,data,cookie=trainer.cookie) {
   const r=await fetch('http://127.0.0.1:3098/api/uploads?kind='+kind,{method:'POST',headers:{cookie,'X-File-Name':'test-file'},body:data});return {status:r.status,data:await r.json()};
  }
  const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=','base64');
  const photo=ok(await upload('photo',image),201).data.url;
  const document=ok(await upload('document',Buffer.from('%PDF-1.4 test')),201).data.url;
  assert.equal((await fetch('http://127.0.0.1:3098'+document)).status,403);
  ok(await upload('photo',Buffer.from('<svg>bad</svg>')),400);
  ok(await action({type:'PROFILE_SUBMIT',values:{...profile,photoUrl:photo,supportingDocuments:[document],certified_status:'suspended'}},trainer.cookie));
  ok(await action({type:'PROFILE_SAVE',values:profile},trainer.cookie),409);
  ok(await action({type:'ADMIN_REVIEW',target:'profile',id:trainerId,decision:'approved'}));
  assert.equal(ok(await request('trainers')).data.length,1);
  assert.equal((await fetch('http://127.0.0.1:3098'+photo)).status,200);
  assert.equal((await fetch('http://127.0.0.1:3098'+document)).status,403);
  const second={...credentials,name:'Second Trainer',email:'second@test.example'};ok(await request('auth/register',second),201);
  const secondRequest=ok(await request('auth/application',second)).data.application;
  ok(await action({type:'ADMIN_REVIEW',target:'access',id:secondRequest.id,decision:'approved',certificateRef:'OFFICIAL-2'}));
  const secondLogin=ok(await request('auth/login',second));const secondId=secondLogin.data.user.id;
  ok(await action({type:'PROFILE_SAVE',values:{...profile,photoUrl:photo}},secondLogin.cookie),403);
  const activity={id:randomUUID(),title:'Test workshop',date:'2026-01-01T10:00',type:'Workshop',mode:'Online',venue:'Online',language:'English',audience:'Caregivers',description:'Practical learning',plannedHours:3,trainers:[{trainerId,role:'Trainer'},{trainerId:secondId,role:'Co-Trainer'}]};
  ok(await action({type:'ACTIVITY_SAVE',activity},trainer.cookie));
  ok(await action({type:'ACTIVITY_SAVE',activity},secondLogin.cookie),403);
  ok(await action({type:'ACTIVITY_SUBMIT',id:activity.id},trainer.cookie));
  ok(await action({type:'ACTIVITY_SAVE',activity},trainer.cookie),409);
  ok(await action({type:'ADMIN_REVIEW',target:'activity',id:activity.id,decision:'published'}),409);
  ok(await action({type:'ADMIN_REVIEW',target:'activity',id:activity.id,decision:'approved'}));
  assert.equal(ok(await request('activities')).data.length,0);
  ok(await action({type:'ADMIN_REVIEW',target:'activity',id:activity.id,decision:'published'}));
  ok(await action({type:'COMPLETION_SAVE',id:activity.id,values:{venue:'Online',hours:2,participants:12}},trainer.cookie));
  assert.equal((await db.query('SELECT * FROM annual_trainer_contributions')).rowCount,0);
  ok(await action({type:'ADMIN_REVIEW',target:'completion',id:activity.id,decision:'returned',comment:'Add photo evidence'}));
  const completionPhoto=ok(await upload('activity-photo',image),201).data.url;
  ok(await action({type:'COMPLETION_SAVE',id:activity.id,values:{venue:'Online',hours:2,participants:12,photos:[completionPhoto]}},trainer.cookie));
  ok(await action({type:'ADMIN_REVIEW',target:'completion',id:activity.id,decision:'approved'}));
  ok(await action({type:'ADMIN_REVIEW',target:'activity',id:activity.id,decision:'archived'}));
  const totals=(await db.query('SELECT * FROM annual_trainer_contributions')).rows;
  assert.equal(totals.length,2);assert.equal(Number(totals[0].hours),2);assert.equal(Number(totals[1].participants),12);
  assert.equal(Number((await db.query('SELECT * FROM annual_project_reach')).rows[0].participants),12);
  const adminEvent={...activity,id:randomUUID(),title:'RCBC webinar',type:'RCBC Webinar',trainers:[],date:'2026-02-01T10:00'};
  ok(await action({type:'ACTIVITY_SAVE',activity:adminEvent}));ok(await action({type:'ACTIVITY_SUBMIT',id:adminEvent.id}));
  ok(await action({type:'ADMIN_REVIEW',target:'activity',id:adminEvent.id,decision:'approved'}));
  ok(await action({type:'ADMIN_REVIEW',target:'activity',id:adminEvent.id,decision:'published'}));
  ok(await action({type:'ACTIVITY_SAVE',activity:{...adminEvent,date:'2026-02-02T10:00'}}));
  ok(await action({type:'ADMIN_REVIEW',target:'activity',id:adminEvent.id,decision:'cancelled',comment:'Venue unavailable'}));
  ok(await action({type:'ADMIN_REVIEW',target:'activity',id:adminEvent.id,decision:'archived'}));
  const review={language:'English',source:'RCBC verified source',source_url:'',last_reviewed_at:'2026-10-18T10:00',next_review_at:'',review_status:'current',publication_status:'published',admin_comment:''};
  const faq={slug:'test-faq',question:'Test question',answer:'Test answer',category:'General',...review};
  const faqId=ok(await request('admin/records/faqs',{values:faq},admin.cookie)).data.id;
  assert.equal(ok(await request('public/faqs')).data.length,1);
  ok(await request('admin/records/faqs',{id:faqId,values:{...faq,publication_status:'unpublished'}},admin.cookie));
  assert.equal(ok(await request('public/faqs')).data.length,0);
  function record(kind,overrides={}) {
   const values={};for(const [name,,type] of recordTypes[kind].fields) values[name]=type==='array'?[]:type==='checkbox'?false:Array.isArray(type)?type[0]:name==='language'?'English':'';
   return {...values,...review,...overrides};
  }
  const organisation=record('organisations',{name:'Test facility',services:['Support'],category:'services'});
  const orgId=ok(await request('admin/records/organisations',{values:organisation},admin.cookie)).data.id;
  assert.equal(ok(await request('public/organisations?category=services')).data.length,1);
  ok(await request('admin/records/organisations',{id:orgId,values:{...organisation,review_status:'archived'}},admin.cookie));
  assert.equal(ok(await request('public/organisations')).data.length,0);
  const resource=record('learning_resources',{title:'Test guide',url:'https://example.org/guide',copyright_permission:'RCBC permission recorded'});
  const resourceId=ok(await request('admin/records/learning_resources',{values:resource},admin.cookie)).data.id;
  assert.equal(ok(await request('public/learning_resources')).data.length,1);
  ok(await request('admin/records/learning_resources',{id:resourceId,values:{...resource,publication_status:'unpublished'}},admin.cookie));
  assert.equal(ok(await request('public/learning_resources')).data.length,0);
  ok(await request('admin/records/content_pages',{values:record('content_pages',{slug:'home',title:'Project note',body:'Plain text update'})},admin.cookie));
  assert.equal(ok(await request('public/content_pages')).data[0].body.text,'Plain text update');
  const enquiry={id:randomUUID(),name:'Visitor',email:'visitor@test.example',type:'Collaboration',message:'Please contact me about the project.',website:'',startedAt:Date.now()-3000};
  ok(await request('enquiries',enquiry));ok(await request('enquiries',enquiry));
  const enquiries=ok(await request('admin/records/enquiries',null,admin.cookie)).data;assert.equal(enquiries.length,1);
  ok(await request('admin/records/enquiries',{id:enquiries[0].id,values:{status:'closed',admin_comment:'Followed up internally'}},admin.cookie));
  assert.equal((await db.query('SELECT status FROM enquiries')).rows[0].status,'closed');
  ok(await request('admin/records/faqs',{id:faqId,remove:true},admin.cookie),400);
  ok(await request('admin/records/faqs',{id:faqId,values:{...faq,review_status:'archived'}},admin.cookie));
  assert.equal(ok(await request('public/faqs')).data.length,0);
  const subscriber=ok(await request('public/subscribe',{name:'Subscriber',email:'subscriber@test.example',city:'Bintulu',state:'Sarawak',language:'English',consent:true}));
  assert.ok(subscriber.data.unsubscribeLink);
  ok(await request('public/unsubscribe',{token:subscriber.data.unsubscribeLink.split('=')[1]}));
  assert.ok((await db.query('SELECT unsubscribed_at FROM subscribers')).rows[0].unsubscribed_at);
  ok(await request('public/subscribe',{email:'bad'}),400);
  ok(await request('admin/records/dcs_certificates',{values:{certificate_ref:'DCS-1',recipient_name:'Recipient',programme:'DCS-Family',issuer:'RCBC',issued_at:'2026-01-01',completion_date:'2026-01-01',training_location:'Bintulu',activity_id:'',status:'valid',verification_consent_at:'2026-01-01T12:00',admin_comment:''}},admin.cookie));
  assert.equal(ok(await request('public/verify-certificate',{name:'Recipient',certificateRef:'DCS-1'})).data.certificate.status,'valid');
  assert.equal(ok(await request('public/verify-certificate',{name:'Wrong name',certificateRef:'DCS-1'})).data.certificate,null);
  ok(await request('admin/users',{id:trainerId,enabled:false,certifiedStatus:'certified',certificateRef:'OFFICIAL-1'},admin.cookie));
  ok(await request('portal',null,trainer.cookie),401);
  ok(await request('admin/users',{id:admin.data.user.id,enabled:false},admin.cookie),400);
  assert.ok((await db.query("SELECT * FROM audit_log WHERE operation='DECISION' AND decision='verified' AND actor_id=$1",[admin.data.user.id])).rowCount);
  assert.ok(!(await db.query("SELECT * FROM audit_log WHERE after_data ? 'password_hash'")).rowCount);
  ok(await request('auth/logout',{},admin.cookie));ok(await request('portal',null,admin.cookie),401);
  for(const login of [second,adminData]) {
   const active=ok(await request('auth/login',login));
   const hash=digest(active.cookie.split('=')[1]);
   await db.query("UPDATE sessions SET expires_at=now()+interval '30 seconds' WHERE token_hash=$1",[hash]);
   ok(await request('auth/activity',{idleMs:0},active.cookie));
   const remaining=Number((await db.query('SELECT extract(epoch FROM expires_at-now()) AS seconds FROM sessions WHERE token_hash=$1',[hash])).rows[0].seconds);
   assert.ok(remaining>295 && remaining<=300);
   await db.query("UPDATE sessions SET expires_at=now()+interval '20 seconds' WHERE token_hash=$1",[hash]);
   ok(await request('auth/me',null,active.cookie));
   assert.ok(Number((await db.query('SELECT extract(epoch FROM expires_at-now()) AS seconds FROM sessions WHERE token_hash=$1',[hash])).rows[0].seconds)<=20);
   await db.query("UPDATE sessions SET expires_at=now()-interval '1 second' WHERE token_hash=$1",[hash]);
   assert.equal(ok(await request('auth/me',null,active.cookie)).data.user,null);
   ok(await request('portal',null,active.cookie),401);
   ok(await request('auth/activity',{idleMs:0},active.cookie),401);
  }
  assert.equal(serverErrors,'');
 }finally{server?.kill();await db.end();await root.query(`DROP SCHEMA ${schema} CASCADE`);await root.end();}
});
