import {pool,transaction} from './db.js';
import {body,currentUser,fail} from './auth.js';
import {isAllowedOrigin} from './origin.js';
import {webinarReview} from '../shared/webinar-library.js';
import {decision} from './decisions.js';
export async function webinarLibraryHandler(req,res,url,send){
 if(url.pathname==='/api/public/activity-resources'){
  if(req.method!=='GET')fail('Method not allowed',405);
  const id=url.searchParams.get('activity');if(!/^[a-f0-9-]{36}$/i.test(id||''))fail('Choose an activity.');
  const activity=(await pool.query("SELECT id FROM activities WHERE id=$1 AND content_approval_status='approved' AND published_at IS NOT NULL AND status IN ('published','completed','verified','archived')",[id])).rows[0];
  if(!activity)fail('Activity not found',404);
  const rows=(await pool.query("SELECT id,title,resource_type,description,url FROM learning_resources WHERE activity_id=$1 AND publication_status='published' AND review_status='current' ORDER BY title",[id])).rows;
  return send(res,200,rows);
 }
 const user=await currentUser(req);if(user?.role!=='admin')fail('Admin access required',user?403:401);
 if(req.method==='GET')return send(res,200,(await pool.query(`SELECT a.id,a.title,a.type,a.mode,a.starts_at,a.status,a.published_at,a.updated_at,a.content_approval_status,a.content_approved_at,a.source_url,a.speaker_name,a.speaker_intro,a.recording_url,a.qa_url,a.qa_text FROM activities a ORDER BY a.starts_at DESC`)).rows);
 if(req.method!=='POST')fail('Method not allowed',405);
 if(!isAllowedOrigin(req.headers.origin))fail('Origin not allowed',403);
 const data=await body(req);if(!/^[a-f0-9-]{36}$/i.test(data.id||''))fail('Choose an activity.');
 let v;try{v=webinarReview(data);}catch(e){fail(e.message);}
 await transaction(async db=>{
  const old=(await db.query('SELECT * FROM activities WHERE id=$1 FOR UPDATE',[data.id])).rows[0];if(!old)fail('Activity not found',404);
  if(data.revision!==old.updated_at.toISOString())fail('This activity changed. Reload the review before saving.',409);
  if(v.content_approval_status==='approved'&&old.type==='RCBC Webinar'){
   const setting=(await db.query('SELECT paid FROM event_registration_settings WHERE activity_id=$1',[old.id])).rows[0];
   if(setting?.paid)fail('RCBC public education webinars must be free. Update registration settings first.');
   if(!setting)await db.query('INSERT INTO event_registration_settings(activity_id,enabled,paid,website_enabled) VALUES($1,false,false,false)',[old.id]);
  }
  await db.query(`UPDATE activities SET source_url=$2,speaker_name=$3,speaker_intro=$4,recording_url=$5,qa_url=$6,qa_text=$7,content_approval_status=$8,content_approved_by=CASE WHEN $8='approved' THEN $9::uuid ELSE NULL END,content_approved_at=CASE WHEN $8='approved' THEN now() ELSE NULL END,updated_at=now() WHERE id=$1`,[old.id,v.source_url,v.speaker_name,v.speaker_intro,v.recording_url,v.qa_url,v.qa_text,v.content_approval_status,user.id]);
  await decision(db,user,'activities',old.id,v.content_approval_status==='approved'?'content-approved':'content-unpublished','RCBC content and publication permission review',old.content_approval_status,v.content_approval_status);
 },user.id);
 return send(res,200,{ok:true});
}
