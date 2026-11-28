import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import pg from 'pg';
import {pool} from '../server/db.js';
import {getLearnEventsData,saveLearnEventsData} from '../server/learn-events-content.js';
import {exportContent,importContent} from '../scripts/transfer-preview-content.js';

test('deployment content persists, repairs skipped seeds, excludes tests and transfers approvals safely',{skip:!process.env.TEST_DATABASE_URL},async()=>{
 const root=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});
 const names=[0,1].map(()=> 'content_test_'+randomUUID().replaceAll('-',''));
 const clients=[],dir=await mkdtemp(join(tmpdir(),'preview-content-'));
 const originalQuery=pool.query,originalConnect=pool.connect;
 try{
  const migrations=[...(await readFile(new URL('../scripts/migrate.js',import.meta.url),'utf8')).matchAll(/'(\d{3}_[^']+\.sql)'/g)].map(m=>m[1]);
  for(const name of names){
   await root.query('CREATE SCHEMA '+name);
   const url=new URL(process.env.TEST_DATABASE_URL);url.searchParams.set('options','-c search_path='+name+',public');
   const db=new pg.Pool({connectionString:url.toString()});clients.push(db);
   for(const f of migrations)await db.query(await readFile(new URL('../database/'+f,import.meta.url),'utf8'));
  }
  const [source,target]=clients,admin=randomUUID(),targetAdmin=randomUUID();
  for(const [db,id]of [[source,admin],[target,targetAdmin]])await db.query("INSERT INTO users(id,email,name,password_hash,role) VALUES($1,'preview-admin@example.test','Admin','unused','admin')",[id]);
  assert.equal(Number((await source.query('SELECT count(*) FROM activities')).rows[0].count),0);
  await source.query('SELECT seed_historical_webinars()');await source.query('SELECT seed_historical_webinars()');
  assert.equal(Number((await source.query('SELECT count(*) FROM activities')).rows[0].count),12);
  await source.query("UPDATE activities SET title='Admin corrected webinar' WHERE id='a0000001-0000-0000-0000-000000000001'");
  await source.query('SELECT seed_historical_webinars()');
  assert.equal((await source.query("SELECT title FROM activities WHERE id='a0000001-0000-0000-0000-000000000001'")).rows[0].title,'Admin corrected webinar');
  pool.query=source.query.bind(source);pool.connect=source.connect.bind(source);
  const content=await getLearnEventsData();
  assert.equal(content.physicalEducation.programmes.length,3);
  assert.equal(content.events.communityOutreach.pillars.length,0);
  content.events.communityOutreach.intro='Persistent edited content';
  const saved=await saveLearnEventsData(content,admin);
  assert.equal(saved._revision,2);
  assert.equal((await getLearnEventsData()).events.communityOutreach.intro,'Persistent edited content');
  await assert.rejects(saveLearnEventsData(content,admin),e=>e.status===409);
  assert.equal(Number((await source.query('SELECT count(*) FROM learn_events_content_history')).rows[0].count),1);
  const testId=randomUUID();
  await source.query("INSERT INTO activities(id,created_by,title,starts_at,type,mode,language,audience,description,planned_hours,status,published_at) VALUES($1,$2,'Testing 1',now(),'Workshop','Online','English','Test','Test',1,'published',now())",[testId,admin]);
  await source.query("INSERT INTO translation_entries(source_key,language,source_text,translated_text,review_type,status,edited_by,approved_by,approved_at) VALUES('ui/header/search','ms','Search','Cari','standard','approved',$1,$1,now()),($2,'ms','Testing 1','Ujian','standard','approved',$1,$1,now())",[admin,'activities/'+testId+'/title']);
  const fileId=randomUUID();
  await source.query("INSERT INTO files(id,owner_id,kind,name,mime,data) VALUES($1,$2,'poster','historical.png','image/png',$3)",[fileId,admin,Buffer.from([1,2,3])]);
  await source.query("UPDATE activities SET poster_url=$1 WHERE id='a0000001-0000-0000-0000-000000000001'",['/api/files/'+fileId]);
  await source.query("INSERT INTO event_registration_settings(activity_id,paid,enabled) VALUES('a0000001-0000-0000-0000-000000000001',false,false)");
  await source.query(`WITH provider AS (
   INSERT INTO organisations(name,category,publication_status,review_status,status,last_reviewed_at)
   VALUES('Genuine provider','Community-led','published','current','published',now()) RETURNING id
  ) INSERT INTO directory_services(organisation_id,category,service_type,publication_status,review_status,last_reviewed_at)
    SELECT id,'services','Support','published','current',now() FROM provider`);
  const historicalId='a0000001-0000-0000-0000-000000000001',proofId=randomUUID(),participantId=randomUUID();
  await source.query("UPDATE activities SET registration_link='https://example.test/unverified-form' WHERE id=$1",[historicalId]);
  await source.query("UPDATE event_registration_settings SET enabled=true,paid=true,fee='RM 999',instructions='TEST BANK INSTRUCTIONS',google_url='https://example.test/unverified-form',website_enabled=false WHERE activity_id=$1",[historicalId]);
  await source.query("INSERT INTO files(id,owner_id,kind,name,mime,data) VALUES($1,$2,'payment-evidence','test-payment.pdf','application/pdf',$3)",[proofId,admin,Buffer.from('%PDF-private-test-proof')]);
  await source.query("INSERT INTO event_participants(id,activity_id,name,email,phone,notes,payment_evidence_file_id) VALUES($1,$2,'Test participant','private-participant@example.test','0123456789','Private participant question',$3)",[participantId,historicalId,proofId]);
  await source.query("INSERT INTO event_confirmation_deliveries(participant_id,status,attempted_by) VALUES($1,'sent',$2)",[participantId,admin]);
  await source.query("INSERT INTO participant_reminders(participant_id,subject,message,created_by,status) VALUES($1,'Private test reminder','Private reminder content',$2,'sent')",[participantId,admin]);
  await source.query("INSERT INTO participant_imports(activity_id,filename,imported_by,added,skipped) VALUES($1,'private-test.csv',$2,1,0)",[historicalId,admin]);
  await source.query("INSERT INTO translation_entries(source_key,language,source_text,translated_text,review_type,status) VALUES($1,'ms','TEST BANK INSTRUCTIONS','TEST PAYMENT TRANSLATION','standard','draft')",['registration/'+historicalId+'/instructions']);
  const bundle=await exportContent(source);
  assert.equal(bundle.registration.length,0);
  assert.equal(bundle.activities.find(a=>a.id===historicalId).registration_link,null);
  assert.equal(bundle.activities.find(a=>a.id===historicalId).registrationMethod,'closed');
  for(const privateText of ['private-participant@example.test','Private participant question','Private reminder content','TEST BANK INSTRUCTIONS','TEST PAYMENT TRANSLATION','private-test-proof'])assert.equal(JSON.stringify(bundle).includes(privateText),false,privateText);
  assert.equal(bundle.files.length,1);
  // Old bundles cannot reintroduce testing settings, evidence or submissions.
  bundle.registration=(await source.query('SELECT * FROM event_registration_settings')).rows;
  bundle.event_participants=(await source.query('SELECT * FROM event_participants')).rows;
  bundle.files.push({id:proofId,kind:'payment-evidence',name:'test-payment.pdf',mime:'application/pdf',data:Buffer.from('%PDF-private-test-proof').toString('base64')});
  bundle.activities.find(a=>a.id===historicalId).registration_link='https://example.test/old-test-form';
  assert.equal(bundle.activities.length,12);assert.equal(bundle.excludedEvents.length,1);
  assert.equal(bundle.translations.length,1);
  assert.equal(bundle.files.length,2);
  assert.equal(bundle.records.organisations.length,1,'example organisations are not exported');
  const sourceKeys=Object.keys(bundle.sources).filter(k=>k.startsWith('ui/header/')&&k!=='ui/header/search');
  const reviewKey=sourceKeys[0];
  bundle.translations.push({...bundle.translations[0],source_key:reviewKey,source_text:bundle.sources[reviewKey],approved_by:randomUUID()});
  bundle.translations.push({...bundle.translations[0],language:'zh',source_text:'Old English'});
  const dry=await importContent(target,bundle,{adminEmail:'preview-admin@example.test'});
  assert.equal(dry.translations.approved,1);assert.equal(dry.translations.review,1);assert.equal(dry.translations['needs-review'],1);
  assert.equal(Number((await target.query('SELECT count(*) FROM activities')).rows[0].count),0,'dry run leaves no rows');
  const result=await importContent(target,bundle,{adminEmail:'preview-admin@example.test',apply:true,cmsRevision:1,backupPath:join(dir,'before.local')});
  assert.equal(result.activities,12);assert.equal(result.translations.approved,1);
  assert.deepEqual((await target.query('SELECT data FROM files WHERE id=$1',[fileId])).rows[0].data,Buffer.from([1,2,3]));
  assert.equal(result.records,2);assert.equal(result.files,1);
  assert.equal(result.eventsWithRegistrationClosed,12);assert.equal(result.registrationsTransferred,0);assert.equal(result.registrationSettingsTransferred,0);
  assert.equal((await target.query('SELECT registration_link FROM activities WHERE id=$1',[historicalId])).rows[0].registration_link,null);
  for(const table of ['event_registration_settings','event_participants','event_confirmation_deliveries','participant_reminders','participant_imports'])assert.equal(Number((await target.query('SELECT count(*) FROM '+table)).rows[0].count),0,table);
  assert.equal(Number((await target.query("SELECT count(*) FROM files WHERE kind='payment-evidence'")).rows[0].count),0);
  assert.equal(Number((await source.query('SELECT count(*) FROM event_participants')).rows[0].count),1,'local tests preserved');
  assert.equal((await target.query("SELECT approved_by FROM translation_entries WHERE source_key='ui/header/search'")).rows[0].approved_by,targetAdmin);
  await target.query("INSERT INTO event_registration_settings(activity_id,paid,enabled) VALUES($1,false,true)",[historicalId]);
  await target.query("UPDATE activities SET registration_link='https://example.test/admin-reviewed-form' WHERE id=$1",[historicalId]);
  const rev=(await target.query("SELECT revision FROM learn_events_content WHERE id='main'")).rows[0].revision;
  const again=await importContent(target,bundle,{adminEmail:'preview-admin@example.test',apply:true,cmsRevision:rev,backupPath:join(dir,'second.local')});
  assert.equal((await target.query('SELECT enabled FROM event_registration_settings WHERE activity_id=$1',[historicalId])).rows[0].enabled,true,'reviewed target settings stay unchanged on re-import');
  assert.equal((await target.query('SELECT registration_link FROM activities WHERE id=$1',[historicalId])).rows[0].registration_link,'https://example.test/admin-reviewed-form');
  assert.equal(again.activities,0);assert.equal(again.translations.existing,3);
  assert.equal(Number((await target.query('SELECT count(*) FROM translation_history')).rows[0].count),3);
  assert.equal(Number((await target.query("SELECT count(*) FROM activities WHERE title='Testing 1'")).rows[0].count),0);
 }finally{
  pool.query=originalQuery;pool.connect=originalConnect;
  for(const db of clients)await db.end();
  for(const name of names)await root.query('DROP SCHEMA IF EXISTS '+name+' CASCADE');
  await root.end();await rm(dir,{recursive:true,force:true});
 }
});
