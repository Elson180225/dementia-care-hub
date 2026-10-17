import { useState } from "react";
import { post } from "./api";
export function localDate(value, type = "datetime-local") {
  if (!value) return "";
  if (type === "date") return String(value).slice(0, 10);
  const date = new Date(value);
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(" ", "T");
}
export function valuesFor(fields, record = {}) {
  return Object.fromEntries(
    fields.map((f) => [
      f.key,
      f.type === "checkbox"
        ? Boolean(record[f.key])
        : Array.isArray(record[f.key])
          ? record[f.key].join(", ")
          : ["date", "datetime-local"].includes(f.type)
            ? localDate(record[f.key], f.type)
            : (record[f.key] ?? (f.type === "select" ? f.options[0] : "")),
    ]),
  );
}
export function payloadFor(fields, values) {
  return Object.fromEntries(
    fields.map((f) => [
      f.key,
      f.type === "checkbox"
        ? Boolean(values[f.key])
        : values[f.key] === ""
          ? null
          : f.type === "number"
            ? Number(values[f.key])
            : f.type === "datetime-local"
              ? values[f.key] + ":00+08:00"
              : values[f.key],
    ]),
  );
}
export function Fields({
  fields,
  values,
  onChange,
  disabled = false,
  references = {},
}) {
  return (
    <div className="ad-form-grid">
      {fields.map((f) => (
        <label className={f.type === "textarea" ? "ad-wide" : ""} key={f.key}>
          {f.label}
          {f.required ? " *" : ""}
          {references[f.key] ? (
            <select
              required={f.required}
              disabled={disabled}
              value={values[f.key] ?? ""}
              onChange={(e) => onChange(f.key, e.target.value)}
            >
              <option value="">None / select record</option>
              {references[f.key].map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : f.type === "select" ? (
            <select
              required={f.required}
              disabled={disabled}
              value={values[f.key] ?? ""}
              onChange={(e) => onChange(f.key, e.target.value)}
            >
              {f.options.map((o) => (
                <option key={o} value={o}>
                  {o.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              rows="4"
              required={f.required}
              disabled={disabled}
              value={values[f.key] ?? ""}
              onChange={(e) => onChange(f.key, e.target.value)}
            />
          ) : (
            <input
              type={f.type}
              required={f.required}
              disabled={disabled}
              checked={
                f.type === "checkbox" ? Boolean(values[f.key]) : undefined
              }
              value={f.type === "checkbox" ? undefined : (values[f.key] ?? "")}
              onChange={(e) =>
                onChange(
                  f.key,
                  f.type === "checkbox" ? e.target.checked : e.target.value,
                )
              }
              step={f.type === "number" ? "0.25" : undefined}
              min={f.type === "number" ? "0" : undefined}
            />
          )}
        </label>
      ))}
    </div>
  );
}
export function Upload({
  onUploaded,
  label = "Upload PDF, PNG or JPEG (up to 8 MB)",
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <label className="ad-upload">
      {label}
      <input
        type="file"
        accept="application/pdf,image/png,image/jpeg"
        disabled={busy}
        onChange={async (e) => {
          const f = e.target.files[0];
          if (!f) return;
          setError("");
          setBusy(true);
          try {
            const body = new FormData();
            body.append("file", f);
            onUploaded(await post("/assets", body));
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      {busy && <span>Uploading…</span>}
      {error && (
        <span role="alert" className="ad-error">
          {error}
        </span>
      )}
    </label>
  );
}
export function AssetLink({ id, children }) {
  return (
    <a href={"/api/assets/" + id} target="_blank" rel="noreferrer">
      {children || "View attachment"}
    </a>
  );
}
export function Badge({ children }) {
  return (
    <span
      className={"ad-badge ad-badge-" + String(children).replaceAll(" ", "-")}
    >
      {String(children || "draft").replaceAll("_", " ")}
    </span>
  );
}
