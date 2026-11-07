import { pool, transaction } from './db.js';
import { body,currentUser,fail } from './auth.js';
import { isAllowedOrigin } from './origin.js';
import { getLearnEventsData } from './learn-events-content.js';
import { decision } from './decisions.js';
import { applicationStatuses,validateTrackApplication } from '../shared/track-applications.js';

const attempts=new Map();
export async function trackApplicationsHandler(req,res,url,send) {
  const admin=url.pathname==='/api/admin/track-applications';
  let user;
  if(admin){user=await currentUser(req);if(user?.role!=='admin')fail('Admin access required',user?403:401);}
  if(admin && req.method==='GET')return send(res,200,(await pool.query('SELECT * FROM track_applications ORDER BY submitted_at DESC')).rows);
  if(req.method!=='POST')fail('Method not allowed',405);
  if(!isAllowedOrigin(req.headers.origin))fail('Origin not allowed',403);
  if(!admin){
    const now=Date.now(),key=req.socket.remoteAddress;
    for(const [ip,entry] of attempts)if(entry.until<now)attempts.delete(ip);
    const entry=attempts.get(key)||{count:0,until:now+900000};attempts.set(key,entry);
    if(++entry.count>20)fail('Too many submissions. Please try again in 15 minutes.',429);
  }
  const data=await body(req);
  if(admin){
    if(!applicationStatuses.includes(data.status)||!/^[a-f0-9-]{36}$/i.test(data.id || ''))fail('Choose a valid application and status');
    await transaction(async db=>{
      const old=(await db.query('SELECT status FROM track_applications WHERE id=$1 FOR UPDATE',[data.id])).rows[0];
      if(!old)fail('Application not found',404);
      await db.query('UPDATE track_applications SET status=$2,reviewed_by=$3,reviewed_at=now() WHERE id=$1',[data.id,data.status,user.id]);
      await decision(db,user,'track_applications',data.id,data.status,'Application review',old.status,data.status);
    },user.id);
    return send(res,200,{ok:true});
  }
  let values;try{values=validateTrackApplication(data);}catch(e){fail(e.message);}
  const content=await getLearnEventsData();
  const track=content.physicalEducation?.programmes?.find(p=>p.id===values.trackId);
  if(!track || track.registrationOpen===false)fail('This track is not accepting applications. Please contact RCBC.',400);
  await pool.query('INSERT INTO track_applications(track_id,track_title,name,email,phone,role,preferred_language,intake_location,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(track_id,email) DO NOTHING',[track.id,track.title,values.fullName,values.email,values.phone,values.role,values.preferredLanguage,values.intakeLocation,values.notes]);
  // Same acknowledgement for retries without exposing whether an email is already registered.
  return send(res,200,{ok:true});
}
