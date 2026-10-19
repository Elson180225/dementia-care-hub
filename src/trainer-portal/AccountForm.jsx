import { useId, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, useTrainer } from './TrainerContext';
export default function AccountForm({role='trainer',signup=false,application=false}) {
 const [params]=useSearchParams();const navigate=useNavigate();const {refresh}=useTrainer();
 const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [request,setRequest]=useState(null);
 const [showPassword,setShowPassword]=useState(false);const passwordId=useId();
 const base=role==='admin'?'/admin':'/trainer-portal';
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
 return <section className="tp-card"><h1>{role==='admin'?'RCBC Administrative Dashboard':'Certified Trainer Portal'}: {application?'Check application':signup?'Register':'Sign in'}</h1>
 <p>{role==='admin'?'Administrator access requires an invitation issued internally by RCBC.':'RCBC verifies identity and certification before granting portal access. Public visitors do not need an account.'}</p>
 <form onSubmit={submit}>
 {signup && <label className="tp-field">Full name<input name="name" required autoComplete="name" maxLength={150}/></label>}
 <label className="tp-field">Email<input name="email" type="email" required autoComplete="email" maxLength={254}/></label>
 <div className="tp-field">
 <label htmlFor={passwordId}>Password</label>
 <div className="tp-password-row">
 <input id={passwordId} name="password" type={showPassword?'text':'password'} required minLength={signup?12:1} maxLength={256} autoComplete={signup?'new-password':'current-password'}/>
 <button className="tp-password-eye" type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'Hide password':'Show password'} aria-controls={passwordId} title={showPassword?'Hide password':'Show password'}>
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
 <button className="tp-btn" disabled={busy}>{busy?'Please wait...':application?'Check status':signup?'Submit registration':'Sign in'}</button>
 {application && request && ['submitted','returned'].includes(request.status) && <button className="tp-btn tp-btn-ghost" value="resubmit" disabled={busy}>Submit amendments</button>}
 <p role="status">{message}</p></form>
 {request && <section className="tp-note"><h2>Application: {request.status}</h2><p>{request.admin_comment || 'No admin comment.'}</p></section>}
 <div className="tp-actions"><Link to={base}>Sign in</Link>{role==='trainer' && <><Link to={base+'/signup'}>Register as a trainer</Link><Link to={base+'/application'}>Check application / submit amendments</Link></>}</div></section>;
}
