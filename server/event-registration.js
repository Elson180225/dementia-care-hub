import {pool,transaction} from './db.js';
import {body,currentUser,fail} from './auth.js';
import {isAllowedOrigin} from './origin.js';
import {getLearnEventsData} from './learn-events-content.js';
import {isPlannedProgramme} from '../shared/programme-intakes.js';
import {registrationDuplicates} from '../shared/registration-duplicates.js';
import {createBrevo} from './brevo.js';
import {decision} from './decisions.js';
import {validateEventRegistration,canConfirmRegistration,participantExport,registrationAvailability} from '../shared/event-registration.js';
const attempts=new Map();
export async function eventRegistrationHandler(req,res,url,send){
 const admin=url.pathname==='/api/admin/event-registration';let user;
 if(admin){user=await currentUser(req);if(user?.role!=='admin')fail('Admin access required',user?403:401);}
 if(!['GET','POST'].includes(req.method))fail('Method not allowed',405);
 if(req.method==='POST'&&!isAllowedOrigin(req.headers.origin))fail('Origin not allowed',403);
 const id=url.searchParams.get('activity');if(!/^[a-f0-9-]{36}$/i.test(id||''))fail('Choose an event');
 const activity=(await pool.query('SELECT * FROM activities WHERE id=$1',[id])).rows[0];
 if(!activity||(!admin&&(!activity.published_at||!['published','completed','verified','archived'].includes(activity.status))))fail('Event not found',404);
 const settings=(await pool.query('SELECT * FROM event_registration_settings WHERE activity_id=$1',[id])).rows[0]||{enabled:false,paid:false,website_enabled:true,google_url:'',fee:'',instructions:'',ask_phone:false,ask_notes:false};
 if(!admin&&activity.programme_id){
  const cms=await getLearnEventsData();
  const programme=cms.physicalEducation?.programmes?.find(p=>p.id===activity.programme_id);
  if(!programme||isPlannedProgramme(programme))settings.enabled=false;
 }
 if(req.method==='GET'){
  if(!admin)return send(res,200,{title:activity.title,starts_at:activity.starts_at,configured:!!settings.activity_id,closedReason:registrationAvailability(activity,settings),settings:{enabled:!registrationAvailability(activity,settings),paid:settings.paid,website_enabled:settings.website_enabled,google_url:settings.google_url,fee:settings.paid?settings.fee:'',instructions:settings.paid?settings.instructions:'',generalInstructions:settings.general_instructions||'',ask_phone:settings.ask_phone,ask_notes:settings.ask_notes}});
  const participants=(await pool.query('SELECT p.*,u.name AS removed_by_name,d.status AS confirmation_email_status,d.error AS confirmation_email_error FROM event_participants p LEFT JOIN users u ON u.id=p.removed_by LEFT JOIN event_confirmation_deliveries d ON d.participant_id=p.id WHERE p.activity_id=$1 ORDER BY p.imported_at DESC',[id])).rows;
  if(url.searchParams.get('export')==='csv'){res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="event-registrations.csv"','Cache-Control':'no-store'});return res.end(participantExport(participants.filter(p=>p.status===(url.searchParams.get('scope')==='history'?'cancelled':'registered'))));}
  return send(res,200,{settings,participants});
 }
 const data=await body(req);
 if(!admin){
  const now=Date.now();for(const [key,item]of attempts)if(item.until<now)attempts.delete(key);
  const key=req.socket.remoteAddress,item=attempts.get(key)||{count:0,until:now+900000};attempts.set(key,item);if(++item.count>20)fail('Too many submissions. Try again in 15 minutes.',429);
  if(registrationAvailability(activity,settings)||!settings.website_enabled)fail(registrationAvailability(activity,settings)||'Website registration is not enabled.');
  let values;try{values=validateEventRegistration(data,settings);}catch(e){fail(e.message);}
  const result=await transaction(async db=>{
   // Serialize website submissions and imports for this intake.
   await db.query('SELECT id FROM activities WHERE id=$1 FOR UPDATE',[id]);
   const existing=(await db.query('SELECT email,phone,status FROM event_participants WHERE activity_id=$1',[id])).rows;
   const match=registrationDuplicates(values,existing);
   if(match.email)return {status:409,body:{code:'duplicate-registration',error:'These details match an existing registration for this intake. The original record is retained. Please check your previous submission or contact RCBC for assistance.'}};
   if(match.phone&&data.acknowledgeSharedPhone!==true)return {status:409,body:{code:'shared-phone',error:'This phone number has already been used for this intake. If your family shares a number and this is a different participant, acknowledge the shared number below to continue. Otherwise, check your previous submission or contact RCBC.'}};
   const inserted=await db.query("INSERT INTO event_participants(activity_id,name,email,phone,notes,consent_at,registration_source) VALUES($1,$2,$3,$4,$5,now(),'website') ON CONFLICT(activity_id,email) DO NOTHING RETURNING id",[id,values.name,values.email,values.phone,values.notes]);
   if(!inserted.rowCount)return {status:409,body:{code:'duplicate-registration',error:'These details match an existing registration for this intake. Please contact RCBC for assistance.'}};
   return {status:200,body:{message:'Your submission has been received. RCBC will review it; this is not a confirmation of a place.'}};
  });
  return send(res,result.status,result.body);
 }
 if(data.action==='settings')fail('Registration settings are now managed in the event editor.',409);
 if(!settings.activity_id)fail('Save event registration settings before reviewing participants.');
 if(!/^[a-f0-9-]{36}$/i.test(data.id||''))fail('Invalid participant');
 if(['pending','verify-payment','confirm'].includes(data.action)){
  await transaction(async db=>{
   const p=(await db.query('SELECT * FROM event_participants WHERE id=$1 AND activity_id=$2 FOR UPDATE',[data.id,id])).rows[0];
   if(!p||p.status!=='registered')fail('Choose an active registration');
   if(activity.cancelled_at)fail('This event is cancelled');
   if(data.action==='pending'){
    if(!settings.paid||p.registration_state==='confirmed'||p.payment_verified_at)fail('Only an unverified paid registration can await payment');
    await db.query("UPDATE event_participants SET registration_state='pending-payment' WHERE id=$1",[p.id]);
   }else if(data.action==='verify-payment'){
    if(!settings.paid||p.registration_state!=='pending-payment'||p.payment_verified_at)fail('Move this paid registration to pending payment verification first');
    const reference=String(data.reference||'').trim();if(!reference||reference.length>200)fail('Enter payment verification evidence/reference (up to 200 characters)');
    await db.query('UPDATE event_participants SET payment_reference=$2,payment_verified_by=$3,payment_verified_at=now() WHERE id=$1',[p.id,reference,user.id]);
   }else{
    if(!canConfirmRegistration(settings,p))fail('RCBC must verify payment before confirmation');
    await db.query("UPDATE event_participants SET registration_state='confirmed',confirmed_by=$2,confirmed_at=coalesce(confirmed_at,now()) WHERE id=$1",[p.id,user.id]);
   }
   await decision(db,user,'event_participants',p.id,data.action,'Event registration review');
  },user.id);return send(res,200,{ok:true});
 }
 if(data.action!=='confirmation-email')fail('Unknown action');
 if(!process.env.BREVO_API_KEY||!process.env.BREVO_SENDER_EMAIL)fail('Configure Brevo API key and sender before sending');
 const p=(await pool.query("SELECT * FROM event_participants WHERE id=$1 AND activity_id=$2 AND status='registered' AND registration_state='confirmed'",[data.id,id])).rows[0];
 if(!p||activity.cancelled_at||!canConfirmRegistration(settings,p))fail('Only active confirmed registrations can receive confirmation');
 const receipt=await pool.query("INSERT INTO event_confirmation_deliveries(participant_id,status,attempted_by) VALUES($1,'sending',$2) ON CONFLICT DO NOTHING RETURNING participant_id",[p.id,user.id]);
 if(!receipt.rowCount)fail('Confirmation already attempted. Check delivery history and provider logs before any further send.',409);
 try{
  const result=await createBrevo()('/smtp/email',{method:'POST',data:{sender:{email:process.env.BREVO_SENDER_EMAIL,name:process.env.BREVO_SENDER_NAME||'RCBC'},to:[{email:p.email,name:p.name}],subject:'Registration confirmed: '+activity.title,textContent:`Hello ${p.name},\n\nRCBC has confirmed your registration for ${activity.title}.\nDate: ${new Date(activity.starts_at).toLocaleString('en-MY',{timeZone:'Asia/Kuala_Lumpur'})} (Malaysia time)\nVenue: ${activity.venue||'Please contact RCBC for details.'}\n${settings.paid?'Payment verified by RCBC.':'Free event: no payment required.'}\n\nRCBC`}});
  await pool.query("UPDATE event_confirmation_deliveries SET status='sent',provider_id=$2 WHERE participant_id=$1",[p.id,result.messageId||null]);return send(res,200,{message:'Confirmation accepted by email provider.'});
 }catch(e){await pool.query('UPDATE event_confirmation_deliveries SET status=$2,error=$3 WHERE participant_id=$1',[p.id,e.uncertain?'uncertain':'failed',e.message]);fail(e.message,502);}
}
