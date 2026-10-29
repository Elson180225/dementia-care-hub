import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../trainer-portal/TrainerContext';
import { parseParticipantCsv, validateParticipants } from '../../../shared/participants';
import './Participants.css';

export default function Participants() {
  const [params,setParams] = useSearchParams(); const activityId = params.get('activity') || '';
  const [events,setEvents] = useState([]), [data,setData] = useState(null), [csv,setCsv] = useState(null);
  const [mapping,setMapping] = useState({name:'',email:'',phone:''}), [filename,setFilename] = useState('');
  const [error,setError] = useState(''), [notice,setNotice] = useState(''), [busy,setBusy] = useState(false);
  const [query,setQuery] = useState(''), [selected,setSelected] = useState([]), [subject,setSubject] = useState(''), [message,setMessage] = useState('');
  const [confirm,setConfirm] = useState(false);
  const [view,setView] = useState('participants');
  const [filter,setFilter] = useState('all');
  const [page,setPage] = useState(1);
  const endpoint = '/api/admin/participants?activity=' + activityId;
  useEffect(() => { api('/api/admin/participants').then(setEvents).catch(e=>setError(e.message)); },[]);
  useEffect(() => {
    let active = true;
    setData(null);setCsv(null);setSelected([]);setConfirm(false);setError('');setNotice('');setPage(1);setQuery('');setFilter('all');
    if (activityId) api('/api/admin/participants?activity='+activityId).then(result=>{
      if (!active) return;
      setData(result);setSubject('Reminder: '+result.activity.title);
      setMessage(`You registered for ${result.activity.title}.\n\nDate: ${new Date(result.activity.starts_at).toLocaleString('en-MY',{timeZone:'Asia/Kuala_Lumpur'})} (Malaysia time)\nVenue: ${result.activity.venue || 'Please refer to the organiser’s instructions.'}\n\nWe look forward to seeing you.\nRCBC`);
    }).catch(e=>{if(active)setError(e.message);});
    return ()=>{active=false;};
  },[activityId]);
  async function run(action) {
    setBusy(true);setError('');setNotice('');
    try { await action();setData(await api(endpoint)); } catch(e){setError(e.message);} finally{setBusy(false);}
  }
  async function readFile(file) {
    setError('');setCsv(null);setNotice('');
    try {
      if (!file) return;
      if (!file.name.toLowerCase().endsWith('.csv') || file.size > 80000) throw new Error('Choose a CSV file under 80 KB (up to 500 rows).');
      const parsed = parseParticipantCsv(await file.text());setCsv(parsed);setFilename(file.name);
      setMapping(Object.fromEntries(['name','email','phone'].map(field=>[field,String(parsed.headers.findIndex(h=>field==='name'?/name|nama/i.test(h):field==='email'?/email|e-mail|emel/i.test(h):/phone|telephone|contact number|telefon/i.test(h)))])));
    } catch(e){setError(e.message);}
  }
  const preview = csv ? validateParticipants(csv.rows.map(row=>Object.fromEntries(['name','email','phone'].map(field=>[field,row[Number(mapping[field])] || ''])))) : [];
  const valid = preview.filter(row=>!row.error);
  const filtered = data?.participants.filter(p=>(filter==='all'||p.status===filter)&&`${p.name} ${p.email} ${p.phone}`.toLowerCase().includes(query.toLowerCase())) || [];
  const totalPages = Math.max(1,Math.ceil(filtered.length/15));
  const currentPage = Math.min(page,totalPages);
  const visible = filtered.slice((currentPage-1)*15,currentPage*15);
  return <section className="participants-workspace" aria-busy={busy}>
    <header className="pm-heading"><div><span className="pm-eyebrow">EVENT MANAGEMENT</span><h1>Every participant, connected.</h1><p>A welcoming workshop starts with an organised guest list.</p></div><span className="pm-private">Admin workspace</span></header>
    <div className="pm-workshop"><span className="pm-workshop-icon" aria-hidden="true">▦</span><label>Choose your workshop <select value={activityId} disabled={busy} onChange={e=>setParams(e.target.value?{activity:e.target.value}:{})}><option value="">Select a workshop to get started</option>{events.map(event=><option key={event.id} value={event.id}>{event.title} — {new Date(event.starts_at).toLocaleDateString('en-MY',{timeZone:'Asia/Kuala_Lumpur'})}</option>)}</select></label></div>
    {!activityId && <div className="pm-empty"><span aria-hidden="true">✧</span><h2>Bring your participant list together</h2><p>Select a workshop above, import your Google Form responses, and keep everyone informed before the event.</p><ol><li>Choose a workshop</li><li>Import registrations</li><li>Review and send reminders</li></ol></div>}
    {error && <p className="pm-alert pm-alert-error" role="alert">{error}</p>}{notice && <p className="pm-alert pm-alert-success" role="status">{notice}</p>}
    {busy && <p className="pm-alert" role="status">Working on your request. Please keep this page open…</p>}
    {activityId && !data && !error && <p role="status">Loading participants…</p>}
    {data && <>
      <div className="pm-event-heading"><h2>{data.activity.title}</h2><p>{new Date(data.activity.starts_at).toLocaleString('en-MY',{timeZone:'Asia/Kuala_Lumpur'})} · Malaysia time · {data.activity.venue || 'Venue to be confirmed'}</p></div>
      <div className="pm-stats"><article><span>Total participants</span><strong>{data.participants.length}</strong><small>Across all registration statuses</small></article><article><span>Ready for a reminder</span><strong>{data.participants.filter(p=>p.status==='registered').length}</strong><small>Currently registered participants</small></article><article><span>Last import</span><strong className="pm-date">{data.imports[0] ? new Date(data.imports[0].imported_at).toLocaleDateString('en-MY') : 'Not imported yet'}</strong><small>{data.imports[0]?.filename || 'Upload your first response file'}</small></article></div>
      <nav className="pm-tabs" aria-label="Participant management sections">{[['participants','Participant list'],['import','Import registrations'],['reminders','Send a reminder'],['history','Activity history']].map(([key,label])=><button type="button" key={key} aria-current={view===key?'page':undefined} disabled={busy} onClick={()=>setView(key)}>{label}{key==='participants' && <span>{data.participants.length}</span>}</button>)}</nav>
      <div hidden={view!=='import'}>
      <fieldset disabled={busy}><legend>Import registrations</legend><p>Bring registrations from Google Forms into this workshop. Existing participants and cancellation statuses stay unchanged.</p><details className="pm-help"><summary>How do I download my Google Form responses?</summary><ol><li>Open the form and select <strong>Responses → View in Sheets</strong>.</li><li>In Sheets, select <strong>File → Download → Comma-separated values (.csv)</strong>.</li><li>Choose the file below, match the columns, then review before importing.</li></ol></details>
        <div className="pm-upload"><span aria-hidden="true">↥</span><label htmlFor="participant-csv">Choose your response file</label><p id="pm-upload-help">CSV only · Up to 500 rows · Under 80 KB</p><input id="participant-csv" aria-describedby="pm-upload-help" type="file" accept=".csv,text/csv" onChange={e=>readFile(e.target.files[0])}/></div>
        {csv && <><p>{filename} · {csv.rows.length} rows. Match the columns below.</p>{['name','email','phone'].map(field=><label key={field} style={{display:'block',margin:'12px 0'}}>{field === 'phone'?'Phone (optional)':field === 'name'?'Name (required)':'Email (required)'} <select value={mapping[field]} onChange={e=>setMapping({...mapping,[field]:e.target.value})}><option value="-1">Not mapped</option>{csv.headers.map((header,i)=><option key={i} value={i}>{header}</option>)}</select></label>)}
          <p>{valid.length} valid rows; {preview.length-valid.length} invalid or duplicate rows will be excluded. Existing workshop emails will be skipped.</p>
          <div style={{overflowX:'auto',maxHeight:300}}><table className="tp-table"><thead><tr><th>CSV row</th><th>Name</th><th>Email</th><th>Phone</th><th>Validation</th></tr></thead><tbody>{preview.map(p=><tr key={p.row}><td>{p.row}</td><td>{p.name}</td><td>{p.email}</td><td>{p.phone}</td><td>{p.error || 'Ready'}</td></tr>)}</tbody></table></div>
          <button className="tp-btn" disabled={!valid.length || mapping.name===mapping.email} onClick={()=>run(async()=>{const result=await api(endpoint,{action:'import',filename,rows:valid.map(({name,email,phone})=>({name,email,phone}))});setNotice(`${result.added} added; ${result.skipped} existing registrations skipped.`);setCsv(null);})}>Confirm import of {valid.length} valid rows</button>
        </>}
      </fieldset>
      </div><div hidden={view!=='participants'}>
      <fieldset disabled={busy}><legend>Participant list</legend><div className="pm-toolbar"><label>Search participants<input placeholder="Search by name, email or phone" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/></label><label>Registration status<select value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}}><option value="all">All statuses</option><option value="registered">Registered</option><option value="cancelled">Cancelled</option></select></label><button className="tp-btn" onClick={()=>setView('import')}>＋ Import participants</button></div><div className="pm-selection"><span role="status">{selected.length} selected · Maximum 25 per send</span><div><button className="tp-btn tp-btn-ghost" disabled={!visible.some(p=>p.status==='registered')} onClick={()=>{setSelected(visible.filter(p=>p.status==='registered').slice(0,25).map(p=>p.id));setConfirm(false);}}>Select first {Math.min(25,visible.filter(p=>p.status==='registered').length)} registered</button><button className="tp-btn tp-btn-ghost" disabled={!selected.length} onClick={()=>{setSelected([]);setConfirm(false);}}>Clear</button><button className="tp-btn" disabled={!selected.length} onClick={()=>setView('reminders')}>Write reminder →</button></div></div>
        <div style={{overflowX:'auto'}}><table className="tp-table"><thead><tr><th>Select</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th></tr></thead><tbody>{visible.map(p=><tr key={p.id}><td><input type="checkbox" aria-label={'Select '+p.name} checked={selected.includes(p.id)} disabled={p.status!=='registered' || (!selected.includes(p.id)&&selected.length>=25)} onChange={e=>{setConfirm(false);setSelected(e.target.checked?[...selected,p.id]:selected.filter(id=>id!==p.id));}}/></td><td>{p.name}</td><td>{p.email}</td><td>{p.phone}</td><td><button className="tp-btn tp-btn-ghost" onClick={()=>run(async()=>{await api(endpoint,{action:'status',id:p.id,status:p.status==='registered'?'cancelled':'registered'});setSelected(selected.filter(id=>id!==p.id));setConfirm(false);})}>{p.status} — {p.status==='registered'?'cancel':'restore'}</button></td></tr>)}</tbody></table></div>{!visible.length && <p>No matching participants.</p>}
      </fieldset>
      <div className="pm-pagination"><span>{filtered.length} matching participants · Page {currentPage} of {totalPages}</span><div><button className="tp-btn tp-btn-ghost" disabled={busy||currentPage===1} onClick={()=>setPage(currentPage-1)}>Previous</button><button className="tp-btn tp-btn-ghost" disabled={busy||currentPage===totalPages} onClick={()=>setPage(currentPage+1)}>Next</button></div></div>
      </div><div hidden={view!=='reminders'}>
      <fieldset disabled={busy}><legend>Send an event reminder</legend><div className="pm-recipient-note"><strong>{selected.length} recipients selected</strong><p>Choose participants from the list, write your message, then review it before sending.</p><button className="tp-btn tp-btn-ghost" onClick={()=>setView('participants')}>Choose recipients</button></div><p>Reminders go individually to selected registered participants. Add the online joining link below if needed.</p>
        <label style={{display:'block'}}>Subject <input value={subject} maxLength={200} onChange={e=>{setSubject(e.target.value);setConfirm(false);}}/></label>
        <label style={{display:'block'}}>Message <textarea rows={9} style={{width:'100%'}} value={message} maxLength={5000} onChange={e=>{setMessage(e.target.value);setConfirm(false);}}/></label>
        <button className="tp-btn" disabled={!selected.length || !subject.trim() || !message.trim()} onClick={()=>setConfirm(true)}>Review reminder ({selected.length} recipients)</button>
        {confirm && <div className="tp-card"><h3>Confirm reminder</h3><p>To: {data.participants.filter(p=>selected.includes(p.id)).map(p=>p.email).join(', ')}</p><strong>{subject}</strong><p style={{whiteSpace:'pre-wrap'}}>{message}</p><p>Identical messages previously attempted for a recipient are skipped. “Sent” means accepted by the email provider; inbox delivery is not guaranteed.</p><button className="tp-btn" onClick={()=>run(async()=>{const result=await api(endpoint,{action:'remind',ids:selected,subject,message});setNotice(`${result.sent} sent; ${result.failed} failed; ${result.uncertain} uncertain; ${result.skipped} previously attempted messages skipped.`);setConfirm(false);setSelected([]);})}>Confirm and send</button><button className="tp-btn tp-btn-ghost" onClick={()=>setConfirm(false)}>Back to editing</button></div>}
      </fieldset>
      </div><section className="pm-history" hidden={view!=='history'}>
      <h2>Reminder history (latest 100)</h2>{!data.deliveries.length && <p className="pm-alert">No reminders sent yet. Your sending activity will appear here.</p>}<p>For failed, uncertain, or interrupted “sending” entries, check Brevo logs before sending again. Identical attempts are retained to prevent accidental duplicates.</p><div style={{overflowX:'auto'}}><table className="tp-table"><thead><tr><th>Recipient</th><th>Subject</th><th>Status</th><th>Attempted</th><th>Details</th></tr></thead><tbody>{data.deliveries.map(d=><tr key={d.id}><td>{d.email}</td><td>{d.subject}</td><td>{d.status}</td><td>{new Date(d.created_at).toLocaleString()}</td><td>{d.error || d.provider_id || '—'}</td></tr>)}</tbody></table></div>
      <h2>Import history (latest 20)</h2>{data.imports.map(i=><p key={i.id}>{new Date(i.imported_at).toLocaleString()} · {i.filename} · {i.added} added, {i.skipped} existing skipped</p>)}
      {!data.imports.length && <p>No imports yet. Start by uploading your Google Form responses.</p>}</section>
    </>}
  </section>;
}
