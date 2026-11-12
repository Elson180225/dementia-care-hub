import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Field } from '../trainer-portal/ui';
import { api } from '../trainer-portal/TrainerContext';
import { useLanguage } from '../i18n/LanguageContext';

export default function ProjectServices({ certificate = false }) {
  const { t } = useLanguage();
  const ps = t.projectServices || {};
  const [params] = useSearchParams();
  const token = params.get('unsubscribe');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [unsubscribe, setUnsubscribe] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setResult(null);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    data.consent = data.consent === 'on';
    try {
      const r = await api(
        '/api/public/' + (certificate ? 'verify-certificate' : token ? 'unsubscribe' : 'subscribe'),
        { ...data, token }
      );
      if (certificate) {
        setResult(r.certificate);
        setMessage(
          r.certificate
            ? ps.certFound || 'Certificate match found.'
            : ps.certNotFound || 'No consented certificate match found. Please check details with RCBC.'
        );
      } else {
        setMessage(token ? ps.unsubscribedMsg || 'You have been unsubscribed.' : r.message);
        setUnsubscribe(r.unsubscribeLink || '');
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  const langOptions = ps.langOptions || ['English', 'Bahasa Malaysia', 'Chinese'];

  return (
    <main className="tp-page">
      <div className="tp-container">
        <h1>
          {certificate
            ? ps.verifyTitle || 'Verify a DCS certificate'
            : token
            ? ps.unsubscribeTitle || 'Unsubscribe from updates'
            : ps.subscribeTitle || 'Get Updated'}
        </h1>
        {!certificate && !token && (
          <p>
            {ps.getUpdatedIntro ||
              'Stay connected with Dementia Care Connect. Register to receive updates on upcoming webinars, education, training and project activities.'}
          </p>
        )}
        <form className="tp-card" onSubmit={submit}>
          {!token && (
            <>
              <Field id="updates-name" label={certificate ? ps.nameOnCertificate || 'Name on certificate' : ps.name || 'Name'} required><input id="updates-name" name="name" required /></Field>
              {certificate ? (
                <Field id="updates-certificateRef" label={ps.certificateRef || 'Certificate reference'} required><input id="updates-certificateRef" name="certificateRef" required /></Field>
              ) : (
                <>
                  <Field id="updates-email" label={ps.email || 'Email'} required><input id="updates-email" name="email" type="email" required /></Field>
                  <Field id="updates-city" label={ps.city || 'City'} required><input id="updates-city" name="city" required /></Field>
                  <Field id="updates-state" label={ps.state || 'State'} required><input id="updates-state" name="state" required /></Field>
                  <Field id="updates-language" label={ps.preferredLanguage || 'Preferred language'} required><select required id="updates-language" name="language">
                      {langOptions.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select></Field>
                  <p>
                    {ps.consentInfo ||
                      'Receive updates and reminders about upcoming webinars, seminars, education and project activities. RCBC stores your name, email, locality, language and consent for this purpose. Authorised administrators and our email provider process these details. No public account is created. Every reminder includes an unsubscribe link. Contact RCBC through the Contact page for correction or deletion requests.'}
                  </p>
                  <Field id="updates-consent" label={ps.consentCheckbox || 'I agree to receive project updates from RCBC by email.'} required example="Tick this box only if you want email updates. You can unsubscribe using the link shown after signup or in any automatic reminder.">
                    <input id="updates-consent" name="consent" type="checkbox" required />
                  </Field>
                </>
              )}
            </>
          )}
          <button className="tp-btn" disabled={busy}>
            {busy
              ? ps.wait || 'Please wait...'
              : certificate
              ? ps.verifyBtn || 'Verify certificate'
              : token
              ? ps.unsubscribeBtn || 'Confirm unsubscribe'
              : ps.subscribeBtn || 'Subscribe'}
          </button>
          <p role="status">{message}</p>
          {unsubscribe && (
            <p>
              {ps.saveUnsubscribe || 'Save your'}{' '}
              <a href={unsubscribe}>{ps.unsubscribeLink || 'unsubscribe link'}</a>{' '}
              {ps.manageSubscription || 'for managing this subscription.'}
            </p>
          )}
          {result && (
            <dl className="tp-dl">
              {Object.entries(result).map(([key, value]) => (
                <div key={key}>
                  <dt>{key.replaceAll('_', ' ')}</dt>
                  <dd>
                    {['issued_at', 'completion_date'].includes(key) && value
                      ? new Date(value).toLocaleDateString('en-MY')
                      : value || '-'}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </form>
        {certificate && (
          <p>
            {ps.certOnlyNotice ||
              'Verification confirms completion of the stated programme only.'}
          </p>
        )}
      </div>
    </main>
  );
}
