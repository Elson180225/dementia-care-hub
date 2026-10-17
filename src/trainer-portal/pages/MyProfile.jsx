import { useState } from "react";
import { useTrainer } from "../TrainerContext";
import { profileFields } from "../../../shared/records";
import {
  Fields,
  valuesFor,
  payloadFor,
  Upload,
  AssetLink,
  Badge,
} from "../../shared/RecordFields";
import { put } from "../../shared/api";
export default function MyProfile() {
  const { state, refresh } = useTrainer();
  const p = state.profile;
  const [values, setValues] = useState(() => valuesFor(profileFields, p)),
    [documents, setDocuments] = useState(
      state.documents.map((d) => d.asset_id),
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const locked = p.status === "submitted";
  return (
    <section className="ad-card">
      <h2>My Profile</h2>
      <p>
        This same profile appears in the Certified Trainer directory after
        approval.
      </p>
      <Badge>{p.status}</Badge>
      <p>
        Name: {p.name} · Certification: {p.certified_status} · Reference:{" "}
        {p.certificate_reference || "Not assigned"}
      </p>
      {p.admin_comment && (
        <p className="ad-error">Admin comment: {p.admin_comment}</p>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await put("/trainer/profile", {
              ...payloadFor(profileFields, values),
              document_ids: documents,
            });
            await refresh();
            setMessage("Profile submitted for Admin review.");
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Fields
          fields={profileFields.filter((f) => f.key !== "photo_asset_id")}
          values={values}
          disabled={locked}
          onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))}
        />
        {values.photo_asset_id && (
          <p>
            <AssetLink id={values.photo_asset_id}>
              Current profile photo
            </AssetLink>
          </p>
        )}
        {!locked && (
          <>
            <Upload
              label="Upload profile photo"
              onUploaded={(f) =>
                setValues((s) => ({ ...s, photo_asset_id: f.id }))
              }
            />
            <Upload
              label="Upload private supporting document"
              onUploaded={(f) => setDocuments((d) => [...d, f.id])}
            />
          </>
        )}
        {documents.map((id) => (
          <p key={id}>
            <AssetLink id={id}>
              {state.assets.find((f) => f.id === id)?.original_filename ||
                "Supporting document"}
            </AssetLink>
            {!locked && (
              <button
                type="button"
                className="ad-secondary"
                onClick={() =>
                  setDocuments((all) => all.filter((d) => d !== id))
                }
              >
                Remove
              </button>
            )}
          </p>
        ))}
        {error && (
          <p role="alert" className="ad-error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="ad-success">
            {message}
          </p>
        )}
        <button disabled={locked || busy}>
          {locked ? "Awaiting Admin review" : "Submit for Admin review"}
        </button>
      </form>
    </section>
  );
}
