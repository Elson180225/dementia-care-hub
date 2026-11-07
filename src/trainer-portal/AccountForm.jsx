import { useId, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, useTrainer } from './TrainerContext';
import hopeCareLogo from '../assets/rcbc-alzheimers-care-logo.png';
import './AccountForm.css';
export default function AccountForm({role='trainer',signup=false,application=false}) {
 const [params]=useSearchParams();const navigate=useNavigate();const {refresh}=useTrainer();
 const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [request,setRequest]=useState(null);
 const [showPassword,setShowPassword]=useState(false);const passwordId=useId();
 const base=role==='admin'?'/admin':'/trainer-portal';
 const signIn=!signup&&!application;
 async function submit(event) {
  event.preventDefault();setBusy(true);setMessage('');
  const values=Object.fromEntries(new FormData(event.currentTarget));
  try {
   const intent=event.nativeEvent.submitter?.value;
   const endpoint=application?(intent==='resubmit'?'resubmit':'application'):signup?(role==='admin'?'admin-register':'register'):'login';
   const result=await api('/api/auth/'+endpoint,{...values,role});
   if(application) {setRequest(result.application);setMessage(intent==='resubmit'?'Amendments submitted to RCBC.':'Application status loaded.');}
   else if(signup) setMessage(result.message);
   else {await refresh();navigate(base);}
  }catch(e){setMessage(e.message);}finally{setBusy(false);}
 }
 return <div className={signIn?`account-shell account-shell-${role}`:'account-secondary'}>
 {signIn&&<aside className="account-story" aria-label="RCBC Alzheimer's Care"><Link className="account-brand" to="/" aria-label="RCBC Hope Care home"><img src={hopeCareLogo} alt="Rotary Club of Bintulu Central Hope Care Alzheimer's Care — understanding the missing pieces"/></Link><div className="account-story-copy"><span className="account-eyebrow">ROTARY CLUB OF BINTULU CENTRAL</span><h2>{role==='admin'?'Behind every connection, a caring community.':'Share knowledge. Support a caring community.'}</h2><p>{role==='admin'?'Help keep dementia education, community resources and training activities connected.':'Your experience helps families and caregivers find understanding, confidence and support.'}</p><span className="account-story-caption">Learning together. Caring together.</span></div></aside>}
 <section className="tp-card account-form-card">
 {signIn&&<div className="account-form-intro"><Link to="/" className="account-home-link">← Back to website</Link><span className="account-access-label">{role==='admin'?'ADMINISTRATOR ACCESS':'CERTIFIED TRAINER ACCESS'}</span></div>}
 <h1>{signIn?'Welcome back':role==='admin'?'RCBC Administrative Dashboard':'Certified Trainer Portal'}{!signIn&&`: ${application?'Check application':'Register'}`}</h1>
 {signIn&&<p className="account-subtitle">Sign in to your {role==='admin'?'administrative dashboard':'trainer portal'}.</p>}
 <p>{role==='admin'?'Administrator access requires an invitation issued internally by RCBC.':'RCBC verifies identity and certification before granting portal access. Public visitors do not need an account.'}</p>
 <form onSubmit={submit}>
 {signup && <label className="tp-field">Full name<input name="name" required autoComplete="name" maxLength={150}/></label>}
 <label className="tp-field">Email<input name="email" type="email" required autoComplete="email" maxLength={254}/></label>
 <div className="tp-field">
 <label htmlFor={passwordId}>Password</label>
 <div className="tp-password-row">
 <input id={passwordId} name="password" type={showPassword?'text':'password'} required minLength={signup?12:1} maxLength={256} autoComplete={signup?'new-password':'current-password'}/>
 <button className="tp-password-eye" type="button" onClick={()=>setShowPassword(value=>!value)} aria-pressed={showPassword} aria-label={showPassword?'Hide password':'Show password'} aria-controls={passwordId} title={showPassword?'Hide password':'Show password'}>
 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
 <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>
 {showPassword && <path d="m3 3 18 18"/>}
 </svg>
 </button>
 </div>
 </div>
 {(signup && role==='trainer' || application && request && ['submitted','returned'].includes(request.status)) && <>
 <label className="tp-field">City<input name="city" required defaultValue={request?.city==='Not provided'?'':request?.city || ''}/></label>
 <label className="tp-field">Certificate reference<input name="certificateRef" required defaultValue={request?.claimed_certificate_ref==='Not provided'?'':request?.claimed_certificate_ref || ''}/></label></>}
 {signup && role==='admin' && <label className="tp-field">RCBC invitation code<input name="invitation" required defaultValue={params.get('invitation') || ''} autoComplete="off"/></label>}
 <button className="tp-btn account-submit" disabled={busy}>{busy?'Please wait...':application?'Check status':signup?'Submit registration':role==='admin'?'Sign in to dashboard':'Sign in to trainer portal'}</button>
 {application && request && ['submitted','returned'].includes(request.status) && <button className="tp-btn tp-btn-ghost" value="resubmit" disabled={busy}>Submit amendments</button>}
 <p className={message?'account-feedback':''} role="status">{message}</p></form>
 {request && <section className="tp-note"><h2>Application: {request.status}</h2><p>{request.admin_comment || 'No admin comment.'}</p></section>}
 <div className="tp-actions account-links">{!signIn&&<Link to={base}>Sign in</Link>}{role==='trainer' && <><Link to={base+'/signup'}>Register as a trainer</Link><Link to={base+'/application'}>Check application / submit amendments</Link></>}</div>
 {signIn&&<p className="account-footer-note">{role==='admin'?'For authorised RCBC administrators. Please contact your RCBC coordinator if you need an invitation.':'Supporting dementia education and community care across Sarawak.'}</p>}
 </section></div>;
}
