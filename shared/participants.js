import {registrationDuplicates,normalisePhone} from './registration-duplicates.js';
// CSV reader supporting Google Sheets exports, including quoted commas and newlines.
export function parseParticipantCsv(text) {
  const rows = []; let row = [], value = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; }
      else if (quoted || !value) quoted = !quoted;
      else throw new Error('Unexpected quote in CSV. Export the file again from Google Sheets.');
    } else if (!quoted && (c === ',' || c === '\n' || c === '\r')) {
      row.push(value); value = '';
      if (c !== ',') { if (row.some(v => v.trim())) rows.push(row); row = []; if (c === '\r' && text[i + 1] === '\n') i++; }
    } else value += c;
  }
  if (quoted) throw new Error('CSV has an unclosed quoted field.');
  row.push(value); if (row.some(v => v.trim())) rows.push(row);
  if (rows.length < 2) throw new Error('Include column headings and at least one participant.');
  const headers = rows.shift().map(v => v.trim());
  if (headers.some(v => !v) || new Set(headers).size !== headers.length) throw new Error('Column headings must be unique and non-empty.');
  if (rows.length > 500) throw new Error('Import up to 500 rows at a time.');
  if (rows.some(r => r.length !== headers.length)) throw new Error('Some rows have a different number of columns. Check the CSV export.');
  return { headers, rows };
}

export function validateParticipants(rows,existing=[]) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 500) throw new Error('Provide between 1 and 500 rows.');
  const contacts=[...existing];
  return rows.map((row, index) => {
    const name = String(row.name || '').trim(), email = String(row.email || '').trim().toLowerCase(), phone = String(row.phone || '').trim(), notes=String(row.notes||'').trim();
    const match=registrationDuplicates({email,phone},contacts);
    const error = !name || name.length > 200 ? 'Name is required (maximum 200 characters)' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ? 'Valid email required' : !phone || phone.length>80 || normalisePhone(phone).length<7 || normalisePhone(phone).length>15 ? 'A valid WhatsApp phone number is required' : notes.length>2000 ? 'Questions must be 2000 characters or fewer' : match.phone ? 'Phone already registered for this intake' : '';
    if(!error)contacts.push({email,phone});
    return { name, email, phone, notes, row: index + 2, error,warning:'' };
  });
}
