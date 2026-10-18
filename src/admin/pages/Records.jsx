import { useEffect, useState } from 'react';
import { api } from '../../trainer-portal/TrainerContext';
import { recordTypes } from '../../../shared/admin-records';
const localDate=value=>value?new Date(value).toLocaleString('sv-SE',{timeZone:'Asia/Kuala_Lumpur'}).replace(' ','T').slice(0,16):'';
export default function Records() {
 const [kind,setKind]=useState('organisations');const [rows,setRows]=useState([]);const [editing,setEditing]=useState(null);
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [search,setSearch]=useState('');const [message,setMessage]=useState('');
 const config=recordTypes[kind];
 async function load(){setRows(await api('/api/admin/records/'+kind));}
 useEffect(()=>{let active=true;api('/api/admin/records/'+kind).then(r=>{if(active)setRows(r);}).catch(e=>{if(active)setError(e.message);});return ()=>{active=false;};},[kind]);
 function open(row={}) {
  const values={};
  for(const [name,,type] of config.fields) {
   const initial=name==='language'?'English':Array.isArray(type)?type[0]:type==='checkbox'?false:type==='array'?[]:'';
   values[name]=type==='datetime-local'?localDate(row[name]):name==='body'?(row.body?.text || ''):row[name]??initial;
  }
  setEditing({id:row.id,values});setError('');setMessage('');
 }
 async function save(event) {
  event.preventDefault();setBusy(true);setError('');
  try {await api('/api/admin/records/'+kind,editing);await load();setEditing(null);setMessage('Record saved to the database.');}catch(e){setError(e.message);}finally{setBusy(false);}
 }
 async function remove(row) {
  setBusy(true);setError('');try {await api('/api/admin/records/'+kind,{id:row.id,remove:true});await load();setMessage('Unpublished draft removed.');}catch(e){setError(e.message);}finally{setBusy(false);}
 }
 function exportSubscribers(){
  const eligible=rows.filter(r=>r.consent_at && !r.unsubscribed_at);const fields=['name','email','city','state','language','consent_at','consent_version'];
  const esc=x=>'"'+String(x??'').replace(/^[=+@-]/,"' $&").replaceAll('"','""')+'"';
  const csv=[fields,...eligible.map(r=>fields.map(f=>r[f]))].map(r=>r.map(esc).join(',')).join('\r\n');
  const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));link.download='opt-in-subscribers.csv';link.click();URL.revokeObjectURL(link.href);
 }
 return <><h1>Content, directory and project records</h1><label className="tp-field">Record type<select value={kind} onChange={e=>{setKind(e.target.value);setEditing(null);setRows([]);setError('');setMessage('');}}>{Object.entries(recordTypes).map(([key,c])=><option key={key} value={key}>{c.label}</option>)}</select></label>
 {error && <p role="alert" className="tp-note">{error}</p>}{message && <p role="status">{message}</p>}
 {editing?<form className="tp-card" onSubmit={save}><h2>{editing.id?'Edit':'Create'} {config.label}</h2>
 {config.fields.map(([name,label,type,required])=>{const value=editing.values[name];const change=v=>setEditing({...editing,values:{...editing.values,[name]:v}});return <label key={name} className="tp-field">{label}{required?' *':''}
 {Array.isArray(type)?<select value={value} onChange={e=>change(e.target.value)}>{type.map(o=><option key={o}>{o}</option>)}</select>:type==='checkbox'?<input type="checkbox" checked={value} onChange={e=>change(e.target.checked)}/>:type==='textarea' || type==='array'?<textarea rows={4} required={required} value={type==='array'?value.join('\n'):value} onChange={e=>change(type==='array'?e.target.value.split('\n'):e.target.value)}/>:<input type={type} required={required} value={value || ''} onChange={e=>change(e.target.value)}/>}</label>;})}
 <div className="tp-actions"><button className="tp-btn" disabled={busy}>Save record</button><button className="tp-btn tp-btn-ghost" type="button" onClick={()=>setEditing(null)}>Cancel</button></div></form>:<>
 <div className="tp-actions">{!config.readonlyCreate && <button className="tp-btn" onClick={()=>open()}>Create {config.label}</button>}{kind==='subscribers' && <button className="tp-btn tp-btn-ghost" onClick={exportSubscribers}>Export opted-in subscribers</button>}</div>
 <label className="tp-field">Search records<input value={search} onChange={e=>setSearch(e.target.value)}/></label>
 <ul className="tp-cards">{rows.filter(r=>JSON.stringify(r).toLowerCase().includes(search.toLowerCase())).map(row=><li className="tp-card" key={row.id}><h2>{row[config.title]}</h2><p>{row.category || row.programme || row.language} {row.review_status || row.status} {row.publication_status}</p>
 {kind==='enquiries' && <><p>{row.email} | {new Date(row.received_at).toLocaleString('en-MY')}</p><p>{row.type}: {row.message}</p></>}
 {kind==='subscribers' && <p>{row.unsubscribed_at?'Unsubscribed':'Opted in'} | Consent: {row.consent_version}</p>}
 <p>{row.source}</p><button className="tp-btn" onClick={()=>open(row)}>View / edit</button>
 {['organisations','learning_resources','faqs','content_pages'].includes(kind) && row.publication_status!=='published' && row.review_status!=='archived' && <button className="tp-btn tp-btn-ghost" disabled={busy} onClick={()=>remove(row)}>Remove unpublished draft</button>}</li>)}</ul>{!rows.length && <p>No records yet.</p>}</>}
 </>;
}
