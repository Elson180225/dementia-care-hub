import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../trainer-portal/TrainerContext';
export default function ProjectServices({certificate=false}) {
 const [params]=useSearchParams();const token=params.get('unsubscribe');
 const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [result,setResult]=useState(null);const [unsubscribe,setUnsubscribe]=useState('');
 async function submit(e){
  e.preventDefault();setBusy(true);setMessage('');setResult(null);
  const data=Object.fromEntries(new FormData(e.currentTarget));data.consent=data.consent==='on';
  try{const r=await api('/api/public/'+(certificate?'verify-certificate':token?'unsubscribe':'subscribe'),{...data,token});
   if(certificate) {setResult(r.certificate);setMessage(r.certificate?'Certificate match found.':'No consented certificate match found. Please check details with RCBC.');}
   else {setMessage(token?'You have been unsubscribed.':r.message);setUnsubscribe(r.unsubscribeLink || '');}
  }catch(err){setMessage(err.message);}finally{setBusy(false);}
 }
 return <main className="tp-page"><div className="tp-container"><h1>{certificate?'Verify a DCS certificate':token?'Unsubscribe from updates':'Get Updated'}</h1>
 {!certificate && !token && <p>Stay connected with Dementia Care Connect. Register to receive updates on upcoming webinars, education, training and project activities.</p>}
 <form className="tp-card" onSubmit={submit}>
 {!token && <><label className="tp-field">{certificate?'Name on certificate':'Name'}<input name="name" required/></label>{certificate?<label className="tp-field">Certificate reference<input name="certificateRef" required/></label>:<>
 <label className="tp-field">Email<input name="email" type="email" required/></label><label className="tp-field">City<input name="city" required/></label><label className="tp-field">State<input name="state" required/></label><label className="tp-field">Preferred language<select name="language">{['English','Bahasa Malaysia','Chinese'].map(x=><option key={x}>{x}</option>)}</select></label>
 <p>Receive updates and reminders about upcoming webinars, seminars, education and project activities. RCBC stores your name, email, locality, language and consent for this purpose. Authorised administrators and our email provider process these details. No public account is created. Every reminder includes an unsubscribe link. Contact RCBC through the Contact page for correction or deletion requests.</p>
 <label className="tp-field"><span><input name="consent" type="checkbox" required/> I agree to receive project updates from RCBC by email.</span></label></>}</>}
 <button className="tp-btn" disabled={busy}>{busy?'Please wait...':certificate?'Verify certificate':token?'Confirm unsubscribe':'Subscribe'}</button><p role="status">{message}</p>
 {unsubscribe && <p>Save your <a href={unsubscribe}>unsubscribe link</a> for managing this subscription.</p>}
 {result && <dl className="tp-dl">{Object.entries(result).map(([key,value])=><div key={key}><dt>{key.replaceAll('_',' ')}</dt><dd>{['issued_at','completion_date'].includes(key) && value?new Date(value).toLocaleDateString('en-MY'):value || '-'}</dd></div>)}</dl>}
 </form>{certificate && <p>Verification confirms completion of the stated programme only.</p>}</div></main>;
}
