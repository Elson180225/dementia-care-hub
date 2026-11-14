import {useEffect,useId,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import './EventRegistration.css';
import {useLanguage} from '../i18n/LanguageContext';
import RegistrationDialog from './RegistrationDialog';

export default function EventRegistration({activityId,onManaged}){
 const {translateContent}=useLanguage();
 const [formValues,setFormValues]=useState({name:'',email:'',phone:'',notes:'',consent:false});
 const [sharedPhone,setSharedPhone]=useState(false),[acknowledgeSharedPhone,setAcknowledgeSharedPhone]=useState(false);
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[saved,setSaved]=useState(false),[kind,setKind]=useState('error');
 const notice=useRef(null),formRef=useRef(null),registerButton=useRef(null),noticeId=useId(),formId=useId();
 const [request,setRequest]=useState({id:'',attempt:-1,data:null,error:''}),[retry,setRetry]=useState(0);
 const validId=/^[a-f0-9-]{36}$/i.test(activityId||'');
 const loading=validId&&(request.id!==activityId||request.attempt!==retry);
 useEffect(()=>{
  if(!validId)return;
  let active=true;
  fetch('/api/public/event-registration?activity='+activityId).then(r=>{if(!r.ok)throw Error('Unable to load registration options.');return r.json();}).then(d=>{if(active)setRequest({id:activityId,attempt:retry,data:d,error:''});}).catch(()=>{if(active)setRequest({id:activityId,attempt:retry,data:null,error:'We could not load registration options. Please try again.'});});
  return()=>{active=false;};
 },[activityId,validId,retry]);
 const data=request.id===activityId?request.data:null;
 useEffect(()=>{onManaged?.(loading?null:!!data?.configured);},[data,loading,onManaged]);
 useEffect(()=>{if(open)formRef.current?.elements.namedItem('name')?.focus();},[open]);
 useEffect(()=>{if(message){notice.current?.focus({preventScroll:true});notice.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});}},[message]);
 if(loading)return <div className="registration-loading" role="status">Checking registration options…</div>;
 if(request.id===activityId&&request.error)return <div className="registration-load-error" role="alert"><p>{request.error}</p><button type="button" onClick={()=>setRetry(retry+1)}>Try again</button> <Link to="/about/contact">Contact RCBC</Link></div>;
 if(!data?.configured)return null;
 if(!data.settings.enabled)return <div className="registration-closed" role="status"><strong>Registration unavailable</strong><p>{data.closedReason||'Registration is not open.'}</p></div>;
 const copy=translateContent({fee:data.settings.fee,instructions:data.settings.instructions,general_instructions:data.settings.generalInstructions},'registration/'+activityId);
 const s={...data.settings,fee:copy.fee,instructions:copy.instructions,generalInstructions:copy.general_instructions};
 async function submit(e){
  e.preventDefault();const form=new FormData(e.currentTarget);setBusy(true);setMessage('');
  try{
   const response=await fetch('/api/public/event-registration?activity='+activityId,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...Object.fromEntries(form),consent:form.get('consent')==='on',acknowledgeSharedPhone})});
   const result=await response.json();
   if(!response.ok){
    setKind(result.code==='duplicate-registration'?'duplicate':result.code==='shared-phone'?'shared':'error');
    setSharedPhone(result.code==='shared-phone');setAcknowledgeSharedPhone(false);
    setMessage(result.error||'Unable to submit. Please try again.');return;
   }
   setSaved(true);setKind('success');setMessage(result.message);
  }catch(error){setKind('error');setMessage(error.message||'Unable to submit. Please try again.');}
  finally{setBusy(false);}
 }
 const titles={duplicate:'You already have a registration for this intake',shared:'Is this a shared family phone number?',success:'Your registration has been submitted',error:'We could not submit your registration'};
 function updateField(e){
  const {name,value,checked,type}=e.target;
  setFormValues(current=>({...current,[name]:type==='checkbox'?checked:value}));
  if(['email','phone'].includes(name)){setSharedPhone(false);setAcknowledgeSharedPhone(false);setMessage('');}
 }
 function editContact(field){formRef.current?.elements.namedItem(field)?.focus();}
 const eventTitle=translateContent({title:data.title},'activities/'+activityId).title;
 const closeRegistration=()=>{if(!busy)setOpen(false);};
 return <section className="event-registration-card event-registration">
  <header className="registration-heading"><div><span className="registration-eyebrow">Join this event</span><h3>Register for this event</h3><p>No website account is needed.</p></div><span className={'registration-fee '+(s.paid?'registration-fee--paid':'')}>{s.paid?s.fee||'Paid programme':'Free to attend'}</span></header>
  <div className="registration-explainer"><span aria-hidden="true">ⓘ</span><p>{s.paid?'Your place is confirmed only after RCBC reviews your registration and verifies payment.':'This event is free. RCBC will review your registration; no payment is required.'}</p></div>
  {s.generalInstructions&&<p className="registration-instructions">{s.generalInstructions}</p>}
  {s.paid&&s.instructions&&<details className="registration-payment" open><summary>Payment instructions</summary><p className="registration-instructions">{s.instructions}</p></details>}
  <div className="registration-entry-actions">{s.website_enabled&&<button ref={registerButton} type="button" className="registration-primary" disabled={busy} onClick={()=>setOpen(true)} aria-haspopup="dialog" aria-controls={open?formId+'-dialog':undefined}>{saved?'View submission status':'Complete registration form'} <span aria-hidden="true">→</span></button>}{!saved&&!s.website_enabled&&s.google_url&&<><a className="registration-primary" href={s.google_url} target="_blank" rel="noreferrer">Continue to registration ↗</a><small>Opens the organiser’s form in a new tab.</small></>}</div>
  {saved&&<p className="registration-saved-summary" role="status">Your submission has been received. RCBC will review it before confirming a place.</p>}
  {open&&<RegistrationDialog id={formId+'-dialog'} title={eventTitle} busy={busy} onClose={closeRegistration}>
   <div className="registration-window-summary"><strong>{s.paid?s.fee||'Paid programme':'Free to attend'}</strong><p>{s.paid?'Your place is confirmed after RCBC verifies payment and approves your registration.':'No payment is required. RCBC will review your registration.'}</p></div>
   {s.generalInstructions&&<p className="registration-instructions">{s.generalInstructions}</p>}
   {s.paid&&s.instructions&&<details className="registration-payment"><summary>Payment instructions</summary><p className="registration-instructions">{s.instructions}</p></details>}
  {message&&<div ref={notice} tabIndex={-1} className={'registration-notice registration-notice--'+kind} role={kind==='success'?'status':'alert'} aria-labelledby={noticeId}>
   <span className="registration-notice-icon" aria-hidden="true">{kind==='success'?'✓':'!'}</span>
   <div className="registration-notice-content"><span className="registration-notice-eyebrow">{kind==='success'?'Submission received':'Please check before continuing'}</span>
    <h4 id={noticeId}>{titles[kind]}</h4>
    <p>{kind==='duplicate'?'No new registration was created. Your existing record has been kept. Check your previous submission, correct the email below if it was entered incorrectly, or contact RCBC for help.':kind==='shared'?'This phone number is already used for this intake. If another family member shares the number, confirm below to continue. Otherwise, check the phone number or contact RCBC.':message}</p>
    {sharedPhone&&kind==='shared'&&<label className="registration-shared-consent"><input type="checkbox" checked={acknowledgeSharedPhone} disabled={busy} onChange={e=>setAcknowledgeSharedPhone(e.target.checked)}/><span>This is a different participant sharing the phone number.</span></label>}
    <div className="registration-notice-actions">
     {!saved&&<button type="button" disabled={busy} onClick={()=>editContact(kind==='shared'?'phone':'email')}>{kind==='shared'?'Check phone number':'Check email address'} ↓</button>}
     {kind!=='success'&&<Link to="/about/contact">Contact RCBC →</Link>}
    </div>
    {kind==='success'&&<p className="registration-notice-footnote">This submission is not a confirmation of a place. RCBC will review your registration{s.paid?' and verify payment':''}.</p>}
   </div>
  </div>}
  <form id={formId} ref={formRef} hidden={saved} aria-busy={busy} onSubmit={submit}>
   <fieldset disabled={busy} className="registration-fieldset"><legend>Your contact details</legend>
    <p className="registration-form-hint">Fields marked “required” must be completed.</p>
    <div className="registration-field-grid">
     <label className="registration-field registration-field-wide" htmlFor={formId+'-name'}>Full name <span>(required)</span><input id={formId+'-name'} name="name" value={formValues.name} onChange={updateField} required maxLength={200} autoComplete="name" placeholder="Your full name"/></label>
     <label className={'registration-field '+(!s.ask_phone?'registration-field-wide':'')} htmlFor={formId+'-email'}>Email address <span>(required)</span><input id={formId+'-email'} name="email" value={formValues.email} onChange={updateField} required type="email" maxLength={254} autoComplete="email" placeholder="name@example.com" aria-describedby={formId+'-email-help'} aria-invalid={message&&kind==='duplicate'?true:undefined}/><small id={formId+'-email-help'}>RCBC will use this to contact you about the event.</small></label>
     {s.ask_phone&&<label className="registration-field" htmlFor={formId+'-phone'}>Phone number <span>(required)</span><input id={formId+'-phone'} name="phone" value={formValues.phone} onChange={updateField} type="tel" required maxLength={80} autoComplete="tel" placeholder="e.g. 012 345 6789"/></label>}
     {s.ask_notes&&<label className="registration-field registration-field-wide" htmlFor={formId+'-notes'}>Anything RCBC should know? <span>(optional)</span><textarea id={formId+'-notes'} name="notes" value={formValues.notes} onChange={updateField} maxLength={2000} rows={3} placeholder="Add a short note, if needed."/></label>}
    </div>
    <div className="registration-consent-box"><label className="registration-shared-consent registration-data-consent"><input type="checkbox" name="consent" checked={formValues.consent} onChange={updateField} required/><span>I agree that RCBC may use these details to manage this event registration and contact me about it.</span></label></div>
    <div className="registration-form-footer"><button type="button" className="registration-secondary" onClick={closeRegistration}>Back to event details</button><button className="registration-primary" disabled={sharedPhone&&!acknowledgeSharedPhone}>{busy?'Submitting…':sharedPhone?'Continue with shared number':'Submit registration →'}</button></div>
    <p className="registration-form-hint">Submitting this form does not confirm a place. RCBC will review your details{s.paid?' and payment':''}.</p>
   </fieldset>
  </form>
  {saved&&<button type="button" className="registration-primary" onClick={closeRegistration}>Back to event details</button>}
  </RegistrationDialog>}
 </section>;
}
