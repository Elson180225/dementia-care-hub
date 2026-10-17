import { useState } from "react";
import { activityFields } from "../../shared/records";
import {
  Fields,
  Upload,
  AssetLink,
  valuesFor,
  payloadFor,
} from "./RecordFields";
import { post, put } from "./api";
export default function ActivityEditor({
  record = {},
  profiles = [],
  assignments = [],
  translations = [],
  organisations = [],
  admin = false,
  onSaved,
  onCancel,
}) {
  const fields = admin
    ? activityFields
    : activityFields.map((f) =>
        f.key === "type_code" ? { ...f, options: ["workshop", "seminar"] } : f,
      );
  const [values, setValues] = useState(() => valuesFor(fields, record)),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [trainers, setTrainers] = useState(
    assignments.filter((a) => a.activity_id === record.id),
  );
  const [translated, setTranslated] = useState(
    translations.filter((t) => t.activity_id === record.id),
  );
  const change = (key, value) => setValues((v) => ({ ...v, [key]: value }));
  async function save(event, submit = false) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = payloadFor(fields, values);
      if (admin) {
        body.trainers = trainers.map(({ trainer_id, role }) => ({
          trainer_id,
          role,
        }));
        body.translations = translated.map(
          ({ locale, title, target_audience, description }) => ({
            locale,
            title,
            target_audience,
            description,
          }),
        );
      }
      const a = await (record.id
        ? put("/activities/" + record.id, body)
        : post("/activities", body));
      if (submit) await post("/activities/" + a.id + "/submit");
      await onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={(e) => save(e, false)}>
      <Fields
        fields={fields.filter((f) => f.key !== "poster_asset_id")}
        values={values}
        onChange={change}
        references={{
          organiser_id: organisations.map((o) => ({
            value: o.id,
            label: o.name,
          })),
        }}
      />
      {values.poster_asset_id && (
        <p>
          <AssetLink id={values.poster_asset_id}>
            Current activity poster
          </AssetLink>
          <button
            className="ad-secondary"
            type="button"
            onClick={() => change("poster_asset_id", "")}
          >
            Remove poster
          </button>
        </p>
      )}
      <Upload
        label="Upload activity poster"
        onUploaded={(f) => change("poster_asset_id", f.id)}
      />
      {admin && (
        <>
          <h3>Assigned trainers</h3>
          {trainers.map((t, i) => (
            <div className="ad-inline" key={i}>
              <select
                aria-label="Assigned trainer"
                value={t.trainer_id}
                onChange={(e) =>
                  setTrainers((all) =>
                    all.map((r, n) =>
                      n === i ? { ...r, trainer_id: e.target.value } : r,
                    ),
                  )
                }
              >
                <option value="">Select trainer</option>
                {profiles
                  .filter((p) => p.certified_status === "certified")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
              <select
                aria-label="Trainer role"
                value={t.role}
                onChange={(e) =>
                  setTrainers((all) =>
                    all.map((r, n) =>
                      n === i ? { ...r, role: e.target.value } : r,
                    ),
                  )
                }
              >
                {["trainer", "co_trainer", "speaker"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <button
                type="button"
                className="ad-secondary"
                onClick={() =>
                  setTrainers((all) => all.filter((_, n) => n !== i))
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="ad-secondary"
            onClick={() =>
              setTrainers((all) => [
                ...all,
                { trainer_id: "", role: "trainer" },
              ])
            }
          >
            + Add trainer
          </button>
          <h3>Translated activity text</h3>
          {translated.map((t, i) => (
            <div className="ad-card" key={i}>
              <select
                aria-label="Translation language"
                value={t.locale}
                onChange={(e) =>
                  setTranslated((all) =>
                    all.map((r, n) =>
                      i === n ? { ...r, locale: e.target.value } : r,
                    ),
                  )
                }
              >
                {["en", "ms", "zh"].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
              {["title", "target_audience", "description"].map((k) => (
                <label key={k}>
                  {k.replaceAll("_", " ")}
                  <input
                    value={t[k] || ""}
                    onChange={(e) =>
                      setTranslated((all) =>
                        all.map((r, n) =>
                          i === n ? { ...r, [k]: e.target.value } : r,
                        ),
                      )
                    }
                  />
                </label>
              ))}
              <button
                type="button"
                className="ad-secondary"
                onClick={() =>
                  setTranslated((all) => all.filter((_, n) => n !== i))
                }
              >
                Remove translation
              </button>
            </div>
          ))}
          <button
            type="button"
            className="ad-secondary"
            onClick={() =>
              setTranslated((all) => [
                ...all,
                {
                  locale: "ms",
                  title: "",
                  target_audience: "",
                  description: "",
                },
              ])
            }
          >
            + Add translation
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="ad-error">
          {error}
        </p>
      )}
      <div className="ad-actions">
        <button disabled={busy}>Save draft</button>
        <button
          type="button"
          disabled={busy}
          onClick={(e) => {
            if (e.currentTarget.form.reportValidity()) save(e, true);
          }}
        >
          Save & submit
        </button>
        <button type="button" className="ad-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
