import {pathToFileURL} from 'node:url';
import {translations} from '../src/i18n/translations.js';
import {sourceLeaves,defaultReviewType,reviewTransition} from '../shared/translation-review.js';
import {translationPage} from '../shared/translation-workspace.js';
import {pool,databaseTransaction} from '../server/db.js';

export function reusePlan(entries,requirements={}){
 const source=sourceLeaves(translations.en),existing=new Map(entries.map(r=>[r.source_key+'|'+r.language,r]));
 return ['ms','zh'].flatMap(language=>{
  const wording=sourceLeaves(translations[language]);
  return Object.entries(source).filter(([key])=>wording[key]?.trim()).map(([key,text])=>({
   key,language,source:text,text:wording[key],existing:existing.get(key+'|'+language),
   reviewType:requirements[translationPage(key)]||defaultReviewType(key)
  }));
 });
}
export async function reuseExistingTranslations({database=pool,actorId,apply=false,publishStandard=false}={}){
 return databaseTransaction(database,async db=>{
  const rows=(await db.query('SELECT * FROM translation_entries')).rows;
  const requirements=Object.fromEntries((await db.query('SELECT page_id,review_type FROM translation_page_requirements')).rows.map(r=>[r.page_id,r.review_type]));
  const plan=reusePlan(rows,requirements);
  const summary={ms:{available:0,preserved:0,drafts:0,published:0},zh:{available:0,preserved:0,drafts:0,published:0}};
  if(apply){
   const actor=(await db.query("SELECT id FROM users WHERE id=$1 AND role='admin' AND enabled",[actorId])).rows[0];
   if(!actor)throw Error('An active RCBC administrator account is required for the import history.');
  }
  for(const item of plan.sort((a,b)=>(a.key+'|'+a.language).localeCompare(b.key+'|'+b.language))){
   const count=summary[item.language];count.available++;
   if(item.existing){count.preserved++;continue;}
   const publish=publishStandard&&item.reviewType==='standard';
   if(!apply){count[publish?'published':'drafts']++;continue;}
   await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[item.key+':'+item.language]);
   const current=(await db.query('SELECT 1 FROM translation_entries WHERE source_key=$1 AND language=$2',[item.key,item.language])).rows[0];
   if(current){count.preserved++;continue;}
   let entry={source_text:item.source,translated_text:item.text,review_type:item.reviewType,status:'draft',edited_by:actorId,expert_reviewed_by:null,approved_by:null};
   const actions=[{action:'save',snapshot:{...entry}}];
   if(publish){
    const actor={id:actorId,admin:true,scopes:[]};
    entry=reviewTransition(entry,item.source,'submit',actor);actions.push({action:'submit',snapshot:{...entry}});
    entry=reviewTransition(entry,item.source,'approve',actor);actions.push({action:'approve',snapshot:{...entry}});
   }
   await db.query(`INSERT INTO translation_entries(source_key,language,source_text,translated_text,review_type,status,edited_by,approved_by,approved_at,revision,review_comment)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,CASE WHEN $8::uuid IS NULL THEN NULL ELSE now() END,$9,$10)`,
    [item.key,item.language,item.source,item.text,item.reviewType,entry.status,actorId,entry.approved_by,actions.length,'Existing project wording reused at the project owner’s request. No expert review is implied.']);
   for(const action of actions)await db.query('INSERT INTO translation_history(source_key,language,action,actor_id,snapshot) VALUES($1,$2,$3,$4,$5)',[item.key,item.language,action.action,actorId,JSON.stringify({...action.snapshot,origin:'existing-project-wording',comment:publish?'Standard wording reused and published on explicit project-owner instruction.':'Existing wording prepared as a draft; required expert review is outstanding.'})]);
   count[publish?'published':'drafts']++;
  }
  return {applied:apply,publishStandard,summary};
 },apply?actorId:null);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const apply=process.argv.includes('--apply'),publishStandard=process.argv.includes('--publish-standard');
  const email=process.argv.find(a=>a.startsWith('--actor-email='))?.slice('--actor-email='.length);
  const actor=apply&&email?(await pool.query("SELECT id FROM users WHERE lower(email)=lower($1) AND role='admin' AND enabled",[email])).rows[0]:null;
  if(apply&&!actor)throw Error('Supply --actor-email for the administrator authorising this import.');
  console.log(JSON.stringify(await reuseExistingTranslations({actorId:actor?.id,apply,publishStandard}),null,2));
 }catch(error){console.error(error.message);process.exitCode=1;}finally{await pool.end();}
}
