import { useState } from "react";
import { useTrainer } from "../TrainerContext";
import { LANGUAGES, STATUS_LABEL } from "../constants";
import { Field, StatusChip } from "../ui";

export default function MyProfile() {
  const { state, dispatch } = useTrainer();
  const { profile } = state;
  const [values, setValues] = useState({
    city: profile.city, language: profile.language, shortProfile: profile.shortProfile,
    qualifications: profile.qualifications, experience: profile.experience,
  });
  const [message, setMessage] = useState("");
  const locked = profile.status === "submitted";

  const change = (e) => { setValues({ ...values, [e.target.name]: e.target.value }); setMessage(""); };

  function submit(e) {
    e.preventDefault();
    if (!values.city.trim() || !values.shortProfile.trim()) {
      setMessage("Please fill in your city and a short profile.");
      return;
    }
    dispatch({ type: "PROFILE_SUBMIT", values });
    setMessage("Your profile update was sent to RCBC Admin for review.");
  }

  return (
    <>
      <h1>My Profile</h1>
      <p>This is the same record shown publicly under Certified Trainers once Admin approves it.</p>
      <p><StatusChip status={profile.status} labels={STATUS_LABEL} /></p>
      {profile.status === "returned" && profile.adminComment && (
        <p className="tp-note">Admin comment: {profile.adminComment}</p>
      )}

      <section className="tp-card">
        <h2>Verified by RCBC (cannot be edited)</h2>
        <dl className="tp-dl">
          <dt>Name</dt><dd>{profile.name}</dd>
          <dt>Status</dt><dd>{profile.certifiedStatus}</dd>
          <dt>Certificate reference no.</dt><dd>{profile.certificateRef}</dd>
        </dl>
      </section>

      <form className="tp-card" onSubmit={submit} noValidate>
        <h2>Details you can update</h2>
        <Field id="city" label="City / Location">
          <input id="city" name="city" value={values.city} onChange={change} disabled={locked} />
        </Field>
        <Field id="language" label="Language">
          <select id="language" name="language" value={values.language} onChange={change} disabled={locked}>
            {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
          </select>
        </Field>
        <Field id="shortProfile" label="Short profile / background">
          <textarea id="shortProfile" name="shortProfile" rows="4" value={values.shortProfile} onChange={change} disabled={locked} />
        </Field>
        <Field id="qualifications" label="Qualifications">
          <textarea id="qualifications" name="qualifications" rows="3" value={values.qualifications} onChange={change} disabled={locked} />
        </Field>
        <Field id="experience" label="Relevant experience">
          <textarea id="experience" name="experience" rows="3" value={values.experience} onChange={change} disabled={locked} />
        </Field>
        <p className="tp-dev">Profile photo and supporting documents will be added when file upload is built on the server.</p>
        <button className="tp-btn" disabled={locked}>Submit for Admin review</button>
        <p role="status" aria-live="polite">{locked ? "Awaiting Admin review." : message}</p>
      </form>
    </>
  );
}