import { useState } from "react";
import { useTrainer } from "../../trainer-portal/TrainerContext";
import { LANGUAGES, RECORD_CATEGORIES, RECORD_STATUS_LABEL } from "../../trainer-portal/constants";
import { reviewDue } from "../../trainer-portal/selectors";
import { Field, StatusChip, describe } from "../../trainer-portal/ui";

const blank = {
  category: RECORD_CATEGORIES[0], title: "", description: "", city: "",
  language: "All", contact: "", source: "", sourceUrl: "",
};
const LANGS = ["All", ...LANGUAGES];

function validate(v) {
  const e = {};
  if (!v.title.trim()) e.title = "Please enter a title.";
  if (!v.description.trim()) e.description = "Please add a short description.";
  if (v.sourceUrl && !/^https?:\/\//i.test(v.sourceUrl))
    e.sourceUrl = "The link must start with http:// or https://";
  return e;
}

const fmt = (d) => new Date(d).toLocaleDateString("en-MY", { dateStyle: "medium" });

export default function Records() {
  const { state, dispatch } = useTrainer();
  const [category, setCategory] = useState("All");
  const [view, setView] = useState("live");
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");

  const list = state.records.filter(
    (r) =>
      (category === "All" || r.category === category) &&
      (view === "live" ? r.status !== "archived" : r.status === view)
  );

  function open(r) {
    setErrors({});
    setNotice("");
    setEditing(
      r
        ? { id: r.id, values: Object.fromEntries(Object.keys(blank).map((k) => [k, r[k] ?? ""])) }
        : { values: { ...blank } }
    );
  }

  const change = (e) =>
    setEditing({ ...editing, values: { ...editing.values, [e.target.name]: e.target.value } });

  function save() {
    const found = validate(editing.values);
    setErrors(found);
    if (Object.keys(found).length) return;
    dispatch({ type: "RECORD_SAVE", record: { id: editing.id ?? crypto.randomUUID(), ...editing.values } });
    setEditing(null);
  }

  function setStatus(r, status) {
    if (status === "published" && !r.source.trim()) {
      setNotice(`“${r.title}” needs a source before it can be published. Edit the record and add one.`);
      return;
    }
    setNotice("");
    dispatch({ type: "RECORD_STATUS", id: r.id, status });
  }

  /* ---------- Form ---------- */
  if (editing) {
    const v = editing.values;
    const input = (name, label, props = {}) => (
      <Field id={name} label={label} error={errors[name]} hint={props.hint}>
        <input id={name} name={name} value={v[name]} onChange={change}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={describe(name, errors[name], props.hint)} {...props} />
      </Field>
    );
    return (
      <>
        <h1>{editing.id ? "Edit record" : "New record"}</h1>
        <form className="tp-card" noValidate onSubmit={(e) => e.preventDefault()}>
          <Field id="category" label="Category">
            <select id="category" name="category" value={v.category} onChange={change}>
              {RECORD_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          {input("title", "Name / title")}
          <Field id="description" label="Description" error={errors.description}>
            <textarea id="description" name="description" rows="4" value={v.description} onChange={change}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={describe("description", errors.description)} />
          </Field>
          {input("city", "City / location")}
          <Field id="language" label="Language availability">
            <select id="language" name="language" value={v.language} onChange={change}>
              {LANGS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          {input("contact", "Contact / access information")}
          {input("source", "Source (who confirmed this information)", {
            hint: "Needed before the record can be published.",
          })}
          {input("sourceUrl", "Source link (optional)", { type: "url", placeholder: "https://" })}
          <div className="tp-actions">
            <button type="button" className="tp-btn" onClick={save}>Save</button>
            <button type="button" className="tp-btn tp-btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      </>
    );
  }

  /* ---------- List ---------- */
  return (
    <>
      <h1>Directory & content</h1>
      <p>
        One place to maintain Find Help & Support, Caregiver Support, Learning Resources and FAQ records.
        Inclusion does not mean RCBC endorses the provider.
      </p>
      <div className="tp-toolbar">
        <Field id="cat" label="Category">
          <select id="cat" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>All</option>
            {RECORD_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field id="view" label="Show">
          <select id="view" value={view} onChange={(e) => setView(e.target.value)}>
            <option value="live">Draft & published</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
        <button className="tp-btn" onClick={() => open(null)}>New record</button>
      </div>
      {notice && <p className="tp-note" role="alert">{notice}</p>}

      <ul className="tp-cards">
        {list.map((r) => (
          <li key={r.id} className="tp-card">
            <p className="tp-dev">{r.category}</p>
            <h2>{r.title}</h2>
            <p>{r.description}</p>
            <p>{[r.city, r.language, r.contact].filter(Boolean).join(" · ")}</p>
            <p>
              Source: {r.source || <em>none yet</em>}
              {r.sourceUrl && (
                <> (<a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">link</a>)</>
              )}
            </p>
            <p>
              Last reviewed: {fmt(r.lastReviewed)}{" "}
              {r.status !== "archived" && reviewDue(r) && <span className="tp-chip tp-chip-amber">Review due</span>}
            </p>
            <p><StatusChip status={r.status} labels={RECORD_STATUS_LABEL} /></p>
            <div className="tp-actions">
              <button className="tp-btn tp-btn-ghost" onClick={() => open(r)}>Edit / correct</button>
              <button className="tp-btn tp-btn-ghost" onClick={() => dispatch({ type: "RECORD_REVIEWED", id: r.id })}>
                Mark as reviewed
              </button>
              {r.status === "draft" && <button className="tp-btn" onClick={() => setStatus(r, "published")}>Publish</button>}
              {r.status === "published" && (
                <button className="tp-btn tp-btn-ghost" onClick={() => setStatus(r, "draft")}>Unpublish</button>
              )}
              {r.status !== "archived" && (
                <button className="tp-btn tp-btn-ghost" onClick={() => setStatus(r, "archived")}>Archive</button>
              )}
              {r.status === "archived" && (
                <button className="tp-btn tp-btn-ghost" onClick={() => setStatus(r, "draft")}>Restore as draft</button>
              )}
            </div>
          </li>
        ))}
        {list.length === 0 && <li className="tp-card">No records in this view.</li>}
      </ul>
    </>
  );
}