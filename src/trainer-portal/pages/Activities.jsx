import UploadField from "../UploadField";
import { useEffect, useState } from "react";
import { useTrainer } from "../TrainerContext";
import { ACTIVITY_TYPES, LANGUAGES, MODES, STATUS_LABEL } from "../constants";
import { fmtDate } from "../selectors";
import { Field, StatusChip, describe } from "../ui";

const blank = {
  title: "", date: "", type: "Workshop", mode: "Online", venue: "", language: "English",
  audience: "", description: "", registrationLink: "", plannedHours: "", city: "", posterUrl: "", registrationDeadline: "", capacity: "",
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

export default function Activities({admin=false}) {
  const { state, dispatch } = useTrainer();
  const [uploading,setUploading]=useState(0);
  const uploadBusy=busy=>setUploading(n=>n+(busy?1:-1));
  const [editing, setEditing] = useState(null); // { id?, values }
  const [errors, setErrors] = useState({});
  const [availableTrainers,setAvailableTrainers]=useState([]);
  useEffect(()=>{fetch('/api/portal/trainers').then(r=>r.json()).then(setAvailableTrainers).catch(()=>{});},[]);
  const [assigned,setAssigned]=useState([]);

  const open = (a) => {
    setErrors({});
    setAssigned(a?.trainers || (admin?[]:[{trainerId:state.session?.id,role:"Trainer"}]));
    setEditing(a ? { id: a.id, values: Object.fromEntries(Object.keys(blank).map((k) => [k, a[k] ?? ""])) } : { values: blank });
  };

  const change = (e) =>
    setEditing({ ...editing, values: { ...editing.values, [e.target.name]: e.target.value } });

  async function save(submitToo) {
    const found = validate(editing.values);
    setErrors(found);
    if (Object.keys(found).length) return;
    const id = editing.id ?? crypto.randomUUID();
    const venue = editing.values.mode === "Online" ? "Online" : editing.values.venue;
    if(!await dispatch({ type: "ACTIVITY_SAVE", activity: { id, ...editing.values, venue, trainers:assigned } })) return;
    if (submitToo && !await dispatch({ type: "ACTIVITY_SUBMIT", id })) return;
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
            <select id="type" name="type" value={v.type} onChange={change}>{(admin?[...ACTIVITY_TYPES,"RCBC Webinar","CT Webinar","DCS-Family","DCS-TTT","Expo","Dialogue","Forum","Public Talk","Other"]:ACTIVITY_TYPES).map((t) => <option key={t}>{t}</option>)}</select>
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
          <fieldset><legend>Activity trainers</legend>
          {assigned.map((t,i)=><div key={i} className="tp-actions"><select aria-label="Trainer" value={t.trainerId} onChange={e=>setAssigned(assigned.map((x,j)=>i===j?{...x,trainerId:e.target.value}:x))}>{availableTrainers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><select aria-label="Activity role" value={t.role} onChange={e=>setAssigned(assigned.map((x,j)=>i===j?{...x,role:e.target.value}:x))}>{["Trainer","Co-Trainer","Speaker"].map(r=><option key={r}>{r}</option>)}</select><button type="button" onClick={()=>setAssigned(assigned.filter((_,j)=>i!==j))}>Remove</button></div>)}
          <button type="button" onClick={()=>setAssigned([...assigned,{trainerId:availableTrainers[0]?.id || state.session?.id,role:"Co-Trainer"}])}>Add trainer</button></fieldset>
          {input("city", "City")}
          {input("registrationDeadline", "Registration deadline", {type:"datetime-local"})}
          {input("capacity", "Capacity (optional)", {type:"number",min:"1",step:"1"})}
          <UploadField onBusyChange={uploadBusy} label="Activity poster" kind="poster" value={v.posterUrl} onChange={posterUrl=>setEditing({...editing,values:{...v,posterUrl}})}/>
          <div className="tp-actions">
            <button type="button" className="tp-btn" disabled={uploading>0} onClick={() => save(true)}>Submit for Admin review</button>
            <button type="button" className="tp-btn tp-btn-ghost" disabled={uploading>0} onClick={() => save(false)}>Save as draft</button>
            <button type="button" className="tp-btn tp-btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      </>
    );
  }

  return (
    <>
      <h1>{admin?"Events and workshops":"Workshop & Seminar"}</h1>
      <p>{admin?"Create and maintain project activities. Submit and approve the record before publishing it from the review queue.":"Submit your own activities. RCBC Admin reviews them before they appear in Education & Events."}</p>
      <button className="tp-btn" onClick={() => open(null)}>{admin?"New project activity":"New workshop / seminar"}</button>
      <ul className="tp-cards">
        {state.activities.map((a) => (
          <li key={a.id} className="tp-card">
            <h2>{a.title}</h2>
            {a.cancelledAt && <p className="tp-note">Cancelled: {a.cancellation_reason}</p>}
            <p>{a.type} · {a.mode} · {fmtDate(a.date)} · {a.language}</p>
            <p><StatusChip status={a.status} labels={STATUS_LABEL} /></p>
            {a.status === "returned" && a.adminComment && <p className="tp-note">Admin comment: {a.adminComment}</p>}
            {(!a.cancelledAt && (admin?["draft","returned","approved","published"].includes(a.status):["draft","returned"].includes(a.status) && a.created_by===state.session?.id)) && (
              <button className="tp-btn tp-btn-ghost" onClick={() => open(a)}>Edit</button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}