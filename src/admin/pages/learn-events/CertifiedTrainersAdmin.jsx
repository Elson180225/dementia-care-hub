import {useEffect,useRef,useState} from 'react';
import {useTrainer} from '../../../trainer-portal/TrainerContext';
import UploadField from '../../../trainer-portal/UploadField';
import {ASSESSMENT_LABEL} from '../../../../shared/teaching-eligibility';
import './TrainerGovernance.css';

const steps=[
 {title:'Personal details',hint:'Introduce the trainer'},
 {title:'Check credentials',hint:'Verify RCBC records'},
 {title:'Teaching & access',hint:'Choose what they can do'},
 {title:'Website & consent',hint:'Control what visitors see'},
];
const listingLabels={none:'Not published',requested:'Awaiting approval',approved:'Published',returned:'Changes requested',rejected:'Not approved',suspended:'Hidden'};
const initials=name=>(name||'?').split(/\s+/).map(part=>part[0]).slice(0,2).join('').toUpperCase();
function TrainerField({label,hint,children,wide=false}){
 return <label className={'tg-field'+(wide?' tg-field-wide':'')}><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>;
}
function Choice({title,hint,checked,onChange,disabled=false}){
 return <label className={'tg-choice'+(checked?' is-checked':'')}><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} disabled={disabled}/><span><strong>{title}</strong>{hint&&<small>{hint}</small>}</span></label>;
}
function formValues(p){
 return {...p,name:p.name||'',city:p.city||'',language:p.language||'English',short_profile:p.short_profile||'',qualifications:p.qualifications||'',experience:p.experience||'',photo_url:p.photo_url||'',supporting_documents:p.supporting_documents||[],certificateEvidenceUrl:p.certificateEvidenceUrl||'',certificate_ref:p.certificate_ref||'',certified_status:p.certified_status||'pending',assessment_status:p.assessment_status||'not_assessed',assessment_result:p.assessment_result||'',independent_teaching_scope:p.independent_teaching_scope||'',healthcare_professional:p.healthcare_professional??null,teaching_allowed:!!p.teaching_allowed,teaching_permissions:p.teaching_permissions||[],portal_access_enabled:!!p.portal_access_active,listing_consent:!!p.listing_consent_at,listing_consent_at:p.listing_consent_at?new Date(p.listing_consent_at).toISOString().slice(0,10):'',listing_status:['approved','suspended'].includes(p.listing_status)?p.listing_status:'none',contact_email:p.contact_email||'',contact_phone:p.contact_phone||'',email_consent:!!p.email_consent,phone_consent:!!p.phone_consent,publish_email:!!p.publish_email,publish_phone:!!p.publish_phone,consent_note:p.consent_note||'',account_email:'',initial_password:'',comment:''};
}

