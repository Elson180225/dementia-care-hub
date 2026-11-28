import { useCallback, useEffect, useState } from "react";
import { api } from "../../trainer-portal/TrainerContext";
import { Field, describe } from "../../trainer-portal/ui";
import { enquiryStatuses, enquiryTypes } from '../../../shared/enquiry.js';
import { serviceCategories } from '../../../shared/directory.js';
import { recordTypes } from "../../../shared/admin-records.js";
import ContactSettings from '../ContactSettings';
import ListingRequestManager from '../ListingRequestManager';
import EmailInventory from '../EmailInventory';
import SubscriberAudience from '../SubscriberAudience';

const ABOUT_SECTIONS = { overview: 'About the project', mission: 'What we aim to do', journey: 'Our journey', organiser: 'Organiser', partner: 'Partner roles', advisors: 'Advisors', supported: 'Supporting organisations', acknowledgements: 'Our thanks' };
const ADVANCE_PLANNING = {
  slug: "advance-plannng",
  title: "Advance Planning",
};
const enquiryStatus = value => enquiryStatuses[value] || value;
const modules = {
  website: { title: 'Content & records', kinds: ['learning_resources', 'faqs', 'content_pages', 'dcs_certificates'] },
  directory: { title: 'Directory Management', kinds: ['organisations', 'directory_services'] },
  communications: { title: 'Enquiries & Subscribers', kinds: ['enquiries', 'subscribers'] },
};
const legacyEnquiryTypes = ['Education & Events', 'Collaboration', 'Website & Resources', 'Others'];
const subscriberLocality = Object.entries({ country: 'Country', state: 'State / Province / Region', city: 'City / Town' });
const reviewStatuses = { published: 'Published', unpublished: 'Unpublished', 'needs review': 'Needs review', current: 'Current', archived: 'Archived' };

function RecordFilters({ kind, filters, onApply, onReset }) {
  const field = (key, label, type = 'search') => <Field key={key} id={`filter-${key}`} label={label}>
    <input id={`filter-${key}`} type={type} name={key} defaultValue={filters[key] || ''} maxLength={254} />
  </Field>;
  const select = (key, label, options, any = 'All') => <Field id={`filter-${key}`} label={label}>
    <select id={`filter-${key}`} name={key} defaultValue={filters[key] || ''}>
      <option value="">{any}</option>
      {Object.entries(options).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
    </select>
  </Field>;
  return <form className="tp-card" onSubmit={event => {
    event.preventDefault();
    onApply(Object.fromEntries(new FormData(event.currentTarget)));
  }} aria-label="Filter records">
    <div className="tp-toolbar">
      {kind === 'enquiries' ? <>
        {select('type', 'Enquiry type', Object.fromEntries([...enquiryTypes, ...legacyEnquiryTypes].map(type => [type, type])), 'All enquiry types')}
        {select('status', 'Status', enquiryStatuses, 'All statuses')}
        {field('from', 'Received from', 'date')}
        {field('through', 'Received through', 'date')}
      </> : kind === 'subscribers' ? <>
        {subscriberLocality.map(([key, label]) => field(key, label))}
        {select('status', 'Status', { active: 'Active', unsubscribed: 'Unsubscribed' }, 'All statuses')}
      </> : <>
        {field('name', 'Organisation name')}
        {kind === 'directory_services' ? select('category', 'Service category', Object.fromEntries(serviceCategories.map(key => [key, key])), 'All categories') : field('category', 'Organisation type')}
        {field('location', 'Location')}
        {select('status', 'Status', reviewStatuses, 'All statuses')}
      </>}
    </div>
    <div className="tp-actions">
      <button className="tp-btn" type="submit">Apply filters</button>
      <button className="tp-btn tp-btn-ghost" type="button" onClick={onReset}>Clear filters</button>
      {kind === 'subscribers' && <a className="tp-btn tp-btn-ghost" href={'/api/admin/subscribers/export?' + new URLSearchParams({ ...filters, records: '1' })}>Export records (CSV)</a>}
    </div>
  </form>;
}
const ZONE = { timeZone: "Asia/Kuala_Lumpur" };

// PostgreSQL returns timestamps as ISO strings; the form inputs need Malaysian local time.
const toLocal = (value, type) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return type === "date"
    ? d.toLocaleDateString("sv-SE", ZONE)
    : d.toLocaleString("sv-SE", ZONE).replace(" ", "T").slice(0, 16);
};
const nowLocal = () => toLocal(new Date(), "datetime-local");
const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-MY", { ...ZONE, dateStyle: "medium" }) : "never");

