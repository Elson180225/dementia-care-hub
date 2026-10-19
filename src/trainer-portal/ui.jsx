const TONE = {
  draft: "grey", none: "grey", submitted: "blue",
  published: "green", completed: "blue", archived: "grey", approved: "green", verified: "green", returned: "amber",
};

export function StatusChip({ status, labels }) {
  return <span className={`tp-chip tp-chip-${TONE[status]}`}>{labels[status]}</span>;
}

export function Field({ id, label, hint, error, children }) {
  return (
    <div className="tp-field">
      <label htmlFor={id}>{label}</label>
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {children}
      {error && <p className="tp-error" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}

export const describe = (id, error, hint) =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;