import UploadField from "../UploadField";
import { useState } from "react";
import { useTrainer } from "../TrainerContext";
import { LANGUAGES, STATUS_LABEL } from "../constants";
import { Field, StatusChip } from "../ui";

const CERT_LABEL = { pending: "Waiting for approval", certified: "Certified", suspended: "Suspended" };

const LISTING_LABEL = {
  none: "Not listed",
  requested: "Waiting for RCBC review",
  approved: "Listed on the public Certified Trainers page",
  returned: "Returned – see RCBC's comment",
  rejected: "Not approved",
  suspended: "Removed by RCBC",
};

export default function MyProfile() {
  const { state, dispatch } = useTrainer();
  const [uploading,setUploading]=useState(0);
  const uploadBusy=busy=>setUploading(n=>n+(busy?1:-1));
  const { profile } = state;
  const [values, setValues] = useState({
    city: profile.city, language: profile.language, shortProfile: profile.shortProfile,
    qualifications: profile.qualifications, experience: profile.experience,
    photoUrl: profile.photoUrl || "", supportingDocuments: profile.supportingDocuments || [],
  });
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const locked = profile.status === "submitted";

  const change = (e) => { setValues({ ...values, [e.target.name]: e.target.value }); setMessage(""); };

  async function submit(e) {
    e.preventDefault();
    const draft=e.nativeEvent.submitter?.value==="draft";
    if (!draft && (!values.city.trim() || !values.shortProfile.trim())) {
      setMessage("Please fill in your city and a short profile.");
      return;
    }
    if(!await dispatch({ type: draft?"PROFILE_SAVE":"PROFILE_SUBMIT", values })) return;
    setMessage(draft?"Draft saved.":"Sent. RCBC will review your profile changes.");
  }

  return (
    <>
      <h1>My profile</h1>
      <p>After RCBC approves it, this profile appears on the public Certified Trainers page.</p>
      <p><StatusChip status={profile.status} labels={STATUS_LABEL} /></p>
      {profile.status === "returned" && profile.adminComment && (
        <p className="tp-note">Comment from RCBC: {profile.adminComment}</p>
      )}

      <section className="tp-card">
        <h2>Checked by RCBC (you can't change these)</h2>
        <dl className="tp-dl">
          <dt>Name</dt><dd>{profile.name}</dd>
          <dt>Certification</dt><dd>{CERT_LABEL[profile.certifiedStatus] ?? profile.certifiedStatus}</dd>
          <dt>Certificate number</dt><dd>{profile.certificateRef}</dd>
        </dl>
      </section>

      <section className="tp-card">
        <h2>Public listing</h2>
        <p>Your portal access and your public listing are approved separately. You only appear on the public Certified Trainers page if you agree and RCBC approves it.</p>
        <p><strong>Status:</strong> {LISTING_LABEL[profile.listingStatus] ?? profile.listingStatus}</p>
        {profile.listingComment && <p className="tp-note">Comment from RCBC: {profile.listingComment}</p>}

        {["none", "returned", "rejected"].includes(profile.listingStatus) && (
          <>
            <label style={{ display: "flex", gap: "12px", alignItems: "flex-start", margin: "16px 0" }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>I agree that RCBC may publish my name, city, language, profile, photo and certificate number on the public Certified Trainers page. I can withdraw at any time.</span>
            </label>
            <button className="tp-btn" disabled={!consent} onClick={() => dispatch({ type: "LISTING_REQUEST", consent: true })}>
              Request public listing
            </button>
          </>
        )}

        {["requested", "approved"].includes(profile.listingStatus) && (
          <button className="tp-btn tp-btn-ghost" onClick={() => dispatch({ type: "LISTING_WITHDRAW" })}>
            Withdraw from public listing
          </button>
        )}
      </section>

      <form className="tp-card" onSubmit={submit} noValidate>
        <h2>Details you can change</h2>
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
        <UploadField onBusyChange={uploadBusy} label="Profile photo" kind="photo" value={values.photoUrl} onChange={photoUrl=>setValues({...values,photoUrl})} disabled={locked}/>
        <UploadField onBusyChange={uploadBusy} label="Supporting documents (private)" kind="document" value={values.supportingDocuments} onChange={supportingDocuments=>setValues({...values,supportingDocuments})} multiple disabled={locked}/>
        <button className="tp-btn" disabled={locked || uploading>0}>Send to RCBC for review</button>
        <button className="tp-btn tp-btn-ghost" value="draft" disabled={locked || uploading>0}>Save draft</button>
        <p role="status" aria-live="polite">{locked ? "Waiting for RCBC to review your changes." : message}</p>
      </form>
    </>
  );
}