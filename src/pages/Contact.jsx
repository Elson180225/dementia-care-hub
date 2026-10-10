import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { enquiryTypes, validateEnquiry } from '../../shared/enquiry.js';
import { contact } from '../data/contact';
import './Contact.css';

function Channel({ href, title, children }) {
  return <div className="contact-channel"><h3>{href ? <a href={href}>{title}</a> : title}</h3><p>{children}</p>{!href && <small>Official contact details will be published once confirmed.</small>}</div>;
}

export default function Contact() {
  const [values, setValues] = useState({ name: '', email: '', type: enquiryTypes[0], message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const attempt = useRef(null);
  const form = useRef(null);
  const result = useRef(null);
  const started = useRef(0);
  useEffect(() => { started.current = Date.now(); }, []);

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
      setValues({ name: '', email: '', type: enquiryTypes[0], message: '', website: '' });
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
    <header className="contact-hero"><div className="contact-container"><p className="contact-kicker">ALZHEIMER’S CARE PROJECT</p><h1>Contact us</h1><p>Project enquiries, community updates and connection with our organisers.</p></div></header>
    <div className="contact-container contact-grid">
      <section aria-labelledby="project-contact"><h2 id="project-contact">Alzheimer’s Care Project</h2><p>Connect with the project team about education, activities, collaboration and website resources.</p>
        <Channel href={contact.projectEmail && `mailto:${contact.projectEmail}`} title="Project email">{contact.projectEmail || 'For project enquiries and collaboration.'}</Channel>
        <Channel href={contact.facebook} title="Facebook Page">Project updates, educational information and activities.</Channel>
        <Channel href={contact.messenger} title="Facebook Messenger">A general enquiry channel for the project.</Channel>
        <Channel href={contact.whatsappCommunity} title="Join Our WhatsApp Community">Receive project updates, educational information and activity announcements.</Channel>
        <section className="contact-organiser" aria-labelledby="organiser"><h2 id="organiser">Our organiser</h2><h3>Rotary Club of Bintulu Central (RCBC)</h3><p>Dementia Care Hub is an initiative of the Alzheimer’s Care Project organised by RCBC.</p>
          <Channel href={contact.organiserEmail && `mailto:${contact.organiserEmail}`} title="Official RCBC email">{contact.organiserEmail || 'For organiser-level enquiries.'}</Channel>
          {contact.organiserWebsite && <p><a href={contact.organiserWebsite}>RCBC official website</a></p>}
          {contact.organiserFacebook && <p><a href={contact.organiserFacebook}>RCBC Facebook Page</a></p>}
          {contact.approvedPostalAddress && <address>{contact.approvedPostalAddress}</address>}
        </section>
      </section>
      <section className="contact-form-card" aria-labelledby="enquiry-heading"><h2 id="enquiry-heading">Send an enquiry</h2>
        <div className="contact-boundary"><strong>Our service boundary</strong><p>Dementia Care Hub does not provide emergency, medical consultation or crisis support services.</p><p>For external services, visit <Link to="/find-help">Find Help &amp; Support</Link>. For event registration, visit the relevant <Link to="/learn-events/events">Education &amp; Events page</Link>.</p></div>
        <p id="privacy-notice">We use your name, email and message to manage and respond to your enquiry through the project’s administrative workflow. Please do not include sensitive medical details.</p>
        <form ref={form} onSubmit={submit} noValidate aria-describedby="privacy-notice" aria-busy={busy}>
          {['name', 'email', 'type', 'message'].map(field => <div className="contact-field" key={field}><label htmlFor={`contact-${field}`}>{({ name: 'Name', email: 'Email', type: 'Enquiry Type', message: 'Message' })[field]} <span>(required)</span></label>
            {field === 'type' ? <select id={`contact-${field}`} name={field} value={values[field]} onChange={change} required aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `${field}-error` : undefined}>{enquiryTypes.map(type => <option key={type}>{type}</option>)}</select> : field === 'message' ? <textarea id={`contact-${field}`} name={field} value={values[field]} onChange={change} required maxLength={5000} rows={6} aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `${field}-error` : undefined} /> : <input id={`contact-${field}`} name={field} type={field === 'email' ? 'email' : 'text'} autoComplete={field} maxLength={field === 'name' ? 120 : 254} value={values[field]} onChange={change} required aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `${field}-error` : undefined} />}
            {errors[field] && <p className="contact-error" id={`${field}-error`}>{errors[field]}</p>}
          </div>)}
          <div className="contact-trap" aria-hidden="true"><label htmlFor="contact-website">Leave this field empty</label><input id="contact-website" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={change} /></div>
          <button className="contact-submit" disabled={busy} type="submit">{busy ? 'Sending…' : 'Send Enquiry'}</button>
          {status && <div ref={result} tabIndex={-1} role={status === 'failure' ? 'alert' : 'status'} className={`contact-result ${status}`}>{status === 'success' ? 'Thank you. Your enquiry has been sent to the Alzheimer’s Care Project team.' : <><p>Your enquiry could not be sent. Your information has been retained. Please try again.</p><button type="submit" disabled={busy}>Retry enquiry</button></>}</div>}
        </form>
      </section>
    </div>
  </main>;
}
