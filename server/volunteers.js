import {pool,transaction} from './db.js';
import {body,currentUser,fail} from './auth.js';
import {isAllowedOrigin} from './origin.js';
import {decision} from './decisions.js';
import {validateVolunteer,volunteerFields} from '../shared/volunteer.js';
const rates=new Map();
const enabled=()=>process.env.VOLUNTEER_REGISTRATION_ENABLED==='true' && Boolean(process.env.VOLUNTEER_CONSENT_VERSION?.trim());
export async function volunteersHandler(req,res,url,send){
  const publicRoute=url.pathname==='/api/public/volunteer-registrations';
  if(publicRoute){
    if(req.method==='GET')return send(res,200,{enabled:enabled()});
    if(req.method!=='POST')fail('Method not allowed',405);
    if(!enabled())fail('Registration is closed',503);
    if(!isAllowedOrigin(req.headers.origin))fail('Origin not allowed',403);
    const now=Date.now();for(const [key,value] of rates)if(value.until<now)rates.delete(key);
    const key=req.socket.remoteAddress, rate=rates.get(key)||{count:0,until:now+60000};rates.set(key,rate);if(++rate.count>10)fail('Try again later',429);
    const input=await body(req,16000);
    let data;try{data=validateVolunteer(input);}catch(e){fail(e.message,400);}
    const keys=volunteerFields.map(f=>f.key);
    await pool.query(`INSERT INTO volunteer_registrations (${keys.join(',')},consent_version) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')},$${keys.length+1})`,[...keys.map(k=>data[k]),process.env.VOLUNTEER_CONSENT_VERSION.trim()]);
    return send(res,201,{ok:true});
  }
  const user=await currentUser(req);if(user?.role!=='admin')fail('Admin access required',user?403:401);
  if(req.method==='GET')return send(res,200,(await pool.query('SELECT * FROM volunteer_registrations ORDER BY created_at DESC')).rows);
  if(req.method!=='PATCH')fail('Method not allowed',405);
  if(!isAllowedOrigin(req.headers.origin))fail('Origin not allowed',403);
  const data=await body(req,16000);
  if(!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(data.id||''))fail('Invalid registration');
  if(!['verify','not_verified','pending','withdraw','archive'].includes(data.action))fail('Invalid action');
  await transaction(async db=>{
    const row=(await db.query('SELECT * FROM volunteer_registrations WHERE id=$1 FOR UPDATE',[data.id])).rows[0];if(!row)fail('Registration not found',404);
    if(data.action==='withdraw'||data.action==='archive'){
      if(row.record_status==='archived'||(row.record_status==='withdrawn'&&data.action==='withdraw'))fail('Invalid status change',409);
      const status=data.action==='withdraw'?'withdrawn':'archived';
      await db.query('UPDATE volunteer_registrations SET record_status=$2,withdrawn_at=CASE WHEN $2=\'withdrawn\' THEN now() ELSE withdrawn_at END,updated_at=now() WHERE id=$1',[row.id,status]);
      await decision(db,user,'volunteer_registrations',row.id,data.action,'',row.record_status,status);return;
    }
    if(row.record_status!=='active')fail('Only active registrations can be reviewed',409);
    let certificateId=null;
    if(data.action==='verify'){
      // Baseline's existing certificate registry; no public consent flag is required for authorised internal review.
      const certificate=(await db.query("SELECT id FROM dcs_certificates WHERE lower(trim(recipient_name))=lower(trim($1)) AND lower(trim(certificate_ref))=lower(trim($2)) AND regexp_replace(lower(programme),'[^a-z]','','g')='dcsfamily' AND status='valid'",[row.name,row.certificate])).rows[0];
      if(!certificate)fail('No matching valid DCS–Family certificate in the current registry. Leave pending for review.',409);
      certificateId=certificate.id;
    }
    const status=data.action==='verify'?'verified':data.action;
    await db.query('UPDATE volunteer_registrations SET verification_status=$2,verified_certificate_id=$3,verified_by=$4,verified_at=now(),updated_at=now() WHERE id=$1',[row.id,status,certificateId,user.id]);
    await decision(db,user,'volunteer_registrations',row.id,data.action,'',row.verification_status,status);
  },user.id);
  return send(res,200,{ok:true});
}
