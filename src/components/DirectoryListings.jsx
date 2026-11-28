import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { directoryCategories, directoryTypes, findDirectoryListings, groupTypes, translateDirectoryListings } from '../../shared/directory.js';
import { LastReviewed } from './PublicFeatures';
import '../pages/find-help/ResourceFinder.css';

const baseFilters = { category: '', type: '', location: '', groupType: '', volunteers: false };
const distinct = items => [...new Set(items.filter(Boolean))].sort((a, b) => a.localeCompare(b));

export default function DirectoryListings({ groupsOnly = false, initial = {}, linkedId, resultsId }) {
  const { t, translateContent } = useLanguage();
  const copy = t.directory;
  const groupLabels = Object.fromEntries(groupTypes.map((type, index) => [type, [groupsOnly ? t.caregiverDraft.publicGroup : copy.governmentGroup, copy.privateGroup, copy.communityGroup][index]]));
  const [filters, setFilters] = useState({ ...baseFilters, ...initial });
  const [rows, setRows] = useState([]);
  const [state, setState] = useState('loading');
  const [retry, setRetry] = useState(0);
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

  return <div className="directory-listings">
    <div className="directory-filters">
      {!groupsOnly && <>
        <label>{copy.category}
          <select value={filters.category} onChange={event => update('category', event.target.value)}>
            <option value="">{copy.allCategories}</option>
            {Object.keys(directoryCategories).map(key => <option key={key} value={key}>{copy[key]}</option>)}
          </select>
        </label>
        <label>{copy.type}
          <select value={filters.type} onChange={event => update('type', event.target.value)}>
            <option value="">{copy.allTypes}</option>
            {distinct([...types, filters.type]).map(type => <option key={type} value={type}>{typeLabels.get(type) || type}</option>)}
          </select>
        </label>
      </>}
      <label>{groupsOnly ? t.caregiverDraft.city : copy.location}
        <select value={filters.location} onChange={event => update('location', event.target.value)}>
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
      </article>) : <p role="status">{copy.empty}</p>)}
    </div>
  </div>;
}
