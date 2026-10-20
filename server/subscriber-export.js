import { createBrevo } from './brevo.js';
export function audienceQuery(filters={}) {
 const values=[];let text='SELECT id,name,email,city,state,language FROM subscribers WHERE consent_at IS NOT NULL AND unsubscribed_at IS NULL';
 for(const field of ['city','state','language']) {
  const value=filters[field];
  if(value!==undefined && (typeof value!=='string' || value.length>150)) throw Object.assign(new Error('Invalid audience filter'),{status:400});
  if(value?.trim()){values.push(value.trim());text+=` AND lower(${field})=lower($${values.length})`;}
 }
 return {text:text+' ORDER BY email',values};
}
export function subscriberCsv(rows) {
 const cell=v=>'"'+String(v ?? '').replace(/^\s*[=+@-]/,"'$&").replaceAll('"','""')+'"';
 return '\uFEFF'+[['EMAIL','NAME','CITY','STATE','LANGUAGE'],...rows.map(r=>[r.email,r.name,r.city,r.state,r.language])].map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n';
}
export async function syncBrevo(active,suppressed,{env=process.env,request=createBrevo({env})}={}) {
 const listId=Number(env.BREVO_LIST_ID);
 if(!Number.isSafeInteger(listId)||listId<1) throw Object.assign(new Error('Configure a positive numeric BREVO_LIST_ID.'),{status:503});
 for(const row of suppressed) await request('/contacts/'+encodeURIComponent(row.email),{method:'PUT',data:{emailBlacklisted:true},missing:true});
 for(const row of active) await request('/contacts',{method:'POST',data:{email:row.email,attributes:{NAME:row.name,CITY:row.city,STATE:row.state,LANGUAGE:row.language},listIds:[listId],updateEnabled:true}});
 return {synced:active.length,suppressed:suppressed.length};
}
