import Trans from "../i18n/Trans";
import FormFeedback from "../components/FormFeedback";
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { enquiryMessageLimit, enquiryTypes, validateEnquiry } from '../../shared/enquiry.js';
import { contact as defaultContact } from '../data/contact';
import './Contact.css';
import HeroPhoto, { HeroWithPhoto } from "../components/HeroPhoto/HeroPhoto";
import heroPhoto from "../assets/Group_Photo_2.png";

function Channel({ href, title, children, pendingNote }) {
  const { t } = useLanguage();
  return (
    <div className={`contact-channel${href ? '' : ' contact-channel-pending'}`}>
      <h3>{href ? <a href={href}><span aria-hidden="true">↗</span> {title}</a> : title}</h3>
      {children && <p>{children}</p>}
      {!href && <small>{pendingNote || t.contact?.pendingDetails}</small>}
    </div>
  );
}

export default function Contact() {
  const { t } = useLanguage();
  const c = t.contact || {};
  const [contact, setContact] = useState(defaultContact);
  const [values, setValues] = useState({ name: '', email: '', type: '', message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const attempt = useRef(null);
  const form = useRef(null);
  const result = useRef(null);
  const started = useRef(0);
  useEffect(() => {
    started.current = Date.now();
    const controller = new AbortController();
    fetch('/api/public/contact-settings', { signal: controller.signal, cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then(settings => {
        if (settings?.projectEmail && !controller.signal.aborted) setContact({ ...defaultContact, ...settings });
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  function change(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
    setErrors({ ...errors, [event.target.name]: undefined });
    setStatus('');
    attempt.current = null;
  }

  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    const invalid = validateEnquiry(values);
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      form.current.elements.namedItem(Object.keys(invalid)[0]).focus();
      return;
    }
    pending.current = true;
    setBusy(true);
    setStatus('');
    attempt.current ??= crypto.randomUUID();
    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, id: attempt.current, startedAt: started.current }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.errors) setErrors(data.errors);
        throw new Error('Submission failed');
      }
      setStatus('success');
      setValues({ name: '', email: '', type: '', message: '', website: '' });
      attempt.current = null;
      started.current = Date.now();
    } catch {
      setStatus('failure');
    } finally {
      pending.current = false;
      setBusy(false);
      requestAnimationFrame(() => result.current?.focus());
    }
  }

  return <main className="contact-page">
    <header className="contact-hero"><div className="contact-container"><HeroWithPhoto photo={<HeroPhoto src={heroPhoto} alt="Alzheimer’s Care Project participants waving at a group session" />}><p className="contact-kicker">{c.kicker || "ALZHEIMER’S CARE PROJECT"}</p><h1>{c.title || "Contact us"}</h1><p>{c.subtitle || "Project enquiries, community updates and connection with our organisers."}</p></HeroWithPhoto></div></header>
    <div className="contact-container contact-grid">
      <section aria-labelledby="project-contact">
        <h2 id="project-contact">{c.projectContact}</h2>
        <p>{c.projectContactSub}</p>
        <h3>{c.title}</h3>
        <Channel href={`mailto:${contact.projectEmail}`} title={c.projectEmail}>{contact.projectEmail}<br />{c.projectEmailPurpose}</Channel>
        <Channel href={contact.messenger} title={c.messenger}>{c.messengerSub}</Channel>
        <h3>{c.stayConnected}</h3>
        <Channel href={contact.facebook} title={c.facebookPage}>{c.facebookUpdates}</Channel>
        <Channel href={contact.whatsappCommunity} title={c.whatsapp} pendingNote={c.channelPending}>{c.whatsappSub}</Channel>
        <section className="contact-organiser" aria-labelledby="organiser">
          <h2 id="organiser">{c.organiser}</h2><h3>{c.rcbc}</h3><p>{c.rcbcSub}</p>
          <Channel href={`mailto:${contact.organiserEmail}`} title={c.officialEmail}>{contact.organiserEmail}<br />{c.organiserSub}</Channel>
          <Channel href={contact.organiserFacebook} title={c.rcbcFacebook} pendingNote={c.channelPending}>{c.rcbcFacebookPurpose}</Channel>
        </section>
      </section>
      <section className="contact-form-card" aria-labelledby="enquiry-heading"><h2 id="enquiry-heading">{c.formTitle}</h2>
        <div className="contact-boundary">
          <strong>{c.boundaryTitle}</strong>
          <p>{c.enquiryScope}</p>
          <p>{c.boundaryHelp} <Link to="/find-help">{t.header.menu.findHelp}</Link>.</p>
          <p>{c.boundaryEvents} <Link to="/learn-events">{t.header.menu.learnEvents}</Link>.</p>
          <p>{c.boundaryText}</p>
        </div>
        <p id="privacy-notice">{c.privacyNotice}</p>
        <form ref={form} onSubmit={submit} noValidate aria-labelledby="enquiry-heading" aria-describedby="privacy-notice" aria-busy={busy}>
          {['name', 'email', 'type', 'message'].map(field => <div className="contact-field" key={field}><label htmlFor={`contact-${field}`}>{({ name: c.name || 'Name', email: c.email || 'Email', type: c.enquiryType || 'Enquiry Type', message: c.message || 'Message' })[field]} <span className="required-marker" aria-label={c.required || "required"}>*</span></label>
            {field === 'type' ? <select id={`contact-${field}`} name={field} value={values[field]} onChange={change} required aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `${field}-error` : undefined}><option value="">{c.selectEnquiryType}</option>{enquiryTypes.map((type,index) => <option key={type} value={type}>{c.enquiryOptions?.[index]||type}</option>)}</select> : field === 'message' ? <textarea id={`contact-${field}`} name={field} value={values[field]} onChange={change} required maxLength={enquiryMessageLimit} rows={6} aria-invalid={!!errors[field]} aria-describedby={`contact-message-help${errors[field] ? ' message-error' : ''}`} /> : <input id={`contact-${field}`} name={field} type={field === 'email' ? 'email' : 'text'} autoComplete={field} maxLength={field === 'name' ? 120 : 254} value={values[field]} onChange={change} required aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `${field}-error` : undefined} />}
            {field === 'message' && <div id="contact-message-help">
              <p>{c.messageHelp} {c.messageLimit}</p>
              <span>{values.message.length.toLocaleString()} / {enquiryMessageLimit.toLocaleString()}</span>
            </div>}
            <FormFeedback id={`${field}-error`}>{errors[field]}</FormFeedback>
          </div>)}
          <div className="contact-trap" aria-hidden="true"><label htmlFor="contact-website"><Trans id="leaveBlank">Leave this field empty</Trans></label><input id="contact-website" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={change} /></div>
          <button className="contact-submit" disabled={busy} type="submit">{busy ? (c.sending || 'Sending…') : (c.send || 'Send Enquiry')}</button>
          {status && <div ref={result} tabIndex={-1} role={status === 'failure' ? 'alert' : 'status'} className={`contact-result ${status}`}>{status === 'success' ? (c.success || 'Thank you. Your enquiry has been sent to the Alzheimer’s Care Project team.') : <><p>{c.failure || 'Your enquiry could not be sent. Your information has been retained. Please try again.'}</p><button type="submit" disabled={busy}>{c.retry || 'Retry enquiry'}</button></>}</div>}
        </form>
      </section>
    </div>
  </main>;
}
