import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { directoryCategories, directoryTypes, findDirectoryListings, groupTypes, translateDirectoryListings } from '../../shared/directory.js';
import { LastReviewed } from './PublicFeatures';
import '../pages/find-help/ResourceFinder.css';

const baseFilters = { category: '', type: '', location: '', groupType: '', volunteers: false };
const distinct = items => [...new Set(items.filter(Boolean))].sort((a, b) => a.localeCompare(b));

export default function DirectoryListings({ groupsOnly = false, initial = {}, linkedId, resultsId, finderLayout = false }) {
  const { t, translateContent } = useLanguage();
  const copy = t.directory;
  const groupLabels = Object.fromEntries(groupTypes.map((type, index) => [type, [groupsOnly ? t.caregiverDraft.publicGroup : copy.governmentGroup, copy.privateGroup, copy.communityGroup][index]]));
  const [filters, setFilters] = useState({ ...baseFilters, ...initial });
  const [rows, setRows] = useState([]);
  const [state, setState] = useState('loading');
  const [retry, setRetry] = useState(0);
  const locationRef = useRef(null);
  const categoryRef = useRef(null);
  const category = groupsOnly ? 'support-group' : filters.category;

  useEffect(() => {
    const controller = new AbortController();
    const url = '/api/public/organisations' + (groupsOnly ? '?category=support-group' : '');
    fetch(url, { signal: controller.signal, cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw Error();
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data)) throw Error();
        if (!controller.signal.aborted) {
          setRows(data);
          setState('ready');
        }
      })
      .catch(() => { if (!controller.signal.aborted) setState('error'); });
    return () => controller.abort();
  }, [groupsOnly, retry]);

  const typeRows = findDirectoryListings(rows, { category });
  const labels = new Map(translateDirectoryListings(typeRows, translateContent).map(row => [row.id, row.service_type]));
  const typeLabels = new Map(typeRows.flatMap(row => directoryTypes(row).map(type => [type, labels.get(row.id) || type])));
  const types = distinct([...typeLabels.keys()]);
  const locations = distinct(rows.flatMap(row => groupsOnly ? [row.city] : [row.city, row.state]));
  const filtered = findDirectoryListings(rows, { ...filters, location: groupsOnly ? "" : filters.location, volunteers: groupsOnly ? false : filters.volunteers, category, localOnly: groupsOnly }).filter(row => !groupsOnly || !filters.location || row.city === filters.location);
  const matchedId = linkedId && (rows.some(row => row.id === linkedId) ? linkedId : rows.find(row => row.organisation_id === linkedId)?.id);
  const focused = matchedId && filtered.find(row => row.id === matchedId);
  const ordered = focused ? [focused, ...filtered.filter(row => row.id !== matchedId)] : filtered;
  const uniqueGroups = groupsOnly ? ordered.filter((row,index) => ordered.findIndex(other => (other.organisation_id || other.id) === (row.organisation_id || row.id)) === index) : ordered;
  const records = translateDirectoryListings(uniqueGroups, translateContent);
  const update = (key, value) => setFilters(current => ({ ...current, [key]: value, ...(key === 'category' ? { type: '' } : {}) }));

  const changeLocation = () => {
    update('location', '');
    locationRef.current?.focus();
  };
  const resetFromEmpty = () => {
    setFilters({ ...baseFilters });
    categoryRef.current?.focus();
  };

  const modern = finderLayout && !groupsOnly;
  const icons = { healthcare: 'M12 21S3 15 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-9 13-9 13ZM9 11h6m-3-3v6', products: 'M3 7l9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10', information: 'M4 4h6a2 2 0 0 1 2 2v15a3 3 0 0 0-3-3H4V4Zm16 0h-6a2 2 0 0 0-2 2v15a3 3 0 0 1 3-3h5V4Z' };
  const symbol = key => <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[key] || 'M5 5h14v14H5zM8 12h8M12 8v8'} /></svg>;
  return <div className={`directory-listings${modern ? ' rf-modern' : ''}`}>
    {modern && <section className="rf-category-section" aria-label={copy.category}>
      <div className="rf-category-heading"><h2>{copy.category}</h2><button ref={categoryRef} type="button" className="rf-all-button" aria-pressed={!filters.category} onClick={() => update('category', '')}>{copy.allCategories}</button></div>
      <div className="rf-category-grid">
        {Object.keys(directoryCategories).map(key => <button key={key} type="button" className={`rf-category-card rf-category-${key}`} aria-pressed={filters.category === key} onClick={() => update('category', filters.category === key ? '' : key)}>
          <span className="rf-category-icon">{symbol(key)}</span><strong>{copy[key]}</strong><span className="rf-category-arrow" aria-hidden="true">{filters.category === key ? '✓' : '→'}</span>
        </button>)}
      </div>
    </section>}
    <div className="directory-filters">
      {!groupsOnly && <>
        {!modern && <label>{copy.category}
          <select ref={categoryRef} value={filters.category} onChange={event => update('category', event.target.value)}>
            <option value="">{copy.allCategories}</option>
            {Object.keys(directoryCategories).map(key => <option key={key} value={key}>{copy[key]}</option>)}
          </select>
        </label>}
        <label>{copy.type}
          <select value={filters.type} onChange={event => update('type', event.target.value)}>
            <option value="">{copy.allTypes}</option>
            {distinct([...types, filters.type]).map(type => <option key={type} value={type}>{typeLabels.get(type) || type}</option>)}
          </select>
        </label>
      </>}

