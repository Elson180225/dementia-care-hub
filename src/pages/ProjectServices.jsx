import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Field } from '../trainer-portal/ui';
import { api } from '../trainer-portal/TrainerContext';
import { useLanguage } from '../i18n/LanguageContext';

export default function ProjectServices({ certificate = false }) {
  const { t } = useLanguage();
  const ps = t.projectServices || {};
  const [params] = useSearchParams();
  const renewing = params.has('resubscribe');
  const token = params.get('unsubscribe') ?? params.get('resubscribe');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [completed, setCompleted] = useState(false);
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
        '/api/public/' + (certificate ? 'verify-certificate' : token ? (renewing ? 'resubscribe' : 'unsubscribe') : 'subscribe'),
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
        setCompleted(r.status === 'subscribed' || Boolean(token));
        setMessage(r.status === 'subscribed' ? ps.subscribedMsg : token ? ps.unsubscribedMsg : ps.existingMsg);
        setUnsubscribe(r.unsubscribeLink || '');
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }


  return (
    <main className="tp-page">
      <div className="tp-container">
        <h1>
          {certificate
            ? ps.verifyTitle || 'Verify a DCS certificate'
            : token
            ? (renewing ? ps.renewTitle : ps.unsubscribeTitle)
            : ps.subscribeTitle || 'Get Updated'}
        </h1>
        {!certificate && !token && (
          <p>
            {ps.getUpdatedIntro ||
              'Stay connected with Dementia Care Connect. Register to receive updates on upcoming webinars, education, training and project activities.'}
          </p>
        )}
        <form className="tp-card" onSubmit={submit} hidden={!certificate && completed}>
          {!token && (
            <>
              <Field id="updates-name" label={certificate ? ps.nameOnCertificate || 'Name on certificate' : ps.name || 'Name'} required><input id="updates-name" name="name" autoComplete="name" maxLength={150} required /></Field>
              {certificate ? (
                <Field id="updates-certificateRef" label={ps.certificateRef || 'Certificate reference'} required><input id="updates-certificateRef" name="certificateRef" required /></Field>
              ) : (
                <>
                  <Field id="updates-email" label={ps.email} required><input id="updates-email" name="email" type="email" autoComplete="email" maxLength={254} required /></Field>
                  <Field id="updates-country" label={ps.country} required><input id="updates-country" name="country" autoComplete="country-name" maxLength={150} required /></Field>
                  <Field id="updates-state" label={ps.state} required><input id="updates-state" name="state" autoComplete="address-level1" maxLength={150} required /></Field>
                  <Field id="updates-city" label={ps.city} required><input id="updates-city" name="city" autoComplete="address-level2" maxLength={150} required /></Field>
                  <p>{ps.languageNotice}</p>
                  <p id="updates-privacy">{ps.consentInfo} {ps.privacyIntro} <Link to="/privacy-policy">{ps.privacyPolicy}</Link>.</p>
                  <Field id="updates-consent" label={ps.consentCheckbox} required>
                    <input id="updates-consent" name="consent" type="checkbox" aria-describedby="updates-privacy" required />
                  </Field>
                </>
              )}
            </>
          )}
          {token && renewing && <p>{ps.renewNotice}</p>}
          {!certificate && !token && <p>{ps.requiredFields}</p>}
          <button className="tp-btn" disabled={busy}>
            {busy
              ? ps.wait || 'Please wait...'
              : certificate
              ? ps.verifyBtn || 'Verify certificate'
              : token
              ? (renewing ? ps.renewBtn : ps.unsubscribeBtn)
              : ps.subscribeBtn || 'Subscribe'}
          </button>
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
        <div role="status">
          {message && <p>{message}</p>}
          {unsubscribe && <p>{ps.subscribedDetail} {ps.saveUnsubscribe}{' '}
            <a href={unsubscribe}>{ps.unsubscribeLink}</a> {ps.manageSubscription}</p>}
          {!certificate && completed && !unsubscribe && <p><Link to="/get-updated">{ps.subscribeAgain}</Link></p>}
          {!certificate && completed && <Link to="/">{ps.returnHome}</Link>}
        </div>
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
