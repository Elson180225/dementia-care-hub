import {webinarReview} from '../shared/webinar-library.js';
import {trainerGovernanceAction,checkTeachingAssignments} from './trainer-governance.js';
import {profileSnapshot,individualHours,activityTiming,organiserRecord} from '../shared/trainer-governance.js';
import { pool, transaction } from './db.js';
import { currentUser, body, fail } from './auth.js';
import { isAllowedOrigin } from './origin.js';
import { decision as logDecision } from './decisions.js';
import { certificateFileId } from './certificate-evidence.js';
import { validateFileLinks } from './uploads.js';
import {validateEventPricing} from '../shared/event-registration.js';
import {getLearnEventsData} from './learn-events-content.js';
import {isPlannedProgramme} from '../shared/programme-intakes.js';
import { maintenanceCounts } from './content-review.js';
const localTime=value=>value?new Date(value).toLocaleString('sv-SE',{timeZone:'Asia/Kuala_Lumpur'}).replace(' ','T').slice(0,16):'';
function validateLinks(single, list = []) {
 if(!Array.isArray(list) || list.some(x=>typeof x!=='string')) fail('Document and photo links must be a list of URLs');
 for(const url of [single,...list].filter(Boolean)) {
  if(typeof url==='string' && /^\/api\/files\/[a-f0-9-]{36}$/.test(url)) continue;
  if(typeof url!=='string' || !/^https?:\/\//i.test(url)) fail('Photo, poster and document links must use HTTP or HTTPS');
  try { new URL(url); } catch { fail('Invalid file URL'); }
 }
}
const profile = p => p && ({...p, shortProfile:p.short_profile, certifiedStatus:p.certified_status, certificateRef:p.certificate_ref || '', adminComment:p.admin_comment, certificateEvidenceUrl:p.certificate_file_id?'/api/files/'+p.certificate_file_id:'', photoUrl:p.photo_url, supportingDocuments:p.supporting_documents, listingStatus:p.listing_status, listingConsentAt:p.listing_consent_at, listingComment:p.listing_comment});
export async function snapshot(user) {
 const admin=user.role==='admin';
 const profiles=(await pool.query('SELECT p.*,u.name,u.email,u.enabled,EXISTS(SELECT 1 FROM approved_trainer_accounts a WHERE a.id=p.id) AS portal_access_active FROM trainer_profiles p JOIN users u ON u.id=p.id WHERE $1 OR p.id=$2',[admin,user.id])).rows;
 const activities=(await pool.query(`SELECT a.*,(SELECT jsonb_build_object('paid',s.paid,'enabled',s.enabled,'fee',s.fee,'instructions',s.instructions,'generalInstructions',s.general_instructions,'website',s.website_enabled,'googleUrl',s.google_url,'askPhone',s.ask_phone,'askNotes',s.ask_notes) FROM event_registration_settings s WHERE s.activity_id=a.id) AS registration_settings,coalesce(c.status,'none') AS completion_status,c.actual_starts_at,c.actual_ends_at,c.actual_venue,c.participants,c.actual_hours,c.admin_comment AS completion_comment,c.photos,
 coalesce((SELECT jsonb_agg(jsonb_build_object('trainerId',t.trainer_id,'role',t.role,'name',u.name,'hours',t.actual_hours,'topic',t.topic,'contributionStatus',t.contribution_status,'reviewComment',t.review_comment)) FROM activity_trainers t LEFT JOIN users u ON u.id=t.trainer_id WHERE t.activity_id=a.id),'[]') AS trainers
 FROM activities a LEFT JOIN completions c ON c.activity_id=a.id
 WHERE $1 OR a.created_by=$2 OR EXISTS(SELECT 1 FROM activity_trainers t WHERE t.activity_id=a.id AND t.trainer_id=$2) ORDER BY a.starts_at DESC`,[admin,user.id])).rows;
 return {session:admin?null:{id:user.id},adminSession:admin?user:null,
 profile:profile(profiles.find(p=>p.id===user.id) || profiles[0]) || {name:user.name}, profiles:profiles.map(profile),
 activities:activities.map(a=>({...a,date:new Date(a.starts_at).toLocaleString('sv-SE',{timeZone:'Asia/Kuala_Lumpur'}).replace(' ','T').slice(0,16),
 activityReference:a.activity_reference,contentApprovalStatus:a.content_approval_status,isPublic:Boolean(a.published_at && a.content_approval_status==="approved" && ["published","completed","verified","archived"].includes(a.status)),organiserKind:a.organiser_kind,organiserName:a.organiser_name,postponedAt:a.postponed_at,endDate:localTime(a.ends_at),teachingModule:a.teaching_module||'',programmeId:a.programme_id||'',registrationType:a.registration_settings?(a.registration_settings.paid?'paid':'free'):'',registrationFee:a.registration_settings?.fee||'',paymentInstructions:a.registration_settings?.instructions||'',registrationInstructions:a.registration_settings?.generalInstructions||'',registrationMethod:a.registration_settings?.enabled?(a.registration_settings.website?(a.registration_settings.googleUrl?'both':'website'):'google'):'closed',registrationGoogleUrl:a.registration_settings?.googleUrl||a.registration_link||'',registrationPhone:!!a.registration_settings?.askPhone,registrationNotes:!!a.registration_settings?.askNotes,audience:a.audience,registrationLink:a.registration_link || '',plannedHours:Number(a.planned_hours),adminComment:a.admin_comment,posterUrl:a.poster_url || '',cancelledAt:a.cancelled_at,
 registrationDeadline:a.registration_deadline?new Date(a.registration_deadline).toLocaleString('sv-SE',{timeZone:'Asia/Kuala_Lumpur'}).replace(' ','T').slice(0,16):'',capacity:a.capacity || '',
 role:a.trainers.find(t=>t.trainerId===user.id)?.role || 'Trainer',completion:{actualStart:localTime(a.actual_starts_at),actualEnd:localTime(a.actual_ends_at),individualStatus:a.trainers.find(t=>t.trainerId===user.id)?.contributionStatus,status:a.completion_status,venue:a.actual_venue,participants:a.participants,eventHours:Number(a.actual_hours),trainerHours:Object.fromEntries(a.trainers.map(t=>[t.trainerId,t.hours])),hours:Number(admin?a.actual_hours:(a.trainers.find(t=>t.trainerId===user.id)?.hours||0)),photos:a.photos || [],adminComment:a.completion_comment}})),
 accessRequests:admin?(await pool.query('SELECT *,claimed_certificate_ref AS "certificateRef",submitted_at AS "requestedAt",admin_comment AS "adminComment" FROM trainer_access_requests ORDER BY submitted_at DESC')).rows:[],
 users:admin?(await pool.query('SELECT u.id,u.name,u.email,u.role,u.enabled,p.certified_status,p.certificate_ref,p.listing_status,p.listing_consent_at,p.assessment_result, p.assessment_status, p.healthcare_professional,p.independent_teaching_scope,p.certificate_file_id,p.teaching_allowed,p.teaching_permissions,p.portal_access_enabled,EXISTS(SELECT 1 FROM approved_trainer_accounts x WHERE x.id=u.id) AS portal_access_active FROM users u LEFT JOIN trainer_profiles p ON p.id=u.id ORDER BY u.created_at DESC')).rows:[],
 contributions:(await pool.query('SELECT * FROM annual_trainer_contributions WHERE $1 OR trainer_id=$2 ORDER BY year DESC',[admin,user.id])).rows,
 projectReach:admin?(await pool.query('SELECT * FROM annual_project_reach ORDER BY year DESC')).rows:[],
 maintenance:admin?await maintenanceCounts(pool):[],
 history:(await pool.query(`SELECT l.id,l.changed_at AS at,l.entity,coalesce(l.after_data->>'title',l.after_data->>'name',l.after_data->>'question',
 (SELECT a.title FROM activities a WHERE a.id::text=l.record_id),
 (SELECT person.name FROM users person WHERE person.id::text=l.record_id),
 (SELECT request.name FROM trainer_access_requests request WHERE request.id::text=l.record_id),l.record_id) AS "entityLabel",coalesce(l.decision,l.operation) AS decision,l.admin_comment AS comment,coalesce(u.name,'System') AS by,l.before_data,l.after_data
 FROM audit_log l LEFT JOIN users u ON u.id=l.actor_id WHERE ($1 OR l.actor_id=$2 OR (l.entity='trainer_profiles' AND l.record_id=$2::text) OR (l.entity IN ('activities','completions') AND EXISTS(SELECT 1 FROM activities a WHERE a.id::text=l.record_id AND (a.created_by=$2 OR EXISTS(SELECT 1 FROM activity_trainers t WHERE t.activity_id=a.id AND t.trainer_id=$2)))))
 ORDER BY l.id DESC LIMIT 300`,[admin,user.id])).rows};
}
export async function portalHandler(req,res,url,send) {
 if(req.method==='GET' && url.pathname==='/api/trainers') return send(res,200,(await pool.query("SELECT v.*, CASE WHEN v.teaching_allowed THEN p.approved_snapshot->>'public_teaching_conditions' END AS public_teaching_conditions FROM public_trainers v JOIN trainer_profiles p ON p.id=v.id")).rows);
 if(req.method==='GET' && url.pathname==='/api/activities') return send(res,200,(await pool.query("SELECT (SELECT jsonb_build_object('paid',s.paid,'enabled',s.enabled,'fee',s.fee) FROM event_registration_settings s WHERE s.activity_id=a.id) AS registration_settings,a.content_approval_status,a.activity_reference,a.organiser_kind,a.organiser_name,a.postponed_at,a.postponement_reason,a.speaker_name AS speaker,a.speaker_intro,a.source_url,a.recording_url AS \"recordingLink\",a.qa_url,a.qa_text,a.programme_id,a.id,a.title,a.starts_at,a.ends_at,a.planned_hours,a.type,a.mode,a.venue,a.city,a.language,a.audience,a.description,a.poster_url,CASE WHEN a.cancelled_at IS NULL THEN a.registration_link ELSE NULL END AS registration_link,a.status,a.cancelled_at,a.cancellation_reason,a.registration_deadline,a.capacity,coalesce((SELECT jsonb_agg(jsonb_build_object('trainerId',t.trainer_id,'role',t.role,'name',u.name)) FROM activity_trainers t LEFT JOIN users u ON u.id=t.trainer_id WHERE t.activity_id=a.id),'[]') AS trainers FROM activities a WHERE a.status IN ('published','completed','verified','archived') AND a.published_at IS NOT NULL AND a.content_approval_status='approved'")).rows);
 const user=await currentUser(req); if(!user) fail('Please sign in',401);
 if(req.method==='GET' && url.pathname==='/api/portal/trainers') return send(res,200,(await pool.query("SELECT u.id,u.name,p.city,p.language,p.teaching_allowed,p.teaching_permissions FROM users u JOIN trainer_profiles p ON p.id=u.id WHERE p.certified_status='certified' AND p.archived_at IS NULL ORDER BY u.name")).rows);
 if(req.method==='GET' && url.pathname==='/api/portal') return send(res,200,await snapshot(user));
 if(req.method!=='POST' || url.pathname!=='/api/portal/actions') fail('Not found',404);
 if(!isAllowedOrigin(req.headers.origin)) fail('Origin not allowed',403);
 const action=await body(req); const admin=user.role==='admin';
 await transaction(async db=>{
  if(await trainerGovernanceAction(db,user,action,logDecision))return;
  const p=(await db.query('SELECT * FROM trainer_profiles WHERE id=$1 FOR UPDATE',[user.id])).rows[0];
  if(p?.archived_at)fail('This trainer is archived. Contact RCBC.',403);
  if(action.type==='PROFILE_SAVE') {
   // Submitted edits remain private until RCBC approves a new public snapshot.
   if(!p) fail('Trainer profile required',403);
   const v=action.values;
   if(v.certificateEvidenceUrl!==undefined) {
    const fileId=await certificateFileId(db,user,v.certificateEvidenceUrl);
    await db.query('UPDATE trainer_profiles SET certificate_file_id=$2 WHERE id=$1',[user.id,fileId]);
   }
   validateLinks(v.photoUrl,v.supportingDocuments || []);
   await validateFileLinks(db,user,[v.photoUrl,...(v.supportingDocuments || [])]);
   if(String(v.contactEmail||'').length>254||v.contactEmail&&!/^\S+@\S+\.\S+$/.test(v.contactEmail)||String(v.contactPhone||'').length>80)fail('Check contact details.');
   if(v.name){if(typeof v.name!=='string'||v.name.trim().length>200)fail('Check your name.');await db.query('UPDATE users SET name=$2 WHERE id=$1',[user.id,v.name.trim()]);}
   if(!v.city?.trim() || !v.shortProfile?.trim()) fail('City and short profile are required');
   await db.query("UPDATE trainer_profiles SET city=$2,language=$3,short_profile=$4,qualifications=$5,experience=$6,photo_url=$7,supporting_documents=$8,contact_email=$9,contact_phone=$10,status='submitted',admin_comment='',revision=revision+1,updated_at=now() WHERE id=$1",[user.id,v.city.trim(),v.language,v.shortProfile.trim(),v.qualifications,v.experience,v.photoUrl || null,JSON.stringify(v.supportingDocuments || []),String(v.contactEmail||'').trim(),String(v.contactPhone||'').trim()]); return;
  }
  if(action.type==='LISTING_REQUEST' || action.type==='LISTING_WITHDRAW') {
   if(admin || !p) fail('Trainer profile required',403);
   if(action.type==='LISTING_REQUEST') {
    if(action.consent!==true) fail('Please tick the consent box to request a public listing');
    if(!['none','returned','rejected'].includes(p.listing_status)) fail('Your listing request is already with RCBC',409);
    await db.query("UPDATE trainer_profiles SET listing_status='requested',listing_consent_at=now(),listing_comment='' WHERE id=$1",[user.id]);
   } else {
    await db.query("UPDATE trainer_profiles SET listing_status='none',listing_consent_at=NULL WHERE id=$1",[user.id]);
   }
   return;
  }
  if(action.type==='ADMIN_LISTING') {
   if(!admin) fail('Admin access required',403);
   const {id,listing,comment=''}=action;
   if(!['suspended','approved'].includes(listing)) fail('Invalid listing change');
   if(listing==='suspended' && !comment.trim()) fail('A comment is required');
   const old=(await db.query('SELECT * FROM trainer_profiles WHERE id=$1 FOR UPDATE',[id])).rows[0];
   if(!old) fail('Trainer not found',404);
   if(old.archived_at)fail('Restore the trainer before changing public listing settings.',409);
   if(listing==='suspended' && old.listing_status!=='approved') fail('Only an approved listing can be suspended',409);
   if(listing==='approved' && (old.listing_status!=='suspended' || !old.listing_consent_at)) fail('Only a suspended listing with consent can be restored',409);
   await db.query('UPDATE trainer_profiles SET listing_status=$2,listing_comment=$3,listing_reviewed_by=$4,listing_reviewed_at=now() WHERE id=$1',[id,listing,comment,user.id]);
   await logDecision(db,user,'trainer_listing',id,listing==='suspended'?'unpublished':'published',comment,old.listing_status,listing);return;
  }
  if(action.type==='ADMIN_REVIEW') {
   if(!admin) fail('Admin access required',403);
   const {target,id,decision,comment=''}=action;
   if(!['approved','returned','rejected','published','completed','archived','verified','unpublished','cancelled'].includes(decision)) fail('Invalid decision');
   if(['returned','rejected','cancelled'].includes(decision) && !comment.trim()) fail('A comment is required');
   if(target==='access') {
    if(!['approved','returned','rejected'].includes(decision)) fail('Invalid access decision');
    const old=(await db.query('SELECT * FROM trainer_access_requests WHERE id=$1 FOR UPDATE',[id])).rows[0];
    if(!old || old.status!=='submitted') fail('Request is not awaiting review',409);
    if((await db.query('SELECT archived_at FROM trainer_profiles WHERE id=$1',[old.user_id])).rows[0]?.archived_at)fail('Restore the trainer before approving access.',409);
    if(decision==='approved' && (!action.certificateRef?.trim() || old.city==='Not provided' || old.claimed_certificate_ref==='Not provided')) fail('Confirm the applicant city and official certificate reference before approving');
    await db.query('UPDATE trainer_access_requests SET status=$2,admin_comment=$3,reviewed_by=$4,reviewed_at=now(),updated_at=now() WHERE id=$1',[id,decision,comment,user.id]);
    if(decision==='approved') await db.query("UPDATE trainer_profiles SET certified_status='certified',certificate_ref=$2,city=$3,certificate_file_id=$4 WHERE id=$1",[old.user_id,action.certificateRef.trim(),old.city,old.certificate_file_id]);
    else await db.query('DELETE FROM sessions WHERE user_id=$1',[old.user_id]);
    await logDecision(db,user,'trainer_access_requests',id,decision,comment,old.status,decision);return;
   }
   if(target==='profile') {
    if(!['approved','returned'].includes(decision)) fail('Invalid profile decision');
    const targetId=id;
    if(!targetId) fail('Profile not found',404);
    const pending=(await db.query('SELECT p.*,u.name FROM trainer_profiles p JOIN users u ON u.id=p.id WHERE p.id=$1 FOR UPDATE OF p',[targetId])).rows[0];
    if(pending?.archived_at)fail('Restore the trainer before reviewing profile changes.',409);
    const result=await db.query("UPDATE trainer_profiles SET status=$2,admin_comment=$3,approved_snapshot=CASE WHEN $2='approved' THEN $4::jsonb ELSE approved_snapshot END,revision=revision+1,updated_at=now() WHERE id=$1 AND status='submitted' RETURNING id",[targetId,decision,comment,pending?JSON.stringify(profileSnapshot(pending,pending.name)):null]);
    if(!result.rowCount) fail('Profile is not awaiting review',409);
    await logDecision(db,user,'trainer_profiles',targetId,decision,comment,'submitted',decision);return;
   }
   if(target==='listing') {
    if(!['approved','returned','rejected'].includes(decision)) fail('Invalid listing decision');
    const old=(await db.query('SELECT * FROM trainer_profiles WHERE id=$1 FOR UPDATE',[id])).rows[0];
    if(old?.archived_at)fail('Restore the trainer before approving a listing.',409);
    if(!old || old.listing_status!=='requested' || !old.listing_consent_at) fail('Listing is not awaiting review',409);
    if(decision==='approved' && (old.certified_status!=='certified' || !old.approved_snapshot || old.healthcare_professional===null)) fail('Verify certification/background and approve the profile before publishing',409);
    await db.query('UPDATE trainer_profiles SET listing_status=$2,listing_comment=$3,listing_reviewed_by=$4,listing_reviewed_at=now() WHERE id=$1',[id,decision,comment,user.id]);
    await logDecision(db,user,'trainer_listing',id,decision,comment,'requested',decision);return;
   }
   if(target==='activity') {
    const transitions={approved:['submitted'],returned:['submitted'],published:['approved','submitted'],completed:['published'],archived:['verified','approved','published'],unpublished:['published'],cancelled:['approved','published']};
    if(!transitions[decision]) fail('Invalid activity transition');
    const old=(await db.query('SELECT * FROM activities WHERE id=$1 FOR UPDATE',[id])).rows[0];
    if(!old || !transitions[decision].includes(old.status) || (decision==='published' && old.cancelled_at)) fail('Invalid activity transition',409);
    if(decision==='archived' && old.status!=='verified' && !old.cancelled_at) fail('Verify completion or cancel the activity before archiving',409);
    if(decision==='completed')fail('Submit actual completion details before marking the activity completed',409);
    if(old.postponed_at&&decision==='published')fail('Reschedule this postponed activity before publishing',409);
    if(decision==='published')await checkTeachingAssignments(db,old,(await db.query('SELECT trainer_id FROM activity_trainers WHERE activity_id=$1',[id])).rows);
    const next=decision==='unpublished'?'approved':decision==='cancelled'?old.status:decision;
    await db.query("UPDATE activities SET status=$2,admin_comment=$3,updated_at=now(),published_at=CASE WHEN $4='published' THEN now() WHEN $4='unpublished' THEN NULL ELSE published_at END,cancelled_at=CASE WHEN $4='cancelled' THEN now() ELSE cancelled_at END,cancellation_reason=CASE WHEN $4='cancelled' THEN $3 ELSE cancellation_reason END WHERE id=$1",[id,next,comment,decision]);
    await logDecision(db,user,'activities',id,decision,comment,old.status,next);return;
   }
   if(target!=='completion' || !['approved','verified','returned'].includes(decision)) fail('Invalid review target');
   const status=decision==='returned'?'returned':'verified';
   const r=await db.query("UPDATE completions SET status=$2,admin_comment=$3,verified_by=$4,verified_at=CASE WHEN $2='verified' THEN now() ELSE NULL END WHERE activity_id=$1 AND status='submitted' RETURNING activity_id",[id,status,comment,status==='verified'?user.id:null]);
   if(!r.rowCount) fail('Completion is not awaiting review',409);
   await db.query('UPDATE activities SET status=$2 WHERE id=$1',[id,status==='verified'?'verified':'completed']);
   await logDecision(db,user,'completions',id,status,comment,'submitted',status);return;
  }
  if(!admin && (!p || p.certified_status!=='certified')) fail('RCBC must verify your trainer access before you submit activities',403);
  if(action.type==='CONTRIBUTION_CONFIRM'||action.type==='CONTRIBUTION_REVIEW') {
   const activity=(await db.query('SELECT a.*,c.status AS completion_status,c.actual_hours FROM activities a JOIN completions c ON c.activity_id=a.id WHERE a.id=$1 FOR UPDATE OF a,c',[action.id])).rows[0];
   if(!activity||activity.cancelled_at||activity.postponed_at)fail('Completed activity required',409);
   const trainerId=action.type==='CONTRIBUTION_CONFIRM'&&!admin?user.id:action.trainerId;
   const row=(await db.query('SELECT * FROM activity_trainers WHERE activity_id=$1 AND trainer_id=$2 FOR UPDATE',[action.id,trainerId])).rows[0];
   if(!row||row.actual_hours===null||Number(row.actual_hours)>Number(activity.actual_hours))fail('Valid assigned contribution required',409);
   if(action.type==='CONTRIBUTION_CONFIRM') {
    if(admin&&!String(action.comment||'').trim())fail('Record how the trainer confirmed this contribution outside the portal.');
    if(!['pending','returned'].includes(row.contribution_status))fail('Contribution is already confirmed',409);
    if(action.hours!==undefined){
     if(action.hours===''||!Number.isFinite(Number(action.hours))||Number(action.hours)<0||Number(action.hours)>Number(activity.actual_hours))fail('Individual hours cannot exceed net event duration');
     await db.query('UPDATE activity_trainers SET actual_hours=$3 WHERE activity_id=$1 AND trainer_id=$2',[action.id,trainerId,Number(action.hours)]);
    }
    await db.query("UPDATE activity_trainers SET contribution_status='confirmed',confirmed_at=now(),reviewed_by=NULL,reviewed_at=NULL,review_comment='' WHERE activity_id=$1 AND trainer_id=$2",[action.id,trainerId]);
   } else {
    if(!admin)fail('Admin access required',403);
    if(!['verified','returned'].includes(action.decision)||!(row.contribution_status==='confirmed'||row.contribution_status==='verified'&&action.decision==='returned'))fail('Contribution must be individually confirmed before review',409);
    if(action.decision==='returned'&&!action.comment?.trim())fail('A comment is required');
    await db.query('UPDATE activity_trainers SET contribution_status=$3,reviewed_by=$4,reviewed_at=now(),review_comment=$5 WHERE activity_id=$1 AND trainer_id=$2',[action.id,trainerId,action.decision,user.id,action.comment||'']);
   }
   if(admin)await logDecision(db,user,'activity_trainers',action.id,action.type==='CONTRIBUTION_CONFIRM'?'confirmed':action.decision,action.comment||'',row.contribution_status,action.decision||'confirmed');return;
  }
  const id=action.id || action.activity?.id;
  const existing=(await db.query('SELECT * FROM activities WHERE id=$1 FOR UPDATE',[id])).rows[0];
  if(existing && !admin && existing.created_by!==user.id) fail('Only the activity owner can edit this record',403);
  if(action.type==='ACTIVITY_SAVE') {
   if(existing && !admin && (!['draft','returned'].includes(existing.status) || existing.cancelled_at)) fail('Activity cannot be edited in this state',409);
   const a=action.activity;
   let timing,organiser;try{timing=activityTiming(a.date,a.endDate,a.plannedHours);organiser=organiserRecord(a.organiserKind||'rcbc',a.organiserName||'');}catch(e){fail(e.message);}
   if(existing&&(await db.query('SELECT 1 FROM completions WHERE activity_id=$1',[id])).rowCount)fail('Completed activity details are locked; review its contribution records instead.',409);
   validateLinks(a.posterUrl);
   await validateFileLinks(db,user,[a.posterUrl]);
   if(!admin && !['Workshop','Seminar'].includes(a.type)) fail('Trainers may submit workshops and seminars only',403);
   if(!a.title?.trim() || !a.description?.trim() || !a.audience?.trim() || !Number.isFinite(Number(a.plannedHours)) || Number(a.plannedHours)<=0 || !a.date || Number.isNaN(Date.parse(a.date))) fail('Complete the required activity fields');
   if(a.registrationLink && !/^https?:\/\//i.test(a.registrationLink)) fail('Registration link must use HTTP or HTTPS');
   const saved=await db.query(`INSERT INTO activities(id,created_by,title,starts_at,type,mode,venue,language,audience,description,registration_link,planned_hours,city,poster_url)
    VALUES($1,$2,$3,$4::timestamp AT TIME ZONE 'Asia/Kuala_Lumpur',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    ON CONFLICT(id) DO UPDATE SET title=excluded.title,starts_at=excluded.starts_at,type=excluded.type,mode=excluded.mode,venue=excluded.venue,language=excluded.language,audience=excluded.audience,description=excluded.description,registration_link=excluded.registration_link,planned_hours=excluded.planned_hours,city=excluded.city,poster_url=excluded.poster_url
    WHERE activities.created_by=$2 OR $15::boolean RETURNING id`,[id,user.id,a.title,a.date,a.type,a.mode,a.venue,a.language,a.audience,a.description,a.registrationLink,a.plannedHours,a.city || '',a.posterUrl || null,admin]);
   await db.query('UPDATE activities SET ends_at=$2,organiser_kind=$3,organiser_name=$4 WHERE id=$1',[id,timing.end,organiser.kind,organiser.name]);
   if(admin && a.publicationReview) {
    let review;
    try { review=webinarReview(a.publicationReview); } catch(error) { fail(error.message); }
    await db.query(`UPDATE activities SET source_url=$2,speaker_name=$3,speaker_intro=$4,recording_url=$5,qa_url=$6,qa_text=$7,
      content_approval_status=$8,content_approved_by=CASE WHEN $8='approved' THEN $9::uuid END,
      content_approved_at=CASE WHEN $8='approved' THEN now() END WHERE id=$1`,
    [id,review.source_url,review.speaker_name,review.speaker_intro,review.recording_url,review.qa_url,review.qa_text,review.content_approval_status,user.id]);
    await logDecision(db,user,'activities',id,review.content_approval_status==='approved'?'content-approved':'content-unpublished','Activity publication review',existing?.content_approval_status,review.content_approval_status);
   } else if(existing)await db.query("UPDATE activities SET content_approval_status='pending',content_approved_by=NULL,content_approved_at=NULL WHERE id=$1",[id]);
   if(!saved.rowCount) fail('Only the activity owner can edit this record',403);
   if(admin){
    const programmeId=String(a.programmeId||'').trim();
    if(programmeId){
     const cms=await getLearnEventsData(),programme=cms.physicalEducation?.programmes?.find(p=>p.id===programmeId);
     if(!programme)fail('Choose an existing Physical Education programme.');
     if(a.mode!=='Physical')fail('Programme intakes must use Physical delivery.');
     if(isPlannedProgramme(programme)&&a.registrationMethod!=='closed')fail('This programme is planned. Keep registration closed until RCBC changes its availability.');
    }
    await db.query('UPDATE activities SET programme_id=$2 WHERE id=$1',[id,programmeId||null]);
    let paid;try{paid=validateEventPricing(a.registrationType,a.mode);}catch(e){fail(e.message);}
    if(a.type==='RCBC Webinar'&&paid)fail('RCBC public education webinars must be free.');
    const oldSettings=(await db.query('SELECT paid FROM event_registration_settings WHERE activity_id=$1 FOR UPDATE',[id])).rows[0];
    if(oldSettings&&oldSettings.paid!==paid&&(await db.query('SELECT 1 FROM event_participants WHERE activity_id=$1 LIMIT 1',[id])).rowCount)fail('Cannot change free/paid classification after registrations exist.');
    if(String(a.registrationFee||'').length>100||String(a.paymentInstructions||'').length>4000)fail('Fee or payment instructions are too long');
    await db.query('INSERT INTO event_registration_settings(activity_id,paid,fee,instructions,updated_by) VALUES($1,$2,$3,$4,$5) ON CONFLICT(activity_id) DO UPDATE SET paid=$2,fee=$3,instructions=$4,updated_by=$5,updated_at=now()',[id,paid,a.registrationFee||'',a.paymentInstructions||'',user.id]);
    if(!['website','google','both','closed'].includes(a.registrationMethod))fail('Choose a registration method.');
    const google=String(a.registrationGoogleUrl??a.registrationLink??'').trim();
    if(['google','both'].includes(a.registrationMethod)&&!/^https?:\/\//i.test(google))fail('Enter a valid Google Form link.');
    if(google){try{const url=new URL(google);if(!['http:','https:'].includes(url.protocol))throw Error();}catch{fail('Enter a valid registration URL');}}
    if(String(a.registrationInstructions||'').length>4000)fail('Registration instructions are too long');
    await db.query('UPDATE event_registration_settings SET enabled=$2,website_enabled=$3,google_url=$4,fee=$5,instructions=$6,general_instructions=$7,ask_phone=$8,ask_notes=$9 WHERE activity_id=$1',[id,a.registrationMethod!=='closed',['website','both'].includes(a.registrationMethod),['google','both'].includes(a.registrationMethod)?google:'',paid?(a.registrationFee||''):'',paid?(a.paymentInstructions||''):'',a.registrationInstructions||'',true,true]);
    await db.query('UPDATE activities SET registration_link=$2 WHERE id=$1',[id,['google','both'].includes(a.registrationMethod)?google:null]);
   }
   if(a.registrationDeadline && new Date(a.registrationDeadline)>new Date(a.date)) fail('Registration deadline must be before the activity');
   if(a.capacity && (!Number.isInteger(Number(a.capacity)) || Number(a.capacity)<=0)) fail('Capacity must be a positive integer');
   await db.query("UPDATE activities SET registration_deadline=$2::timestamp AT TIME ZONE 'Asia/Kuala_Lumpur',capacity=$3,updated_at=now() WHERE id=$1",[id,a.registrationDeadline || null,a.capacity || null]);
   if(admin && a.status && !['draft','submitted','approved','published'].includes(a.status))fail('Use the completion workflow to verify a finished activity');
   if(admin && a.status && ['draft','submitted','approved','published'].includes(a.status)) {
    await db.query("UPDATE activities SET status=$2,published_at=CASE WHEN $2 IN ('published','completed','verified','archived') THEN COALESCE(published_at, now()) ELSE published_at END,updated_at=now() WHERE id=$1",[id,a.status]);
   } else if(existing && ['completed','verified','archived'].includes(existing.status)) {
    await db.query("UPDATE activities SET status=$2,published_at=COALESCE(published_at, now()),updated_at=now() WHERE id=$1",[id,existing.status]);
   }
   if(a.trainers) {
    if(!Array.isArray(a.trainers) || (!admin && !a.trainers.length) || new Set(a.trainers.map(t=>t.trainerId)).size!==a.trainers.length || (!admin && !a.trainers.some(t=>t.trainerId===user.id))) fail('Assign distinct trainers and include yourself');
    const eligible=await db.query("SELECT id FROM trainer_profiles WHERE certified_status='certified' AND id=ANY($1::uuid[])",[a.trainers.map(t=>t.trainerId)]);
    if(eligible.rowCount!==a.trainers.length) fail('Only certified trainers can be assigned');
    if(new Date(a.date)>new Date())await checkTeachingAssignments(db,a,a.trainers);
    const lockedCompletion=(await db.query("SELECT status FROM completions WHERE activity_id=$1 AND status IN ('submitted','verified')",[id])).rows[0];
    if(lockedCompletion){const previous=(await db.query('SELECT trainer_id FROM activity_trainers WHERE activity_id=$1',[id])).rows.map(t=>t.trainer_id);if(previous.length!==a.trainers.length||a.trainers.some(t=>!previous.includes(t.trainerId)))fail('Assigned trainers are locked while completion is under review or verified.',409);}
    await db.query('DELETE FROM activity_trainers WHERE activity_id=$1 AND NOT (trainer_id=ANY($2::uuid[]))',[id,a.trainers.map(t=>t.trainerId)]);
   } else if(!admin) await db.query('INSERT INTO activity_trainers(activity_id,trainer_id,role) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[id,user.id,a.role || 'Trainer']);
   if(a.trainers) {
    for(const t of a.trainers){
     if(!['Trainer','Co-Trainer','Speaker'].includes(t.role)||typeof (t.topic||'')!=='string'||String(t.topic||'').length>300)fail('Check trainer role and topic');
     await db.query('INSERT INTO activity_trainers(activity_id,trainer_id,role,topic) VALUES($1,$2,$3,$4) ON CONFLICT(activity_id,trainer_id) DO UPDATE SET role=excluded.role,topic=excluded.topic',[id,t.trainerId,t.role,String(t.topic||'').trim()]);
    }
   }
   await db.query('UPDATE activities SET teaching_module=$2 WHERE id=$1',[id,String(a.teachingModule||'').slice(0,300)]);
   if(!admin&&!a.trainers)await checkTeachingAssignments(db,{...a},[{trainerId:user.id}]);
   if(admin) await logDecision(db,user,'activities',id,existing && existing.starts_at.toISOString()!==new Date(a.date+'+08:00').toISOString()?'rescheduled':'corrected','',existing?.status || null,existing?.status || 'draft');return;
  }
  if(!existing) fail('Activity not found',404);
  if(action.type==='ACTIVITY_POSTPONE'||action.type==='ACTIVITY_RESUME') {
   if(!admin)fail('Admin access required',403);
   if(!['approved','published'].includes(existing.status)||existing.cancelled_at)fail('Only upcoming approved or published activities can be postponed',409);
   if((await db.query('SELECT 1 FROM completions WHERE activity_id=$1',[id])).rowCount)fail('Completed activities cannot be postponed',409);
   if(action.type==='ACTIVITY_POSTPONE') {
    if(!action.comment?.trim())fail('Give a postponement reason');
    await db.query('UPDATE activities SET postponed_at=now(),postponement_reason=$2 WHERE id=$1',[id,action.comment.trim()]);
   }else{
    if(!existing.postponed_at)fail('Activity is not postponed',409);
    let timing;try{timing=activityTiming(action.date,action.endDate,existing.planned_hours);}catch(e){fail(e.message);}
    await db.query("UPDATE activities SET starts_at=$2,ends_at=$3,postponed_at=NULL,postponement_reason=$4,registration_deadline=NULL,content_approval_status='pending',content_approved_by=NULL,content_approved_at=NULL WHERE id=$1",[id,timing.start,timing.end,'']);
   }
   await logDecision(db,user,'activities',id,action.type==='ACTIVITY_POSTPONE'?'postponed':'rescheduled',action.comment||'',existing.status,existing.status);return;
  }
  if(action.type==='ACTIVITY_DELETE') {
   if(!admin && (existing.created_by!==user.id || !['draft','returned'].includes(existing.status))) fail('Only draft activities can be deleted',403);
   await db.query('DELETE FROM event_confirmation_deliveries WHERE participant_id IN (SELECT id FROM event_participants WHERE activity_id=$1)',[id]);
   await db.query('DELETE FROM participant_reminders WHERE participant_id IN (SELECT id FROM event_participants WHERE activity_id=$1)',[id]);
   await db.query('DELETE FROM event_attendance_reminders WHERE activity_id=$1',[id]);
   await db.query('DELETE FROM event_participants WHERE activity_id=$1',[id]);
   await db.query('DELETE FROM participant_imports WHERE activity_id=$1',[id]);
   await db.query('DELETE FROM event_registration_settings WHERE activity_id=$1',[id]);
   await db.query('UPDATE learning_resources SET activity_id=NULL WHERE activity_id=$1',[id]);
   await db.query('UPDATE dcs_registry_records SET activity_id=NULL WHERE activity_id=$1',[id]);
   await db.query('DELETE FROM completions WHERE activity_id=$1',[id]);
   await db.query('DELETE FROM activity_trainers WHERE activity_id=$1',[id]);
   await db.query('DELETE FROM activities WHERE id=$1',[id]);
   if(admin) await logDecision(db,user,'activities',id,'deleted','',existing.status,'deleted');
   return;
  }
  if(action.type==='ACTIVITY_SUBMIT') {
   if(!['draft','returned'].includes(existing.status)) fail('Activity is not editable',409);
   await checkTeachingAssignments(db,existing,(await db.query('SELECT trainer_id FROM activity_trainers WHERE activity_id=$1',[id])).rows);
   await db.query("UPDATE activities SET status='submitted',admin_comment='' WHERE id=$1",[id]); return;
  }
  if(action.type==='COMPLETION_REOPEN'){
   if(!admin||!String(action.comment||'').trim())fail('Admin access and a correction reason are required',403);
   const old=(await db.query('SELECT * FROM completions WHERE activity_id=$1 FOR UPDATE',[id])).rows[0];
   if(!old||old.status!=='verified')fail('Choose a verified completion record',409);
   await db.query("UPDATE completions SET status='returned',verified_by=NULL,verified_at=NULL,admin_comment=$2 WHERE activity_id=$1",[id,action.comment]);
   await db.query("UPDATE activities SET status='completed' WHERE id=$1",[id]);
   await logDecision(db,user,'completions',id,'reopened-for-correction',action.comment,'verified','returned');return;
  }
  if(action.type==='COMPLETION_SAVE' || action.type==='COMPLETION_SUBMIT') {
   if(!['published','completed'].includes(existing.status) || existing.cancelled_at || existing.postponed_at || new Date(existing.starts_at)>new Date()) fail('Completion requires a published activity that has happened',409);
   const old=(await db.query('SELECT * FROM completions WHERE activity_id=$1 FOR UPDATE',[id])).rows[0];
   if(old && ['submitted','verified'].includes(old.status)) fail('Completion is locked for review',409);
   const v=action.values;
   if(!v) fail('Save the completion details before submitting');
   validateLinks(null,v.photos || []);
   await validateFileLinks(db,user,v.photos || []);
   if(!v.venue?.trim() || !Number.isInteger(Number(v.participants)) || Number(v.participants)<0 || !Number.isFinite(Number(v.hours)) || Number(v.hours)<=0) fail('Valid venue, participants and hours are required');
   let timing;try{timing=activityTiming(v.actualStart,v.actualEnd,v.hours);}catch(e){fail(e.message);}
   if(timing.end>new Date())fail('Actual completion cannot be in the future');
   const assigned=(await db.query('SELECT trainer_id FROM activity_trainers WHERE activity_id=$1',[id])).rows;
   let hours;try{hours=individualHours(assigned,v.trainerHours,timing.hours);}catch(e){fail(e.message);}
   for(const h of hours)await db.query("UPDATE activity_trainers SET actual_hours=$3,contribution_status='pending',confirmed_at=NULL,reviewed_by=NULL,reviewed_at=NULL,review_comment='' WHERE activity_id=$1 AND trainer_id=$2",[id,h.id,h.hours]);
   await db.query("INSERT INTO completions(activity_id,actual_venue,participants,actual_hours,photos,actual_starts_at,actual_ends_at,status) VALUES($1,$2,$3,$4,$5,$6,$7,'submitted') ON CONFLICT(activity_id) DO UPDATE SET actual_venue=excluded.actual_venue,participants=excluded.participants,actual_hours=excluded.actual_hours,photos=excluded.photos,actual_starts_at=excluded.actual_starts_at,actual_ends_at=excluded.actual_ends_at,status='submitted',admin_comment=''",[id,v.venue,v.participants,v.hours,JSON.stringify(v.photos || []),timing.start,timing.end]);
   await db.query("UPDATE activities SET status='completed' WHERE id=$1",[id]); return;
  }
  fail('Unsupported action');
 },user.id);
 return send(res,200,await snapshot(user));
}
