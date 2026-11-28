import { useEffect, useState } from 'react';
import { contactFields } from '../../shared/contact-settings.js';
import { api } from '../trainer-portal/TrainerContext';
import { Field } from '../trainer-portal/ui';

export default function ContactSettings() {
  const [values, setValues] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    api('/api/admin/contact-settings').then(data => { if (live) setValues(data); })
      .catch(error => { if (live) setMessage(error.message); });
    return () => { live = false; };
  }, []);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      setValues(await api('/api/admin/contact-settings', values));
      setMessage('Contact details published.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <section className="tp-card" aria-labelledby="contact-settings-heading">
    <h2 id="contact-settings-heading">Public contact details</h2>
    <p>Use official RCBC destinations. Leaving a URL blank shows a pending link on Contact Us.</p>
    {values && <form onSubmit={save} aria-labelledby="contact-settings-heading">
      {Object.entries(contactFields).map(([key, label]) => {
        const email = key === 'projectEmail';
        const id = `contact-setting-${key}`;
        return <Field key={key} id={id} label={label} required={email}>
          <input id={id} type={email ? 'email' : 'url'} value={values[key]} required={email}
            maxLength={email ? 254 : 2000} disabled={busy}
            onChange={event => setValues({ ...values, [key]: event.target.value })} />
        </Field>;
      })}
      <button className="tp-btn" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save contact details'}</button>
    </form>}
    <p role="status">{message || (!values && 'Loading contact details…')}</p>
  </section>;
}
