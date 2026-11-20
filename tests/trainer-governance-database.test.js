import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {Readable} from 'node:stream';
import pg from 'pg';
import {pool} from '../server/db.js';
import {digest} from '../server/auth.js';
import {portalHandler} from '../server/portal.js';





test('trainer governance: private drafts, independent approvals, consent, teaching restrictions and individual hours',{skip:!process.env.TEST_DATABASE_URL},async()=>{
 const root=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});
 const schema='trainer_test_'+randomUUID().replaceAll('-','');
 await root.query('CREATE SCHEMA '+schema);
 const connection=new URL(process.env.TEST_DATABASE_URL);connection.searchParams.set('options','-c search_path='+schema+',public');
 const db=new pg.Pool({connectionString:connection.toString()});
 const oldQuery=pool.query,oldConnect=pool.connect;
 try{
  const script=await readFile(new URL('../scripts/migrate.js',import.meta.url),'utf8');
  for(const match of script.matchAll(/'(\d{3}_[^']+\.sql)'/g))await db.query(await readFile(new URL('../database/'+match[1],import.meta.url),'utf8'));
  pool.query=db.query.bind(db);pool.connect=db.connect.bind(db);
  const admin=randomUUID(),token='trainer-governance-admin';
  await db.query("INSERT INTO users(id,name,email,password_hash,role) VALUES($1,'Admin','governance-admin@example.test','unused','admin')",[admin]);
  await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest(token),admin]);
  async function call(data=null,credential=token,path='/api/portal/actions'){
   const req=Readable.from(data?[JSON.stringify(data)]:[]);req.method=data?'POST':'GET';req.headers=credential?{cookie:'rcbc_session='+credential}:{};req.socket={remoteAddress:'governance-integration'};
   let result;await portalHandler(req,{},new URL('http://localhost'+path),(_r,status,body)=>{result={status,body};});return result;
  }
  async function values(id){
   const p=(await db.query('SELECT p.*,u.name FROM trainer_profiles p JOIN users u ON u.id=p.id WHERE p.id=$1',[id])).rows[0];
   return {...p,listing_consent:!!p.listing_consent_at,account_email:'',initial_password:'',certificateEvidenceUrl:p.certificate_file_id?'/api/files/'+p.certificate_file_id:'',comment:'Verified against RCBC records'};
  }
  async function save(id,patch={}){
   return call({type:'ADMIN_TRAINER_SAVE',id,values:{...await values(id),...patch}});
  }
  await call({type:'ADMIN_TRAINER_CREATE',name:'Non HCP person',email:'nonhcp@example.test',password:'Initial-password-123!'});
  const id=(await db.query("SELECT id FROM users WHERE email='nonhcp@example.test'")).rows[0].id;
  assert.equal((await db.query('SELECT teaching_allowed FROM trainer_profiles WHERE id=$1',[id])).rows[0].teaching_allowed,false);
  await save(id,{healthcare_professional:false,assessment_status:'independent',city:'Kuching',short_profile:'Original approved biography',certified_status:'certified',certificate_ref:'GOV-1',listing_consent:true,listing_consent_at:'2026-01-01',listing_status:'approved',approveProfile:true});
  let pub=(await call(null,null,'/api/trainers')).body;
  assert.equal(pub.length,1);assert.equal(pub[0].teaching_allowed,false);assert.equal(pub[0].contact_email,null);
  assert.equal((await db.query('SELECT * FROM approved_trainer_accounts WHERE id=$1',[id])).rowCount,0,'Public listing does not grant account access');
  await save(id,{portal_access_enabled:true,contact_email:'public@example.test',email_consent:true,publish_email:true,approveProfile:true});
  const trainerToken='governance-trainer';
  await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest(trainerToken),id]);
  await call({type:'PROFILE_SAVE',values:{city:'Kuching',language:'English',shortProfile:'Pending changed biography',qualifications:'Qualification',experience:'Experience',contactEmail:'updated@example.test',contactPhone:'0123456789'}},trainerToken);
  pub=(await call(null,null,'/api/trainers')).body;assert.equal(pub[0].short_profile,'Original approved biography');assert.equal(pub[0].contact_email,'public@example.test');
  await call({type:'ADMIN_REVIEW',target:'profile',id,decision:'returned',comment:'Please clarify biography'});
  assert.equal((await call(null,null,'/api/trainers')).body[0].short_profile,'Original approved biography');
  await call({type:'PROFILE_SAVE',values:{city:'Kuching',language:'English',shortProfile:'Reviewed biography',qualifications:'Qualification',experience:'Experience',contactEmail:'updated@example.test'}},trainerToken);
  await call({type:'ADMIN_REVIEW',target:'profile',id,decision:'approved'});
  assert.equal((await call(null,null,'/api/trainers')).body[0].short_profile,'Reviewed biography');
  await assert.rejects(save(id,{phone_consent:false,publish_phone:true}),/consent/);
  const stale=await values(id);await save(id,{email_consent:false,publish_email:false});
  assert.equal((await call(null,null,'/api/trainers')).body[0].contact_email,null);
  await assert.rejects(call({type:'ADMIN_TRAINER_SAVE',id,values:stale}),/changed/);
  await assert.rejects(call({type:'ADMIN_TRAINER_SAVE',id,values:stale},trainerToken),e=>e.status===403);
  const activity={id:randomUUID(),title:'Workshop',date:'2099-01-01T10:00',type:'Workshop',mode:'Physical',venue:'Hall',city:'Kuching',language:'English',audience:'Families',description:'Education',plannedHours:6,registrationType:'free',registrationMethod:'closed',trainers:[{trainerId:id,role:'Trainer'}]};
  await assert.rejects(call({type:'ACTIVITY_SAVE',activity}),/not approved/);
  await save(id,{teaching_allowed:true,teaching_permissions:[{scope:'Workshop',modules:['Communication']}]});
  await assert.rejects(call({type:'ACTIVITY_SAVE',activity}),/not approved/);
  activity.teachingModule='Communication';
  await call({type:'ACTIVITY_SAVE',activity});
  const second=randomUUID();
  await db.query("INSERT INTO users(id,name,email,password_hash,role) VALUES($1,'Second trainer','second-governance@example.test','unused','trainer')",[second]);
  await db.query("INSERT INTO trainer_profiles(id,healthcare_professional,certified_status,teaching_allowed,teaching_permissions) VALUES($1,true,'certified',true,'[{\"scope\":\"Workshop\",\"modules\":[]}]')",[second]);
  await db.query("INSERT INTO activity_trainers(activity_id,trainer_id,role) VALUES($1,$2,'Co-Trainer')",[activity.id,second]);
  await db.query("UPDATE activities SET starts_at='2026-01-01',status='published',published_at=now() WHERE id=$1",[activity.id]);
  await assert.rejects(call({type:'COMPLETION_SAVE',id:activity.id,values:{venue:'Hall',participants:10,hours:6,trainerHours:{[id]:2}}}),/every assigned trainer/);
  await call({type:'COMPLETION_SAVE',id:activity.id,values:{venue:'Hall',participants:10,hours:6,trainerHours:{[id]:2,[second]:4}}});
  assert.equal((await db.query('SELECT * FROM annual_trainer_contributions')).rowCount,0);
  await call({type:'ADMIN_REVIEW',target:'completion',id:activity.id,decision:'verified'});
  const totals=(await db.query('SELECT trainer_id,hours FROM annual_trainer_contributions')).rows;
  assert.equal(Number(totals.find(p=>p.trainer_id===id).hours),2);assert.equal(Number(totals.find(p=>p.trainer_id===second).hours),4);
  activity.date='2026-01-01T10:00';activity.trainers.push({trainerId:second,role:'Co-Trainer'});
  await call({type:'ACTIVITY_SAVE',activity});
  assert.equal(Number((await db.query('SELECT actual_hours FROM activity_trainers WHERE activity_id=$1 AND trainer_id=$2',[activity.id,second])).rows[0].actual_hours),4,'Editing an event preserves individual verified hours');
  await assert.rejects(call({type:'ACTIVITY_SAVE',activity:{...activity,trainers:[{trainerId:id,role:'Trainer'}]}}),/locked/);
  await save(id,{portal_access_enabled:false});assert.equal((await db.query('SELECT * FROM sessions WHERE user_id=$1',[id])).rowCount,0);
  assert.equal((await call(null,null,'/api/trainers')).body.length,1,'Turning off portal access does not unpublish');
  await save(id,{listing_status:'suspended'});assert.equal((await call(null,null,'/api/trainers')).body.length,0);

  await save(id,{listing_status:'approved',portal_access_enabled:true,approveProfile:true});
  await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest(trainerToken),id]);
  const before=await values(id);
  await assert.rejects(call({type:'ADMIN_TRAINER_ARCHIVE',id,revision:before.revision},trainerToken),e=>e.status===403);
  await assert.rejects(call({type:'ADMIN_TRAINER_ARCHIVE',id,revision:before.revision-1}),e=>e.status===409);
  await call({type:'ADMIN_TRAINER_ARCHIVE',id,revision:before.revision,reason:'No longer active'});
  const archived=await values(id);
  assert.ok(archived.archived_at);
  assert.equal(archived.archive_reason,'No longer active');
  for(const field of ['teaching_allowed','portal_access_enabled','publish_email','publish_phone'])assert.equal(archived[field],false);
  assert.equal(archived.certificate_ref,before.certificate_ref);
  assert.deepEqual(archived.approved_snapshot,before.approved_snapshot);
  assert.deepEqual(archived.teaching_permissions,before.teaching_permissions);
  assert.equal((await db.query('SELECT enabled FROM users WHERE id=$1',[id])).rows[0].enabled,false);
  assert.equal((await db.query('SELECT * FROM sessions WHERE user_id=$1',[id])).rowCount,0);
  assert.equal((await db.query('SELECT * FROM approved_trainer_accounts WHERE id=$1',[id])).rowCount,0);
  assert.equal((await call(null,null,'/api/trainers')).body.length,0);
  await assert.rejects(save(id,{teaching_allowed:true}),/Restore/);
  await assert.rejects(db.query('UPDATE trainer_profiles SET teaching_allowed=true WHERE id=$1',[id]),/archived_trainer_inactive/);
  assert.equal(Number((await db.query('SELECT actual_hours FROM activity_trainers WHERE activity_id=$1 AND trainer_id=$2',[activity.id,id])).rows[0].actual_hours),2);
  await call({type:'ADMIN_TRAINER_RESTORE',id,revision:archived.revision});
  const restored=await values(id);
  assert.equal(restored.archived_at,null);
  assert.equal(restored.listing_status,'none');
  assert.equal(restored.teaching_allowed,false);
  assert.equal(restored.portal_access_enabled,false);
  assert.equal(restored.certificate_ref,before.certificate_ref);
  assert.equal((await call(null,null,'/api/trainers')).body.length,0);
  await assert.rejects(call({type:'ADMIN_TRAINER_RESTORE',id,revision:restored.revision}),e=>e.status===409);
 }finally{pool.query=oldQuery;pool.connect=oldConnect;await db.end();await root.query('DROP SCHEMA '+schema+' CASCADE');await root.end();}
});
