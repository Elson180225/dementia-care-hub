import {useEffect,useId,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import './EventRegistration.css';
import {useLanguage} from '../i18n/LanguageContext';
import RegistrationDialog from './RegistrationDialog';

export default function EventRegistration({activityId,onManaged}){
 const {translateContent,t}=useLanguage();
 const text=t.learnEvents.registrationCopy;
 const [formValues,setFormValues]=useState({name:'',email:'',phone:'',notes:'',consent:false});

 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[saved,setSaved]=useState(false),[kind,setKind]=useState('error');
 const notice=useRef(null),formRef=useRef(null),registerButton=useRef(null),noticeId=useId(),formId=useId();
 const [request,setRequest]=useState({id:'',attempt:-1,data:null,error:''}),[retry,setRetry]=useState(0);
 const validId=/^[a-f0-9-]{36}$/i.test(activityId||'');
 const loading=validId&&(request.id!==activityId||request.attempt!==retry);
 useEffect(()=>{
  if(!validId)return;
  let active=true;
  fetch('/api/public/event-registration?activity='+activityId).then(r=>{if(!r.ok)throw Error('Unable to load registration options.');return r.json();}).then(d=>{if(active)setRequest({id:activityId,attempt:retry,data:d,error:''});}).catch(()=>{if(active)setRequest({id:activityId,attempt:retry,data:null,error:text.loadError});});
  return()=>{active=false;};
 },[activityId,validId,retry]);
 const data=request.id===activityId?request.data:null;
 useEffect(()=>{onManaged?.(loading?null:!!data?.configured);},[data,loading,onManaged]);
 useEffect(()=>{if(open)formRef.current?.elements.namedItem('name')?.focus();},[open]);
 useEffect(()=>{if(message){notice.current?.focus({preventScroll:true});notice.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});}},[message]);
 if(loading)return <div className="registration-loading" role="status">{text.loading}</div>;
 if(request.id===activityId&&request.error)return <div className="registration-load-error" role="alert"><p>{request.error}</p><button type="button" onClick={()=>setRetry(retry+1)}>{text.retry}</button> <Link to="/about/contact">{text.contact}</Link></div>;
 if(!data?.configured)return null;
 if(!data.settings.enabled)return <div className="registration-closed" role="status"><strong>{text.unavailable}</strong><p>{data.closedReason||text.notOpen}</p></div>;
 const copy=translateContent({fee:data.settings.fee,instructions:data.settings.instructions,general_instructions:data.settings.generalInstructions},'registration/'+activityId);
 const s={...data.settings,fee:copy.fee,instructions:copy.instructions,generalInstructions:copy.general_instructions};
 async function submit(e){
  e.preventDefault();const form=new FormData(e.currentTarget);setBusy(true);setMessage('');
  try{
   const response=await fetch('/api/public/event-registration?activity='+activityId,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...Object.fromEntries(form),consent:form.get('consent')==='on'})});
   const result=await response.json();
   if(!response.ok){
    setKind(result.code==='duplicate-phone'?'duplicate':'error');
    setMessage(result.code==='duplicate-phone'?text.duplicateMessage:result.error||text.submitError);return;
   }
   setSaved(true);setKind('success');setMessage(s.paid?text.pendingFootnote:text.confirmedFootnote);
  }catch(error){setKind('error');setMessage(error.message||text.submitError);}
  finally{setBusy(false);}
 }
 const titles={duplicate:text.duplicateTitle,shared:'Is this a shared family phone number?',success:s.paid?text.pendingTitle:text.confirmedTitle,error:text.errorTitle};
 function updateField(e){
  const {name,value,checked,type}=e.target;
  setFormValues(current=>({...current,[name]:type==='checkbox'?checked:value}));
  if(['email','phone'].includes(name)){setMessage('');}
 }
 function editContact(field){formRef.current?.elements.namedItem(field)?.focus();}
 const eventTitle=translateContent({title:data.title},'activities/'+activityId).title;
 const closeRegistration=()=>{if(!busy)setOpen(false);};
 return <section className="event-registration-card event-registration">
  <header className="registration-heading"><div><span className="registration-eyebrow">{text.join}</span><h3>{text.heading}</h3><p>{text.noAccount}</p></div><span className={'registration-fee '+(s.paid?'registration-fee--paid':'')}>{s.paid?s.fee||text.paidProgramme:text.freeAttend}</span></header>
  <div className="registration-explainer"><span aria-hidden="true">ⓘ</span><p>{s.paid?text.paidIntro:text.freeIntro}</p></div>
  {s.generalInstructions&&<p className="registration-instructions">{s.generalInstructions}</p>}
  {s.paid&&s.instructions&&<details className="registration-payment" open><summary>{text.paymentInstructions}</summary><p className="registration-instructions">{s.instructions}</p></details>}
  <div className="registration-entry-actions">{s.website_enabled&&<button ref={registerButton} type="button" className="registration-primary" disabled={busy} onClick={()=>setOpen(true)} aria-haspopup="dialog" aria-controls={open?formId+'-dialog':undefined}>{saved?text.viewStatus:text.complete} <span aria-hidden="true">→</span></button>}{!saved&&s.google_url&&<><a className="registration-primary" href={s.google_url} target="_blank" rel="noreferrer">{text.external} ↗</a><small>{text.externalHelp}</small></>}</div>
  {saved&&<p className="registration-saved-summary" role="status">{s.paid?text.pendingSummary:text.confirmedSummary}</p>}
  {open&&<RegistrationDialog id={formId+'-dialog'} title={eventTitle} busy={busy} onClose={closeRegistration}>
   <div className="registration-window-summary"><strong>{s.paid?s.fee||text.paidProgramme:text.freeAttend}</strong><p>{s.paid?text.paidSummary:text.freeSummary}</p></div>
   {s.generalInstructions&&<p className="registration-instructions">{s.generalInstructions}</p>}
   {s.paid&&s.instructions&&<details className="registration-payment"><summary>{text.paymentInstructions}</summary><p className="registration-instructions">{s.instructions}</p></details>}
  {message&&<div ref={notice} tabIndex={-1} className={'registration-notice registration-notice--'+kind} role={kind==='success'?'status':'alert'} aria-labelledby={noticeId}>
   <span className="registration-notice-icon" aria-hidden="true">{kind==='success'?'✓':'!'}</span>
   <div className="registration-notice-content"><span className="registration-notice-eyebrow">{kind==='success'?text.received:text.check}</span>
    <h4 id={noticeId}>{titles[kind]}</h4>
    <p>{message}</p>
    <div className="registration-notice-actions">
     {!saved&&<button type="button" disabled={busy} onClick={()=>editContact('phone')}>{text.checkPhone} ↓</button>}
     {kind!=='success'&&<Link to="/about/contact">{text.contact} →</Link>}
    </div>
    {kind==='success'&&<p className="registration-notice-footnote">{s.paid?text.pendingFootnote:text.confirmedFootnote}</p>}
   </div>
  </div>}
  <form id={formId} ref={formRef} hidden={saved} aria-busy={busy} onSubmit={submit}>
   <fieldset disabled={busy} className="registration-fieldset"><legend>{text.contactDetails}</legend>
    <p className="registration-form-hint">{text.requiredHint}</p>
    <div className="registration-field-grid">
     <label className="registration-field registration-field-wide" htmlFor={formId+'-name'}>{text.fullName} <span>{text.required}</span><input id={formId+'-name'} name="name" value={formValues.name} onChange={updateField} required maxLength={200} autoComplete="name" placeholder={text.namePlaceholder}/></label>
     <label className={'registration-field '+(!s.ask_phone?'registration-field-wide':'')} htmlFor={formId+'-email'}>{text.emailLabel} <span>{text.required}</span><input id={formId+'-email'} name="email" value={formValues.email} onChange={updateField} required type="email" maxLength={254} autoComplete="email" placeholder="name@example.com" aria-describedby={formId+'-email-help'} /><small id={formId+'-email-help'}>{text.emailHelp}</small></label>
     {s.ask_phone&&<label className="registration-field" htmlFor={formId+'-phone'}>{text.phoneLabel} <span>{text.required}</span><input id={formId+'-phone'} name="phone" aria-invalid={message&&kind==='duplicate'?true:undefined} value={formValues.phone} onChange={updateField} type="tel" required maxLength={80} autoComplete="tel" placeholder="e.g. 012 345 6789"/></label>}
     {s.ask_notes&&<label className="registration-field registration-field-wide" htmlFor={formId+'-notes'}>{text.notesLabel} <span>{text.optional}</span><textarea id={formId+'-notes'} name="notes" value={formValues.notes} onChange={updateField} maxLength={2000} rows={3} placeholder={text.notesPlaceholder}/></label>}
    </div>
    <div className="registration-consent-box"><label className="registration-shared-consent registration-data-consent"><input type="checkbox" name="consent" checked={formValues.consent} onChange={updateField} required/><span>{text.consent}</span></label></div>
    <div className="registration-form-footer"><button type="button" className="registration-secondary" onClick={closeRegistration}>{text.back}</button><button className="registration-primary">{busy?text.submitting:text.submit+' →'}</button></div>
    <p className="registration-form-hint">{s.paid?text.paidFooter:text.freeFooter}</p>
   </fieldset>
  </form>
  {saved&&<button type="button" className="registration-primary" onClick={closeRegistration}>{text.back}</button>}
  </RegistrationDialog>}
 </section>;
}
