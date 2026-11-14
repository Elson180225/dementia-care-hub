import {translations} from '../src/i18n/translations.js';
import {sourceLeaves,reviewLanguages,reviewStatus,defaultReviewType,reviewTransition} from '../shared/translation-review.js';
import {getLearnEventsData} from './learn-events-content.js';
import {pool,transaction} from './db.js';
import {body,currentUser,fail} from './auth.js';
import {isAllowedOrigin} from './origin.js';
import {translationPages,translationPage,friendlyField} from '../shared/translation-workspace.js';
import {canBulkApprove} from '../shared/bulk-translation-approval.js';
import {randomUUID} from 'node:crypto';

export async function translationCatalogue(){
 const sources=sourceLeaves(translations.en);
 sourceLeaves(await getLearnEventsData(),'cms',sources);
 const activities=(await pool.query("SELECT id,title,description,audience,venue,registration_link FROM activities WHERE published_at IS NOT NULL AND status IN ('published','completed','verified','archived')")).rows;
 sourceLeaves(activities,'activities',sources);
 const settings=(await pool.query("SELECT s.activity_id AS id,s.fee,s.instructions,s.general_instructions FROM event_registration_settings s JOIN activities a ON a.id=s.activity_id WHERE a.published_at IS NOT NULL AND a.status IN ('published','completed','verified','archived')")).rows;
 sourceLeaves(settings,'registration',sources);
 for(const [kind,fields]of Object.entries({content_pages:'id,title,body',faqs:'id,question,answer',learning_resources:'id,title,description,audience',organisations:'id,name,services,eligibility,fees,opening_hours,volunteer_details'})){
  const rows=(await pool.query(`SELECT ${fields} FROM ${kind} WHERE publication_status='published' AND review_status<>'archived' AND language='English'`)).rows;
  sourceLeaves(rows,'records/'+kind,sources);
 }
 await pool.query("UPDATE translation_entries SET status='needs-review',expert_reviewed_by=NULL,approved_by=NULL,expert_reviewed_at=NULL,approved_at=NULL,revision=revision+1,updated_at=now() WHERE status<>'needs-review' AND (NOT ($1::jsonb ? source_key) OR $1::jsonb->>source_key<>source_text)",[JSON.stringify(sources)]);
 return sources;
}
export async function translationsHandler(req,res,url,send){
 const publicRoute=url.pathname==='/api/public/translations';
 if(publicRoute){
  if(req.method!=='GET')fail('Method not allowed',405);
  const language=url.searchParams.get('language');
  if(!reviewLanguages.includes(language))return send(res,200,{approved:{}});
  const sources=await translationCatalogue(),rows=(await pool.query("SELECT source_key,source_text,translated_text FROM translation_entries WHERE language=$1 AND status='approved'",[language])).rows;
  return send(res,200,{approved:Object.fromEntries(rows.filter(r=>sources[r.source_key]===r.source_text).map(r=>[r.source_key,{source:r.source_text,text:r.translated_text}]))});
 }
 const user=await currentUser(req);if(!user)fail('Sign in to review translations.',401);
 const scopes=(await pool.query('SELECT scope FROM translation_experts WHERE user_id=$1',[user.id])).rows.map(r=>r.scope);
 const actor={id:user.id,admin:user.role==='admin',scopes};
 if(!actor.admin&&!scopes.length)fail('Translation reviewer access required.',403);
 if(req.method==='GET'&&url.searchParams.get('access')==='1')return send(res,200,{actor});
 if(req.method==='GET'){
  const sources=await translationCatalogue(),rows=(await pool.query('SELECT * FROM translation_entries')).rows;
  const suggestions={ms:sourceLeaves(translations.ms),zh:sourceLeaves(translations.zh)};
  const pageRequirements=(await pool.query('SELECT * FROM translation_page_requirements')).rows;
  const defaults=Object.fromEntries(pageRequirements.map(r=>[r.page_id,r.review_type]));
  const entries=Object.entries(sources).flatMap(([key,source])=>reviewLanguages.map(language=>{
   const row=rows.find(r=>r.source_key===key&&r.language===language);
   return {...row,key,language,source,page:translationPage(key),label:friendlyField(key,sources),status:reviewStatus(row,source),review_type:row?.review_type||defaults[translationPage(key)]||defaultReviewType(key),suggestion:suggestions[language][key]||'',revision:row?.revision||0};
  }));
  const experts=(await pool.query('SELECT e.*,u.name FROM translation_experts e JOIN users u ON u.id=e.user_id')).rows;
  const users=actor.admin?(await pool.query('SELECT id,name,role FROM users WHERE enabled ORDER BY name')).rows:[];
  const history=(await pool.query('SELECT h.*,u.name FROM translation_history h JOIN users u ON u.id=h.actor_id ORDER BY h.id DESC LIMIT 200')).rows;
  return send(res,200,{actor,entries,experts,users,history,pageRequirements});
 }
 if(req.method!=='POST')fail('Method not allowed',405);
 if(!isAllowedOrigin(req.headers.origin))fail('Origin not allowed',403);
 const data=await body(req,1500000);
 if(data.action==='approve-bulk'){
  if(!actor.admin)fail('RCBC admin approval is required.',403);
  if(data.page&&!translationPages.some(p=>p.id===data.page))fail('Choose a valid website page.');
  if(![...reviewLanguages,'all'].includes(data.language))fail('Choose a translation language.');
  if(!Array.isArray(data.items)||!data.items.length||data.items.length>5000)fail('Choose between 1 and 5000 eligible translations.');
  if(data.items.some(i=>!i||typeof i.key!=='string'||!reviewLanguages.includes(i.language)||!Number.isInteger(i.revision)))fail('Invalid translation selection.');
  const items=[...data.items].sort((a,b)=>(a.key+'|'+a.language).localeCompare(b.key+'|'+b.language));
  if(new Set(items.map(i=>i.key+'|'+i.language)).size!==items.length)fail('Duplicate translation selection.');
  const sources=await translationCatalogue(),batchId=randomUUID();
  const byLanguage={ms:0,zh:0};
  await transaction(async db=>{
   for(const item of items){
    if(!sources[item.key]||(data.page&&translationPage(item.key)!==data.page)||(data.language!=='all'&&item.language!==data.language))fail('The selection does not match the confirmed page and language.',409);
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[item.key+':'+item.language]);
    const row=(await db.query('SELECT * FROM translation_entries WHERE source_key=$1 AND language=$2 FOR UPDATE',[item.key,item.language])).rows[0];
    if(!row||row.revision!==item.revision)fail('A selected translation changed. Refresh and check the approval summary again. Nothing in this batch was published.',409);
    if(!canBulkApprove({...row,source:sources[item.key]}))fail('A selected translation is not ready for approval or still needs expert review. Nothing in this batch was published.',409);
    let next;try{next=reviewTransition(row,sources[item.key],'approve',actor);}catch(e){fail(e.message,409);}
    await db.query("UPDATE translation_entries SET status='approved',approved_by=$3,approved_at=now(),revision=revision+1,updated_at=now() WHERE source_key=$1 AND language=$2",[item.key,item.language,user.id]);
    await db.query('INSERT INTO translation_history(source_key,language,action,actor_id,snapshot) VALUES($1,$2,$3,$4,$5)',[item.key,item.language,'approve',user.id,JSON.stringify({...next,batchId,comment:'Approved with the confirmed bulk selection.'})]);
    byLanguage[item.language]++;
   }
  },user.id);
  return send(res,200,{ok:true,count:items.length,byLanguage});
 }
 if(['page-requirement','submit-page'].includes(data.action)){
  if(!actor.admin)fail('RCBC admin access required.',403);
  if(!translationPages.some(p=>p.id===data.page))fail('Choose a website page.');
  const sources=await translationCatalogue();
  if(data.action==='page-requirement'){
   if(!['standard','medical','professional'].includes(data.reviewType))fail('Choose a review requirement.');
   const keys=Object.keys(sources).filter(key=>translationPage(key)===data.page);
   await transaction(async db=>{
    await db.query('INSERT INTO translation_page_requirements(page_id,review_type,updated_by) VALUES($1,$2,$3) ON CONFLICT(page_id) DO UPDATE SET review_type=$2,updated_by=$3,updated_at=now()',[data.page,data.reviewType,user.id]);
    await db.query("UPDATE translation_entries SET review_type=$2,status='draft',expert_reviewed_by=NULL,approved_by=NULL,expert_reviewed_at=NULL,approved_at=NULL,revision=revision+1,updated_at=now() WHERE source_key=ANY($1::text[]) AND review_type<>$2",[keys,data.reviewType]);
    await db.query('INSERT INTO translation_history(source_key,language,action,actor_id,snapshot) VALUES($1,$2,$3,$4,$5)',['page:'+data.page,'*','page-requirement',user.id,JSON.stringify({reviewType:data.reviewType,comment:'Page review requirement updated; affected approvals cleared.'})]);
   },user.id);
   return send(res,200,{ok:true});
  }
  if(!reviewLanguages.includes(data.language)||!Array.isArray(data.items)||!data.items.length||data.items.length>500)fail('Choose up to 500 saved drafts.');
  const items=[...data.items].sort((a,b)=>String(a.key).localeCompare(String(b.key)));
  if(new Set(items.map(i=>i.key)).size!==items.length)fail('Duplicate draft selection.');
  await transaction(async db=>{
   for(const item of items){
    if(translationPage(item.key)!==data.page||sources[item.key]!==item.source)fail('English content changed. Refresh before sending for review.',409);
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[item.key+':'+data.language]);
    const row=(await db.query('SELECT * FROM translation_entries WHERE source_key=$1 AND language=$2 FOR UPDATE',[item.key,data.language])).rows[0];
    if(!row||row.revision!==item.revision)fail('A saved draft changed. Refresh before sending for review.',409);
    let next;try{next=reviewTransition(row,sources[item.key],'submit',actor);}catch(e){fail(e.message,409);}
    await db.query("UPDATE translation_entries SET status='review',revision=revision+1,updated_at=now() WHERE source_key=$1 AND language=$2",[item.key,data.language]);
    await db.query('INSERT INTO translation_history(source_key,language,action,actor_id,snapshot) VALUES($1,$2,$3,$4,$5)',[item.key,data.language,'submit',user.id,JSON.stringify({...next,comment:'Sent for review with the page drafts.'})]);
   }
  },user.id);
  return send(res,200,{ok:true,count:items.length});
 }
 if(data.action==='expert-access'){
  if(!actor.admin)fail('Admin access required',403);
  if(!['medical','professional'].includes(data.scope)||!data.userId)fail('Choose an expert and review category.');
  if(data.remove)await pool.query('DELETE FROM translation_experts WHERE user_id=$1 AND scope=$2',[data.userId,data.scope]);
  else{
   if(!String(data.expertise||'').trim()||String(data.expertise).length>1000)fail('Record the relevant expertise verified by RCBC.');
   if(!(await pool.query('SELECT 1 FROM users WHERE id=$1 AND enabled',[data.userId])).rowCount)fail('Choose an active account.');
   await pool.query('INSERT INTO translation_experts(user_id,scope,expertise,assigned_by) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,scope) DO UPDATE SET expertise=$3,assigned_by=$4,assigned_at=now()',[data.userId,data.scope,data.expertise.trim(),user.id]);
  }
  return send(res,200,{ok:true});
 }
 if(!reviewLanguages.includes(data.language))fail('Choose Bahasa Malaysia or Chinese.');
 const sources=await translationCatalogue(),source=sources[data.key];
 if(!source||source!==data.source)fail('The English source changed or was removed. Reload before reviewing.',409);
 await transaction(async db=>{
  await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[data.key+':'+data.language]);
  const row=(await db.query('SELECT * FROM translation_entries WHERE source_key=$1 AND language=$2 FOR UPDATE',[data.key,data.language])).rows[0];
  if((row?.revision||0)!==data.revision)fail('Another reviewer changed this translation. Reload first.',409);
  let next;
  if(data.action==='save'){
   if(!actor.admin)fail('RCBC admins edit translation drafts.',403);
   if(typeof data.text!=='string'||data.text.length>30000||!['standard','medical','professional'].includes(data.reviewType))fail('Check the translation and review category.');
   next={source_text:source,translated_text:data.text,review_type:data.reviewType,status:'draft',edited_by:user.id,expert_reviewed_by:null,approved_by:null};
  }else{
   if(!row)fail('Save a translation draft first.');
   try{next=reviewTransition(row,source,data.action,actor);}catch(e){fail(e.message,409);}
  }
  const comment=String(data.comment||'').trim();if(comment.length>2000)fail('Review comments must be under 2000 characters.');
  if(data.action==='return'&&!comment)fail('Explain what needs correcting.');
  await db.query(`INSERT INTO translation_entries(source_key,language,source_text,translated_text,review_type,status,edited_by,expert_reviewed_by,approved_by,revision,review_comment,expert_reviewed_at,approved_at)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,CASE WHEN $8::uuid IS NULL THEN NULL ELSE now() END,CASE WHEN $9::uuid IS NULL THEN NULL ELSE now() END)
   ON CONFLICT(source_key,language) DO UPDATE SET source_text=$3,translated_text=$4,review_type=$5,status=$6,edited_by=$7,expert_reviewed_by=$8,approved_by=$9,revision=$10,review_comment=$11,expert_reviewed_at=CASE WHEN $8::uuid IS NULL THEN NULL ELSE coalesce(translation_entries.expert_reviewed_at,now()) END,approved_at=CASE WHEN $9::uuid IS NULL THEN NULL ELSE now() END,updated_at=now()`,
   [data.key,data.language,next.source_text,next.translated_text,next.review_type,next.status,next.edited_by,next.expert_reviewed_by,next.approved_by,(row?.revision||0)+1,comment]);
  await db.query('INSERT INTO translation_history(source_key,language,action,actor_id,snapshot) VALUES($1,$2,$3,$4,$5)',[data.key,data.language,data.action,user.id,JSON.stringify({...next,comment})]);
 },user.id);
 return send(res,200,{ok:true});
}
