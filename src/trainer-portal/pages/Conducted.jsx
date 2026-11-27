import {activityTiming,individualHours} from '../../../shared/trainer-governance';
import UploadField from "../UploadField";
import { useState } from "react";
import { useTrainer } from "../TrainerContext";
import { COMPLETION_LABEL } from "../constants";
import { Field, StatusChip, describe } from "../ui";
import EventCard from "../EventCard";

export default function Conducted({admin=false}) {
  const { state, dispatch } = useTrainer();
  const [uploading,setUploading]=useState(0);
  const uploadBusy=busy=>setUploading(n=>n+(busy?1:-1));
  const [openId, setOpenId] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  // Only approved activities can be completed. This is the same record, not a new one.
  const eligible = state.activities.filter((a) => ["published", "completed", "verified", "archived"].includes(a.status) && !a.postponedAt && !a.cancelledAt && new Date(a.date)<=new Date());

  function open(a) {
    setErrors({});
    setOpenId(a.id);
    setValues({
      actualStart:a.completion.actualStart||a.date,
      actualEnd:a.completion.actualEnd||a.endDate||'',
      venue: a.completion.venue ?? a.venue,
      participants: a.completion.participants ?? "",
      hours: a.completion.eventHours || a.plannedHours,
      trainerHours:Object.fromEntries((a.trainers||[]).map(t=>[t.trainerId,a.completion.trainerHours?.[t.trainerId]??''])),
      photos: a.completion.photos || [],
    });
  }

  async function submit() {
    const e = {};
    if (!String(values.venue).trim()) e.venue = "Please enter the actual venue.";
    if (!(Number(values.participants) >= 0) || values.participants === "") e.participants = "Enter the number of participants.";
    if (!(Number(values.hours) > 0)) e.hours = "Enter actual hours greater than 0.";
    try{activityTiming(values.actualStart,values.actualEnd,values.hours);individualHours(eligible.find(a=>a.id===openId)?.trainers||[],values.trainerHours,Number(values.hours));}catch(error){e.hours=error.message;}
    setErrors(e);
    if (Object.keys(e).length) return;
    if(!await dispatch({ type: "COMPLETION_SAVE", id: openId, values })) return;
    setOpenId(null);
  }

  const change = (e) => setValues({ ...values, [e.target.name]: e.target.value });

  return (
    <>
      <h1>{admin?'Activity completion reviews':'Completed activities'}</h1>
           <ul className="ev-grid">
        {eligible.map((a) => (
          <EventCard key={a.id} activity={a} wide={openId === a.id}
            status={<StatusChip status={a.completion.status} labels={COMPLETION_LABEL} />}>
            <p>{a.activityReference} · {a.organiserName} · {a.completion.actualStart || a.date}</p>
            {admin&&a.completion.status==='verified'&&<button type="button" className="tp-btn tp-btn-ghost" onClick={()=>{const reason=window.prompt('Why does this verified completion need correction? Verified totals will exclude it until it is checked again.');if(reason?.trim())dispatch({type:'COMPLETION_REOPEN',id:a.id,comment:reason.trim()});}}>Reopen for correction</button>}
            {(a.trainers||[]).map(t=><div key={t.trainerId}><p>{t.name} · {t.topic||'Topic not recorded'} · {t.role} · {t.hours??'—'} hours · {t.contributionStatus||'pending'} {t.reviewComment}</p>{a.completion.status!=='none'&&t.trainerId===state.session?.id&&['pending','returned'].includes(t.contributionStatus)&&<button className="tp-btn tp-btn-ghost" onClick={()=>{const hours=window.prompt('Confirm or correct your actual individual hours (maximum '+a.completion.eventHours+')',String(t.hours??''));if(hours!==null&&hours!=='')dispatch({type:'CONTRIBUTION_CONFIRM',id:a.id,hours});}}>Confirm my contribution</button>}</div>)}
            {a.completion.status === "returned" && a.completion.adminComment && (
              <p className="tp-note">Comment from RCBC: {a.completion.adminComment}</p>
            )}
            {["none", "draft", "returned"].includes(a.completion.status) && (admin || a.created_by === state.session?.id) && openId !== a.id && (
              <button className="tp-btn tp-btn-ghost" onClick={() => open(a)}>Record how it went</button>
            )}
            {openId === a.id && (
              <form noValidate onSubmit={(e) => e.preventDefault()}>
                <Field id="actualStart" label="Actual start (Malaysia)"><input id="actualStart" name="actualStart" type="datetime-local" value={values.actualStart} onChange={change}/></Field>
                <Field id="actualEnd" label="Actual end (Malaysia)"><input id="actualEnd" name="actualEnd" type="datetime-local" value={values.actualEnd} onChange={change}/></Field>
                <Field id="venue" label="Actual venue / location" error={errors.venue}>
                  <input id="venue" name="venue" value={values.venue} onChange={change}
                    aria-invalid={Boolean(errors.venue)} aria-describedby={describe("venue", errors.venue)} />
                </Field>
                <Field id="participants" label="Total participants" error={errors.participants}>
                  <input id="participants" name="participants" type="number" min="0" value={values.participants} onChange={change}
                    aria-invalid={Boolean(errors.participants)} aria-describedby={describe("participants", errors.participants)} />
                </Field>
                <Field id="hours" label="Net actual hours (excluding breaks)" error={errors.hours}>
                  <input id="hours" name="hours" type="number" min="0" step="0.5" value={values.hours} onChange={change}
                    aria-invalid={Boolean(errors.hours)} aria-describedby={describe("hours", errors.hours)} />
                </Field>
                <fieldset><legend>Individual trainer contribution hours</legend><p>Record each person's actual hours, no greater than the net event duration. Each trainer confirms their record before RCBC reviews it.</p>{(eligible.find(a=>a.id===openId)?.trainers||[]).map(t=><label key={t.trainerId}>{t.name||state.profiles.find(p=>p.id===t.trainerId)?.name||'Assigned trainer'} — {t.role}<input type="number" min="0" step="0.5" value={values.trainerHours[t.trainerId]} onChange={e=>setValues({...values,trainerHours:{...values.trainerHours,[t.trainerId]:e.target.value}})}/></label>)}</fieldset>
                <UploadField onBusyChange={uploadBusy} label="Activity photos" kind="activity-photo" value={values.photos} onChange={photos=>setValues({...values,photos})} multiple/>
                <div className="tp-actions">
                  <button type="button" className="tp-btn" disabled={uploading>0} onClick={submit}>Submit for verification</button>
                  <button type="button" className="tp-btn tp-btn-ghost" onClick={() => setOpenId(null)}>Cancel</button>
                </div>
              </form>
            )}
          </EventCard>
        ))}
        {eligible.length === 0 && (
          <li className="tp-card" style={{ gridColumn: "1 / -1" }}>No finished workshops yet. Published workshops appear here once their date has passed.</li>
        )}
      </ul>
    </>
  );
}
