import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export default function PublishedRecords({ kind, category, slug, title }) {
  const { t } = useLanguage();
  const pr = t.publishedRecords || {};
  const [rows, setRows] = useState([]);
  const [language, setLanguage] = useState('All');

  useEffect(() => {
    let live = true;
    fetch('/api/public/' + kind + (category ? '?category=' + encodeURIComponent(category) : ''))
      .then((r) => {
        if (!r.ok) return [];
        const contentType = r.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return r.json().catch(() => []);
        }
        return [];
      })
      .then((data) => {
        if (live && Array.isArray(data)) setRows(data);
      })
      .catch(() => {
        if (live) setRows([]);
      });
    return () => {
      live = false;
    };
  }, [kind, category]);

  const shown = rows.filter(
    (r) => (!slug || r.slug === slug) && (language === 'All' || r.language === language)
  );

  if (!shown.length) return null;

  return (
    <section className="tp-container tp-managed">
      <h2>{title || pr.title || 'RCBC published records'}</h2>
      <label className="tp-field">
        {pr.language || 'Language'}
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="All">{pr.allLanguages || 'All languages'}</option>
          {[...new Set(rows.map((r) => r.language).filter(Boolean))].map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>
      {shown.map((r) => (
        <article className="tp-card" key={r.id}>
          <h3>{r.name || r.title || r.question}</h3>
          <p>{r.answer || r.body?.text || r.description || r.specialist_field}</p>
          {r.city && (
            <p>
              {r.address} {r.city} {r.state}
            </p>
          )}
          {r.services?.length > 0 && <p>{r.services.join(', ')}</p>}
          {r.phone && (
            <p>
              {pr.phone || 'Phone:'} {r.phone}
            </p>
          )}
          {r.email && (
            <p>
              {pr.email || 'Email:'} {r.email}
            </p>
          )}
          {r.opening_hours && (
            <p>
              {pr.openingHours || 'Opening hours:'} {r.opening_hours}
            </p>
          )}
          {r.eligibility && (
            <p>
              {pr.eligibility || 'Eligibility:'} {r.eligibility}
            </p>
          )}
          {r.fees && (
            <p>
              {pr.fees || 'Fees:'} {r.fees}
            </p>
          )}
          {r.accepting_volunteers && (
            <p>
              {pr.acceptingVolunteers || 'Accepting volunteers:'} {r.volunteer_details}
            </p>
          )}
          {(r.website || r.url) && (
            <a href={r.website || r.url} target="_blank" rel="noreferrer">
              {pr.visitResource || 'Visit resource'}
            </a>
          )}
          <p>
            {pr.source || 'Source:'} {r.source}
            {r.source_url && (
              <>
                {' | '}
                <a href={r.source_url} target="_blank" rel="noreferrer">
                  {pr.sourceReference || 'Source reference'}
                </a>
              </>
            )}
          </p>
          {r.last_reviewed_at && (
            <p>
              {pr.lastReviewed || 'Last reviewed:'}{' '}
              {new Date(r.last_reviewed_at).toLocaleDateString('en-MY')}
            </p>
          )}
          {r.review_status === 'needs review' && (
            <p>{pr.reviewPending || 'Review pending. Confirm current details with the organisation.'}</p>
          )}
        </article>
      ))}
    </section>
  );
}
