import { useState } from 'react';
import { api } from '../trainer-portal/TrainerContext';
export default function SubscriberAudience() {
 const [filters,setFilters]=useState({city:'',state:'',language:''});
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[reminders,setReminders]=useState(null);
 async function sync() {
  setBusy(true);setMessage('');
  try {const r=await api('/api/admin/subscribers/sync',filters);setMessage(`${r.synced} contacts synced; ${r.suppressed} website opt-outs processed. Select the matching segment before sending campaigns in Brevo.`);}
  catch(e){setMessage(e.message);}finally{setBusy(false);}
 }
 async function status() {
  try {setReminders(await api('/api/admin/subscribers/reminders'));setMessage('');}catch(e){setMessage(e.message);}
 }
 return <section className="tp-card" aria-labelledby="subscriber-audience"><h2 id="subscriber-audience">Get Updated email audience</h2>
  <p>Sync subscribers or download a CSV. Filters add matching contacts to the Brevo list; they do not remove earlier contacts. Website and Brevo opt-outs are preserved.</p>
  {['city','state'].map(field=><label className="tp-field" key={field}>{field==='city'?'City':'State'} (optional)<input maxLength={150} value={filters[field]} onChange={e=>setFilters({...filters,[field]:e.target.value})}/></label>)}
  <label className="tp-field">Preferred language<select value={filters.language} onChange={e=>setFilters({...filters,language:e.target.value})}><option value="">All languages</option>{['English','Bahasa Malaysia','Chinese'].map(x=><option key={x}>{x}</option>)}</select></label>
  <div className="tp-actions"><button className="tp-btn" disabled={busy} onClick={sync}>{busy?'Syncing...':'Sync to Brevo'}</button><a className="tp-btn tp-btn-ghost" href={'/api/admin/subscribers/export?'+new URLSearchParams(filters)}>Download Brevo CSV</a><button className="tp-btn tp-btn-ghost" onClick={status}>Check automatic reminders</button></div>
  <p role="status">{message}</p>
  {reminders && <><h3>Automatic reminders: {reminders.enabled?'enabled':'disabled'}</h3><p>Due {reminders.leadHours} hours before published webinars and seminars. Language must match; in-person events also match city. Filters above apply to manual sync only.</p><p>Sent means accepted by Brevo; check Brevo logs for delivery. Sending or uncertain records require review and are not automatically resent.</p><ul>{reminders.deliveries.map((r,i)=><li key={i}>{r.activity_id} — {new Date(r.starts_at).toLocaleString('en-MY',{timeZone:'Asia/Kuala_Lumpur'})}: {r.status} ({r.attempts} attempts) {r.error || ''}</li>)}</ul>{!reminders.deliveries.length && <p>No reminder attempts yet.</p>}</>}
 </section>;
}
