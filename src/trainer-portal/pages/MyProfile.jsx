import UploadField from "../UploadField";
import { useState } from "react";
import { useTrainer } from "../TrainerContext";
import { LANGUAGES } from "../constants";
import { Field } from "../ui";
import "./MyProfile.css";
import { ASSESSMENT_LABEL, teachingEligibility } from "../../../shared/teaching-eligibility";

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
  const fromProfile = (p) => ({
    city: p.city || "", language: p.language || "English", shortProfile: p.shortProfile || "",
    qualifications: p.qualifications || "", experience: p.experience || "",
    certificateEvidenceUrl: p.certificateEvidenceUrl || "",
    photoUrl: p.photoUrl || "", supportingDocuments: p.supportingDocuments || [],
  });
  const [values, setValues] = useState(() => fromProfile(profile));
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  // A profile that has never been completed opens straight in edit mode.
  const [editing, setEditing] = useState(profile.status !== "approved");

  const change = (e) => { setValues({ ...values, [e.target.name]: e.target.value }); setMessage(""); };

  function startEditing() {
    setValues(fromProfile(profile));
    setMessage("");
    setEditing(true);
  }

  async function save(e) {
    e.preventDefault();
    if (!values.city.trim() || !values.shortProfile.trim()) {
      setMessage("Please fill in your city and a short profile.");
      return;
    }
    if (!await dispatch({ type: "PROFILE_SAVE", values })) return;
    setEditing(false);
    setMessage("Profile saved.");
  }

  const initials = (profile.name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <h1>My profile</h1>
      {message && <p className="tp-note" role="status">{message}</p>}
      <section className="tp-card">
        <dl className="tp-dl">
          <dt>Name</dt><dd>{profile.name}</dd>
          <dt>Certification</dt><dd>{CERT_LABEL[profile.certifiedStatus] ?? profile.certifiedStatus}</dd>
          <dt>Assessment</dt><dd>{ASSESSMENT_LABEL[profile.assessment_status] ?? "Not assessed yet"}</dd>
          <dt>Assessment notes</dt><dd>{profile.assessment_result || "Not recorded"}</dd>
          <dt>Healthcare professional</dt><dd>{profile.healthcare_professional == null ? "Not recorded" : profile.healthcare_professional ? "Yes" : "No"}</dd>
          <dt>Teaching eligibility</dt><dd>{teachingEligibility(profile.assessment_status, profile.healthcare_professional)}</dd>    
          <dt>Independent teaching scope</dt><dd>{profile.independent_teaching_scope || "Not recorded"}</dd>
          <dt>Certificate evidence (private)</dt><dd>{profile.certificateEvidenceUrl ? <a href={profile.certificateEvidenceUrl} target="_blank" rel="noreferrer">Open certificate image or PDF</a> : "Not uploaded"}</dd>
          <dt>Certificate number</dt><dd>{profile.certificateRef}</dd>
        </dl>
        <p>Trainers running independent sessions are responsible for those sessions, not RCBC.</p>
      </section>

      <section className="tp-card">
        <h2>Public listing</h2>
        <p><strong>Status:</strong> {LISTING_LABEL[profile.listingStatus] ?? profile.listingStatus}</p>
        {profile.listingComment && <p className="tp-note">Comment from RCBC: {profile.listingComment}</p>}

        {["none", "returned", "rejected"].includes(profile.listingStatus) && (
          <>
            <Field id="listing-consent" label="I agree that RCBC may publish my name, city, language, profile, photo and certificate number on the public Certified Trainers page. I can withdraw at any time." required example="Tick this only if you want a public listing. Your certificate image and supporting documents stay private. RCBC reviews the listing request separately.">
              <input id="listing-consent" type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>
            </Field>
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

      {!editing ? (
        <section className="tp-card">
          <div className="mp-view">
            {profile.photoUrl
              ? <img className="mp-photo" src={profile.photoUrl} alt={`Profile photo of ${profile.name}`} />
              : <div className="mp-photo mp-initials" aria-hidden="true">{initials}</div>}
            <div className="mp-details">
              <h2>{profile.name}</h2>
              <p className="mp-meta">{profile.city} · {profile.language}</p>
              <h3>Short profile</h3>
              <p>{profile.shortProfile || "–"}</p>
              <h3>Qualifications</h3>
              <p>{profile.qualifications || "–"}</p>
              <h3>Relevant experience</h3>
              <p>{profile.experience || "–"}</p>
              <h3>Supporting documents (private)</h3>
              {(profile.supportingDocuments || []).length === 0 ? <p>–</p> : (
                <ul className="mp-docs">
                  {profile.supportingDocuments.map((url, i) => (
                    <li key={url}><a href={url} target="_blank" rel="noreferrer">Document {i + 1}</a></li>
                  ))}
                </ul>
              )}
              <div className="mp-actions">
                <button type="button" className="tp-btn" onClick={startEditing}>Edit profile</button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <form className="tp-card" onSubmit={save} noValidate>
          <h2>{profile.status === "approved" ? "Edit your profile" : "Complete your profile"}</h2>
          <Field id="city" label="City / Location (required)">
            <input id="city" name="city" value={values.city} onChange={change} />
          </Field>
          <Field id="language" label="Language">
            <select id="language" name="language" value={values.language} onChange={change}>
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field id="shortProfile" label="Short profile / background (required)" example="Briefly describe your background and dementia education experience. This text is public if RCBC approves your listing.">
            <textarea id="shortProfile" name="shortProfile" rows="4" value={values.shortProfile} onChange={change} />
          </Field>
          <Field id="qualifications" label="Qualifications">
            <textarea id="qualifications" name="qualifications" rows="3" value={values.qualifications} onChange={change} />
          </Field>
          <Field id="experience" label="Relevant experience">
            <textarea id="experience" name="experience" rows="3" value={values.experience} onChange={change} />
          </Field>
          <UploadField onBusyChange={uploadBusy} label="Profile photo" kind="photo" value={values.photoUrl} onChange={photoUrl=>setValues({...values,photoUrl})} />
          <UploadField onBusyChange={uploadBusy} label="Certificate image or PDF (private, optional)" kind="document" value={values.certificateEvidenceUrl} onChange={certificateEvidenceUrl=>setValues({...values,certificateEvidenceUrl})} help="Upload a clear certificate photo or PDF matching your reference. Only you and RCBC administrators can access it."/>
          <UploadField onBusyChange={uploadBusy} label="Supporting documents (private)" kind="document" value={values.supportingDocuments} onChange={supportingDocuments=>setValues({...values,supportingDocuments})} multiple />
          <div className="mp-actions">
            <button className="tp-btn" disabled={uploading > 0}>Save profile</button>
            {profile.status === "approved" && (
              <button type="button" className="tp-btn tp-btn-ghost" disabled={uploading > 0} onClick={() => { setEditing(false); setMessage(""); }}>Cancel</button>
            )}
          </div>
        </form>
      )}
    </>
  );
}