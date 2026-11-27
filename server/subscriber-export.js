import { createBrevo } from './brevo.js';
export function audienceQuery(filters={}) {
 const values=[];let text='SELECT id,name,email,country,city,state FROM subscribers WHERE consent_at IS NOT NULL AND unsubscribed_at IS NULL';
 for(const field of ['country','city','state']) {
  const value=filters[field];
  if(value!==undefined && (typeof value!=='string' || value.length>150)) throw Object.assign(new Error('Invalid audience filter'),{status:400});
  if(value?.trim()){values.push(value.trim());text+=` AND lower(${field})=lower($${values.length})`;}
 }
 return {text:text+' ORDER BY email',values};
}
export function subscriberCsv(rows, { admin = false } = {}) {
 const cell=v=>'"'+String(v ?? '').replace(/^\s*[=+@-]/,"'$&").replaceAll('"','""')+'"';
 const header = ['EMAIL','NAME','COUNTRY','CITY','STATE'];
 if (admin) header.push('STATUS','CONSENT_DATE','CONSENT_VERSION','UNSUBSCRIBED_DATE');
 const data = rows.map(r => {
  const values = [r.email,r.name,r.country,r.city,r.state];
  if (admin) values.push(r.unsubscribed_at ? 'Unsubscribed' : 'Active', r.consent_at?.toISOString(), r.consent_version, r.unsubscribed_at?.toISOString());
  return values;
 });
 return '\uFEFF'+[header,...data].map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n';
}
export async function syncBrevo(active,suppressed,{env=process.env,request=createBrevo({env})}={}) {
 const listId=Number(env.BREVO_LIST_ID);
 if(!Number.isSafeInteger(listId)||listId<1) throw Object.assign(new Error('Configure a positive numeric BREVO_LIST_ID.'),{status:503});
 for(const row of suppressed) await request('/contacts/'+encodeURIComponent(row.email),{method:'PUT',data:{unlinkListIds:[listId]},missing:true});
 for(const row of active) await request('/contacts',{method:'POST',data:{email:row.email,attributes:{NAME:row.name,COUNTRY:row.country || '',CITY:row.city,STATE:row.state},listIds:[listId],updateEnabled:true}});
 return {synced:active.length,suppressed:suppressed.length};
}
