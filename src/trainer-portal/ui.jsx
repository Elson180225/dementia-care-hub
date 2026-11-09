import { Children } from "react";
import FieldInfo, { fieldExample } from "../components/FieldInfo";
import FormFeedback from "../components/FormFeedback";
const TONE = {
  draft: "grey", none: "grey", submitted: "blue", completed: "blue",
  approved: "green", verified: "green", published: "green",
  returned: "amber", cancelled: "amber", archived: "grey",
};

export function StatusChip({ status, labels }) {
  return <span className={`tp-chip tp-chip-${TONE[status]}`}>{labels[status]}</span>;
}

export function Field({ id, label, hint, error, children, required, example }) {
  const control = Children.toArray(children).find(child => child?.props);
  const mandatory = required ?? (control?.props?.required || /\(required\)/i.test(label || ''));
  const text = typeof label === 'string' ? label.replace(/\s*\(required\)/gi, '') : label;
  const choices = control?.type === 'select' ? Children.toArray(control.props.children).find(option => option?.props)?.props : null;
  const help = example || hint || (choices ? `Example: choose ${choices.children || choices.value} or another option that applies.` : fieldExample(id, control?.props?.type));
  return (
    <div className="tp-field">
      <div className="field-label-row"><label htmlFor={id}>{text}{mandatory && <span className="required-marker" aria-label="required"> *</span>}</label><FieldInfo label={text} example={help} /></div>
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {children}
      <FormFeedback id={`${id}-error`}>{error}</FormFeedback>
    </div>
  );
}

export const describe = (id, error, hint) =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;