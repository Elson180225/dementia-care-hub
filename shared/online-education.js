export const qaFolders = ['Oral Health Webinar', 'Prevention&Early Detection (Chinese)', 'Understanding the Missing Pieces'];

export function publicLink(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try { const url = new URL(value.trim()); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}

export function topicDate(value) {
  if (!value) return '';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? value + 'T00:00:00+08:00' : value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function topicDateFields(value) {
  const dateISO = topicDate(value);
  if (!dateISO) return {};
  const date = new Date(dateISO + 'T00:00:00+08:00');
  return { dateISO, date: date.toLocaleDateString('en-GB', { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', year: 'numeric' }), day: String(Number(dateISO.slice(8))), month: date.toLocaleDateString('en-GB', { timeZone: 'Asia/Kuala_Lumpur', month: 'short' }).toUpperCase(), year: dateISO.slice(0,4) };
}

export function orderWebinars(items, now = Date.now()) {
  const stamp = item => Date.parse(item.rawDate || item.starts_at || item.dateISO && item.dateISO + 'T00:00:00+08:00' || item.date);
  const past = item => ['completed','verified','archived'].includes(item.status) || stamp(item) < now;
  return [...items].sort((a,b) => {
    const at=stamp(a), bt=stamp(b);
    if (!Number.isFinite(at)) return Number.isFinite(bt) ? 1 : 0;
    if (!Number.isFinite(bt)) return -1;
    return Number(past(a))-Number(past(b)) || (past(a) ? bt-at : at-bt);
  }).map(item => past(item) && item.status !== 'cancelled' ? {...item,status:'completed'} : item);
}

export function resourceQaFolder(resource) {
  return resource.qaFolder || (Number.isInteger(resource.qaIndex) ? qaFolders[resource.qaIndex] : '') || '';
}