// Convert a database row into the exact shape the server's field list expects.
function toForm(config, row = {}) {
  const values = {};
  for (const [name, , type] of config.fields) {
    const v = row[name];
    if (type === "checkbox") values[name] = Boolean(v);
    else if (type === "array") values[name] = Array.isArray(v) ? v.join("\n") : "";
    else if (name === "body") values[name] = v?.text ?? "";
    else if (type === "date" || type === "datetime-local") values[name] = toLocal(v, type);
    else if (Array.isArray(type)) values[name] = v ?? type[0];
    else if (name === "language") values[name] = v ?? "English";
    else values[name] = v ?? "";
  }
  return values;
}

function toPayload(config, values) {
  const out = { ...values };
  for (const [name, , type] of config.fields)
    if (type === "array") out[name] = String(values[name] || "").split("\n").map((x) => x.trim()).filter(Boolean);
  return out;
}

function validate(config, values) {
  const e = {};
  for (const [name, label, type, required] of config.fields) {
    const v = values[name];
    if (required && type !== "checkbox" && !String(v ?? "").trim()) e[name] = `${label} is required.`;
    if (type === "url" && v && !/^https?:\/\//i.test(v)) e[name] = "The link must start with http:// or https://";
  }
  if (values.publication_status === "published" && "source" in values && (!values.source?.trim() || !values.last_reviewed_at))
    e.publication_status = "Add a source and last-reviewed date before publishing.";
  return e;
}

const reviewDue = (r) =>
  r.review_status === "needs review" ||
  (r.review_status !== "archived" && r.next_review_at && new Date(r.next_review_at) <= new Date());

export default function Records({ module = 'website' }) {
  const { title, kinds } = modules[module];
  const [kind, setKind] = useState(kinds[0]);
  const [filters, setFilters] = useState({});
  const [filterReset, setFilterReset] = useState(0);
  const filterQuery = new URLSearchParams(filters).toString();
  const [organisations, setOrganisations] = useState([]);
  const config = recordTypes[kind];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { id?, values }
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (kind !== 'directory_services') return;
    let active = true;
    api('/api/admin/records/organisations?choices=1').then(rows => {
      if (active) setOrganisations(rows);
    }).catch(error => { if (active) setNotice(error.message); });
    return () => { active = false; };
  }, [kind]);
  const load = useCallback(async (live = () => true) => {
    try {
      const next = await api(`/api/admin/records/${kind}?${filterQuery}`);
      if (live()) setRows(next);
    } catch (e) {
      if (live()) { setRows([]); setNotice(e.message); }
    } finally {
      if (live()) setLoading(false);
    }
  }, [kind, filterQuery]);

  useEffect(() => {
    let active = true;
    load(() => active);
    return () => { active = false; };
  }, [load]);

  useEffect(() => {
    if (kind !== 'enquiries' || !editing?.id) return;
    let live = true;
    queueMicrotask(() => { if (live) { setHistory([]); setHistoryError(''); } });
    api('/api/admin/enquiry-history?id=' + encodeURIComponent(editing.id)).then(rows => { if (live) setHistory(rows); }).catch(() => { if (live) setHistoryError('Follow-up history could not be loaded.'); });
    return () => { live = false; };
  }, [kind, editing?.id]);

  function applyFilters(values) {
    if (new URLSearchParams(values).toString() === filterQuery) return;
    setLoading(true);
    setFilters(values);
  }

  async function send(data, done) {
    setBusy(true);
    setNotice("");
    try {
      await api(`/api/admin/records/${kind}`, data);
      setNotice(done);
      await load();
      return true;
    } catch (e) {
      setNotice(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const found = validate(config, editing.values);
    if (kind === 'subscribers' && !editing.id && !editing.values.country.trim()) found.country = 'Country is required.';
    setErrors(found);
    if (Object.keys(found).length) return;
    if (kind === 'enquiries' && editing.values.status !== 'new' && !editing.values.admin_comment?.trim()) {
      setErrors({ admin_comment: 'Describe the follow-up or outcome before saving.' }); return;
    }
    const ok = await send({ id: editing.id, values: toPayload(config, editing.values) }, "Record saved.");
    if (ok) setEditing(null);
  }

  // Quick actions resend the full record with one or two fields changed.
  const quick = (row, changes, done) =>
    send({ id: row.id, values: toPayload(config, { ...toForm(config, row), ...changes }) }, done);

  const removeDraft = (row) => {
    if (window.confirm("Delete this unpublished draft? This cannot be undone."))
      send({ id: row.id, remove: true }, "Draft deleted.");
  };

  /* ---------- Form ---------- */
  if (editing) {
    const v = editing.values;
    const set = (name, value) => setEditing({ ...editing, values: { ...v, [name]: value } });
    return (
      <>
        <h1>{editing.id ? `Edit ${config.label.toLowerCase()} record` : `New ${config.label.toLowerCase()} record`}</h1>
        {kind === 'enquiries' && (() => { const row = rows.find(r => r.id === editing.id); return row && <article className="tp-card"><h2>Visitor message</h2><p>{row.name} · <a href={`mailto:${row.email}`}>{row.email}</a></p><p>{row.type}</p><p style={{whiteSpace:'pre-wrap'}}>{row.message}</p><p>Received: {fmt(row.received_at)}</p></article>; })()}
        {kind === 'content_pages' && <p>RCBC supplies and approves About text. Save as unpublished until approved, then record the approver, source and review date before publishing.</p>}
        <form className="tp-card" noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
          {config.fields.map(([name, label, type, required]) => {
            const id = `rec-${name}`;
            const mandatory = required ||
              (kind === 'subscribers' && name === 'country' && (!editing.id || Boolean(rows.find(row => row.id === editing.id)?.country))) ||
              (name === 'admin_comment' && kind === 'enquiries' && v.status !== 'new') ||
              (name === 'last_reviewed_at' && (v.review_status === 'current' || v.publication_status === 'published')) ||
              (name === 'source' && v.publication_status === 'published') ||
              (name === 'reviewer' && kind === 'content_pages' && v.slug?.startsWith('about-') && v.publication_status === 'published') ||
              (['copyright_permission', 'url'].includes(name) && kind === 'learning_resources' && v.publication_status === 'published');
            const common = {
              id, value: v[name], onChange: (e) => set(name, e.target.value),
              required: Boolean(mandatory),
              "aria-invalid": Boolean(errors[name]), "aria-describedby": describe(id, errors[name]),
            };
            const text = label + (mandatory ? "" : " (optional)");
            if (type === "checkbox")
              return (
                <Field key={name} id={id} label={label} example={name === 'is_example' ? 'Keep this ticked for fictional demonstration records. These must not be presented as real services.' : 'Tick this option only when it applies to this record.'}>
                  <input id={id} type="checkbox" checked={v[name]} onChange={(e) => set(name, e.target.checked)} />
                </Field>
              );
            return (
              <Field key={name} id={id} label={text} required={Boolean(mandatory)} error={errors[name]}>
                {type === 'organisation' ? (
                  <select {...common}><option value="">Choose an organisation</option>{organisations.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select>
                ) : Array.isArray(type) ? (
                  <select {...common}>{type.map((o) => <option key={o} value={o}>{kind === "enquiries" && name === "status" ? enquiryStatus(o) : o || 'Choose if applicable'}</option>)}</select>
                ) : type === "textarea" || type === "array" ? (
                  <textarea rows={name === "body" ? 8 : 3} {...common} />
                ) : (
                  <><input type={type} {...common} list={kind === 'content_pages' && name === 'slug' ? 'about-sections' : undefined} />{kind === 'content_pages' && name === 'slug' && <datalist id="about-sections">{Object.entries(ABOUT_SECTIONS).map(([id,title]) => <option key={id} value={`about-${id}`}>{title}</option>)}</datalist>}</>
                )}
              </Field>
            );
          })}
          {kind === 'content_pages' && <aside className="tp-card"><h2>Text preview</h2><h3>{v.title || 'Page title'}</h3><p style={{whiteSpace:'pre-wrap'}}>{v.body || 'Your text will appear here.'}</p></aside>}
          <div className="tp-actions">
            <button className="tp-btn" disabled={busy}>{busy ? "Saving..." : "Save"}</button>
            <button type="button" className="tp-btn tp-btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
          <p role="status" aria-live="polite">{notice}</p>
        </form>
        {kind === 'enquiries' && <section className="tp-card"><h2>Follow-up history</h2>{historyError && <p role="alert">{historyError}</p>}{history.map((entry,index) => <article key={index}><p>{new Date(entry.changed_at).toLocaleString('en-MY', ZONE)} · {enquiryStatus(entry.to_status) || entry.decision}</p><p style={{whiteSpace:'pre-wrap'}}>{entry.admin_comment}</p></article>)}{!history.length && !historyError && <p>No recorded follow-up yet.</p>}</section>}
      </>
    );
  }

  /* ---------- List ---------- */
  const reviewed = "review_status" in toForm(config);
  return (
    <>
      <h1>{title}</h1>
      {module === 'website' && <EmailInventory />}
      {module === 'directory' && <p>Manage shared contact details in Organisations. Link each service listing to its organisation to publish it in the relevant public directory views.</p>}
      <div className="tp-toolbar">
        <Field id="kind" label="What to update">
          <select id="kind" value={kind} onChange={(e) => { setKind(e.target.value); setRows([]); setLoading(true); setFilters({}); setNotice(""); }}>
            {kinds.map((k) => <option key={k} value={k}>{recordTypes[k].label}</option>)}
          </select>
        </Field>
        {!config.readonlyCreate && (
          <button className="tp-btn" onClick={() => { setErrors({}); setEditing({ values: toForm(config) }); }}>
            New record
          </button>
        )}
      </div>
      {kind === 'content_pages' && <section className="tp-card"><h3>About the Project</h3><p>Add approved text to each section as it becomes available. Published entries replace the matching section in the selected language. Use separate entries for partners and contributors.</p><div className="tp-actions">{Object.entries(ABOUT_SECTIONS).map(([id,title]) => <button className="tp-btn tp-btn-ghost" key={id} onClick={() => { setErrors({}); setEditing({values:{...toForm(config),slug:`about-${id}`,title}}); }}>Add {title.toLowerCase()}</button>)}</div></section>}

{kind === 'content_pages' && (
  <section className="tp-card">
    <h3>Advance Planning</h3>

    <p>
      Manage the Advance Planning information displayed
      on the Find Help & Support page.
      Only publish content approved by RCBC.
    </p>

    <div className="tp-actions">
      <button
        type="button"
        className="tp-btn"
        onClick={() => {
          const existing = rows.find(
            row =>
              row.slug === ADVANCE_PLANNING.slug &&
              row.language === "English"
          );

          setErrors({});

          setEditing(
            existing
              ? {
                  id: existing.id,
                  values: toForm(config, existing),
                }
              : {
                  values: {
                    ...toForm(config),
                    ...ADVANCE_PLANNING,
                    language: "English",
                  },
                }
          );
        }}
      >
        Manage Advance Planning
      </button>
    </div>
  </section>
)}

      {module !== 'website' && <RecordFilters key={kind + filterReset} kind={kind} filters={filters} onApply={applyFilters}
        onReset={() => { applyFilters({}); setFilterReset(current => current + 1); }} />}
      {kind === 'subscribers' && <SubscriberAudience />}
      {kind === 'enquiries' && <ContactSettings />}
      {module === 'directory' &&
        kind === 'organisations' && (
          <ListingRequestManager />
      )}
      {notice && <p className="tp-note" role="status">{notice}</p>}
      {loading && <p role="status">Loading records…</p>}

      <ul className="tp-cards">
        {!loading && rows.map((r) => (
          <li key={r.id} className="tp-card">
            <h2>{r[config.title] || "(untitled)"}</h2>
            {r.category && <p className="tp-dev">{r.organisation_name ? `${r.organisation_name} ? ` : ''}{r.category}</p>}
            {kind === 'subscribers' && <>
              <p>{r.email}</p>
              <p>{[r.country || 'Country not recorded', r.state, r.city].filter(Boolean).join(' ? ')}</p>
              <p>{r.unsubscribed_at ? `Unsubscribed ${fmt(r.unsubscribed_at)}` : 'Active'} ? Subscribed {fmt(r.consent_at)}</p>
              <p>Consent recorded {new Date(r.consent_at).toLocaleString('en-MY', ZONE)} ? {r.consent_version}</p>
            </>}
            {kind === "enquiries" && <><p><a href={`mailto:${r.email}`}>{r.email}</a> · {r.type}</p><p style={{whiteSpace:'pre-wrap'}}>{r.message}</p><p>Received: {fmt(r.received_at)}{r.followed_up_at && ` · Followed up: ${fmt(r.followed_up_at)}`}{r.closed_at && ` · Closed: ${fmt(r.closed_at)}`}</p><p>Email notification: {r.notification_status === 'sent' ? 'Sent to RCBC' : r.notification_status || 'Pending'}</p>{r.notification_error && <p>{r.notification_error}</p>}{r.admin_comment && <p>Latest note: {r.admin_comment}</p>}{r.notification_status === 'failed' && <button className="tp-btn tp-btn-ghost" disabled={busy} onClick={async () => { setBusy(true); try { await api('/api/admin/enquiry-notification-retry',{id:r.id}); setNotice('Email queued for another delivery attempt.'); await load(); } catch(e) { setNotice(e.message); } finally { setBusy(false); } }}>Retry notification</button>}</>}
            {reviewed ? (
              <>
                <p>Source: {r.source || <em>none yet</em>} · Last reviewed: {fmt(r.last_reviewed_at)}</p>
                <p>
                  <span className={`tp-chip tp-chip-${r.publication_status === "published" ? "green" : "grey"}`}>
                    {r.publication_status === "published" ? "Published" : "Not public"}
                  </span>{" "}
                  <span className="tp-chip tp-chip-grey">{r.review_status}</span>{" "}
                  {reviewDue(r) && <span className="tp-chip tp-chip-amber">Review due</span>}
                </p>
              </>
            ) : (
              r.status && <p><span className="tp-chip tp-chip-grey">{kind === "enquiries" ? enquiryStatus(r.status) : r.status}</span></p>
            )}
            <div className="tp-actions">
              <button className="tp-btn tp-btn-ghost" disabled={busy}
                onClick={() => { setErrors({}); setEditing({ id: r.id, values: toForm(config, r) }); }}>
                {kind === "enquiries" ? "Record follow-up" : "Edit / correct"}
              </button>
              {reviewed && r.review_status !== "archived" && (
                <>
                  <button className="tp-btn tp-btn-ghost" disabled={busy}
                    onClick={() => quick(r, { review_status: "current", last_reviewed_at: nowLocal() }, "Marked as reviewed.")}>
                    Mark as reviewed
                  </button>
                  {r.publication_status === "published" ? (
                    <button className="tp-btn tp-btn-ghost" disabled={busy}
                      onClick={() => quick(r, { publication_status: "unpublished" }, "Record unpublished.")}>
                      Unpublish
                    </button>
                  ) : (
                    <button className="tp-btn" disabled={busy}
                      onClick={() => quick(r, { publication_status: "published" }, "Record published.")}>
                      Publish
                    </button>
                  )}
                  <button className="tp-btn tp-btn-ghost" disabled={busy}
                    onClick={() => quick(r, { review_status: "archived" }, "Record archived.")}>
                    Archive
                  </button>
                  {r.publication_status !== "published" && (
                    <button className="tp-btn tp-btn-ghost" disabled={busy} onClick={() => removeDraft(r)}>
                      Delete draft
                    </button>
                  )}
                </>
              )}
              {reviewed && r.review_status === "archived" && (
                <button className="tp-btn tp-btn-ghost" disabled={busy}
                  onClick={() => quick(r, { review_status: "needs review", publication_status: "unpublished" }, "Restored as a draft for review.")}>
                  Restore as draft
                </button>
              )}
            </div>
          </li>
        ))}
        {!loading && rows.length === 0 && <li className="tp-card">No {config.label.toLowerCase()} records yet.</li>}
      </ul>
    </>
  );
}
