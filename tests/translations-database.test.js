import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {Readable} from 'node:stream';
import pg from 'pg';
import {pool} from '../server/db.js';
import {digest} from '../server/auth.js';
import {translationsHandler} from '../server/translations.js';
import {reuseExistingTranslations} from '../scripts/reuse-translations.js';

test('translation database workflow: drafts, approvals, source changes, permissions and conflicts',{skip:!process.env.TEST_DATABASE_URL},async()=>{
 const root=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});
 const schema='translation_test_'+randomUUID().replaceAll('-','');
 await root.query('CREATE SCHEMA '+schema);
 const connection=new URL(process.env.TEST_DATABASE_URL);connection.searchParams.set('options','-c search_path='+schema+',public');
 const db=new pg.Pool({connectionString:connection.toString()});
 const originalQuery=pool.query,originalConnect=pool.connect;
 try{
  const script=await readFile(new URL('../scripts/migrate.js',import.meta.url),'utf8');
  const files=[...script.matchAll(/'(\d{3}_[^']+\.sql)'/g)].map(m=>m[1]);
  for(const file of files)await db.query(await readFile(new URL('../database/'+file,import.meta.url),'utf8'));
  pool.query=db.query.bind(db);pool.connect=db.connect.bind(db);
  const admin=randomUUID(),expert=randomUUID();
  for(const [id,name,token]of [[admin,'RCBC editor','editor-token'],[expert,'Medical reviewer','expert-token']]){
   await db.query("INSERT INTO users(id,email,password_hash,name,role) VALUES($1,$2,'unused',$3,'admin')",[id,id+'@example.test',name]);
   await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest(token),id]);
  }
  async function call(data=null,token='editor-token',language='ms'){
   const req=Readable.from(data?[JSON.stringify(data)]:[]);req.method=data?'POST':'GET';req.headers=token?{cookie:'rcbc_session='+token}:{};
   let result;await translationsHandler(req,{},new URL(data||token?'http://localhost/api/admin/translations':'http://localhost/api/public/translations?language='+language),(_r,status,body)=>{result={status,body};});return result;
  }
  await assert.rejects(translationsHandler({method:'GET',headers:{}},{},new URL('http://localhost/api/admin/translations'),()=>{}),e=>e.status===401);
  const initial=(await call()).body;
  const item=initial.entries.find(r=>r.key==='ui/header/search'&&r.language==='ms');
  assert.equal(item.status,'missing');
  const payload={key:item.key,language:'ms',source:item.source,revision:0,text:'Cari ujian',reviewType:'standard'};
  await call({...payload,action:'save'});
  assert.equal((await call(null,null)).body.approved[item.key],undefined);
  await call({...payload,revision:1,action:'submit'});
  await call({...payload,revision:2,action:'approve'});
  assert.equal((await call(null,null)).body.approved[item.key].text,'Cari ujian');
  assert.equal((await call(null,null,'zh')).body.approved[item.key],undefined);
  await assert.rejects(call({...payload,revision:1,action:'save'}),e=>e.status===409);
  // A published activity source can change independently of translation approvals.
  const activity=randomUUID();
  await db.query("INSERT INTO activities(id,created_by,title,starts_at,type,mode,venue,language,audience,description,planned_hours,status,published_at) VALUES($1,$2,'English medical topic','2099-01-01','Workshop','Physical','Kuching','English','Families','English description',1,'published',now())",[activity,admin]);
  const key='activities/'+activity+'/title',medical={key,language:'ms',source:'English medical topic',text:'Topik perubatan',reviewType:'medical',revision:0};
  await call({...medical,action:'save'});await call({...medical,revision:1,action:'submit'});
  await assert.rejects(call({...medical,revision:2,action:'approve'}),/expert review/);
  await assert.rejects(call({...medical,revision:2,action:'expert-review'},'expert-token'),/designated expert/);
  await call({action:'expert-access',userId:expert,scope:'medical',expertise:'RCBC verified clinical reviewer'});
  await call({...medical,revision:2,action:'expert-review'},'expert-token');
  await call({...medical,revision:3,action:'approve'});
  assert.equal((await call(null,null)).body.approved[key].text,'Topik perubatan');
  await db.query("UPDATE activities SET title='Updated English' WHERE id=$1",[activity]);
  assert.equal((await call(null,null)).body.approved[key],undefined);
  const outdated=(await call()).body.entries.find(r=>r.key===key&&r.language==='ms');
  assert.equal(outdated.status,'needs-review');assert.equal(outdated.expert_reviewed_by,null);
  await db.query("UPDATE activities SET title='English medical topic' WHERE id=$1",[activity]);
  assert.equal((await call(null,null)).body.approved[key],undefined,'Reverting English must not silently restore approval');
  assert.ok((await db.query('SELECT 1 FROM translation_history')).rowCount>=7);
  // Page setup applies to both languages, withdraws affected approvals, and supplies defaults.
  await call({action:'page-requirement',page:'shared',reviewType:'medical'});
  assert.equal((await call(null,null)).body.approved[item.key],undefined);
  const policyData=(await call()).body;
  assert.equal(policyData.entries.find(r=>r.key===item.key&&r.language==='ms').status,'draft');
  assert.equal(policyData.entries.find(r=>r.key==='ui/header/topBar'&&r.language==='zh').review_type,'medical');
  await call({action:'page-requirement',page:'shared',reviewType:'standard'});
  const second=(await call()).body.entries.find(r=>r.key==='ui/header/topBar'&&r.language==='ms');
  await call({action:'save',key:second.key,language:'ms',source:second.source,revision:second.revision,text:'Draft page introduction',reviewType:'standard'});
  const drafts=(await call()).body.entries.filter(r=>r.page==='shared'&&r.language==='ms'&&r.status==='draft'&&r.translated_text);
  const batch={action:'submit-page',page:'shared',language:'ms',items:drafts.map(r=>({key:r.key,revision:r.revision,source:r.source}))};
  assert.equal((await call(batch)).body.count,2);
  assert.equal((await call()).body.entries.filter(r=>r.page==='shared'&&r.language==='ms'&&r.status==='review').length,2);
  await assert.rejects(call(batch),e=>e.status===409);
  await assert.rejects(call({...batch,page:'education'}),e=>e.status===409);
  const ready=(await call()).body.entries.filter(r=>r.page==='shared'&&r.language==='ms'&&r.status==='review');
  const bulk={action:'approve-bulk',page:'shared',language:'ms',items:ready.map(r=>({key:r.key,language:r.language,revision:r.revision}))};
  await assert.rejects(call(bulk,''),e=>e.status===401);
  const reviewer=randomUUID();
  await db.query("INSERT INTO users(id,email,password_hash,name,role) VALUES($1,$2,'unused','Expert-only account','trainer')",[reviewer,reviewer+'@example.test']);
  await db.query("INSERT INTO trainer_profiles(id,certified_status) VALUES($1,'certified')",[reviewer]);
  await db.query("INSERT INTO trainer_access_requests(user_id,name,email,city,claimed_certificate_ref,status,reviewed_by,reviewed_at) VALUES($1,'Expert-only account',$2,'Kuching','TEST-EXPERT','approved',$3,now())",[reviewer,reviewer+'@example.test',admin]);
  await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest('reviewer-token'),reviewer]);
  await call({action:'expert-access',userId:reviewer,scope:'medical',expertise:'Relevant clinical expertise'});
  await assert.rejects(call(bulk,'reviewer-token'),e=>e.status===403);
  const staleItems=bulk.items.map((r,i)=>({...r,revision:r.revision+(i===1?1:0)}));
  await assert.rejects(call({...bulk,items:staleItems}),e=>e.status===409);
  assert.equal((await call()).body.entries.filter(r=>r.page==='shared'&&r.language==='ms'&&r.status==='review').length,2,'A stale item must roll back the whole batch');
  const medicalCurrent=(await call()).body.entries.find(r=>r.key===key&&r.language==='ms');
  await call({...medical,revision:medicalCurrent.revision,action:'save'});
  let medicalReady=(await call()).body.entries.find(r=>r.key===key&&r.language==='ms');
  await call({...medical,revision:medicalReady.revision,action:'submit'});
  medicalReady=(await call()).body.entries.find(r=>r.key===key&&r.language==='ms');
  await assert.rejects(call({...bulk,page:'',items:[...bulk.items,{key,language:'ms',revision:medicalReady.revision}]}),e=>e.status===409);
  assert.equal((await call(bulk)).body.count,2);
  await assert.rejects(call(bulk),e=>e.status===409,'Repeated requests cannot duplicate approvals');
  const zh=(await call()).body.entries.find(r=>r.key===item.key&&r.language==='zh');
  await call({action:'save',key:zh.key,language:'zh',source:zh.source,revision:zh.revision,text:'测试翻译',reviewType:'standard'});
  let zhReady=(await call()).body.entries.find(r=>r.key===item.key&&r.language==='zh');
  await call({action:'submit',key:zhReady.key,language:'zh',source:zhReady.source,revision:zhReady.revision});
  zhReady=(await call()).body.entries.find(r=>r.key===item.key&&r.language==='zh');
  await call({...medical,revision:medicalReady.revision,action:'expert-review'},'reviewer-token');
  medicalReady=(await call()).body.entries.find(r=>r.key===key&&r.language==='ms');
  const bilingual=await call({action:'approve-bulk',page:'',language:'all',items:[{key,language:'ms',revision:medicalReady.revision},{key:zhReady.key,language:'zh',revision:zhReady.revision}]});
  assert.deepEqual(bilingual.body.byLanguage,{ms:1,zh:1});
  assert.equal((await db.query("SELECT count(*)::int AS count FROM translation_history WHERE action='approve' AND snapshot ? 'batchId'")).rows[0].count,4);
  const beforeImport=(await db.query('SELECT * FROM translation_entries ORDER BY source_key,language')).rows;
  const imported=await reuseExistingTranslations({database:db,actorId:admin,apply:true,publishStandard:true});
  assert.ok(imported.summary.ms.published>0);assert.ok(imported.summary.ms.drafts>0);
  const expertPublished=await db.query("SELECT 1 FROM translation_entries WHERE review_comment LIKE 'Existing project wording%' AND review_type<>'standard' AND status='approved'");
  assert.equal(expertPublished.rowCount,0);
  for(const previous of beforeImport){
   const after=(await db.query('SELECT * FROM translation_entries WHERE source_key=$1 AND language=$2',[previous.source_key,previous.language])).rows[0];
   assert.deepEqual(after,previous,'Reusing wording must not overwrite saved edits or approvals');
  }
  const repeated=await reuseExistingTranslations({database:db,actorId:admin,apply:true,publishStandard:true});
  assert.equal(repeated.summary.ms.published,0);assert.equal(repeated.summary.zh.published,0);
  assert.equal(repeated.summary.ms.drafts,0);assert.equal(repeated.summary.zh.drafts,0);
 }finally{
  pool.query=originalQuery;pool.connect=originalConnect;
  await db.end();await root.query('DROP SCHEMA '+schema+' CASCADE');await root.end();
 }
});
