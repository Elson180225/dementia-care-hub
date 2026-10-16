import { useState } from "react";
import { useTrainer } from "../TrainerContext";
import { ACTIVITY_TYPES, LANGUAGES, MODES, STATUS_LABEL } from "../constants";
import { fmtDate } from "../selectors";
import { Field, StatusChip, describe } from "../ui";

const blank = {
  title: "", date: "", type: "Workshop", mode: "Online", venue: "", language: "English",
  audience: "", description: "", registrationLink: "", plannedHours: "",
};

function validate(v) {
  const e = {};
  if (!v.title.trim()) e.title = "Please enter a title.";
  if (!v.date) e.date = "Please choose a date and time.";
  if (v.mode === "Physical" && !v.venue.trim()) e.venue = "Please enter the venue.";
  if (!v.audience.trim()) e.audience = "Please say who this is suitable for.";
  if (!v.description.trim()) e.description = "Please describe what participants will learn.";
  if (!(Number(v.plannedHours) > 0)) e.plannedHours = "Enter planned hours greater than 0.";
  if (v.registrationLink && !/^https?:\/\//i.test(v.registrationLink))
    e.registrationLink = "The link must start with http:// or https://";
  return e;
}

export default function Activities() {
  const { state, dispatch } = useTrainer();
  const [editing, setEditing] = useState(null); // { id?, values }
  const [errors, setErrors] = useState({});

  const open = (a) => {
    setErrors({});
    setEditing(a ? { id: a.id, values: Object.fromEntries(Object.keys(blank).map((k) => [k, a[k] ?? ""])) } : { values: blank });
  };

  const change = (e) =>
    setEditing({ ...editing, values: { ...editing.values, [e.target.name]: e.target.value } });

  function save(submitToo) {
    const found = validate(editing.values);
    setErrors(found);
    if (Object.keys(found).length) return;
    const id = editing.id ?? crypto.randomUUID();
    const venue = editing.values.mode === "Online" ? "Online" : editing.values.venue;
    dispatch({ type: "ACTIVITY_SAVE", activity: { id, ...editing.values, venue } });
    if (submitToo) dispatch({ type: "ACTIVITY_SUBMIT", id });
    setEditing(null);
  }

  const v = editing?.values;
  const input = (name, label, props = {}) => (
    <Field id={name} label={label} error={errors[name]} hint={props.hint}>
      <input id={name} name={name} value={v[name]} onChange={change}
        aria-invalid={Boolean(errors[name])} aria-describedby={describe(name, errors[name], props.hint)} {...props} />
    </Field>
  );

  if (editing) {
    return (
      <>
        <h1>{editing.id ? "Edit workshop / seminar" : "New workshop / seminar"}</h1>
        <form className="tp-card" noValidate onSubmit={(e) => e.preventDefault()}>
          {input("title", "Title")}
          {input("date", "Date & time", { type: "datetime-local" })}
          <Field id="type" label="Activity type">
            <select id="type" name="type" value={v.type} onChange={change}>{ACTIVITY_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          <Field id="mode" label="Online or physical">
            <select id="mode" name="mode" value={v.mode} onChange={change}>{MODES.map((m) => <option key={m}>{m}</option>)}</select>
          </Field>
          {v.mode === "Physical" && input("venue", "Venue / location")}
          <Field id="language" label="Language">
            <select id="language" name="language" value={v.language} onChange={change}>{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select>
          </Field>
          {input("audience", "Suitable for")}
          <Field id="description" label="What participants will learn" error={errors.description}>
            <textarea id="description" name="description" rows="4" value={v.description} onChange={change}
              aria-invalid={Boolean(errors.description)} aria-describedby={describe("description", errors.description)} />
          </Field>
          {input("registrationLink", "External registration link (optional)", { type: "url", placeholder: "https://" })}
          {input("plannedHours", "Planned contribution hours", { type: "number", min: "0", step: "0.5" })}
          <p className="tp-dev">Poster upload will be added when file upload is built on the server.</p>
          <div className="tp-actions">
            <button type="button" className="tp-btn" onClick={() => save(true)}>Submit for Admin review</button>
            <button type="button" className="tp-btn tp-btn-ghost" onClick={() => save(false)}>Save as draft</button>
            <button type="button" className="tp-btn tp-btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      </>
    );
  }

  return (
    <>
      <h1>Workshop & Seminar</h1>
      <p>Submit your own activities. RCBC Admin reviews them before they appear in Education & Events.</p>
      <button className="tp-btn" onClick={() => open(null)}>New workshop / seminar</button>
      <ul className="tp-cards">
        {state.activities.map((a) => (
          <li key={a.id} className="tp-card">
            <h2>{a.title}</h2>
            <p>{a.type} · {a.mode} · {fmtDate(a.date)} · {a.language}</p>
            <p><StatusChip status={a.status} labels={STATUS_LABEL} /></p>
            {a.status === "returned" && a.adminComment && <p className="tp-note">Admin comment: {a.adminComment}</p>}
            {(a.status === "draft" || a.status === "returned") && (
              <button className="tp-btn tp-btn-ghost" onClick={() => open(a)}>Edit</button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}