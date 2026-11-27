import CertificateEvidenceInput from "./CertificateEvidenceInput";
import FieldInfo, { fieldExample } from "../components/FieldInfo";
import FormFeedback from "../components/FormFeedback";
import { useId, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, useTrainer } from './TrainerContext';
import './AccountForm.css';
export default function AccountForm({role='trainer',signup=false,application=false,forgot=false,reset=false}) {
  const [params]=useSearchParams();const navigate=useNavigate();const {refresh,error:sessionError,clearError}=useTrainer();
  const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [request,setRequest]=useState(null);
  const [fieldErrors,setFieldErrors]=useState({});const [messageTone,setMessageTone]=useState('error');
  const [certificateEvidence,setCertificateEvidence]=useState(null),[readingCertificate,setReadingCertificate]=useState(false),[certificateError,setCertificateError]=useState('');
  const [showPassword,setShowPassword]=useState(false);const passwordId=useId();
  const base=role==='admin'?'/admin':'/trainer-portal';
  const signIn=!signup&&!application&&!forgot&&!reset;
  const resetToken=params.get('token') || '';
  async function submit(event) {
    event.preventDefault();setMessage('');clearError();setMessageTone('error');
    if(readingCertificate || certificateError) {setMessage(certificateError || 'Please wait for the certificate file to finish loading.');return;}
    const errors={};
    for(const input of event.currentTarget.elements) {
    if(!input.name || input.disabled || input.validity?.valid) continue;
    if(input.validity.valueMissing && input.type==='checkbox') errors[input.name]='Please confirm you have read the eligibility and teaching conditions.';
    else if(input.validity.valueMissing) errors[input.name]='Please enter '+({name:'your full name',email:'your email address',password:'your password',confirmPassword:'your password again',city:'your city',certificateRef:'your certificate reference',invitation:'your RCBC invitation code'}[input.name] || 'this information')+'.';
    else if(input.validity.typeMismatch) errors[input.name]='Please enter a valid email address.';
    else if(input.validity.tooShort) errors[input.name]=`Use at least ${input.minLength} characters.`;
    else errors[input.name]='Please check this information.';
    }

    const values=Object.fromEntries(new FormData(event.currentTarget));

    if(reset && values.password !== values.confirmPassword) {
    errors.confirmPassword='The passwords do not match.';
    }

    setFieldErrors(errors);
    if(Object.keys(errors).length) {event.currentTarget.elements.namedItem(Object.keys(errors)[0])?.focus();return;}

    setBusy(true);
    try {
    if(forgot) {
      const result=await api('/api/auth/forgot-password',{email:values.email});
      setMessageTone('success');
      setMessage(result.message);
      return;
    }

    if(reset) {
      const result=await api('/api/auth/reset-password',{token:resetToken,password:values.password});
      setMessageTone('success');
      setMessage(result.message);
      return;
    }

    const intent=event.nativeEvent.submitter?.value;
    const endpoint=application?(intent==='resubmit'?'resubmit':'application'):signup?(role==='admin'?'admin-register':'register'):'login';
    const result=await api('/api/auth/'+endpoint,{...values,role,...((signup && role==='trainer' || endpoint==='resubmit') && certificateEvidence ? {certificateEvidence} : {})});
    setMessageTone('success');
    if(application) {setRequest(result.application);if(intent==='resubmit') setCertificateEvidence(null);setMessage(intent==='resubmit'?'Amendments submitted to RCBC.':'Application status loaded.');}
    else if(signup) {setMessage(result.message);setCertificateEvidence(null);}
    else {await refresh();clearError();navigate(base);}
    }catch(e){setMessageTone('error');setMessage(e.message);}finally{setBusy(false);}
  }
  return <div className={(signIn||forgot||reset)?`account-shell account-shell-${role}`:'account-secondary'}>
  <section className="tp-card account-form-card">
  {(signIn||forgot||reset)&&<div className="account-form-intro"><Link to={forgot||reset?base:"/"} className="account-home-link">{forgot||reset?'← Back to sign in':'← Back to website'}</Link><span className="account-access-label">{role==='admin'?'ADMINISTRATOR ACCESS':'CERTIFIED TRAINER ACCESS'}</span></div>}
  <h1>{forgot?'Forgot your password?':reset?'Choose a new password':signIn?'Welcome back':role==='admin'?'RCBC Administrative Dashboard':'Certified Trainer Portal'}{!signIn&&!forgot&&!reset&&`: ${application?'Check application':role==='trainer'?'Apply for Trainer Portal Access':'Register'}`}</h1>
  {signIn&&<p className="account-subtitle">Sign in to your {role==='admin'?'administrative dashboard':'trainer portal'}.</p>}
  {forgot&&<p className="account-subtitle">Enter the email address linked to your account. If an eligible account exists, RCBC will send a password reset link.</p>}
  {reset&&<p className="account-subtitle">Enter a new password of at least 15 characters. A short phrase of 3–4 words works well. The reset link can only be used once.</p>}
  {!forgot&&!reset&&<p>{role==='admin'?'Administrator access requires an invitation issued internally by RCBC.':(signup?'All applications are subject to verification and approval by the RCBC Alzheimer’s Care Project team. You will receive an application status update via email within 30 calendar days.':'RCBC verifies identity and certification before granting portal access. Public visitors do not need an account.')}</p>}
  <form onSubmit={submit} noValidate onChange={() => {setFieldErrors({});setMessage('');clearError();}}>
  {signup && <label className="tp-field"><span className="account-field-label">Full name <span className="required-marker" aria-label="required">*</span><FieldInfo label="Full name" example={fieldExample("name")} /></span><input name="name" aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name ? `${passwordId}-name-error` : undefined} required autoComplete="name" maxLength={150}/><FormFeedback id={`${passwordId}-name-error`}>{fieldErrors.name}</FormFeedback></label>}

  {!reset&&<label className="tp-field"><span className="account-field-label">Email <span className="required-marker" aria-label="required">*</span><FieldInfo label="Email" example={fieldExample("email")} /></span><input name="email" aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? `${passwordId}-email-error` : undefined} type="email" required autoComplete="email" maxLength={254}/><FormFeedback id={`${passwordId}-email-error`}>{fieldErrors.email}</FormFeedback></label>}

  {!forgot&&<div className="tp-field">
  <label htmlFor={passwordId}>Password <span className="required-marker" aria-label="required">*</span><FieldInfo label="Password" example={signup||reset ? fieldExample("password") : "Example: enter the password you used to create this account."} /></label>
  <div className="tp-password-row">
  <input id={passwordId} name="password" aria-invalid={!!fieldErrors.password || (signIn && !!message && messageTone==='error')} aria-describedby={fieldErrors.password || (signIn && (message || sessionError)) ? `${passwordId}-feedback` : undefined} type={showPassword?'text':'password'} required minLength={signup||reset?15:1} maxLength={256} autoComplete={signup||reset?'new-password':'current-password'}/>
  <button className="tp-password-eye" type="button" onClick={()=>setShowPassword(value=>!value)} aria-pressed={showPassword} aria-label={showPassword?'Hide password':'Show password'} aria-controls={passwordId} title={showPassword?'Hide password':'Show password'}>
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>
  {showPassword && <path d="m3 3 18 18"/>}
  </svg>
  </button>
  </div>
  <FormFeedback id={`${passwordId}-feedback`} tone={fieldErrors.password ? 'error' : message ? messageTone : 'warning'}>{fieldErrors.password || (signIn ? message || sessionError : '')}</FormFeedback>
  </div>}

  {reset&&<label className="tp-field"><span className="account-field-label">Confirm new password <span className="required-marker" aria-label="required">*</span></span><input name="confirmPassword" type={showPassword?'text':'password'} required minLength={15} maxLength={256} autoComplete="new-password" aria-invalid={!!fieldErrors.confirmPassword}/><FormFeedback>{fieldErrors.confirmPassword}</FormFeedback></label>}

  {(signup && role==='trainer' || application && request && ['submitted','returned'].includes(request.status)) && <>
  <label className="tp-field"><span className="account-field-label">City <span className="required-marker" aria-label="required">*</span><FieldInfo label="City" example={fieldExample("city")} /></span><input name="city" aria-invalid={!!fieldErrors.city} aria-describedby={fieldErrors.city ? `${passwordId}-city-error` : undefined} required defaultValue={request?.city==='Not provided'?'':request?.city || ''}/><FormFeedback id={`${passwordId}-city-error`}>{fieldErrors.city}</FormFeedback></label>
  <label className="tp-field"><span className="account-field-label">Certificate reference <span className="required-marker" aria-label="required">*</span><FieldInfo label="Certificate reference" example={fieldExample("certificateRef")} /></span><input name="certificateRef" aria-invalid={!!fieldErrors.certificateRef} aria-describedby={fieldErrors.certificateRef ? `${passwordId}-certificateRef-error` : undefined} required defaultValue={request?.claimed_certificate_ref==='Not provided'?'':request?.claimed_certificate_ref || ''}/><FormFeedback id={`${passwordId}-certificateRef-error`}>{fieldErrors.certificateRef}</FormFeedback></label><CertificateEvidenceInput value={certificateEvidence} onChange={setCertificateEvidence} onBusyChange={setReadingCertificate} onError={setCertificateError} disabled={busy || readingCertificate} hasExisting={request?.has_certificate_evidence}/></>}

  {signup && role==='admin' && <label className="tp-field"><span className="account-field-label">RCBC invitation code <span className="required-marker" aria-label="required">*</span><FieldInfo label="RCBC invitation code" example={fieldExample("invitation")} /></span><input name="invitation" aria-invalid={!!fieldErrors.invitation} aria-describedby={fieldErrors.invitation ? `${passwordId}-invitation-error` : undefined} required defaultValue={params.get('invitation') || ''} autoComplete="off"/><FormFeedback id={`${passwordId}-invitation-error`}>{fieldErrors.invitation}</FormFeedback></label>}

  {signup && role==='trainer' && <label className="tp-field account-ack"><span><input type="checkbox" name="eligibilityAck" required aria-invalid={!!fieldErrors.eligibilityAck} /> I have read the <Link to={base+'/eligibility'} target="_blank" rel="noopener">eligibility &amp; teaching conditions</Link>. <span className="required-marker" aria-label="required">*</span></span>{fieldErrors.eligibilityAck && <FormFeedback>{fieldErrors.eligibilityAck}</FormFeedback>}</label>}

  <button className="tp-btn account-submit" disabled={busy || readingCertificate || (reset && !resetToken)}>{busy?'Please wait...':forgot?'Send reset link':reset?'Update password':application?'Check status':signup?(role==='trainer'?'Submit application':'Submit registration'):role==='admin'?'Sign in to dashboard':'Sign in to trainer portal'}</button>

  {application && request && ['submitted','returned'].includes(request.status) && <button className="tp-btn tp-btn-ghost" value="resubmit" disabled={busy || readingCertificate}>Submit amendments</button>}
  {(forgot||reset||!signIn) && <FormFeedback tone={message ? messageTone : 'warning'}>{reset&&!resetToken?'This password reset link is incomplete. Request a new link from the sign-in page.':message || sessionError}</FormFeedback>}
  </form>

  {request && <section className="tp-note"><h2>Application: {request.status}</h2><p>{request.admin_comment || 'No admin comment.'}</p></section>}

  <div className="tp-actions account-links">
  {signIn&&<Link to={base+'/forgot-password'}>Forgot password?</Link>}
  {(forgot||reset)&&<Link to={base}>Return to sign in</Link>}
  {!signIn&&!forgot&&!reset&&<Link to={base}>Sign in</Link>}
  {role==='trainer' && !forgot && !reset && <><Link to={base+'/eligibility'}>Check your eligibility &amp; teaching conditions</Link><Link to={base+'/signup'}>Apply for Trainer Portal Access</Link><Link to={base+'/application'}>Check application / submit amendments</Link></>}
  </div>

  {signIn&&<p className="account-footer-note">{role==='admin'?'For authorised RCBC administrators. Please contact your RCBC coordinator if you need an invitation.':'Supporting dementia education and community care across Sarawak.'}</p>}
  </section></div>;
}
