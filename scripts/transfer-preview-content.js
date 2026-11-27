import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import pg from 'pg';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import {pool} from '../server/db.js';
import {translationSources} from '../server/translations.js';
import {defaultReviewType} from '../shared/translation-review.js';
import {translationPage} from '../shared/translation-workspace.js';
import {cleanDeploymentContent,isTestingEvent,translationImportStatus,deploymentEvent,registrationSourceKey} from '../shared/deployment-content.js';

const recordKinds=['organisations','directory_services','content_pages','faqs','learning_resources'];
const legacyCategories=['healthcare','services','financial','equipment','support-group'];
function legacyDirectoryServices(organisation) {
 if (!Array.isArray(organisation.services)) return [];
 const isSupportGroup = label => /support[ -]*group/i.test(label);
 const isGroup = organisation.category === 'support-group';
 const types = organisation.services.length ? [...organisation.services] : [isGroup || organisation.support_group ? 'Support Group' : 'Other'];
 if (organisation.support_group && !isGroup && !types.some(isSupportGroup)) types.push('Support Group');
 return [...new Set(types.map(type => type.trim()).filter(Boolean))].map(service_type => {
  const category = isGroup || isSupportGroup(service_type) ? 'support-group'
   : legacyCategories.includes(organisation.category) ? organisation.category : 'information';
  return {
   ...organisation, organisation_id: organisation.id, category, service_type, description: organisation.specialist_field,
   id: createHash('md5').update(`legacy-directory-service:${organisation.id}:${category}:${service_type}`).digest('hex'),
   address: null, city: null, state: null, postcode: null,
  };
 });
}
const jsonFile=(path,data)=>writeFile(path,JSON.stringify(data,null,2),{mode:0o600,flag:'wx'});
export async function exportContent(db){
 const exists=(await db.query("SELECT to_regclass('learn_events_content') AS name")).rows[0].name;
 const cms=exists?(await db.query("SELECT data FROM learn_events_content WHERE id='main'")).rows[0]?.data
  :JSON.parse(await readFile(new URL('../shared/learn-events-content.json',import.meta.url),'utf8'));
 if(!cms)throw Error('CMS content is not initialized.');
 const all=(await db.query("SELECT * FROM activities WHERE published_at IS NOT NULL AND status IN ('published','completed','verified','archived')")).rows;
 const activities=all.filter(a=>!isTestingEvent(a)).map(deploymentEvent),ids=activities.map(a=>a.id);
 // Existing registration configuration is unverified test setup. Never export it.
 const registration=[];
 const records={};
 for(const kind of recordKinds)records[kind]=(await db.query("SELECT * FROM "+kind+" WHERE publication_status='published' AND review_status<>'archived'"+(kind==='organisations'?' AND NOT is_example':kind==='directory_services'?' AND id IN (SELECT id FROM published_directory)':''))).rows
  .filter(r=>!r.activity_id||ids.includes(r.activity_id));
 const bundle={version:1,registrationPolicy:'closed-until-admin-reviewed',exportedAt:new Date().toISOString(),cms:cleanDeploymentContent(cms),activities,registration,records,
  translations:(await db.query('SELECT * FROM translation_entries')).rows,
  history:(await db.query('SELECT * FROM translation_history ORDER BY id')).rows,
  requirements:(await db.query('SELECT * FROM translation_page_requirements')).rows,
  identities:(await db.query('SELECT id,email,name,role,enabled FROM users WHERE id IN (SELECT edited_by FROM translation_entries UNION SELECT approved_by FROM translation_entries UNION SELECT expert_reviewed_by FROM translation_entries UNION SELECT actor_id FROM translation_history UNION SELECT updated_by FROM translation_page_requirements)')).rows,
  excludedEvents:all.filter(isTestingEvent).map(a=>({id:a.id,title:a.title}))};
 const sources=await translationSources(db,bundle.cms);
 const allowedKey=key=>!registrationSourceKey(key)&&sources[key]!==undefined&&(!/^(activities|registration)\//.test(key)||ids.includes(decodeURIComponent(key.split('/')[1])));
 bundle.sources=Object.fromEntries(Object.entries(sources).filter(([key])=>allowedKey(key)));
 bundle.translations=bundle.translations.filter(r=>allowedKey(r.source_key));
 bundle.history=bundle.history.filter(r=>allowedKey(r.source_key));
 const refs=[...new Set([...JSON.stringify({cms:bundle.cms,activities,records}).matchAll(/\/api\/files\/([a-f0-9-]{36})/g)].map(m=>m[1]))];
 bundle.files=(await db.query("SELECT id,kind,name,mime,data FROM files WHERE id=ANY($1::uuid[]) AND kind<>'payment-evidence'",[refs])).rows.map(f=>({...f,data:f.data.toString('base64')}));
 return bundle;
}
async function insertMissing(db,table,row){
 const columns=(await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=$1 AND is_identity='NO' AND is_generated='NEVER'",[table])).rows.map(r=>r.column_name);
 const keys=Object.keys(row).filter(k=>columns.includes(k));
 const vals=keys.map(k=>row[k]&&typeof row[k]==='object'&&!(row[k] instanceof Date)&&!Buffer.isBuffer(row[k])&&!Array.isArray(row[k])?JSON.stringify(row[k]):row[k]);
 // jsonb array fields need JSON, PostgreSQL text[] fields retain array encoding.
 const types=(await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=$1 AND data_type IN ('json','jsonb')",[table])).rows.map(r=>r.column_name);
 keys.forEach((k,i)=>{if(types.includes(k))vals[i]=JSON.stringify(row[k]);});
 return (await db.query('INSERT INTO '+table+'('+keys.map(k=>'"'+k+'"').join(',')+') VALUES('+keys.map((_,i)=>'$'+(i+1)).join(',')+') ON CONFLICT DO NOTHING',vals)).rowCount;
}
export async function importContent(db,bundle,{adminEmail,apply=false,backupPath,cmsRevision}={}){
 if(bundle.version!==1||!bundle.cms||!Array.isArray(bundle.activities)||!Array.isArray(bundle.translations))throw Error('Invalid deployment bundle.');
 const actor=(await db.query("SELECT id FROM users WHERE lower(email)=lower($1) AND role='admin' AND enabled",[adminEmail])).rows[0];
 if(!actor)throw Error('Choose an existing active administrator in the target database.');
 if(apply&&!backupPath)throw Error('An exclusive backup file path is required before applying.');
 await db.query('BEGIN');
 try{
  await db.query("SELECT pg_advisory_xact_lock(718422)");
  await db.query("SELECT set_config('app.actor_id',$1,true)",[actor.id]);
  const current=(await db.query("SELECT * FROM learn_events_content WHERE id='main' FOR UPDATE")).rows[0];
  if(apply&&current?.revision!==cmsRevision)throw Error('CMS revision changed or was not supplied. Run the dry run and pass --cms-revision.');
  if(apply){
   const backup={createdAt:new Date().toISOString(),cms:current,tables:{}};
   for(const t of ['activities','event_registration_settings','translation_entries','translation_history',...recordKinds])
    backup.tables[t]=(await db.query('SELECT * FROM '+t)).rows;
   await jsonFile(backupPath,backup);
  }
  const report={mode:apply?'applied':'dry-run',targetCmsRevision:current?.revision,activities:0,records:0,files:0,registrationsTransferred:0,registrationSettingsTransferred:0,eventsWithRegistrationClosed:0,
   excludedEvents:bundle.excludedEvents||[],sourceDifferences:{missingInTarget:0,changedEnglish:0,targetOnly:0},translations:{approved:0,review:0,draft:0,'needs-review':0,excluded:0,existing:0},pageCounts:{}};
  const cms=cleanDeploymentContent(bundle.cms);
  if(!isDeepStrictEqual(current.data,cms)){
   await db.query('INSERT INTO learn_events_content_history(data,revision,actor_id) VALUES($1,$2,$3)',[current.data,current.revision,actor.id]);
   await db.query("UPDATE learn_events_content SET data=$1,revision=revision+1,updated_by=$2,updated_at=now() WHERE id='main'",[cms,actor.id]);
  }
  const ids=[];
  for(const a of bundle.activities){
   if(isTestingEvent(a)){report.excludedEvents.push({id:a.id,title:a.title});continue;}
   if(await insertMissing(db,'activities',{...deploymentEvent(a),created_by:actor.id,organiser_id:null})){report.activities++;report.eventsWithRegistrationClosed++;}
   ids.push(a.id);
  }
  // Ignore registration settings even in older bundles. Missing settings mean closed,
  // and avoid falsely classifying an unreviewed event as free or paid.
  const records={...bundle.records};
  records.directory_services ??= (records.organisations || []).filter(r => !r.is_example).flatMap(legacyDirectoryServices);
  for(const kind of recordKinds)for(const r of records[kind]||[]){
   if(r.is_example||r.activity_id&&!ids.includes(r.activity_id))continue;
   if(kind==='organisations' && Array.isArray(r.services) && legacyCategories.includes(r.category)){
    report.records+=await insertMissing(db,kind,{...r,category:'Unspecified'});
    continue;
   }
   report.records+=await insertMissing(db,kind,r);
  }
  for(const f of bundle.files||[])if(f.kind!=='payment-evidence')report.files+=await insertMissing(db,'files',{...f,owner_id:actor.id,data:Buffer.from(f.data,'base64')});
  const sources=await translationSources(db,cms);
  for(const [key,source]of Object.entries(bundle.sources||{})){
   if(sources[key]===undefined)report.sourceDifferences.missingInTarget++;
   else if(sources[key]!==source)report.sourceDifferences.changedEnglish++;
  }
  report.sourceDifferences.targetOnly=Object.keys(sources).filter(key=>bundle.sources&&!(key in bundle.sources)).length;
  const users=(await db.query('SELECT id,email,role,enabled FROM users')).rows,experts=(await db.query('SELECT user_id,scope FROM translation_experts')).rows;
  const map=old=>{const identity=bundle.identities?.find(u=>u.id===old);return identity?users.find(u=>u.enabled&&u.email.toLowerCase()===identity.email.toLowerCase()):null;};
  const defaults=Object.fromEntries((await db.query('SELECT * FROM translation_page_requirements')).rows.map(r=>[r.page_id,r.review_type]));
  for(const key of Object.keys(sources)){const p=translationPage(key);report.pageCounts[p]=(report.pageCounts[p]||0)+1;}
  for(const row of bundle.translations){
   if(registrationSourceKey(row.source_key)){report.translations.excluded++;continue;}
   if(!['ms','zh'].includes(row.language))throw Error('Invalid translation language.');
   const approver=map(row.approved_by),expert=map(row.expert_reviewed_by);
   const requiredType=defaults[translationPage(row.source_key)]||defaultReviewType(row.source_key);
   const status=translationImportStatus(row,sources[row.source_key],{
    approver:approver?.role==='admin',
    expert:!!expert&&experts.some(e=>e.user_id===expert.id&&e.scope===requiredType),requiredType});
   if(status==='excluded'){report.translations.excluded++;continue;}
   const imported={...row,status,review_type:requiredType,edited_by:map(row.edited_by)?.id||actor.id,
    approved_by:status==='approved'?approver.id:null,approved_at:status==='approved'?row.approved_at:null,
    expert_reviewed_by:status==='approved'&&expert?expert.id:null,expert_reviewed_at:status==='approved'&&expert?row.expert_reviewed_at:null,
    review_comment:'Transferred from reviewed content bundle; original provenance is recorded in translation history.'};
   if(await insertMissing(db,'translation_entries',imported)){
    report.translations[status]++;
    await db.query("INSERT INTO translation_history(source_key,language,action,actor_id,snapshot) VALUES($1,$2,'import', $3,$4)",[
     row.source_key,row.language,actor.id,{original:row,originalIdentities:bundle.identities?.filter(u=>[row.edited_by,row.approved_by,row.expert_reviewed_by].includes(u.id)),
      originalHistory:bundle.history?.filter(h=>h.source_key===row.source_key&&h.language===row.language),importedStatus:status}]);
   }else report.translations.existing++;
  }
  await db.query(apply?'COMMIT':'ROLLBACK');return report;
 }catch(e){await db.query('ROLLBACK');throw e;}
}
async function main(){
 const args=process.argv.slice(2),option=k=>args[args.indexOf(k)+1],file=option('--file');
 if(!args.includes('--file')||!file?.endsWith('.local'))throw Error('Use --export or --import --file path.local. Bundles contain private review information; never commit them.');
 if(args.includes('--export')){
  try{const bundle=await exportContent(pool);await jsonFile(file,bundle);console.log(JSON.stringify({events:bundle.activities.length,excludedEvents:bundle.excludedEvents,translationEntries:bundle.translations.length,files:bundle.files.length,registrationPolicy:bundle.registrationPolicy,registrationsTransferred:0,registrationSettingsTransferred:0}));}finally{await pool.end();}
 }else if(args.includes('--import')){
  if(!process.env.PREVIEW_DATABASE_URL)throw Error('Set PREVIEW_DATABASE_URL explicitly. DATABASE_URL is never used as the import destination.');
  const target=new pg.Pool({connectionString:process.env.PREVIEW_DATABASE_URL}),db=await target.connect();
  try{console.log(JSON.stringify(await importContent(db,JSON.parse(await readFile(file,'utf8')),{adminEmail:option('--admin-email'),apply:args.includes('--apply'),backupPath:args.includes('--backup')?option('--backup'):null,cmsRevision:Number(option('--cms-revision'))}),null,2));}
  finally{db.release();await target.end();await pool.end();}
 }else throw Error('Choose --export or --import.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.code?'Content transfer failed: '+e.code:e.message);process.exitCode=1;});
