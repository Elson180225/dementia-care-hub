import { useState } from "react";
import { useTrainer } from "../../trainer-portal/TrainerContext";
import { ADMIN_ACTIVITY_TYPES, LANGUAGES, MODES, ROLES, STAGE_LABEL } from "../../trainer-portal/constants";
import { canArchive, fmtDate, lifecycleStage } from "../../trainer-portal/selectors";
import { Field, StatusChip, describe } from "../../trainer-portal/ui";

const blank = {
  title: "", date: "", type: "Webinar", mode: "Online", venue: "", language: "English",
  audience: "", description: "", registrationLink: "", registrationDeadline: "", capacity: "",
  trainers: [],
};

const FILTERS = {
  active: ["Active", (a) => !a.archived && !a.cancelled],
  toPublish: ["Awaiting publication", (a) => a.status === "approved" && !a.published && !a.archived && !a.cancelled],
  published: ["Published", (a) => a.published && !a.archived && !a.cancelled],
  archived: ["Archived", (a) => a.archived],
  all: ["All", () => true],
};

function validate(v) {
  const e = {};
  if (!v.title.trim()) e.title = "Please enter a title.";
  if (!v.date) e.date = "Please choose a date and time.";
  if (v.mode === "Physical" && !v.venue.trim()) e.venue = "Please enter the venue.";
  if (!v.description.trim()) e.description = "Please add a short description.";
  if (v.registrationLink && !/^https?:\/\//i.test(v.registrationLink))
    e.registrationLink = "The link must start with http:// or https://";
  if (v.registrationDeadline && v.date && v.registrationDeadline > v.date)
    e.registrationDeadline = "The deadline should be before the activity starts.";
  if (v.capacity !== "" && !(Number(v.capacity) > 0))
    e.capacity = "Capacity must be a number above 0, or left empty.";
  if (v.trainers.some((t) => !t.name.trim()))
    e.trainers = "Each trainer row needs a name, or remove the row.";
  return e;
}

export default function AdminActivities() {
  const { state, dispatch } = useTrainer();
  const [filter, setFilter] = useState("active");
  const [editing, setEditing] = useState(null); // { id?, values }
  const [errors, setErrors] = useState({});
  const [cancelling, setCancelling] = useState(null); // { id, reason, error }

  const list = state.activities
    .filter(FILTERS[filter][1])
    .sort((a, b) => a.date.localeCompare(b.date));

  function open(a) {
    setErrors({});
    setEditing(
      a
        ? {
            id: a.id,
            values: {
              ...Object.fromEntries(Object.keys(blank).map((k) => [k, a[k] ?? ""])),
              trainers: (a.trainers ?? []).map((t) => ({ ...t })),
            },
          }
        : { values: { ...blank, trainers: [] } }
    );
  }

  const change = (e) =>
    setEditing({ ...editing, values: { ...editing.values, [e.target.name]: e.target.value } });

  const setTrainers = (fn) =>
    setEditing({ ...editing, values: { ...editing.values, trainers: fn(editing.values.trainers) } });

  function save() {
    const found = validate(editing.values);
    setErrors(found);
    if (Object.keys(found).length) return;
    const venue = editing.values.mode === "Online" ? "Online" : editing.values.venue;
    dispatch({
      type: "ADMIN_ACTIVITY_SAVE",
      activity: { id: editing.id ?? crypto.randomUUID(), ...editing.values, venue },
    });
    setEditing(null);
  }

  function confirmCancel() {
    if (!cancelling.reason.trim()) {
      setCancelling({ ...cancelling, error: "Please give a short reason." });
      return;
    }
    dispatch({ type: "ADMIN_CANCEL", id: cancelling.id, reason: cancelling.reason.trim() });
    setCancelling(null);
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
        <h1>{editing.id ? "Edit / reschedule activity" : "New RCBC activity"}</h1>
        <form className="tp-card" noValidate onSubmit={(e) => e.preventDefault()}>
          {input("title", "Title")}
          {input("date", "Date & time", { type: "datetime-local" })}
          <Field id="type" label="Activity type">
            <select id="type" name="type" value={v.type} onChange={change}>
              {[...new Set([...ADMIN_ACTIVITY_TYPES, v.type].filter(Boolean))].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field id="mode" label="Online or physical">
            <select id="mode" name="mode" value={v.mode} onChange={change}>
              {MODES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          {v.mode === "Physical" && input("venue", "Venue / location")}
          <Field id="language" label="Activity language">
            <select id="language" name="language" value={v.language} onChange={change}>
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          {input("audience", "Suitable for")}
          <Field id="description" label="Description" error={errors.description}>
            <textarea id="description" name="description" rows="4" value={v.description} onChange={change}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={describe("description", errors.description)} />
          </Field>
          {input("registrationLink", "External registration link (optional)", { type: "url", placeholder: "https://" })}
          {input("registrationDeadline", "Registration deadline (optional)", { type: "datetime-local" })}
          {input("capacity", "Capacity (optional)", { type: "number", min: "1" })}

          <fieldset className="tp-field">
            <legend>Assigned trainers and roles</legend>
            {v.trainers.map((t, i) => (
              <div key={i} className="tp-actions">
                <input aria-label={`Trainer ${i + 1} name`} value={t.name}
                  onChange={(e) => setTrainers((list) => list.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <select aria-label={`Trainer ${i + 1} role`} value={t.role}
                  onChange={(e) => setTrainers((list) => list.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))}>
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
                <button type="button" className="tp-btn tp-btn-ghost"
                  onClick={() => setTrainers((list) => list.filter((_, j) => j !== i))}>Remove</button>
              </div>
            ))}
            {errors.trainers && <p className="tp-error" role="alert">{errors.trainers}</p>}
            <button type="button" className="tp-btn tp-btn-ghost"
              onClick={() => setTrainers((list) => [...list, { name: "", role: "Trainer" }])}>Add trainer</button>
          </fieldset>

          <p className="tp-dev">Poster upload will be added when file upload is built on the server.</p>
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
      <h1>Activities</h1>
      <p>
        Trainer-submitted activities arrive through the Review queue. Once approved, publish them here.
        RCBC-run webinars and programmes are created here.
      </p>
      <div className="tp-toolbar">
        <Field id="filter" label="Show">
          <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {Object.entries(FILTERS).map(([key, [label]]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </Field>
        <button className="tp-btn" onClick={() => open(null)}>New RCBC activity</button>
      </div>

      <ul className="tp-cards">
        {list.map((a) => (
          <li key={a.id} className="tp-card">
            <p className="tp-dev">{a.source === "rcbc" ? "Created by RCBC" : "Submitted by trainer"} · {a.type}</p>
            <h2>{a.title}</h2>
            <p>{fmtDate(a.date)} · {a.mode} · {a.language}</p>
            {a.trainers?.length > 0 && (
              <p>Trainers: {a.trainers.map((t) => `${t.name} (${t.role})`).join(", ")}</p>
            )}
            <p><StatusChip status={lifecycleStage(a)} labels={STAGE_LABEL} /></p>
            {a.cancelled && a.adminComment && <p className="tp-note">Cancelled: {a.adminComment}</p>}

            <div className="tp-actions">
              {a.status === "approved" && !a.cancelled && !a.archived && (
                <button className="tp-btn"
                  onClick={() => dispatch({ type: "ADMIN_PUBLISH", id: a.id, published: !a.published })}>
                  {a.published ? "Unpublish" : "Publish"}
                </button>
              )}
              {!a.archived && <button className="tp-btn tp-btn-ghost" onClick={() => open(a)}>Edit / reschedule</button>}
              {!a.archived && !a.cancelled && (
                <button className="tp-btn tp-btn-ghost" onClick={() => setCancelling({ id: a.id, reason: "", error: "" })}>
                  Cancel activity
                </button>
              )}
              {canArchive(a) && (
                <button className="tp-btn tp-btn-ghost" onClick={() => dispatch({ type: "ADMIN_ARCHIVE", id: a.id })}>
                  Archive
                </button>
              )}
            </div>

            {cancelling?.id === a.id && (
              <div>
                <Field id={`cancel-${a.id}`} label="Reason for cancelling" error={cancelling.error}>
                  <textarea id={`cancel-${a.id}`} rows="2" value={cancelling.reason}
                    onChange={(e) => setCancelling({ ...cancelling, reason: e.target.value, error: "" })}
                    aria-invalid={Boolean(cancelling.error)}
                    aria-describedby={describe(`cancel-${a.id}`, cancelling.error)} />
                </Field>
                <div className="tp-actions">
                  <button className="tp-btn" onClick={confirmCancel}>Confirm cancellation</button>
                  <button className="tp-btn tp-btn-ghost" onClick={() => setCancelling(null)}>Keep activity</button>
                </div>
              </div>
            )}
          </li>
        ))}
        {list.length === 0 && <li className="tp-card">No activities in this view.</li>}
      </ul>
    </>
  );
}