import { useState } from "react";
import { useTrainer } from "../TrainerContext";
import { COMPLETION_LABEL } from "../constants";
import { fmtDate } from "../selectors";
import { Field, StatusChip, describe } from "../ui";

export default function Conducted() {
  const { state, dispatch } = useTrainer();
  const [openId, setOpenId] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  // Only approved activities can be completed. This is the same record, not a new one.
  const eligible = state.activities.filter((a) => a.status === "approved");

  function open(a) {
    setErrors({});
    setOpenId(a.id);
    setValues({
      venue: a.completion.venue ?? a.venue,
      participants: a.completion.participants ?? "",
      hours: a.completion.hours ?? a.plannedHours,
    });
  }

  function submit() {
    const e = {};
    if (!String(values.venue).trim()) e.venue = "Please enter the actual venue.";
    if (!(Number(values.participants) >= 0) || values.participants === "") e.participants = "Enter the number of participants.";
    if (!(Number(values.hours) > 0)) e.hours = "Enter actual hours greater than 0.";
    setErrors(e);
    if (Object.keys(e).length) return;
    dispatch({ type: "COMPLETION_SAVE", id: openId, values });
    dispatch({ type: "COMPLETION_SUBMIT", id: openId });
    setOpenId(null);
  }

  const change = (e) => setValues({ ...values, [e.target.name]: e.target.value });

  return (
    <>
      <h1>Workshops & Seminars Conducted</h1>
      <p>After an approved activity ends, add its record here. The title, date and language carry over automatically.</p>
      <ul className="tp-cards">
        {eligible.map((a) => (
          <li key={a.id} className="tp-card">
            <h2>{a.title}</h2>
            <p>{fmtDate(a.date)} · {a.language}</p>
            <p><StatusChip status={a.completion.status} labels={COMPLETION_LABEL} /></p>
            {a.completion.status === "returned" && a.completion.adminComment && (
              <p className="tp-note">Admin comment: {a.completion.adminComment}</p>
            )}
            {["none", "draft", "returned"].includes(a.completion.status) && openId !== a.id && (
              <button className="tp-btn tp-btn-ghost" onClick={() => open(a)}>Add activity record</button>
            )}
            {openId === a.id && (
              <form noValidate onSubmit={(e) => e.preventDefault()}>
                <Field id="venue" label="Actual venue / location" error={errors.venue}>
                  <input id="venue" name="venue" value={values.venue} onChange={change}
                    aria-invalid={Boolean(errors.venue)} aria-describedby={describe("venue", errors.venue)} />
                </Field>
                <Field id="participants" label="Total participants" error={errors.participants}>
                  <input id="participants" name="participants" type="number" min="0" value={values.participants} onChange={change}
                    aria-invalid={Boolean(errors.participants)} aria-describedby={describe("participants", errors.participants)} />
                </Field>
                <Field id="hours" label="Actual contribution hours" error={errors.hours}>
                  <input id="hours" name="hours" type="number" min="0" step="0.5" value={values.hours} onChange={change}
                    aria-invalid={Boolean(errors.hours)} aria-describedby={describe("hours", errors.hours)} />
                </Field>
                <p className="tp-dev">Activity photos will be added when file upload is built on the server.</p>
                <div className="tp-actions">
                  <button type="button" className="tp-btn" onClick={submit}>Submit for verification</button>
                  <button type="button" className="tp-btn tp-btn-ghost" onClick={() => setOpenId(null)}>Cancel</button>
                </div>
              </form>
            )}
          </li>
        ))}
        {eligible.length === 0 && <li className="tp-card">No approved activities yet.</li>}
      </ul>
    </>
  );
}