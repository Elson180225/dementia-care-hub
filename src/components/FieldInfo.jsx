import { useId, useState } from 'react';
import './FieldInfo.css';

export function fieldExample(name, type) {
 const key = String(name || '').toLowerCase().replace(/[-_]/g, ' ');
 if (/password/.test(key)) return 'Example: use a unique password with at least 12 characters when registering. Never reuse this example as your password.';
 if (/email/.test(key) || type === 'email') return 'Example: name@example.org';
 if (/message|enquiry/.test(key)) return 'Example: I would like to learn more about your upcoming caregiver workshops.';
 if (/invitation/.test(key)) return 'Example: paste the invitation code supplied by your RCBC administrator.';
 if (/consent/.test(key)) return 'Give consent only when you agree to the stated use of your information. For an existing record, enter the actual consent evidence.';
 if (/body|content/.test(key)) return 'Enter the approved text for this section. Save as unpublished while it is waiting for review.';
 if (/organisation|facility/.test(key)) return 'Enter the organisation or facility name exactly as confirmed by your source.';
 if (/certificate/.test(key)) return 'Example: enter the reference exactly as printed on your certificate.';
 if (/name/.test(key)) return 'Example: Alex Tan';
 if (/city/.test(key)) return 'Example: Bintulu';
 if (/state/.test(key)) return 'Example: Sarawak';
 if (/postcode/.test(key)) return 'Example: 97000';
 if (/phone/.test(key)) return 'Example: +60 12 345 6789';
 if (/url|link|website/.test(key) || type === 'url') return 'Example: https://example.org/resource';
 if (/slug/.test(key)) return 'Example: about-overview';
 if (/language/.test(key)) return 'Example: English';
 if (/date|reviewed|starts|ends/.test(key) || /date/.test(type || '')) return 'Example: choose the relevant date using the calendar. Times are in Malaysia time (UTC+8).';
 if (/source|reviewer/.test(key)) return 'Example: RCBC-approved project information, reviewed by the project coordinator.';
 if (/note|comment/.test(key)) return 'Example: Replied by email and provided the requested workshop information.';
 if (/title/.test(key)) return 'Example: Community caregiver workshop';
 if (/hours|number|count/.test(key) || type === 'number') return 'Example: 2. Enter the actual amount for this record.';
 return 'Example: enter the relevant details for this field. Use confirmed information for public records.';
}

export default function FieldInfo({ label, example }) {
 const id = useId();
 const [open, setOpen] = useState(false);
 return <span className="field-info" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
  <button type="button" className="field-info-button" aria-label={`Example for ${label}`} aria-expanded={open} aria-controls={id} aria-describedby={open ? id : undefined}
   onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onClick={event => { event.preventDefault(); setOpen(true); }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); } }}><span className="field-info-glyph" aria-hidden="true">i</span></button>
  {open && <span id={id} role="tooltip" className="field-info-tooltip">{example}</span>}
 </span>;
}
