import {useEffect,useRef,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {api,useTrainer} from '../../trainer-portal/TrainerContext';
import {columns,parseRegistryCsv,registryCsv,fieldLabels,requiredFields} from '../../../shared/dcs-registry.js';
import {workbookCsv} from '../../../shared/workbook-import.js';
import './DcsRegistry.css';
const endpoint='/api/admin/dcs-registry';
const blank=()=>Object.fromEntries(columns.map(k=>[k,k==='status'?'attended':'']));
const editorGroups={
 identity:['participant_key','name','email'],
 programme:['programme','intake','status','completion_date','activity_id'],
 training:['training_location','attendance_date','organiser','source_reference','assessment_reference','evidence_reference'],
 certificate:['certificate_ref','issued_at','issuer'],
};
const tabLabels={records:'Find records',add:'Add or edit',review:'Public approval queue',import:'Import spreadsheet',advanced:'Advanced'};
function download(csv,name) {const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function reviewSummary(r) {
 const items=[r.verified?'Verified':'Needs verification',r.public_consent?'Consent recorded':'Consent missing',r.approved_public_display?'Public display approved':'Not on website'];
 return items.join(' · ');
}
export default function DcsRegistry() {
 const [params,setParams]=useSearchParams();
 const initialTab=params.get('tab');
 const [tab,setTab]=useState(()=>(initialTab&&tabLabels[initialTab]?initialTab:'records'));
 useEffect(()=>{const next=params.get('tab');if(next&&tabLabels[next])setTab(next);},[params]);
 const [data,setData]=useState({rows:[],total:0}),[filters,setFilters]=useState({q:'',programme:'',status:'',location:'',year:''}),[page,setPage]=useState(1),[revision,setRevision]=useState(0);
 const [form,setForm]=useState(blank),[id,setId]=useState(null),[version,setVersion]=useState(null),[review,setReview]=useState(null),[rows,setRows]=useState(null),[preview,setPreview]=useState(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[legacy,setLegacy]=useState({legacyId:'',participant_key:'',intake:'',training_location:'',attendance_date:'',activity_id:'',organiser:'',source_reference:'',assessment_reference:'',evidence_reference:''});
 const {state}=useTrainer();
 const [showEditor,setShowEditor]=useState(tab==='add');
 const [showCertificate,setShowCertificate]=useState(false);
 const editorHeading=useRef(null),reviewHeading=useRef(null),feedback=useRef(null);
 const [programmeOptions,setProgrammeOptions]=useState([]);
 useEffect(()=>{
   let active=true;
   api('/api/admin/learn-events-content').then(content=>{
     if(active)setProgrammeOptions((content.physicalEducation?.programmes||[]).map(programme=>programme.code).filter(Boolean));
   }).catch(()=>{});
   return ()=>{active=false;};
 },[]);
 useEffect(()=>{if(showEditor)editorHeading.current?.focus();},[showEditor,id]);
 useEffect(()=>{if(review)reviewHeading.current?.focus();},[review?.id]);
 useEffect(()=>{if(error||notice)feedback.current?.focus();},[error,notice]);
 function selectTab(next) {
   setTab(next);
   setParams(next==='records'?{}:{tab:next},{replace:true});
   if(next==='add'){setShowEditor(true);if(!id&&!showEditor)setForm(blank());}
   if(next!=='add')setShowEditor(false);
   if(next==='review'){setPage(1);setReview(null);}
 }
 function startRecord(person){
   setId(null);setVersion(null);setReview(null);setShowCertificate(false);
   setForm({...blank(),...(person&&{participant_key:person.participant_key,name:person.name,email:person.email||''})});
   setShowEditor(true);selectTab('add');editorHeading.current?.focus();
 }
 const listQuery=new URLSearchParams({...filters,page,...(tab==='review'?{pending:'1'}:{})});
 useEffect(()=>{let active=true;setError('');api(endpoint+'?'+listQuery).then(v=>{if(active)setData(v);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[filters,page,revision,tab]);
 async function run(fn) {setBusy(true);setError('');setNotice('');try{await fn();}catch(e){setError(e.message);}finally{setBusy(false);}}
 function refresh(message){setNotice(message);setRevision(v=>v+1);}
 function edit(r){setShowEditor(true);setShowCertificate(Boolean(r.certificate_ref||r.issued_at||r.issuer));setId(r.id);setVersion(r.updated_at);setForm(Object.fromEntries(columns.map(k=>[k,r[k]==null?'':String(r[k]).slice(0,k.endsWith('_date')||k==='issued_at'?10:undefined)])));setReview(null);selectTab('add');}
 function openReview(r){setShowEditor(false);setReview({...r,consent_note:r.consent_note||''});selectTab('review');}
 const renderField=(key)=>{
  const update=e=>setForm({...form,[key]:e.target.value});
  return <label key={key}>
   {key==='activity_id'?'Link to an event (optional)':fieldLabels[key]}{requiredFields.includes(key)&&' *'}
   {key==='status'?<select value={form[key]} onChange={update}><option value="attended">Attended</option><option value="completed">Completed</option></select>
   :key==='activity_id'?<select value={form[key]} onChange={update}><option value="">No linked event</option>{form[key]&&!state.activities.some(a=>a.id===form[key])&&<option value={form[key]}>Previously linked event</option>}{state.activities.map(a=><option key={a.id} value={a.id}>{a.title} · {a.date?.slice(0,10)}</option>)}</select>
   :<input disabled={key==='participant_key'&&!!id} list={key==='programme'?'registry-programmes':undefined} type={key.endsWith('_date')||key==='issued_at'?'date':key==='email'?'email':'text'} required={requiredFields.includes(key)||(key==='completion_date'&&form.status==='completed')} value={form[key]} onChange={update}/>}
  </label>;
 };
 const registryTable=<><p role="status">{data.total} programme records{tab==='review'?' waiting for public approval':''}</p><div className="dcs-table"><table><thead><tr><th>Participant</th><th>Programme / intake</th><th>Training / certificate</th><th>Review status</th><th>Actions</th></tr></thead><tbody>{data.rows.map(r=><tr key={r.id}><td>{r.name}<br/>{r.participant_key}<br/>{r.email}</td><td>{r.programme}<br/>{r.intake}<br/>{r.training_location}<br/>{r.attendance_date}</td><td>{r.status}<br/>{r.certificate_ref||'No certificate issued'}</td><td>{reviewSummary(r)}</td><td className="dcs-row-actions"><button type="button" disabled={busy} onClick={()=>edit(r)}>Edit</button><button type="button" disabled={busy} className={tab==='review'?'dcs-primary':'dcs-secondary'} onClick={()=>openReview(r)}>Review</button><button type="button" disabled={busy} onClick={()=>startRecord(r)}>Add programme</button></td></tr>)}</tbody></table></div>{!data.rows.length&&<p>{tab==='review'?'No records waiting for approval.':'No records found.'}</p>}<nav aria-label="Registry pages"><button type="button" disabled={busy||page===1} onClick={()=>setPage(page-1)}>Previous</button> Page {page} <button type="button" disabled={busy||page*20>=data.total} onClick={()=>setPage(page+1)}>Next</button></nav></>;
 return <section className="dcs-admin"><h1>DCS Training & Certification Registry</h1><p>Use one task at a time: find records, add training, approve public display, or import a spreadsheet.</p>
 {error&&<p ref={feedback} tabIndex={-1} role="alert" className="dcs-error">{error}</p>}{notice&&<p ref={feedback} tabIndex={-1} role="status" className="dcs-notice">{notice}</p>}
 <nav className="dcs-tabs" aria-label="Registry tasks">{Object.entries(tabLabels).map(([key,label])=><button key={key} type="button" className={tab===key?'is-active':''} aria-current={tab===key?'page':undefined} onClick={()=>selectTab(key)}>{label}</button>)}</nav>

 {(tab==='records'||tab==='review')&&<fieldset disabled={busy} className="dcs-panel"><legend>{tab==='review'?'Records awaiting public approval':'Search and export'}</legend>
  {tab==='review'&&<p className="dcs-help">Only records that still need verification, consent evidence, or website approval appear here. Complete all three steps on Review before a name appears on the public register.</p>}
  <div className="dcs-fields">{['q','programme','location','year'].map(k=><label key={k}>{({q:'Name or certificate number',programme:'Exact programme',location:'Exact training location',year:'Attendance year'})[k]}<input value={filters[k]} onChange={e=>{setPage(1);setFilters({...filters,[k]:e.target.value});}}/></label>)}{tab==='records'&&<label>Status<select value={filters.status} onChange={e=>{setPage(1);setFilters({...filters,status:e.target.value});}}><option value="">All</option><option value="attended">Attended</option><option value="completed">Completed</option></select></label>}</div>
  {tab==='records'&&<button type="button" onClick={()=>run(async()=>download((await api(endpoint+'?'+listQuery+'&export=csv')).csv,'dcs-registry.csv'))}>Export filtered CSV (private data)</button>}
  {registryTable}
  {tab==='records'&&<div className="tp-actions"><button type="button" disabled={busy} onClick={()=>startRecord()}>Add programme record</button></div>}
 </fieldset>}

 {tab==='add'&&(showEditor?<form className="dcs-panel" onSubmit={e=>{e.preventDefault();run(async()=>{await api(endpoint,{action:id?'edit':'create',id,expected_updated_at:version,record:form});setShowEditor(false);selectTab('review');refresh('Record saved. Open the Public approval queue to verify consent before publishing.');});}}>
  <fieldset disabled={busy}>
   <legend ref={editorHeading} tabIndex={-1}>{id?'Edit programme record':'Add programme record'}</legend>
   <p className="dcs-help">{id?'Changing the participant’s name or email updates all their programme records and clears their public approvals.':'For a returning participant, search under Find records and choose Add programme. Match identity using RCBC records.'}</p>
   <datalist id="registry-programmes">{[...new Set(programmeOptions)].map(code=><option key={code} value={code}/>)}</datalist>
   <fieldset className="dcs-subfieldset"><legend>1. Participant</legend><div className="dcs-fields">{editorGroups.identity.map(renderField)}</div></fieldset>
   <fieldset className="dcs-subfieldset"><legend>2. Programme & status</legend><div className="dcs-fields">{editorGroups.programme.filter(key=>key!=='completion_date'||(form.status==='completed'||form.completion_date)).map(renderField)}</div></fieldset>
   <fieldset className="dcs-subfieldset"><legend>3. Training evidence (admin only)</legend><div className="dcs-fields">{editorGroups.training.map(renderField)}</div></fieldset>
   {showCertificate&&<fieldset className="dcs-subfieldset"><legend>4. Certificate (if completed)</legend><div className="dcs-fields">{editorGroups.certificate.map(renderField)}</div></fieldset>}
   <div className="tp-actions">{form.status==='completed'&&!showCertificate&&<button type="button" onClick={()=>setShowCertificate(true)}>Add certificate details</button>}<button type="submit">Save record</button><button type="button" onClick={()=>{setShowEditor(false);selectTab('records');}}>Cancel</button></div>
  </fieldset>
 </form>:<div className="dcs-panel"><p className="dcs-help">Add a new participant record or search under Find records and choose Edit.</p><button type="button" disabled={busy} onClick={()=>startRecord()}>Start new programme record</button></div>)}

 {tab==='review'&&review&&<form className="dcs-panel dcs-review-panel" onSubmit={e=>{e.preventDefault();run(async()=>{await api(endpoint,{action:'review',id:review.id,expected_updated_at:review.updated_at,verified:review.verified,public_consent:review.public_consent,approved_public_display:review.approved_public_display,consent_note:review.consent_note});setReview(null);refresh('Review saved. Public listing requires all three choices and consent evidence.');});}}>
  <fieldset disabled={busy}><legend ref={reviewHeading} tabIndex={-1}>Approve public listing — {review.name} · {review.programme}</legend>
   <ol className="dcs-review-steps">
    <li><label><input type="checkbox" checked={review.verified} onChange={e=>setReview({...review,verified:e.target.checked})}/> Checked against RCBC attendance / certificate evidence</label></li>
    <li><label><input type="checkbox" checked={review.public_consent} onChange={e=>setReview({...review,public_consent:e.target.checked})}/> Participant consented to appear on the public register</label></li>
    <li><label><input type="checkbox" checked={review.approved_public_display} onChange={e=>setReview({...review,approved_public_display:e.target.checked})}/> Approve website display of name, programme, location, date and certificate number</label></li>
   </ol>
   <p><strong>Public preview:</strong> {review.name} · {review.programme} · {review.training_location} · {review.attendance_date} · {review.certificate_ref||'No certificate issued yet'}</p>
   <p className="dcs-help">Private references — organiser {review.organiser}; source {review.source_reference}; assessment {review.assessment_reference||'None'}; evidence {review.evidence_reference||'None'}.</p>
   <label>Consent evidence note<textarea maxLength={2000} required={review.public_consent} value={review.consent_note} onChange={e=>setReview({...review,consent_note:e.target.value})}/></label>
   <div className="tp-actions"><button type="submit">Save review</button><button type="button" onClick={()=>setReview(null)}>Cancel</button></div>
  </fieldset>
 </form>}

 {tab==='import'&&<fieldset disabled={busy} id="registry-import" className="dcs-panel"><legend>CSV / Excel import</legend><p>CSV UTF-8 and Excel (.xlsx) supported, up to 1 MB / 500 records. Imports add unapproved records only.</p><button type="button" onClick={()=>download(registryCsv([{...blank(),participant_key:'example-001',name:'Example Participant',programme:'DCS',intake:'2026-01',training_location:'Kuching',attendance_date:'2026-01-01',organiser:'RCBC',source_reference:'Attendance register 2026-01'}]),'dcs-registry-template.csv')}>Download CSV template</button><label>Choose CSV or Excel<input type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={e=>{const f=e.target.files[0];setRows(null);setPreview(null);if(!f)return;run(async()=>{if(f.size>1000000)throw new Error('Maximum file size is 1 MB');const parsed=parseRegistryCsv(f.name.toLowerCase().endsWith('.xlsx')?await workbookCsv(await f.arrayBuffer()):await f.text());setRows(parsed);setPreview(await api(endpoint,{action:'preview',rows:parsed}));});}}/></label>{preview&&<><p>{preview.valid?'All rows validated. Commit rechecks current registry data.':'Resolve errors in your CSV and upload again.'}</p><ol>{preview.preview.map(r=><li key={r.row}>Row {r.row}: {r.error||`${r.record.name} / ${r.record.programme} / ${r.record.intake} — ready (unapproved)`}</li>)}</ol><button type="button" disabled={!preview.valid} onClick={()=>run(async()=>{const result=await api(endpoint,{action:'commit',rows});setPreview(null);setRows(null);refresh(`${result.added} unapproved records imported. Open Public approval queue when ready.`);selectTab('review');})}>Commit validated import</button></>}</fieldset>}

 {tab==='advanced'&&<form className="dcs-panel" onSubmit={e=>{e.preventDefault();run(async()=>{await api(endpoint,{action:'backfill',...legacy});refresh('Legacy certificate copied as unapproved; original preserved.');});}}><fieldset disabled={busy}><legend>Controlled legacy backfill</legend><p>Copy one valid legacy certificate by ID. Verification and public consent are never copied automatically.</p>{Object.keys(legacy).map(k=><label key={k}>{fieldLabels[k]}<input type={k==='attendance_date'?'date':'text'} required={!['activity_id','assessment_reference','evidence_reference'].includes(k)} value={legacy[k]} onChange={e=>setLegacy({...legacy,[k]:e.target.value})}/></label>)}<button type="submit">Copy as unapproved</button></fieldset></form>}
 </section>;
}
