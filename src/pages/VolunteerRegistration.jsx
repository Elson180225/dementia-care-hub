import { useEffect,useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { volunteerFields } from '../../shared/volunteer.js';
export default function VolunteerRegistration(){
  const {t}=useLanguage(), d=t.caregiverDraft;
  const [enabled,setEnabled]=useState(false),[state,setState]=useState('idle');
  useEffect(()=>{const c=new AbortController();fetch('/api/public/volunteer-registrations',{signal:c.signal}).then(r=>r.ok?r.json():{}).then(data=>{if(!c.signal.aborted)setEnabled(data.enabled===true);}).catch(()=>{});return()=>c.abort();},[]);
  async function submit(e){e.preventDefault();if(!enabled||state==='sending')return;const form=e.currentTarget;const data=Object.fromEntries(new FormData(form));data.consent=data.consent==='on';setState('sending');try{const r=await fetch('/api/public/volunteer-registrations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(!r.ok)throw Error();form.reset();setState('sent');}catch{setState('error');}}
  const busy = !enabled || state==='sending';
  const renderField = ({key,max,required,multiline,type}) => <label key={key} className={multiline||key==='certificate'?'caregiver-form-wide':undefined}>{d[key === "languages" || key === "availability" ? key+"Label" : key]}{required?' *':''}{multiline?<textarea name={key} maxLength={max} required={required} disabled={busy} rows={3}/>:<input name={key} type={type||'text'} maxLength={max} required={required} disabled={busy} autoComplete={key==='name'?'name':key==='email'?'email':key==='phone'?'tel':undefined}/>}</label>;
  return <section className="caregiver-section caregiver-section-soft" id="volunteer"><div className="caregiver-container caregiver-registration-layout">
    <aside className="caregiver-registration-aside"><span className="caregiver-registration-symbol" aria-hidden="true">✦</span><h2>{d.volunteerTitle}</h2><p>{d.volunteerIntro}</p><div className="caregiver-registration-note"><p>{d.volunteerBoundary}</p></div></aside>
    <div className="caregiver-registration-panel"><div className="caregiver-section-heading"><p className="caregiver-eyebrow">{d.volunteerTitle}</p><h2>{d.register}</h2></div>
      {!enabled&&<p className="caregiver-registration-status" role="status">{d.closed}</p>}
      <form className="caregiver-volunteer-form" onSubmit={submit}>
        <div className="caregiver-form-grid">{volunteerFields.map(renderField)}</div>
        <div className="caregiver-consent-panel"><label className="caregiver-consent"><input name="consent" type="checkbox" required disabled={busy}/><span>{d.consent}</span></label><p><Link to="/privacy-policy">{d.privacy}</Link> · <Link to="/terms-of-use">{d.terms}</Link></p></div>
        <button type="submit" className="caregiver-button caregiver-button-green" disabled={busy}>{state==='sending'?d.sending:d.register} <span aria-hidden="true">→</span></button>
        {state==='sent'&&<p role="status">{d.sent}</p>}{state==='error'&&<p role="alert">{d.failure}</p>}
      </form>
    </div>
  </div></section>;
}
