import { randomBytes } from 'node:crypto';
import { pool } from './db.js';
import { subscriberPool,subscriberTransaction } from './subscriber-db.js';
import { verifyUnsubscribeToken } from './subscriber-tokens.js';
import { body, digest, fail } from './auth.js';
import { isAllowedOrigin } from './origin.js';
const publicColumns={
 organisations:'id,name,category,services,specialist_field,address,city,state,postcode,phone,email,website,languages,opening_hours,eligibility,fees,accepting_volunteers,volunteer_details,support_group,source,source_url,language,last_reviewed_at,review_status',
 learning_resources:'id,activity_id,title,resource_type,topic,language,audience,description,url,source,source_url,last_reviewed_at,review_status',
 content_pages:'id,slug,language,title,body,source,source_url,last_reviewed_at,review_status',
 faqs:'id,slug,language,question,answer,category,source,source_url,last_reviewed_at,review_status',
};
const rates=new Map();
export async function publicRecordsHandler(req,res,url,send) {
 const kind=url.pathname.split('/')[3];
 if(req.method==='GET' && publicColumns[kind]) {
  const category=url.searchParams.get('category');
  const rows=(await pool.query(`SELECT ${publicColumns[kind]} FROM ${kind} WHERE publication_status='published' AND review_status<>'archived' ${kind==='organisations' && category?'AND category=$1':''} ORDER BY id LIMIT 500`,kind==='organisations' && category?[category]:[])).rows;
  return send(res,200,rows);
 }
 if(req.method!=='POST') fail('Not found',404);
 if(!isAllowedOrigin(req.headers.origin)) fail('Origin not allowed',403);
 const now=Date.now();for(const [key,r] of rates) if(r.until<now) rates.delete(key);
 const key=req.socket.remoteAddress;const rate=rates.get(key) || {count:0,until:now+60000};rates.set(key,rate);
 if(++rate.count>20) fail('Too many requests. Try again in a minute.',429);
 const data=await body(req);
 if(kind==='verify-certificate') {
  if(!data.name?.trim() || !data.certificateRef?.trim()) fail('Name and certificate reference are required');
  const match=(await pool.query("SELECT programme,certificate_ref,completion_date,issued_at,issuer,status FROM dcs_certificates WHERE lower(recipient_name)=lower($1) AND certificate_ref=$2 AND verification_consent_at IS NOT NULL",[data.name.trim(),data.certificateRef.trim()])).rows[0];
  return send(res,200,{certificate:match || null});
 }
 if(kind==='unsubscribe') {
  const id=verifyUnsubscribeToken(data.token,process.env.SUBSCRIBER_TOKEN_SECRET);
  if(!id && (typeof data.token!=='string' || !/^[a-f0-9]{64}$/.test(data.token))) fail('Invalid unsubscribe link');
  const r=await subscriberPool.query(`UPDATE subscribers SET unsubscribed_at=coalesce(unsubscribed_at,now()) WHERE ${id?'id':'unsubscribe_hash'}=$1 RETURNING id`,[id || digest(data.token)]);
  if(!r.rowCount) fail('Invalid unsubscribe link');
  return send(res,200,{ok:true});
 }
 if(kind!=='subscribe') fail('Not found',404);
 for(const field of ['name','email','city','state','language']) {
  if(typeof data[field]!=='string' || data[field].trim().length>(field==='email'?254:150)) fail('Enter valid subscriber details');
  data[field]=data[field].trim();
 }
 if(!data.name?.trim() || !data.city?.trim() || !data.state?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '') || !['English','Bahasa Malaysia','Chinese'].includes(data.language) || data.consent!==true) fail('Complete your name, email, city/state, language and opt-in consent');
 const token=randomBytes(32).toString('hex');
 const inserted=await subscriberTransaction(async db=>(await db.query(`INSERT INTO subscribers(name,email,city,state,language,consent_version,consent_at,unsubscribe_hash)
 VALUES($1,$2,$3,$4,$5,'email-updates-v1',now(),$6) ON CONFLICT DO NOTHING RETURNING id`,[data.name.trim(),data.email.trim().toLowerCase(),data.city.trim(),data.state.trim(),data.language,digest(token)])).rowCount);
 // A repeat subscription never silently reactivates a previously unsubscribed record.
 return send(res,200,{ok:true,message:'Request received. Existing subscription preferences are preserved.',unsubscribeLink:inserted?`/get-updated?unsubscribe=${token}`:null});
}