export default function CertifiedTrainersAdmin({content}){
 const {state,dispatch,error}=useTrainer();
 const [editing,setEditing]=useState(null),[step,setStep]=useState(0),[query,setQuery]=useState(''),[group,setGroup]=useState('all'),[filter,setFilter]=useState('all');
 const [archiveConfirm,setArchiveConfirm]=useState(false),[archiveReason,setArchiveReason]=useState('');
 const [busy,setBusy]=useState(false),[uploads,setUploads]=useState(0),[notice,setNotice]=useState(''),[creating,setCreating]=useState(false),[withAccount,setWithAccount]=useState(false);
 const archiveHeading=useRef(null);
 const title=useRef(null),feedback=useRef(null),initial=useRef('');
 const dirty=!!editing&&JSON.stringify(editing)!==initial.current;
 useEffect(()=>{if(!dirty)return;const warn=e=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 useEffect(()=>{if(error)feedback.current?.focus();},[error]);
 const locked=busy||uploads>0;
 const scopes=[{id:'Workshop',title:'General workshop'},{id:'Seminar',title:'General seminar'},{id:'RCBC Webinar',title:'RCBC webinar'},{id:'CT Webinar',title:'Trainer webinar'},...(content?.physicalEducation?.programmes||[]).map(p=>({id:p.id,title:p.code||p.title})),{id:'DCS-Family',title:'Standalone DCS-Family event'},{id:'DCS-TTT',title:'Standalone DCS-TTT event'}];
 const all=state.profiles.filter(p=>!p.archived_at),archived=state.profiles.filter(p=>p.archived_at);
 const needsReview=p=>p.status==='submitted'||p.certified_status==='pending'||p.healthcare_professional==null||p.listing_status==='requested';
 const profiles=(filter==='archived'?archived:all).filter(p=>(group==='all'||group===(p.healthcare_professional==null?'unknown':p.healthcare_professional?'hcp':'non-hcp'))&&(filter==='archived'||filter==='all'||filter==='review'&&needsReview(p)||filter==='published'&&p.listing_status==='approved')&&`${p.name} ${p.city} ${p.short_profile}`.toLowerCase().includes(query.toLowerCase()));
 const change=(key,value)=>setEditing(p=>({...p,[key]:value}));
 const onBusyChange=value=>setUploads(n=>n+(value?1:-1));
 function open(p){setArchiveConfirm(false);setArchiveReason('');const values=formValues(p);setEditing(values);initial.current=JSON.stringify(values);setStep(0);setNotice('');requestAnimationFrame(()=>title.current?.focus());}
 function close(){if(!locked&&(!dirty||window.confirm('Leave this trainer without saving your changes?'))){setEditing(null);requestAnimationFrame(()=>title.current?.focus());}}
 function navigate(index){setStep(index);requestAnimationFrame(()=>title.current?.focus());}
 async function save(approveProfile=false){
  setBusy(true);
  try{
   const values={...editing,teaching_permissions:editing.teaching_permissions.map(p=>({...p,modules:p.modules.map(m=>m.trim()).filter(Boolean)})),approveProfile};
   if(await dispatch({type:'ADMIN_TRAINER_SAVE',id:editing.id,values})){
    setNotice(approveProfile?'Profile approved and settings saved. The website follows the visibility settings you selected.':'Settings saved. The approved public profile text has not been replaced.');
    setEditing(null);requestAnimationFrame(()=>title.current?.focus());
   }
  }finally{setBusy(false);}
 }
 async function archiveTrainer(){
  setBusy(true);
  try{if(await dispatch({type:'ADMIN_TRAINER_ARCHIVE',id:editing.id,revision:editing.revision,reason:archiveReason})){
   setNotice(editing.name+' moved to Archived trainers. Website listing, portal access and teaching are off. Historical records are retained.');
   setEditing(null);setArchiveConfirm(false);setArchiveReason('');setFilter('archived');requestAnimationFrame(()=>title.current?.focus());
  }}finally{setBusy(false);}
 }
 async function restoreTrainer(p){
  if(!window.confirm('Restore '+p.name+' to Active trainers? Portal access, teaching permission and website publication will remain off until you approve them separately.'))return;
  setBusy(true);
  try{if(await dispatch({type:'ADMIN_TRAINER_RESTORE',id:p.id,revision:p.revision})){
   setNotice(p.name+' restored. Review the trainer and explicitly approve access, teaching and publication when appropriate.');
   setFilter('all');requestAnimationFrame(()=>title.current?.focus());
  }}finally{setBusy(false);}
 }
 async function create(e){
  e.preventDefault();setBusy(true);
  try{if(await dispatch({type:'ADMIN_TRAINER_CREATE',...Object.fromEntries(new FormData(e.currentTarget))})){
   setCreating(false);setWithAccount(false);setNotice('Trainer added. Choose “Manage trainer” to check their details and set permissions.');
  }}finally{setBusy(false);}
 }
 const text=(key,label,options={})=><TrainerField label={label} hint={options.hint} wide={options.wide}>{options.multiline?<textarea rows={options.rows||4} value={editing[key]} maxLength={5000} onChange={e=>change(key,e.target.value)}/>:<input type={options.type||'text'} value={editing[key]} onChange={e=>change(key,e.target.value)} maxLength={options.type==='email'?254:options.type==='password'?256:200} autoComplete={options.type==='password'?'new-password':undefined}/>}</TrainerField>;
 return <section className="tg-workspace" aria-busy={busy}>
  {!editing?<header className="tg-heading"><div><span className="tg-eyebrow">PEOPLE & TRAINING</span><h2 ref={title} tabIndex={-1}>Certified trainers</h2><p>Keep trainer details up to date and decide who can teach, sign in and appear on the website.</p></div><button type="button" className="tp-btn" disabled={locked} onClick={()=>setCreating(!creating)}>{creating?'Close new trainer form':'+ Add trainer'}</button></header>:<header className="tg-editor-heading"><button type="button" className="tg-back" disabled={locked} onClick={close}>← Back to trainers</button><div className="tg-editor-identity"><span className="tg-avatar" aria-hidden="true">{initials(editing.name)}</span><div><span className="tg-eyebrow">MANAGE TRAINER</span><h2 ref={title} tabIndex={-1}>{editing.name}</h2><p>Changes stay here until you save. Public profile text changes only after approval.</p></div></div></header>}
  {notice&&<p className="tg-notice tg-notice-success" role="status">{notice}</p>}
  {error&&<p ref={feedback} tabIndex={-1} className="tg-notice tg-notice-error" role="alert">{error}</p>}
  {!editing&&<>
   {creating&&<form className="tg-create tg-panel" onSubmit={create}><div className="tg-section-title"><span className="tg-step-number">+</span><div><h3>Add a trainer</h3><p>Start with their name. You can complete the rest afterwards.</p></div></div>
    <div className="tg-form-grid"><TrainerField label="Full name" hint="Required — use the name in RCBC’s records."><input name="name" required maxLength={200} autoComplete="name"/></TrainerField></div>
    <Choice title="Prepare a Trainer Portal account too" hint="Optional. The trainer still needs admin approval before they can sign in." checked={withAccount} onChange={setWithAccount}/>
    {withAccount&&<div className="tg-form-grid"><TrainerField label="Account email"><input name="email" type="email" required autoComplete="email"/></TrainerField><TrainerField label="Initial password" hint="At least 15 characters; a short phrase works well. Share it privately with the trainer."><input name="password" type="password" required autoComplete="new-password" minLength={15} maxLength={256}/></TrainerField></div>}
    <p className="tg-help-note">Adding a record does not publish it, approve teaching or activate sign-in. No email is sent automatically.</p>
    <div className="tg-actions"><button className="tp-btn" disabled={locked}>Add trainer</button><button type="button" className="tp-btn tp-btn-ghost" disabled={locked} onClick={()=>setCreating(false)}>Cancel</button></div>
   </form>}
   <div className="tg-overview" aria-label="Trainer overview">{[{key:'all',label:'Active trainers',count:all.length},{key:'review',label:'Need attention',count:all.filter(needsReview).length},{key:'published',label:'Published',count:all.filter(p=>p.listing_status==='approved').length},{key:'archived',label:'Archived trainers',count:archived.length}].map(item=><button type="button" key={item.key} className={filter===item.key?'is-active':''} aria-pressed={filter===item.key} onClick={()=>setFilter(item.key)}><span>{item.label}</span><strong>{item.count}</strong></button>)}</div>
   <div className="tg-toolbar"><TrainerField label="Find a trainer"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, city or biography" type="search"/></TrainerField><TrainerField label="Background"><select value={group} onChange={e=>setGroup(e.target.value)}><option value="all">All backgrounds</option><option value="hcp">HCP — Healthcare Professional</option><option value="non-hcp">Non-HCP</option><option value="unknown">Not yet classified</option></select></TrainerField></div>
   <p className="tg-results" role="status">{profiles.length} {profiles.length===1?'trainer':'trainers'} shown</p>
   <div className="tg-grid">{profiles.map(p=><article className="tg-card" key={p.id}>
    <div className="tg-card-header"><span className="tg-avatar" aria-hidden="true">{initials(p.name)}</span><span className={'tg-badge '+(needsReview(p)?'tg-badge-amber':'')}>{p.archived_at?'Archived':p.status==='submitted'?'Profile update to review':p.healthcare_professional==null?'Check background':p.healthcare_professional?'HCP':'Non-HCP'}</span></div>
    <h3>{p.name}</h3><p className="tg-card-location">{p.city||'City not recorded'} · {ASSESSMENT_LABEL[p.assessment_status]||'Not assessed'}</p>
    <dl className="tg-card-status"><div><dt>Website</dt><dd>{p.archived_at?'Hidden':listingLabels[p.listing_status]||'Not published'}</dd></div><div><dt>Teaching</dt><dd>{p.teaching_allowed?'Approved scope':'Not approved'}</dd></div><div><dt>Portal</dt><dd>{p.portal_access_active?'Can sign in':'Access off'}</dd></div></dl>
    {p.archived_at&&<p className="tg-import-note">Archived {new Date(p.archived_at).toLocaleDateString('en-MY')}{p.archive_reason?' · '+p.archive_reason:''}</p>}{p.legacy_source_id&&<small className="tg-import-note">Existing record — check against RCBC’s records.</small>}
    {p.archived_at?<button type="button" className="tp-btn tp-btn-ghost" disabled={locked} onClick={()=>restoreTrainer(p)}>Restore trainer</button>:<button type="button" className="tp-btn tp-btn-ghost" disabled={locked} onClick={()=>open(p)}>Manage trainer <span aria-hidden="true">→</span></button>}
   </article>)}</div>
   {!profiles.length&&<div className="tg-empty"><h3>No matching trainers</h3><p>Try a different name or clear your filters.</p><button type="button" className="tp-btn tp-btn-ghost" onClick={()=>{setQuery('');setGroup('all');setFilter('all');}}>Clear filters</button></div>}
  </>}
  {editing&&<>
   <nav className="tg-steps" aria-label="Trainer setup">{steps.map((item,index)=><button type="button" disabled={locked} key={item.title} aria-current={step===index?'step':undefined} onClick={()=>navigate(index)}><span className="tg-step-number">{index+1}</span><span><strong>{item.title}</strong><small>{item.hint}</small></span></button>)}</nav>
   <div className="tg-editor-layout"><div className="tg-editor-main"><fieldset disabled={locked} className="tg-panel tg-step-panel"><legend className="tg-sr-only">{steps[step].title}</legend>
    <div className="tg-section-title"><div><span className="tg-eyebrow">STEP {step+1} OF 4</span><h3>{steps[step].title}</h3><p>{['Introduce the person and add the contact details RCBC uses.','Check the person’s background, certificate and assessment against RCBC’s records.','Teaching permission and website sign-in are two separate choices.','Choose what visitors can see and record the consent RCBC has obtained.'][step]}</p></div></div>
    {step===0&&<><div className="tg-form-grid">{text('name','Full name')}{text('city','City / location')}{text('language','Teaching languages',{wide:true,hint:'For example: English, Bahasa Malaysia and Chinese.'})}{text('contact_email','Contact email',{type:'email',hint:'Kept private unless you choose to publish it in step 4.'})}{text('contact_phone','Contact phone',{hint:'Kept private unless you choose to publish it in step 4.'})}{text('short_profile','Short biography',{multiline:true,wide:true,hint:'A brief introduction for the public profile.'})}{text('qualifications','Qualifications',{multiline:true,wide:true})}{text('experience','Relevant experience',{multiline:true,wide:true})}</div><UploadField kind="photo" label="Profile photograph" value={editing.photo_url} onChange={value=>change('photo_url',value)} onBusyChange={onBusyChange} disabled={busy}/></>}
    {step===1&&<><div className="tg-form-grid">
     <TrainerField label="RCBC verification"><select value={editing.certified_status} onChange={e=>change('certified_status',e.target.value)}><option value="pending">Not yet verified</option><option value="certified">Verified by RCBC</option><option value="suspended">Verification suspended</option></select></TrainerField>
     <TrainerField label="Background" hint="Use RCBC’s confirmed classification."><select value={editing.healthcare_professional===null?'unknown':String(editing.healthcare_professional)} onChange={e=>change('healthcare_professional',e.target.value==='unknown'?null:e.target.value==='true')}><option value="unknown">Not yet classified</option><option value="true">HCP — Healthcare Professional</option><option value="false">Non-HCP</option></select></TrainerField>
     <TrainerField label="Assessment outcome" hint="Record the outcome exactly as confirmed by RCBC."><select value={editing.assessment_status} onChange={e=>change('assessment_status',e.target.value)}>{Object.entries(ASSESSMENT_LABEL).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></TrainerField>
     {text('certificate_ref','Official certificate reference',{hint:'Required for an RCBC-verified record.'})}
     {text('assessment_result','Assessment notes',{multiline:true,wide:true,hint:'Optional details that help RCBC check the outcome.'})}
     </div><p className="tg-help-note">An assessment outcome does not give permission to teach. Set teaching permission in the next step.</p>
     <UploadField kind="document" label="Certificate evidence — private" value={editing.certificateEvidenceUrl} onChange={value=>change('certificateEvidenceUrl',value)} onBusyChange={onBusyChange} disabled={busy}/>
     <details className="tg-disclosure"><summary>Other supporting documents (optional)</summary><UploadField kind="document" label="Supporting documents — private" multiple value={editing.supporting_documents} onChange={value=>change('supporting_documents',value)} onBusyChange={onBusyChange} disabled={busy}/></details>
    </>}
    {step===2&&<><h4>Can this person conduct training?</h4><Choice title="Approve teaching" hint="Allow this person to teach only the programmes you select below. Either HCP or Non-HCP may be approved." checked={editing.teaching_allowed} onChange={value=>change('teaching_allowed',value)}/>
     <details className="tg-disclosure" open={editing.teaching_allowed?true:undefined}><summary>Permitted programmes{editing.teaching_permissions.length?' ('+editing.teaching_permissions.length+' selected)':''}</summary><p className="tg-muted">Choose only programmes approved by RCBC. Module limits are optional.</p>
      <div className="tg-permissions">{scopes.map(scope=>{const permission=editing.teaching_permissions.find(p=>p.scope===scope.id);return <div className="tg-permission" key={scope.id}><Choice title={scope.title} checked={!!permission} onChange={value=>change('teaching_permissions',value?[...editing.teaching_permissions,{scope:scope.id,modules:[]}]:editing.teaching_permissions.filter(p=>p.scope!==scope.id))}/>{permission&&<details className="tg-module-limits"><summary>{permission.modules.some(m=>m.trim())?'Edit module limits':'Limit to specific modules (optional)'}</summary><TrainerField label={'Permitted modules for '+scope.title} hint="One module per line. Leave blank to allow the full programme."><textarea rows={3} value={permission.modules.join('\n')} onChange={e=>change('teaching_permissions',editing.teaching_permissions.map(p=>p.scope===scope.id?{...p,modules:e.target.value.split('\n')}:p))}/></TrainerField></details>}</div>})}</div>
     </details>{text('independent_teaching_scope','Teaching conditions or supervision notes',{multiline:true,hint:'Optional. Record any conditions confirmed by RCBC.'})}
     <div className="tg-section-divider"/><h4>Can this person sign in?</h4><Choice title="Allow Trainer Portal access" hint="Lets the trainer manage their profile and submit activities. This does not publish their profile." checked={editing.portal_access_enabled} onChange={value=>change('portal_access_enabled',value)}/>
     {editing.email?.endsWith('@unclaimed.invalid')&&<details className="tg-disclosure" open={editing.portal_access_enabled?true:undefined}><summary>Set up account credentials</summary><div className="tg-form-grid">{text('account_email','Account email',{type:'email'})}{text('initial_password','Initial password',{type:'password',hint:'At least 15 characters; a short phrase works well. Share privately; no email is sent.'})}</div></details>}
    </>}
    {step===3&&<><TrainerField label="Website visibility" hint="Published profiles appear in the public Certified Trainer Directory."><select value={editing.listing_status} onChange={e=>change('listing_status',e.target.value)}><option value="none">Keep private — not published</option><option value="approved">Publish on the website</option><option value="suspended">Hide an existing listing</option></select></TrainerField>
     <Choice title="Public-profile consent obtained" hint="RCBC has permission to publish this person’s approved profile." checked={editing.listing_consent} onChange={value=>setEditing(p=>({...p,listing_consent:value,...(!value?{publish_email:false,publish_phone:false}:{})}))}/>
     <div className="tg-form-grid">{text('listing_consent_at','Consent obtained on',{type:'date'})}{text('consent_note','Consent note or reference',{multiline:true,hint:'For example: written consent retained by RCBC.'})}</div>
     <details className="tg-disclosure"><summary>Public contact details (optional)</summary><p>Contact information stays private unless both consent and display permission are selected.</p>
      {[['email','Email address',editing.contact_email],['phone','Phone number',editing.contact_phone]].map(([field,label,value])=><div className="tg-contact-permission" key={field}><h4>{label}</h4><p>{value||'No '+label.toLowerCase()+' recorded in step 1.'}</p><Choice title={'Consent to publish '+field} checked={editing[field+'_consent']} onChange={checked=>setEditing(p=>({...p,[field+'_consent']:checked,...(!checked?{['publish_'+field]:false}:{})}))}/><Choice title={'Show '+field+' on the website'} hint="Requires public-profile consent and contact-field consent." checked={editing['publish_'+field]} disabled={!editing.listing_consent||!editing[field+'_consent']} onChange={checked=>change('publish_'+field,checked)}/></div>)}
     </details>
     <details className="tg-disclosure"><summary>Compare with the current approved profile</summary><p>The current public version remains visible while changes await approval.</p><div className="tg-compare"><table className="tp-table"><thead><tr><th>Detail</th><th>Approved version</th><th>Proposed version</th></tr></thead><tbody>{[['name','Name'],['city','City'],['language','Languages'],['short_profile','Biography'],['qualifications','Qualifications'],['experience','Experience'],['contact_email','Email'],['contact_phone','Phone'],['photo_url','Photograph']].map(([key,label])=><tr key={key}><th scope="row">{label}</th><td>{editing.approved_snapshot?.[key]||'Not approved yet'}</td><td>{editing[key]||'Not provided'}</td></tr>)}</tbody></table></div></details>
     {text('comment','Admin note for the approval history',{multiline:true,hint:'Optional. Explain a decision or a change.'})}
    </>}
    <div className="tg-step-actions">{step>0&&<button type="button" className="tp-btn tp-btn-ghost" onClick={()=>navigate(step-1)}>← Previous</button>}{step<3&&<button type="button" className="tp-btn" onClick={()=>navigate(step+1)}>Next: {steps[step+1].title} →</button>}</div>
   </fieldset></div>
   <aside className="tg-preview-column"><div className="tg-panel tg-preview"><span className="tg-eyebrow">WEBSITE PREVIEW</span><small>Proposed profile · not saved yet</small><div className="tg-preview-person">{editing.photo_url?<img src={editing.photo_url} alt="Proposed trainer photograph"/>:<span className="tg-avatar tg-avatar-large" aria-hidden="true">{initials(editing.name)}</span>}<h3>{editing.name||'Trainer name'}</h3><span className="tg-badge">{editing.healthcare_professional===null?'Background not yet confirmed':editing.healthcare_professional?'HCP — Healthcare Professional':'Non-HCP'}</span><p className="tg-muted">{[editing.city,editing.language].filter(Boolean).join(' · ')||'Location and languages'}</p></div>
    <p>{editing.short_profile||'A short biography will appear here.'}</p><dl className="tg-preview-facts"><div><dt>Assessment</dt><dd>{ASSESSMENT_LABEL[editing.assessment_status]}</dd></div><div><dt>Teaching</dt><dd>{editing.teaching_allowed?'Approved within selected scope':'Not approved'}</dd></div></dl>
    {editing.teaching_allowed&&<ul>{editing.teaching_permissions.map(p=><li key={p.scope}>{scopes.find(s=>s.id===p.scope)?.title||p.scope}{p.modules.some(m=>m.trim())?': '+p.modules.filter(Boolean).join(', '):''}</li>)}</ul>}
    {editing.publish_email&&editing.email_consent&&editing.listing_consent&&<p>{editing.contact_email}</p>}{editing.publish_phone&&editing.phone_consent&&editing.listing_consent&&<p>{editing.contact_phone}</p>}
   </div><div className="tg-panel tg-checklist"><h4>Before publishing</h4><ul>{[{label:'RCBC verification and certificate',ready:editing.certified_status==='certified'&&!!editing.certificate_ref.trim()},{label:'HCP / Non-HCP confirmed',ready:editing.healthcare_professional!==null},{label:'Public-profile consent and date',ready:editing.listing_consent&&!!editing.listing_consent_at},{label:'Profile ready for approval',ready:!!editing.name.trim()&&!!editing.city.trim()&&!!editing.short_profile.trim()}].map(item=><li key={item.label}><span aria-hidden="true">{item.ready?'✓':'○'}</span><span>{item.label}<small>{item.ready?'Ready':'Needs attention'}</small></span></li>)}</ul></div></aside>
   </div>
   <footer className="tg-savebar"><div><strong>{dirty?'Unsaved changes':'No changes made'}</strong><p><b>Save changes</b> keeps the approved public text. <b>Approve profile & save</b> replaces it. Website visibility follows step 4.</p></div><div className="tg-actions"><button type="button" className="tp-btn tp-btn-ghost" disabled={locked} onClick={()=>save(true)}>Approve profile & save</button><button type="button" className="tp-btn" disabled={locked} onClick={()=>save(false)}>{busy?'Saving…':'Save changes'}</button></div></footer>
   <section className="tg-archive-panel" aria-labelledby="trainer-archive-title"><div><span className="tg-eyebrow">ARCHIVE & RECOVERY</span><h3 id="trainer-archive-title">Archive this trainer</h3><p>Remove this person from the active list and public website. Portal access and teaching permission will be turned off. Past activities, certificates, verified hours and approval history are kept.</p></div>
    {!archiveConfirm?<button type="button" className="tg-archive-button" disabled={locked} onClick={()=>{setArchiveConfirm(true);requestAnimationFrame(()=>archiveHeading.current?.focus());}}>Archive trainer</button>:
     <div className="tg-archive-confirm" role="group" aria-labelledby="archive-confirm-title"><h4 id="archive-confirm-title" ref={archiveHeading} tabIndex={-1}>Archive {editing.name}?</h4><p>You can restore the record later from Archived trainers. Restoring will not automatically re-enable teaching, portal access or publication.</p>{dirty&&<p className="tg-help-note">Your unsaved edits will not be saved. The existing trainer record will be archived.</p>}<TrainerField label="Reason for archiving (optional)"><textarea rows={3} value={archiveReason} maxLength={2000} onChange={e=>setArchiveReason(e.target.value)} disabled={locked}/></TrainerField><div className="tg-actions"><button type="button" className="tg-archive-button" disabled={locked} onClick={archiveTrainer}>{busy?'Archiving…':'Confirm archive'}</button><button type="button" className="tp-btn tp-btn-ghost" disabled={locked} onClick={()=>setArchiveConfirm(false)}>Cancel</button></div></div>}
   </section>
  </>}
 </section>;
}

