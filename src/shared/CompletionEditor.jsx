import { useState } from "react";
import { put } from "./api";
import { Upload, AssetLink } from "./RecordFields";
export default function CompletionEditor({
  activity,
  existingAssets = [],
  onSaved,
  onCancel,
}) {
  const [values, setValues] = useState({
    actual_venue: activity.actual_venue || activity.venue || "Online",
    participant_count: activity.participant_count ?? "",
    actual_hours: activity.actual_hours || activity.planned_hours || "",
  });
  const [assets, setAssets] = useState(
      existingAssets.map((a) => ({ asset_id: a.asset_id, purpose: a.purpose })),
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await put("/activities/" + activity.id + "/completion", {
        ...values,
        participant_count: Number(values.participant_count),
        actual_hours: Number(values.actual_hours),
        assets,
      });
      await onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save}>
      <h3>Completion: {activity.title}</h3>
      <div className="ad-form-grid">
        {[
          ["actual_venue", "Actual venue", "text"],
          ["participant_count", "Number of participants", "number"],
          ["actual_hours", "Actual contribution hours", "number"],
        ].map(([key, label, type]) => (
          <label key={key}>
            {label}
            <input
              type={type}
              required
              min={key === "actual_hours" ? "0.25" : "0"}
              step={key === "actual_hours" ? "0.25" : "1"}
              value={values[key]}
              onChange={(e) =>
                setValues((v) => ({ ...v, [key]: e.target.value }))
              }
            />
          </label>
        ))}
      </div>
      <Upload
        label="Upload completion photo or supporting material"
        onUploaded={(f) =>
          setAssets((a) => [...a, { asset_id: f.id, purpose: "photo" }])
        }
      />
      {assets.map((a, i) => (
        <div className="ad-inline" key={a.asset_id}>
          <AssetLink id={a.asset_id} />
          <select
            aria-label="Material type"
            value={a.purpose}
            onChange={(e) =>
              setAssets((all) =>
                all.map((r, n) =>
                  i === n ? { ...r, purpose: e.target.value } : r,
                ),
              )
            }
          >
            {["photo", "recording", "slides", "qa", "handout", "other"].map(
              (p) => (
                <option key={p}>{p}</option>
              ),
            )}
          </select>
          <button
            type="button"
            className="ad-secondary"
            onClick={() => setAssets((all) => all.filter((_, n) => n !== i))}
          >
            Remove
          </button>
        </div>
      ))}
      {error && (
        <p role="alert" className="ad-error">
          {error}
        </p>
      )}
      <div className="ad-actions">
        <button disabled={busy}>Submit completion for verification</button>
        <button type="button" className="ad-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
