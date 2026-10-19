import { useCallback, useEffect, useState } from "react";
import { api } from "../../trainer-portal/TrainerContext";
import { Field, describe } from "../../trainer-portal/ui";
import { recordTypes } from "../../../shared/admin-records.js";

const KINDS = Object.keys(recordTypes);
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
const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-MY", { dateStyle: "medium" }) : "never");

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

export default function Records() {
  const [kind, setKind] = useState(KINDS[0]);
  const config = recordTypes[kind];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { id?, values }
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api(`/api/admin/records/${kind}`));
    } catch (e) {
      setNotice(e.message);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    load();
  }, [load]);

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
    setErrors(found);
    if (Object.keys(found).length) return;
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
        <form className="tp-card" noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
          {config.fields.map(([name, label, type, required]) => {
            const id = `rec-${name}`;
            const common = {
              id, value: v[name], onChange: (e) => set(name, e.target.value),
              "aria-invalid": Boolean(errors[name]), "aria-describedby": describe(id, errors[name]),
            };
            const text = label + (required ? "" : " (optional)");
            if (type === "checkbox")
              return (
                <label key={name} className="tp-field">
                  <span>{label}</span>
                  <input type="checkbox" checked={v[name]} onChange={(e) => set(name, e.target.checked)} />
                </label>
              );
            return (
              <Field key={name} id={id} label={text} error={errors[name]}>
                {Array.isArray(type) ? (
                  <select {...common}>{type.map((o) => <option key={o}>{o}</option>)}</select>
                ) : type === "textarea" || type === "array" ? (
                  <textarea rows={name === "body" ? 8 : 3} {...common} />
                ) : (
                  <input type={type} {...common} />
                )}
              </Field>
            );
          })}
          <div className="tp-actions">
            <button className="tp-btn" disabled={busy}>{busy ? "Saving..." : "Save"}</button>
            <button type="button" className="tp-btn tp-btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
          <p role="status" aria-live="polite">{notice}</p>
        </form>
      </>
    );
  }

  /* ---------- List ---------- */
  const reviewed = "review_status" in toForm(config);
  return (
    <>
      <h1>Content and records</h1>
      <p>
        One place to maintain directory listings, learning resources, FAQs, page content, subscribers,
        DCS certificates and enquiries. Inclusion does not mean RCBC endorses the provider.
      </p>
      <div className="tp-toolbar">
        <Field id="kind" label="Record type">
          <select id="kind" value={kind} onChange={(e) => { setKind(e.target.value); setNotice(""); }}>
            {KINDS.map((k) => <option key={k} value={k}>{recordTypes[k].label}</option>)}
          </select>
        </Field>
        {!config.readonlyCreate && (
          <button className="tp-btn" onClick={() => { setErrors({}); setEditing({ values: toForm(config) }); }}>
            New record
          </button>
        )}
      </div>
      {notice && <p className="tp-note" role="status">{notice}</p>}
      {loading && <p role="status">Loading records…</p>}

      <ul className="tp-cards">
        {rows.map((r) => (
          <li key={r.id} className="tp-card">
            <h2>{r[config.title] || "(untitled)"}</h2>
            {r.category && <p className="tp-dev">{r.category}</p>}
            {kind === "enquiries" && <p>{r.email} · {r.type} — {r.message}</p>}
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
              r.status && <p><span className="tp-chip tp-chip-grey">{r.status}</span></p>
            )}
            <div className="tp-actions">
              <button className="tp-btn tp-btn-ghost" disabled={busy}
                onClick={() => { setErrors({}); setEditing({ id: r.id, values: toForm(config, r) }); }}>
                Edit / correct
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