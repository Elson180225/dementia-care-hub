import {useEffect,useRef,useState} from 'react';
import {api,useTrainer} from '../../trainer-portal/TrainerContext';
import {columns,parseRegistryCsv,registryCsv,fieldLabels,requiredFields} from '../../../shared/dcs-registry.js';
import {workbookCsv} from '../../../shared/workbook-import.js';
import './DcsRegistry.css';
const endpoint='/api/admin/dcs-registry';
const blank=()=>Object.fromEntries(columns.map(k=>[k,k==='status'?'attended':'']));
function download(csv,name) {const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export default function DcsRegistry() {
 const [data,setData]=useState({rows:[],total:0}),[filters,setFilters]=useState({q:'',programme:'',status:'',location:'',year:''}),[page,setPage]=useState(1),[revision,setRevision]=useState(0);
 const [form,setForm]=useState(blank),[id,setId]=useState(null),[version,setVersion]=useState(null),[review,setReview]=useState(null),[rows,setRows]=useState(null),[preview,setPreview]=useState(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[legacy,setLegacy]=useState({legacyId:'',participant_key:'',intake:'',training_location:'',attendance_date:'',activity_id:'',organiser:'',source_reference:'',assessment_reference:'',evidence_reference:''});

 const {state}=useTrainer();
 const [showEditor,setShowEditor]=useState(false);
 const [showCertificate,setShowCertificate]=useState(false);
 const editorHeading=useRef(null),reviewHeading=useRef(null),feedback=useRef(null);
 const [programmeOptions,setProgrammeOptions]=useState([]);
 useEffect(()=>{
   let active=true;
   api('/api/admin/learn-events-content').then(content=>{
     if(active)setProgrammeOptions((content.physicalEducation?.programmes||[]).map(programme=>programme.code).filter(Boolean));
   }).catch(()=>{ /* Existing and historical programme names can be entered directly. */ });
   return ()=>{active=false;};
 },[]);
 useEffect(()=>{if(showEditor)editorHeading.current?.focus();},[showEditor,id]);
 useEffect(()=>{if(review)reviewHeading.current?.focus();},[review?.id]);
 useEffect(()=>{if(error||notice)feedback.current?.focus();},[error,notice]);
 function startRecord(person){
   setId(null);
   setVersion(null);
   setReview(null);
   setShowCertificate(false);
   setForm({...blank(),...(person&&{participant_key:person.participant_key,name:person.name,email:person.email||''})});
   setShowEditor(true);
   editorHeading.current?.focus();
 }
 const query=new URLSearchParams({...filters,page});
 useEffect(()=>{let active=true;setError('');api(endpoint+'?'+new URLSearchParams({...filters,page})).then(v=>{if(active)setData(v);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[filters,page,revision]);
 async function run(fn) {setBusy(true);setError('');setNotice('');try{await fn();}catch(e){setError(e.message);}finally{setBusy(false);}}
 function refresh(message){setNotice(message);setRevision(v=>v+1);}
 function edit(r){setShowEditor(true);setShowCertificate(Boolean(r.certificate_ref || r.issued_at || r.issuer));setId(r.id);setVersion(r.updated_at);setForm(Object.fromEntries(columns.map(k=>[k,r[k]==null?'':String(r[k]).slice(0,k.endsWith('_date')||k==='issued_at'?10:undefined)])));setReview(null);}
 return <section className="dcs-admin"><h1>DCS Training & Certification Registry</h1><p>Find a participant, add a programme record, or import records from a spreadsheet.</p>
 {error&&<p ref={feedback} tabIndex={-1} role="alert" className="dcs-error">{error}</p>}{notice&&<p ref={feedback} tabIndex={-1} role="status">{notice}</p>}

 <nav className="tp-actions" aria-label="Registry actions">
   <a className="tp-btn tp-btn-ghost" href="#registry-search">Find a participant</a>
   <button type="button" disabled={busy} onClick={()=>startRecord()}>Add programme record</button>
   <a className="tp-btn tp-btn-ghost" href="#registry-import">Import spreadsheet</a>
 </nav>
 <fieldset id="registry-search" disabled={busy}><legend>Search and export</legend><div className="dcs-fields">{['q','programme','location','year'].map(k=><label key={k}>{({q:'Name or certificate number',programme:'Exact programme',location:'Exact training location',year:'Attendance year'})[k]}<input value={filters[k]} onChange={e=>{setPage(1);setFilters({...filters,[k]:e.target.value});}}/></label>)}<label>Status<select value={filters.status} onChange={e=>{setPage(1);setFilters({...filters,status:e.target.value});}}><option value="">All</option><option value="attended">Attended</option><option value="completed">Completed</option></select></label></div><button onClick={()=>run(async()=>download((await api(endpoint+'?'+query+'&export=csv')).csv,'dcs-registry.csv'))}>Export filtered CSV (private data)</button></fieldset>
 <p>{data.total} programme records</p><div className="dcs-table"><table><thead><tr><th>Participant</th><th>Programme / intake</th><th>Training / certificate</th><th>Review</th><th>Actions</th></tr></thead><tbody>{data.rows.map(r=><tr key={r.id}><td>{r.name}<br/>{r.participant_key}<br/>{r.email}</td><td>{r.programme}<br/>{r.intake}<br/>{r.training_location}<br/>{r.attendance_date}</td><td>{r.status}<br/>{r.certificate_ref||'No certificate issued'}</td><td>{r.verified?'Verified':'Unverified'}<br/>{r.public_consent?'Public consent recorded':'No public consent'}<br/>{r.approved_public_display?'Public display approved':'Public display not approved'}</td><td><button disabled={busy} onClick={()=>edit(r)}>Edit</button><button disabled={busy} onClick={()=>{setShowEditor(false);setReview({...r});reviewHeading.current?.focus();}}>Review</button><button disabled={busy} onClick={()=>startRecord(r)}>Add programme</button></td></tr>)}</tbody></table></div>{!data.rows.length&&<p>No records found.</p>}
 <nav aria-label="Registry pages"><button disabled={busy||page===1} onClick={()=>setPage(page-1)}>Previous</button> Page {page} <button disabled={busy||page*20>=data.total} onClick={()=>setPage(page+1)}>Next</button></nav>

 {showEditor&&<form onSubmit={e=>{
   e.preventDefault();
   run(async()=>{
     await api(endpoint,{action:id?'edit':'create',id,expected_updated_at:version,record:form});
     setShowEditor(false);
     refresh('Record saved. Select Review to verify it or approve public display.');
   });
 }}>
   <fieldset disabled={busy}>
     <legend ref={editorHeading} tabIndex={-1}>{id?'Edit programme record':'Add programme record'}</legend>
     <p>{id
       ? 'Changing the participant’s name or email updates all their programme records and clears their public approvals.'
       : 'For a returning participant, search for their record and select Add programme. Check their identity using RCBC records.'}</p>
     <datalist id="registry-programmes">{[...new Set(programmeOptions)].map(code=><option key={code} value={code}/>)}</datalist>
     <div className="dcs-fields">
       {columns.filter(key=>{
         if(key==='completion_date')return form.status==='completed'||Boolean(form.completion_date);
         return showCertificate||!['certificate_ref','issued_at','issuer'].includes(key);
       }).map(key=>{
         const update=e=>setForm({...form,[key]:e.target.value});
         return <label key={key}>
           {key==='activity_id'?'Link to an event (optional)':fieldLabels[key]}
           {requiredFields.includes(key)&&' *'}
           {key==='status'?<select value={form[key]} onChange={update}>
             <option value="attended">Attended</option><option value="completed">Completed</option>
           </select>:key==='activity_id'?<select value={form[key]} onChange={update}>
             <option value="">No linked event</option>
             {form[key]&&!state.activities.some(a=>a.id===form[key])&&<option value={form[key]}>Previously linked event</option>}
             {state.activities.map(a=><option key={a.id} value={a.id}>{a.title} · {a.date?.slice(0,10)}</option>)}
           </select>:<input disabled={key==='participant_key'&&!!id}
             list={key==='programme'?'registry-programmes':undefined}
             type={key.endsWith('_date')||key==='issued_at'?'date':key==='email'?'email':'text'}
             required={requiredFields.includes(key)||(key==='completion_date'&&form.status==='completed')} value={form[key]} onChange={update}/>}
         </label>;
       })}
     </div>
     <div className="tp-actions">
       {form.status==='completed'&&!showCertificate&&<button type="button" onClick={()=>setShowCertificate(true)}>Add certificate details</button>}
       <button type="submit">Save record</button>
       <button type="button" onClick={()=>setShowEditor(false)}>Cancel</button>
     </div>
   </fieldset>
 </form>}
 {review&&<form onSubmit={e=>{e.preventDefault();run(async()=>{await api(endpoint,{action:'review',id:review.id,expected_updated_at:review.updated_at,verified:review.verified,public_consent:review.public_consent,approved_public_display:review.approved_public_display,consent_note:review.consent_note});setReview(null);refresh('Review saved. Public visibility requires all three choices.');});}}><fieldset disabled={busy}><legend ref={reviewHeading} tabIndex={-1}>Review {review.name} — {review.programme}</legend><label><input type="checkbox" checked={review.verified} onChange={e=>setReview({...review,verified:e.target.checked})}/> Training record and any issued certificate verified against source evidence</label><label><input type="checkbox" checked={review.public_consent} onChange={e=>setReview({...review,public_consent:e.target.checked})}/> Participant explicitly consented to public listing</label><label><input type="checkbox" checked={review.approved_public_display} onChange={e=>setReview({...review,approved_public_display:e.target.checked})}/> Approve the following fields for public display</label><p>Public preview: {review.name} · {review.programme} · {review.training_location} · {review.attendance_date} · {review.certificate_ref||'No certificate issued yet'}</p><p>Private review references: organiser {review.organiser}; source {review.source_reference}; assessment {review.assessment_reference||'None'}; evidence {review.evidence_reference||'None'}.</p><label>Consent evidence / source reference<textarea maxLength={2000} required={review.public_consent} value={review.consent_note} onChange={e=>setReview({...review,consent_note:e.target.value})}/></label><button>Save review</button><button type="button" onClick={()=>setReview(null)}>Cancel</button></fieldset></form>}
 <fieldset id="registry-import" disabled={busy}><legend>CSV / Excel import</legend><p>CSV UTF-8 and Excel (.xlsx) supported, up to 1 MB / 500 records. Excel uses the first sheet with the template headings. Imports only add records; approval columns are never accepted.</p><button onClick={()=>download(registryCsv([{...blank(),participant_key:'example-001',name:'Example Participant',programme:'DCS',intake:'2026-01',training_location:'Kuching',attendance_date:'2026-01-01',organiser:'RCBC',source_reference:'Attendance register 2026-01'}]),'dcs-registry-template.csv')}>Download CSV template</button><label>Choose CSV or Excel<input type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={e=>{const f=e.target.files[0];setRows(null);setPreview(null);if(!f)return;run(async()=>{if(f.size>1000000)throw new Error('Maximum file size is 1 MB');const parsed=parseRegistryCsv(f.name.toLowerCase().endsWith('.xlsx')?await workbookCsv(await f.arrayBuffer()):await f.text());setRows(parsed);setPreview(await api(endpoint,{action:'preview',rows:parsed}));});}}/></label>{preview&&<><p>{preview.valid?'All rows validated. Commit rechecks current registry data.':'Resolve errors in your CSV and upload again.'}</p><ol>{preview.preview.map(r=><li key={r.row}>Row {r.row}: {r.error||`${r.record.name} / ${r.record.programme} / ${r.record.intake} — ready (unapproved)`}</li>)}</ol><button disabled={!preview.valid} onClick={()=>run(async()=>{const result=await api(endpoint,{action:'commit',rows});setPreview(null);setRows(null);refresh(`${result.added} unapproved records imported.`);})}>Commit validated import</button></>}</fieldset>
 <form onSubmit={e=>{e.preventDefault();run(async()=>{await api(endpoint,{action:'backfill',...legacy});refresh('Legacy certificate copied as unapproved; original preserved.');});}}><fieldset disabled={busy}><legend>Controlled legacy backfill</legend><p>Copy one valid legacy certificate by ID after identifying the participant. The original is preserved. Verification, consent and public display approval are never copied. Supply confirmed training details below. A completion date must exist on the legacy record.</p>{Object.keys(legacy).map(k=><label key={k}>{fieldLabels[k]}<input type={k==='attendance_date'?'date':'text'} required={!['activity_id','assessment_reference','evidence_reference'].includes(k)} value={legacy[k]} onChange={e=>setLegacy({...legacy,[k]:e.target.value})}/></label>)}<button>Copy as unapproved</button></fieldset></form>
 </section>;
}
