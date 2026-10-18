import { pool, transaction } from './db.js';
import { currentUser, body, fail } from './auth.js';
import { isAllowedOrigin } from './origin.js';
import { decision as logDecision } from './decisions.js';
import { validateFileLinks } from './uploads.js';
function validateLinks(single, list = []) {
 if(!Array.isArray(list) || list.some(x=>typeof x!=='string')) fail('Document and photo links must be a list of URLs');
 for(const url of [single,...list].filter(Boolean)) {
  if(typeof url==='string' && /^\/api\/files\/[a-f0-9-]{36}$/.test(url)) continue;
  if(typeof url!=='string' || !/^https?:\/\//i.test(url)) fail('Photo, poster and document links must use HTTP or HTTPS');
  try { new URL(url); } catch { fail('Invalid file URL'); }
 }
}
const profile = p => p && ({...p, shortProfile:p.short_profile, certifiedStatus:p.certified_status, certificateRef:p.certificate_ref || '', adminComment:p.admin_comment, photoUrl:p.photo_url, supportingDocuments:p.supporting_documents});
export async function snapshot(user) {
 const admin=user.role==='admin';
 const profiles=(await pool.query('SELECT p.*,u.name,u.email FROM trainer_profiles p JOIN users u ON u.id=p.id WHERE $1 OR p.id=$2',[admin,user.id])).rows;
 const activities=(await pool.query(`SELECT a.*,coalesce(c.status,'none') AS completion_status,c.actual_venue,c.participants,c.actual_hours,c.admin_comment AS completion_comment,c.photos,
 coalesce((SELECT jsonb_agg(jsonb_build_object('trainerId',t.trainer_id,'role',t.role)) FROM activity_trainers t WHERE t.activity_id=a.id),'[]') AS trainers
 FROM activities a LEFT JOIN completions c ON c.activity_id=a.id
 WHERE $1 OR a.created_by=$2 OR EXISTS(SELECT 1 FROM activity_trainers t WHERE t.activity_id=a.id AND t.trainer_id=$2) ORDER BY a.starts_at DESC`,[admin,user.id])).rows;
 return {session:admin?null:{id:user.id},adminSession:admin?user:null,
 profile:profile(profiles.find(p=>p.id===user.id) || profiles[0]) || {name:user.name}, profiles:profiles.map(profile),
 activities:activities.map(a=>({...a,date:new Date(a.starts_at).toLocaleString('sv-SE',{timeZone:'Asia/Kuala_Lumpur'}).replace(' ','T').slice(0,16),
 audience:a.audience,registrationLink:a.registration_link || '',plannedHours:Number(a.planned_hours),adminComment:a.admin_comment,posterUrl:a.poster_url || '',cancelledAt:a.cancelled_at,
 registrationDeadline:a.registration_deadline?new Date(a.registration_deadline).toLocaleString('sv-SE',{timeZone:'Asia/Kuala_Lumpur'}).replace(' ','T').slice(0,16):'',capacity:a.capacity || '',
 role:a.trainers.find(t=>t.trainerId===user.id)?.role || 'Trainer',completion:{status:a.completion_status,venue:a.actual_venue,participants:a.participants,hours:Number(a.actual_hours),photos:a.photos || [],adminComment:a.completion_comment}})),
 accessRequests:admin?(await pool.query('SELECT *,claimed_certificate_ref AS "certificateRef",submitted_at AS "requestedAt",admin_comment AS "adminComment" FROM trainer_access_requests ORDER BY submitted_at DESC')).rows:[],
 users:admin?(await pool.query('SELECT u.id,u.name,u.email,u.role,u.enabled,p.certified_status,p.certificate_ref FROM users u LEFT JOIN trainer_profiles p ON p.id=u.id ORDER BY u.created_at DESC')).rows:[],
 contributions:(await pool.query('SELECT * FROM annual_trainer_contributions WHERE $1 OR trainer_id=$2 ORDER BY year DESC',[admin,user.id])).rows,
 projectReach:admin?(await pool.query('SELECT * FROM annual_project_reach ORDER BY year DESC')).rows:[],
 maintenance:admin?(await pool.query(`SELECT 'Directory' AS kind,count(*)::int AS count FROM organisations WHERE review_status='needs review' OR (review_status<>'archived' AND next_review_at<=now())
 UNION ALL SELECT 'Learning resources',count(*)::int FROM learning_resources WHERE review_status='needs review' OR (review_status<>'archived' AND next_review_at<=now())
 UNION ALL SELECT 'Content and FAQs',count(*)::int FROM (SELECT review_status,next_review_at FROM content_pages UNION ALL SELECT review_status,next_review_at FROM faqs) c WHERE review_status='needs review' OR (review_status<>'archived' AND next_review_at<=now())
 UNION ALL SELECT 'Enquiries',count(*)::int FROM enquiries WHERE status<>'closed'`)).rows:[],
 history:(await pool.query(`SELECT l.id,l.changed_at AS at,l.entity,coalesce(l.after_data->>'title',l.after_data->>'name',l.after_data->>'question',
 (SELECT a.title FROM activities a WHERE a.id::text=l.record_id),
 (SELECT person.name FROM users person WHERE person.id::text=l.record_id),
 (SELECT request.name FROM trainer_access_requests request WHERE request.id::text=l.record_id),l.record_id) AS "entityLabel",coalesce(l.decision,l.operation) AS decision,l.admin_comment AS comment,coalesce(u.name,'System') AS by,l.before_data,l.after_data
 FROM audit_log l LEFT JOIN users u ON u.id=l.actor_id WHERE ($1 OR l.actor_id=$2 OR (l.entity='trainer_profiles' AND l.record_id=$2::text) OR (l.entity IN ('activities','completions') AND EXISTS(SELECT 1 FROM activities a WHERE a.id::text=l.record_id AND (a.created_by=$2 OR EXISTS(SELECT 1 FROM activity_trainers t WHERE t.activity_id=a.id AND t.trainer_id=$2)))))
 ORDER BY l.id DESC LIMIT 300`,[admin,user.id])).rows};
}
export async function portalHandler(req,res,url,send) {
 if(req.method==='GET' && url.pathname==='/api/trainers') return send(res,200,(await pool.query('SELECT * FROM public_trainers')).rows);
 if(req.method==='GET' && url.pathname==='/api/activities') return send(res,200,(await pool.query("SELECT a.id,a.title,a.starts_at,a.type,a.mode,a.venue,a.city,a.language,a.audience,a.description,a.poster_url,CASE WHEN a.cancelled_at IS NULL THEN a.registration_link ELSE NULL END AS registration_link,a.status,a.cancelled_at,a.cancellation_reason,a.registration_deadline,a.capacity,coalesce((SELECT jsonb_agg(jsonb_build_object('trainerId',t.trainer_id,'role',t.role)) FROM activity_trainers t WHERE t.activity_id=a.id),'[]') AS trainers FROM activities a WHERE a.status IN ('published','completed','verified','archived') AND a.published_at IS NOT NULL")).rows);
 const user=await currentUser(req); if(!user) fail('Please sign in',401);
 if(req.method==='GET' && url.pathname==='/api/portal/trainers') return send(res,200,(await pool.query("SELECT u.id,u.name,p.city,p.language FROM approved_trainer_accounts u JOIN trainer_profiles p ON p.id=u.id ORDER BY u.name")).rows);
 if(req.method==='GET' && url.pathname==='/api/portal') return send(res,200,await snapshot(user));
 if(req.method!=='POST' || url.pathname!=='/api/portal/actions') fail('Not found',404);
 if(!isAllowedOrigin(req.headers.origin)) fail('Origin not allowed',403);
 const action=await body(req); const admin=user.role==='admin';
 await transaction(async db=>{
  const p=(await db.query('SELECT * FROM trainer_profiles WHERE id=$1 FOR UPDATE',[user.id])).rows[0];
  if(action.type==='PROFILE_SUBMIT' || action.type==='PROFILE_SAVE') {
   if(!p || p.status==='submitted') fail('Profile is awaiting review',409);
   const v=action.values;
   validateLinks(v.photoUrl,v.supportingDocuments || []);
   await validateFileLinks(db,user,[v.photoUrl,...(v.supportingDocuments || [])]);
   if(action.type==='PROFILE_SUBMIT' && (!v.city?.trim() || !v.shortProfile?.trim())) fail('City and short profile are required');
   await db.query("UPDATE trainer_profiles SET city=$2,language=$3,short_profile=$4,qualifications=$5,experience=$6,photo_url=$7,supporting_documents=$8,status=$9,admin_comment='',updated_at=now() WHERE id=$1",[user.id,v.city,v.language,v.shortProfile,v.qualifications,v.experience,v.photoUrl || null,JSON.stringify(v.supportingDocuments || []),action.type==='PROFILE_SAVE'?'draft':'submitted']); return;
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
    if(decision==='approved' && (!action.certificateRef?.trim() || old.city==='Not provided' || old.claimed_certificate_ref==='Not provided')) fail('Confirm the applicant city and official certificate reference before approving');
    await db.query('UPDATE trainer_access_requests SET status=$2,admin_comment=$3,reviewed_by=$4,reviewed_at=now(),updated_at=now() WHERE id=$1',[id,decision,comment,user.id]);
    if(decision==='approved') await db.query("UPDATE trainer_profiles SET certified_status='certified',certificate_ref=$2,city=$3 WHERE id=$1",[old.user_id,action.certificateRef.trim(),old.city]);
    else await db.query('DELETE FROM sessions WHERE user_id=$1',[old.user_id]);
    await logDecision(db,user,'trainer_access_requests',id,decision,comment,old.status,decision);return;
   }
   if(target==='profile') {
    if(!['approved','returned'].includes(decision)) fail('Invalid profile decision');
    const targetId=id;
    if(!targetId) fail('Profile not found',404);
    const result=await db.query("UPDATE trainer_profiles SET status=$2,admin_comment=$3,updated_at=now() WHERE id=$1 AND status='submitted' RETURNING id",[targetId,decision,comment]);
    if(!result.rowCount) fail('Profile is not awaiting review',409);
    await logDecision(db,user,'trainer_profiles',targetId,decision,comment,'submitted',decision);return;
   }
   if(target==='activity') {
    const transitions={approved:['submitted'],returned:['submitted'],published:['approved'],completed:['published'],archived:['verified','approved','published'],unpublished:['published'],cancelled:['approved','published']};
    if(!transitions[decision]) fail('Invalid activity transition');
    const old=(await db.query('SELECT * FROM activities WHERE id=$1 FOR UPDATE',[id])).rows[0];
    if(!old || !transitions[decision].includes(old.status) || (decision==='published' && old.cancelled_at)) fail('Invalid activity transition',409);
    if(decision==='archived' && old.status!=='verified' && !old.cancelled_at) fail('Verify completion or cancel the activity before archiving',409);
    if(decision==='completed' && new Date(old.starts_at)>new Date()) fail('Activity has not happened yet');
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
  const id=action.id || action.activity?.id;
  const existing=(await db.query('SELECT * FROM activities WHERE id=$1 FOR UPDATE',[id])).rows[0];
  if(existing && !admin && existing.created_by!==user.id) fail('Only the activity owner can edit this record',403);
  if(action.type==='ACTIVITY_SAVE') {
   if(existing && (!['draft','returned',...(admin?['approved','published']:[])].includes(existing.status) || existing.cancelled_at)) fail('Activity cannot be edited in this state',409);
   const a=action.activity;
   validateLinks(a.posterUrl);
   await validateFileLinks(db,user,[a.posterUrl]);
   if(!admin && !['Workshop','Seminar'].includes(a.type)) fail('Trainers may submit workshops and seminars only',403);
   if(!a.title?.trim() || !a.description?.trim() || !a.audience?.trim() || !Number.isFinite(Number(a.plannedHours)) || Number(a.plannedHours)<=0 || !a.date || Number.isNaN(Date.parse(a.date))) fail('Complete the required activity fields');
   if(a.registrationLink && !/^https?:\/\//i.test(a.registrationLink)) fail('Registration link must use HTTP or HTTPS');
   const saved=await db.query(`INSERT INTO activities(id,created_by,title,starts_at,type,mode,venue,language,audience,description,registration_link,planned_hours,city,poster_url)
    VALUES($1,$2,$3,$4::timestamp AT TIME ZONE 'Asia/Kuala_Lumpur',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    ON CONFLICT(id) DO UPDATE SET title=excluded.title,starts_at=excluded.starts_at,type=excluded.type,mode=excluded.mode,venue=excluded.venue,language=excluded.language,audience=excluded.audience,description=excluded.description,registration_link=excluded.registration_link,planned_hours=excluded.planned_hours,city=excluded.city,poster_url=excluded.poster_url
    WHERE activities.created_by=$2 OR $15::boolean RETURNING id`,[id,user.id,a.title,a.date,a.type,a.mode,a.venue,a.language,a.audience,a.description,a.registrationLink,a.plannedHours,a.city || '',a.posterUrl || null,admin]);
   if(!saved.rowCount) fail('Only the activity owner can edit this record',403);
   if(a.registrationDeadline && new Date(a.registrationDeadline)>new Date(a.date)) fail('Registration deadline must be before the activity');
   if(a.capacity && (!Number.isInteger(Number(a.capacity)) || Number(a.capacity)<=0)) fail('Capacity must be a positive integer');
   await db.query("UPDATE activities SET registration_deadline=$2::timestamp AT TIME ZONE 'Asia/Kuala_Lumpur',capacity=$3,updated_at=now() WHERE id=$1",[id,a.registrationDeadline || null,a.capacity || null]);
   if(a.trainers) {
    if(!Array.isArray(a.trainers) || (!admin && !a.trainers.length) || new Set(a.trainers.map(t=>t.trainerId)).size!==a.trainers.length || (!admin && !a.trainers.some(t=>t.trainerId===user.id))) fail('Assign distinct trainers and include yourself');
    const eligible=await db.query("SELECT id FROM approved_trainer_accounts WHERE id=ANY($1::uuid[])",[a.trainers.map(t=>t.trainerId)]);
    if(eligible.rowCount!==a.trainers.length) fail('Only certified trainers can be assigned');
    await db.query('DELETE FROM activity_trainers WHERE activity_id=$1',[id]);
   } else if(!admin) await db.query('INSERT INTO activity_trainers(activity_id,trainer_id,role) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[id,user.id,a.role || 'Trainer']);
   if(a.trainers) {
    for(const t of a.trainers) await db.query('INSERT INTO activity_trainers(activity_id,trainer_id,role) VALUES($1,$2,$3) ON CONFLICT(activity_id,trainer_id) DO UPDATE SET role=excluded.role',[id,t.trainerId,t.role]);
   }
   if(admin) await logDecision(db,user,'activities',id,existing && existing.starts_at.toISOString()!==new Date(a.date+'+08:00').toISOString()?'rescheduled':'corrected','',existing?.status || null,existing?.status || 'draft');return;
  }
  if(!existing) fail('Activity not found',404);
  if(action.type==='ACTIVITY_SUBMIT') {
   if(!['draft','returned'].includes(existing.status)) fail('Activity is not editable',409);
   await db.query("UPDATE activities SET status='submitted',admin_comment='' WHERE id=$1",[id]); return;
  }
  if(action.type==='COMPLETION_SAVE' || action.type==='COMPLETION_SUBMIT') {
   if(!['published','completed'].includes(existing.status) || existing.cancelled_at || new Date(existing.starts_at)>new Date()) fail('Completion requires a published activity that has happened',409);
   const old=(await db.query('SELECT * FROM completions WHERE activity_id=$1 FOR UPDATE',[id])).rows[0];
   if(old && ['submitted','verified'].includes(old.status)) fail('Completion is locked for review',409);
   const v=action.values;
   if(!v) fail('Save the completion details before submitting');
   validateLinks(null,v.photos || []);
   await validateFileLinks(db,user,v.photos || []);
   if(!v.venue?.trim() || !Number.isInteger(Number(v.participants)) || Number(v.participants)<0 || !Number.isFinite(Number(v.hours)) || Number(v.hours)<=0) fail('Valid venue, participants and hours are required');
   await db.query("INSERT INTO completions(activity_id,actual_venue,participants,actual_hours,photos,status) VALUES($1,$2,$3,$4,$5,'submitted') ON CONFLICT(activity_id) DO UPDATE SET actual_venue=excluded.actual_venue,participants=excluded.participants,actual_hours=excluded.actual_hours,photos=excluded.photos,status='submitted',admin_comment=''",[id,v.venue,v.participants,v.hours,JSON.stringify(v.photos || [])]);
   await db.query("UPDATE activities SET status='completed' WHERE id=$1",[id]); return;
  }
  fail('Unsupported action');
 },user.id);
 return send(res,200,await snapshot(user));
}