<label>{groupsOnly ? t.caregiverDraft.city : copy.location}
  <select
    ref={locationRef}
    value={filters.location}
    onChange={event => update('location', event.target.value)}
  >
          <option value="">{copy.allLocations}</option>
          {distinct([...locations, filters.location]).map(location => <option key={location}>{location}</option>)}
        </select>
      </label>
      {groupsOnly && <>
        <label>{copy.groupType}
          <select value={filters.groupType} onChange={event => update('groupType', event.target.value)}>
            <option value="">{copy.allGroups}</option>
            {groupTypes.map(type => <option key={type} value={type}>{groupLabels[type]}</option>)}
          </select>
        </label>
      </>}
      <button className="tp-btn tp-btn-ghost" type="button" onClick={() => setFilters(baseFilters)}>{copy.reset}</button>
    </div>
    <div id={resultsId} className="directory-results">
      {state === 'loading' && <p role="status">{copy.loading}</p>}
      {state === 'error' && <div role="alert"><p>{copy.error}</p>
        <button className="tp-btn tp-btn-ghost" type="button" onClick={() => { setState('loading'); setRetry(retry + 1); }}>{copy.retry}</button>
      </div>}
      {state === 'ready' && (records.length ? records.map(row => <article key={row.id} className="directory-result">
        {modern && <span className="rf-result-icon">{symbol(Object.keys(directoryCategories).find(key => directoryCategories[key].includes(row.category)))}</span>}
        <h3>{row.name}</h3>
        {!groupsOnly && <p>{[...directoryTypes(row), groupLabels[row.group_type]].filter(Boolean).join(' · ')}</p>}
        {!groupsOnly && (row.description || row.specialist_field) && <p>{row.description || row.specialist_field}</p>}
        <p>{[row.address, row.postcode, row.city, row.state].filter(Boolean).join(', ')}</p>
        <div className="directory-contacts">
          {row.phone && <a href={`tel:${row.phone.replace(/[^+\d]/g, '')}`}>{row.phone}</a>}
          {row.email && <a href={`mailto:${row.email}`}>{row.email}</a>}
          {!groupsOnly && /^https?:\/\//i.test(row.website || '') && <a href={row.website}>{copy.website}</a>}
        </div>
        {!groupsOnly && <LastReviewed value={row.last_reviewed_at} />}
        {!groupsOnly && (row.opening_hours || row.eligibility || row.fees || row.volunteer_details) && <details open={row.id === matchedId ? true : undefined}>
          <summary>{copy.details}</summary>
          <dl>{Object.entries({ hours: row.opening_hours, eligibility: row.eligibility, fees: row.fees, volunteerDetails: row.volunteer_details })
            .filter(([, value]) => value).map(([key, value]) => <div key={key}><dt>{copy[key]}</dt><dd>{value}</dd></div>)}</dl>
        </details>}
      </article>) : groupsOnly ? <p role="status">{copy.empty}</p> : <div className="directory-result directory-empty" style={{ gridColumn: '1 / -1' }}>
        <div role="status">
          {modern && <span className="rf-empty-icon">{symbol("information")}</span>}
          <h3>{modern && !rows.length ? (copy.emptyDirectoryTitle || copy.empty) : (copy.emptyTitle || 'No matching resources found')}</h3>
          <p>{modern && !rows.length ? (copy.emptyDirectoryGuidance || copy.intro) : (copy.emptyGuidance || copy.empty)}</p>
        </div>
        <div className="tp-actions directory-empty-actions">
          <button type="button" className="tp-btn" onClick={changeLocation}>{copy.changeLocation || 'Change Location'}</button>
          <button type="button" className="tp-btn tp-btn-ghost" onClick={resetFromEmpty}>{copy.reset}</button>
        </div>
      </div>)}
    </div>
  </div>;
}
