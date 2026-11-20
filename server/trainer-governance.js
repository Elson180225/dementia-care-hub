import {fail,hashPassword} from './auth.js';
import {validateFileLinks} from './uploads.js';
import {certificateFileId} from './certificate-evidence.js';
import {getLearnEventsData} from './learn-events-content.js';
import {ASSESSMENTS,validatePermissions,profileSnapshot,teachingPermission} from '../shared/trainer-governance.js';

export async function checkTeachingAssignments(db,activity,trainers){
 const ids=trainers.map(t=>t.trainerId||t.trainer_id);
 const rows=(await db.query('SELECT * FROM trainer_profiles WHERE id=ANY($1::uuid[])',[ids])).rows;
 if(ids.some(id=>{const p=rows.find(p=>p.id===id);return !p||p.certified_status!=='certified'||p.healthcare_professional===null||!teachingPermission(p,activity);}))fail('An assigned trainer is not approved to deliver this programme/module. Ask RCBC to update teaching permissions.',409);
}
export async function trainerGovernanceAction(db,user,action,log){
 if(!['ADMIN_TRAINER_CREATE','ADMIN_TRAINER_SAVE','ADMIN_TRAINER_ARCHIVE','ADMIN_TRAINER_RESTORE'].includes(action.type))return false;
 if(user.role!=='admin')fail('Admin access required',403);
 if(action.type==='ADMIN_TRAINER_CREATE'){
  const name=String(action.name||'').trim(),email=String(action.email||'').trim().toLowerCase();
  if(!name||name.length>200)fail('Enter the trainer name.');
  if(email&&!/^\S+@\S+\.\S+$/.test(email))fail('Enter a valid account email.');
  const password=action.password;
  if(email&&(typeof password!=='string'||password.length<12||password.length>256))fail('Set an initial password of 12–256 characters for this account.');
  const created=(await db.query("INSERT INTO users(name,email,password_hash,role,enabled) VALUES($1,coalesce(nullif($2,''),'trainer-'||gen_random_uuid()::text||'@unclaimed.invalid'),$3,'trainer',false) RETURNING id",[name,email,email?hashPassword(password):'00000000000000000000000000000000:'+ '00'.repeat(64)])).rows[0];
  await db.query('INSERT INTO trainer_profiles(id,portal_access_enabled) VALUES($1,false)',[created.id]);
  await log(db,user,'trainer_profiles',created.id,'created','New trainer record; access, teaching and publication remain unapproved.');
  return true;
 }
 const v=action.values||{};
 const old=(await db.query('SELECT p.*,u.name,u.email,u.enabled FROM trainer_profiles p JOIN users u ON u.id=p.id WHERE p.id=$1 AND u.role=\'trainer\' FOR UPDATE OF p,u',[action.id])).rows[0];
 if(!old)fail('Trainer not found',404);
 if(['ADMIN_TRAINER_ARCHIVE','ADMIN_TRAINER_RESTORE'].includes(action.type)){
  if(action.revision!==old.revision)fail('This trainer record changed. Refresh before continuing.',409);
  const reason=String(action.reason||'').trim();if(reason.length>2000)fail('Keep the archive note under 2000 characters.');
  const archive=action.type==='ADMIN_TRAINER_ARCHIVE';
  if(archive&&old.archived_at||!archive&&!old.archived_at)fail(archive?'Trainer is already archived.':'Trainer is not archived.',409);
  if(archive){
   await db.query("UPDATE trainer_profiles SET archived_at=now(),archived_by=$2,archive_reason=$3,teaching_allowed=false,portal_access_enabled=false,listing_status='suspended',publish_email=false,publish_phone=false,updated_at=now() WHERE id=$1",[old.id,user.id,reason]);
  }else{
   await db.query("UPDATE trainer_profiles SET archived_at=NULL,restored_at=now(),restored_by=$2,teaching_allowed=false,portal_access_enabled=false,listing_status='none',publish_email=false,publish_phone=false,updated_at=now() WHERE id=$1",[old.id,user.id]);
  }
  await db.query('UPDATE users SET enabled=false WHERE id=$1',[old.id]);
  await db.query('DELETE FROM sessions WHERE user_id=$1',[old.id]);
  await log(db,user,'trainer_profiles',old.id,archive?'archived':'restored',reason||(archive?'Trainer archived; historical records retained.':'Trainer restored; teaching, access and publication remain off.'));
  return true;
 }
 if(old.archived_at)fail('Restore this trainer before editing or approving the record.',409);
 if(v.revision!==old.revision)fail('This trainer record changed. Refresh before saving.',409);
 if(typeof v.name!=='string'||!v.name.trim()||v.name.length>200)fail('Enter the trainer name.');
 if(!ASSESSMENTS.includes(v.assessment_status)||![true,false,null].includes(v.healthcare_professional))fail('Choose a valid background and assessment outcome.');
 if(!['pending','certified','suspended'].includes(v.certified_status))fail('Choose a certification status.');
 for(const field of ['teaching_allowed','portal_access_enabled','listing_consent','email_consent','phone_consent','publish_email','publish_phone'])if(typeof v[field]!=='boolean')fail('Check trainer permission and consent settings.');
 let permissions;try{permissions=validatePermissions(v.teaching_permissions);}catch(e){fail(e.message);}
 if(v.teaching_allowed&&(v.healthcare_professional===null||v.certified_status!=='certified'||!permissions.length))fail('Verify background/certification and select the teaching scope before allowing training.');
 const cms=await getLearnEventsData(),validScopes=new Set(['Workshop','Seminar','RCBC Webinar','CT Webinar','DCS-Family','DCS-TTT',...(cms.physicalEducation?.programmes||[]).map(p=>p.id)]);
 if(permissions.some(p=>!validScopes.has(p.scope)))fail('Choose an existing programme or supported workshop type.');
 const ref=String(v.certificate_ref||'').trim();if(ref.length>200||v.certified_status==='certified'&&!ref)fail('Certified records require an official certificate reference.');
 if(!['none','approved','suspended'].includes(v.listing_status))fail('Choose a public listing setting.');
 let consentAt=null;
 if(v.listing_consent){consentAt=String(v.listing_consent_at||'');if(!consentAt||!Number.isFinite(Date.parse(consentAt))||Date.parse(consentAt)>Date.now())fail('Record the actual consent date.');}
 if(v.listing_status==='approved'&&(!v.listing_consent||v.healthcare_professional===null||v.certified_status!=='certified'))fail('Verify the record/background and record consent before publishing.');
 if(v.publish_email&&(!v.listing_consent||!v.email_consent)||v.publish_phone&&(!v.listing_consent||!v.phone_consent))fail('Record consent for each contact field before publishing it.');
 const email=String(v.contact_email||'').trim(),phone=String(v.contact_phone||'').trim();
 if(email&&!/^\S+@\S+\.\S+$/.test(email)||email.length>254||phone.length>80)fail('Check public contact details.');
 for(const field of ['city','language','short_profile','qualifications','experience','assessment_result','independent_teaching_scope','consent_note'])if(typeof v[field]!=='string'||v[field].length>5000)fail('Check trainer profile fields (maximum 5000 characters).');
 if(v.approveProfile&&(!v.city.trim()||!v.short_profile.trim()))fail('A city and short profile are required before profile approval.');
 if(v.listing_status==='approved'&&!old.approved_snapshot&&!v.approveProfile)fail('Approve the profile before publication.');
 const docs=v.supporting_documents||[];
 if(!Array.isArray(docs)||docs.length>30||docs.some(x=>typeof x!=='string'||!/^\/api\/files\/[a-f0-9-]{36}$/.test(x)))fail('Supporting documents must be private uploaded files.');
 if(v.photo_url&&!/^\/api\/files\/[a-f0-9-]{36}$/.test(v.photo_url)&&!/^https?:\/\//.test(v.photo_url))fail('Choose a valid profile photograph.');
 await validateFileLinks(db,user,[v.photo_url,...docs].filter(Boolean));
 const fileId=await certificateFileId(db,user,v.certificateEvidenceUrl||'');
 if(v.portal_access_enabled){
  if(old.email.endsWith('@unclaimed.invalid')&&(!v.account_email||!v.initial_password))fail('Set an account email and initial password before granting portal access.');
  if(v.certified_status!=='certified')fail('Verify certification before granting portal access.');
 }
 if(v.account_email){
  if(!old.email.endsWith('@unclaimed.invalid'))fail('Existing account email is managed separately.');
  if(!/^\S+@\S+\.\S+$/.test(v.account_email)||typeof v.initial_password!=='string'||v.initial_password.length<12||v.initial_password.length>256)fail('Enter a valid account email and initial password of 12–256 characters.');
  await db.query('UPDATE users SET email=$2,password_hash=$3 WHERE id=$1',[old.id,v.account_email.trim().toLowerCase(),hashPassword(v.initial_password)]);
 }
 const status=v.approveProfile?'approved':old.status;
 const snapshot=v.approveProfile?profileSnapshot({...v,contact_email:email,contact_phone:phone},v.name.trim()):old.approved_snapshot;
 await db.query('UPDATE users SET name=$2 WHERE id=$1',[old.id,v.name.trim()]);
 await db.query(`UPDATE trainer_profiles SET city=$2,language=$3,short_profile=$4,qualifications=$5,experience=$6,photo_url=$7,
 supporting_documents=$8,certificate_file_id=$9,certificate_ref=$10,certified_status=$11,assessment_status=$12,assessment_result=$13,
 healthcare_professional=$14,independent_teaching_scope=$15,teaching_allowed=$16,teaching_permissions=$17,portal_access_enabled=$18,
 contact_email=$19,contact_phone=$20,publish_email=$21,publish_phone=$22,email_consent=$23,phone_consent=$24,
 listing_consent_at=$25,consent_note=$26,listing_status=$27,approved_snapshot=$28,status=$29,revision=revision+1,
 listing_reviewed_by=$30,listing_reviewed_at=now(),updated_at=now() WHERE id=$1`,
 [old.id,v.city,v.language,v.short_profile,v.qualifications,v.experience,v.photo_url||null,JSON.stringify(docs),fileId,ref||null,
 v.certified_status,v.assessment_status,v.assessment_result,v.healthcare_professional,v.independent_teaching_scope,v.teaching_allowed,JSON.stringify(permissions),
 v.portal_access_enabled,email,phone,v.publish_email,v.publish_phone,v.email_consent,v.phone_consent,consentAt,v.consent_note,
 v.listing_status,JSON.stringify(snapshot),status,user.id]);
 if(v.portal_access_enabled){
  await db.query('UPDATE users SET enabled=true WHERE id=$1',[old.id]);
  await db.query(`INSERT INTO trainer_access_requests(user_id,name,email,city,claimed_certificate_ref,status,reviewed_by,reviewed_at)
   SELECT id,name,email,$2,$3,'approved',$4,now() FROM users WHERE id=$1
   ON CONFLICT(user_id) DO UPDATE SET status='approved',reviewed_by=$4,reviewed_at=now()`,[old.id,v.city,ref,user.id]);
 }else await db.query('DELETE FROM sessions WHERE user_id=$1',[old.id]);
 await log(db,user,'trainer_profiles',old.id,v.approveProfile?'approved':'updated',v.comment||'Trainer governance settings updated.',old.status,status);
 return true;
}
