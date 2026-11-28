import { pool } from './db.js';
import { eventPath } from '../shared/public-features.js';

export function eventEnd(activity) {
 const start = new Date(activity.starts_at).getTime();
 const end = activity.ends_at && new Date(activity.ends_at).getTime();
 if (end > start) return new Date(end);
 const duration = Number(activity.planned_hours);
 return duration > 0 ? new Date(start + duration * 3600000) : null;
}

const timestamp = value => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const escapeText = value => String(value || '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/[;,]/g, '\\$&');

function foldLine(line) {
 let result = '', bytes = 0;
 for (const char of line) {
  const size = Buffer.byteLength(char);
  if (bytes + size > 75) {
   result += '\r\n ';
   bytes = 1;
  }
  result += char;
  bytes += size;
 }
 return result;
}

export function eventCalendar(activity, base, now = new Date()) {
 const end = eventEnd(activity);
 const url = new URL(eventPath(activity.id), base);
 return [
  'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dementia Care Connect//Calendar//EN',
  'BEGIN:VEVENT',
  `UID:${activity.id}@${url.hostname}`, `DTSTAMP:${timestamp(now)}`, `DTSTART:${timestamp(activity.starts_at)}`,
  ...(end ? [`DTEND:${timestamp(end)}`] : []),
  `SUMMARY:${escapeText(activity.title)}`,
  `LOCATION:${escapeText(activity.venue || activity.city || activity.mode)}`,
  `DESCRIPTION:${escapeText([activity.description, url.href].filter(Boolean).join('\n'))}`,
  `URL:${url.href}`,
  'END:VEVENT', 'END:VCALENDAR', '',
 ].map(foldLine).join('\r\n');
}

export function googleCalendarUrl(activity, base) {
 const end = eventEnd(activity);
 if (!end) return '';
 const link = new URL('https://calendar.google.com/calendar/render');
 link.search = new URLSearchParams({
  action: 'TEMPLATE', text: activity.title,
  dates: `${timestamp(activity.starts_at)}/${timestamp(end)}`,
  location: activity.venue || activity.city || activity.mode,
  details: new URL(eventPath(activity.id), base).href,
 }).toString();
 return link.href;
}

export async function eventCalendarHandler(req, res, url, send, db = pool) {
 if (!['GET', 'HEAD'].includes(req.method)) {
  res.setHeader('Allow', 'GET, HEAD');
  return send(res, 405, { error: 'Use GET or HEAD' });
 }
 const id = url.searchParams.get('activity');
 if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id || '')) {
  return send(res, 404, { error: 'Event not found' });
 }
 const { rows: [activity] } = await db.query(
  `SELECT id,title,starts_at,ends_at,planned_hours,venue,city,mode,description FROM activities
   WHERE id=$1 AND status='published' AND published_at IS NOT NULL AND cancelled_at IS NULL AND postponed_at IS NULL AND content_approval_status='approved'`, [id],
 );
 if (!activity) return send(res, 404, { error: 'Event not found' });

 const base = new URL(process.env.APP_BASE_URL || url.origin);
 const calendar = eventCalendar(activity, base);
 res.writeHead(200, {
  'Content-Type': 'text/calendar; charset=utf-8',
  'Content-Disposition': 'attachment; filename="event.ics"',
  'Cache-Control': 'no-store',
 });
 return res.end(req.method === 'HEAD' ? undefined : calendar);
}
