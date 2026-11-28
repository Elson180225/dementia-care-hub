import { useId, useState } from 'react';
import './FieldInfo.css';

const inputHelp = {
 email: 'Example: name@example.org',
 url: 'Enter the full URL. Example: https://example.org/resource',
 date: 'Choose the relevant calendar date.',
 'datetime-local': 'Enter the date and time in Malaysia time (UTC+8).',
};

export const fieldExample = (type) => inputHelp[type];

export default function FieldInfo({ label, example }) {
 const id = useId();
 const [open, setOpen] = useState(false);
 return <span className="field-info" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
  <button type="button" className="field-info-button" aria-label={`Help for ${label}`} aria-expanded={open} aria-controls={open ? id : undefined} aria-describedby={open ? id : undefined}
   onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onClick={event => { event.preventDefault(); setOpen(true); }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); } }}><span className="field-info-glyph" aria-hidden="true">i</span></button>
  {open && <span id={id} role="tooltip" className="field-info-tooltip">{example}</span>}
 </span>;
}
