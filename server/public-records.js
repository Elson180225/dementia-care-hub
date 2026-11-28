import { pool } from './db.js';
import { subscriberPool } from './subscriber-db.js';
import { changeSubscription } from './subscriptions.js';
import { contactSettings } from './contact-settings.js';
import { body, fail } from './auth.js';
import { isAllowedOrigin } from './origin.js';
const publicColumns={
 learning_resources:'id,activity_id,qa_folder,title,resource_type,topic,language,audience,description,url,source,source_url,last_reviewed_at,review_status',
 content_pages:'id,slug,language,title,body,source,source_url,last_reviewed_at,review_status',
 faqs:'id,slug,language,question,answer,category,source,source_url,last_reviewed_at,review_status',
};
const rates=new Map();
export async function publicRecordsHandler(req,res,url,send) {
 const kind=url.pathname.split('/')[3];
 if(req.method==='GET' && kind==='contact-settings') return send(res,200,await contactSettings(pool));
 if(req.method==='GET' && kind==='organisations') {
  const category=url.searchParams.get('category');
  const {rows}=await pool.query(
   `SELECT * FROM published_directory ${category ? 'WHERE category=$1' : ''} ORDER BY name,service_type,id`,
   category ? [category] : [],
  );
  return send(res,200,rows);
 }
 if(req.method==='GET' && kind==='learning_resources'){
  const columns=publicColumns[kind].split(',').map((name)=>`learning_resources.${name.trim()}`).join(',');
  const rows=(await pool.query(`SELECT ${columns},EXTRACT(YEAR FROM a.starts_at)::int AS source_year FROM learning_resources LEFT JOIN activities a ON a.id=learning_resources.activity_id WHERE learning_resources.publication_status='published' AND learning_resources.review_status='current' AND EXISTS(SELECT 1 FROM activities act WHERE act.id=learning_resources.activity_id AND act.content_approval_status='approved' AND act.published_at IS NOT NULL AND act.status IN ('published','completed','verified','archived')) ORDER BY learning_resources.id LIMIT 500`)).rows;
  return send(res,200,rows);
 }
 if(req.method==='GET' && publicColumns[kind]) {
  const rows=(await pool.query(`SELECT ${publicColumns[kind]} FROM ${kind} WHERE publication_status='published' AND review_status<>'archived' ${['content_pages','faqs'].includes(kind)?"AND language='English'":''} ORDER BY id LIMIT 500`)).rows;
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
  const match=(await pool.query("SELECT r.programme,r.certificate_ref,r.completion_date,r.issued_at,r.issuer,r.status FROM dcs_registry_records r JOIN dcs_registry_participants p ON p.id=r.participant_id WHERE lower(p.name)=lower($1) AND r.certificate_ref=$2 AND r.verified AND r.public_consent AND r.approved_public_display",[data.name.trim(),data.certificateRef.trim()])).rows[0];
  return send(res,200,{certificate:match || null});
 }
 if(!['unsubscribe','subscribe','resubscribe'].includes(kind)) fail('Not found',404);
 return send(res,200,await changeSubscription(kind,data,subscriberPool));
}
