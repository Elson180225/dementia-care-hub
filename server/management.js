import { randomBytes, randomUUID } from 'node:crypto';
import { pool, transaction } from './db.js';
import { body, currentUser, digest, fail } from './auth.js';
import { isAllowedOrigin } from './origin.js';
import { decision } from './decisions.js';
import { recordTypes } from '../shared/admin-records.js';
import { subscriberPool,subscriberTransaction,subscriberAuditTable } from './subscriber-db.js';
import { audienceQuery,subscriberCsv,syncBrevo } from './subscriber-export.js';
import { reminderSettings } from './reminders.js';

function validUrl(value) {
 if(!value) return;
 try {const u=new URL(value);if(!['http:','https:'].includes(u.protocol)) throw new Error();}
 catch {fail('Links must be valid HTTP or HTTPS URLs');}
}
export async function managementHandler(req,res,url,send) {
 const user=await currentUser(req);
 if(user?.role!=='admin') fail('Admin access required',user?403:401);
 if(req.method==='POST' && !isAllowedOrigin(req.headers.origin)) fail('Origin not allowed',403);
 if(url.pathname==='/api/admin/subscribers/export' && req.method==='GET') {
  const rows=(await subscriberPool.query(audienceQuery(Object.fromEntries(url.searchParams)))).rows;
  res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="get-updated-brevo.csv"','Cache-Control':'no-store'});
  return res.end(subscriberCsv(rows));
 }
 if(url.pathname==='/api/admin/subscribers/sync' && req.method==='POST') {
  const rows=(await subscriberPool.query(audienceQuery(await body(req)))).rows;
  const suppressed=(await subscriberPool.query('SELECT email FROM subscribers WHERE unsubscribed_at IS NOT NULL')).rows;
  return send(res,200,await syncBrevo(rows,suppressed));
 }
 if(url.pathname==='/api/admin/subscribers/reminders' && req.method==='GET') {
  const deliveries=(await subscriberPool.query('SELECT activity_id,starts_at,status,attempts,attempted_at,sent_at,provider_message_id,error FROM reminder_deliveries ORDER BY attempted_at DESC LIMIT 50')).rows;
  return send(res,200,{enabled:process.env.REMINDERS_ENABLED==='true',leadHours:reminderSettings().hours,deliveries});
 }
 if(url.pathname==='/api/admin/invitations' && req.method==='POST') {
  const data=await body(req);const email=String(data.email || '').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Enter a valid administrator email');
  const token=randomBytes(32).toString('hex');
  await transaction(async db=>{
   await db.query('INSERT INTO admin_invitations(email,token_hash,created_by) VALUES($1,$2,$3)',[email,digest(token),user.id]);
   await decision(db,user,'admin_invitations',email,'created','Internal administrator invitation issued');
  },user.id);
  return send(res,201,{link:`${process.env.APP_BASE_URL || 'http://localhost:5173'}/admin/signup?invitation=${token}`});
 }
 if(url.pathname==='/api/admin/users' && req.method==='POST') {
  const data=await body(req);
  await transaction(async db=>{
   // Serialize admin access changes to protect the last enabled administrator.
   await db.query("SELECT id FROM users WHERE role='admin' ORDER BY id FOR UPDATE");
   const old=(await db.query('SELECT * FROM users WHERE id=$1 FOR UPDATE',[data.id])).rows[0];
   if(!old) fail('Account not found',404);
   if(typeof data.enabled!=='boolean') fail('Choose enabled or disabled');
   if(!data.enabled && old.role==='admin') {
    if(old.id===user.id) fail('You cannot disable your own administrator account');
    if((await db.query("SELECT id FROM users WHERE role='admin' AND enabled")).rowCount<=1) fail('Keep at least one enabled administrator');
   }
   await db.query('UPDATE users SET enabled=$2 WHERE id=$1',[data.id,data.enabled]);
   if(!data.enabled) await db.query('DELETE FROM sessions WHERE user_id=$1',[data.id]);
   if(old.role==='trainer') {
    if(!['pending','certified','suspended'].includes(data.certifiedStatus)) fail('Invalid certification status');
    if(data.certifiedStatus==='certified' && !data.certificateRef?.trim()) fail('Official certificate reference is required');
    await db.query('UPDATE trainer_profiles SET certified_status=$2,certificate_ref=$3 WHERE id=$1',[data.id,data.certifiedStatus,data.certificateRef?.trim() || null]);
    if(data.certifiedStatus!=='certified') await db.query('DELETE FROM sessions WHERE user_id=$1',[data.id]);
   }
   await decision(db,user,'users',data.id,data.enabled?'enabled':'disabled',data.comment || '',String(old.enabled),String(data.enabled));
  },user.id);
  return send(res,200,{ok:true});
 }
 const kind=url.pathname.split('/')[4];const config=recordTypes[kind];
 if(!config || url.pathname!==`/api/admin/records/${kind}`) fail('Not found',404);
 const recordsPool=kind==='subscribers'?subscriberPool:pool;
 const recordsTransaction=kind==='subscribers'?subscriberTransaction:transaction;
 if(req.method==='GET') return send(res,200,(await recordsPool.query(`SELECT * FROM ${config.table} ORDER BY id DESC LIMIT 500`)).rows);
 if(req.method!=='POST') fail('Method not allowed',405);
 const data=await body(req);
 const id=data.id || randomUUID();
 await recordsTransaction(async db=>{
  const old=(await db.query(`SELECT * FROM ${config.table} WHERE id=$1 FOR UPDATE`,[id])).rows[0];
  if(config.readonlyCreate && !old) fail('Enquiries are created through the contact form');
  if(data.remove) {
   if(!old) fail('Record not found',404);
   if(!['organisations','learning_resources','faqs','content_pages'].includes(kind) || old.publication_status==='published' || old.review_status==='archived') fail('Unpublish and archive this record to retain its history');
   if((await db.query("SELECT 1 FROM audit_log WHERE entity=$1 AND record_id=$2 AND operation='DECISION' AND decision='published'",[kind,id])).rowCount) fail('Previously published records must be archived');
   await db.query(`DELETE FROM ${config.table} WHERE id=$1`,[id]);
   await decision(db,user,kind,id,'deleted',data.comment || 'Removed unpublished draft');return;
  }
  const values={};
  for(const [name,label,type,required] of config.fields) {
   let v=data.values?.[name];
   if(v===undefined) v=old?.[name];
   if(type==='checkbox') {v=!!v;}
   else if(type==='array') {if(!Array.isArray(v)) fail(label+' must be a list');v=v.map(x=>String(x).trim()).filter(Boolean);}
   else if(name==='body') {v=typeof v==='object'?v:{text:String(v || '')};if(!v?.text?.trim()) fail('Content is required');}
   else {
    if(v!==null && v!==undefined && typeof v!=='string') fail(label+' must be text');
    v=String(v || '').trim();
    if(required && !v) fail(label+' is required');
    if(Array.isArray(type) && !type.includes(v)) fail('Choose a valid '+label);
    if(type==='url') validUrl(v);
    if(type==='email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) fail('Enter a valid email');
    if(type==='date' || type==='datetime-local') {
     if(v && Number.isNaN(Date.parse(v))) fail('Enter a valid '+label);
     if(v && type==='datetime-local' && !/(Z|[+-]\d\d:\d\d)$/.test(v)) v+='+08:00';
    }
    if(!v && (name.endsWith('_at') || name==='activity_id' || name.endsWith('_date'))) v=null;
   }
   values[name]=v;
  }
  if('review_status' in values) {
   if(values.review_status==='archived') values.publication_status='unpublished';
   if(values.review_status==='current' && !values.last_reviewed_at) fail('A current record needs a last-reviewed date');
   if(values.publication_status==='published') {
    if(!values.source || !values.last_reviewed_at) fail('Verify source and last-reviewed date before publishing');
    if(kind==='learning_resources' && (!values.copyright_permission || !values.url)) fail('Permission evidence and resource URL are required before publication');
   }
   if(kind!=='faqs') values.status=values.review_status==='archived'?'archived':values.publication_status==='published'?'published':kind==='organisations'?'verified':'approved';
  }
  if(kind==='subscribers' && (!values.consent_at || !values.name || !values.city || !values.state)) fail('Name, locality and opt-in consent evidence are required');
  const names=Object.keys(values);const params=[id,...names.map(k=>k==='body'?JSON.stringify(values[k]):values[k])];
  const sql=old?`UPDATE ${config.table} SET ${names.map((n,i)=>`${n}=$${i+2}`).join(',')} WHERE id=$1`:`INSERT INTO ${config.table}(id,${names.join(',')}) VALUES(${params.map((_,i)=>'$'+(i+1)).join(',')})`;
  await db.query(sql,params);
  const action=values.review_status==='archived'?'archived':values.publication_status==='published'?'published':old?.publication_status==='published'?'unpublished':kind==='subscribers' && values.unsubscribed_at?'unsubscribed':kind==='dcs_certificates' && values.status==='revoked'?'revoked':'corrected';
  await decision(db,user,kind,id,action,values.admin_comment || '',old?.review_status || old?.status || null,values.review_status || values.status || null,kind==='subscribers'?subscriberAuditTable:'audit_log');
 },user.id);
 return send(res,200,{ok:true,id});
}
