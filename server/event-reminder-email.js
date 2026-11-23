import { createHash } from 'node:crypto';
import { eventEnd, googleCalendarUrl } from './event-calendar.js';
import { unsubscribeToken } from './subscriber-tokens.js';
import { publicLink } from '../shared/online-education.js';
import { isPlannedProgramme } from '../shared/programme-intakes.js';
import { eventPath } from '../shared/public-features.js';

export function registrationTarget(activity) {
 if (activity.programme_id && (!activity.programme || isPlannedProgramme(activity.programme))) return '';
 if (activity.registration_enabled === false) return '';
 if (activity.registration_enabled === true) {
  return activity.website_enabled ? eventPath(activity.id) : publicLink(activity.google_url);
 }
 return publicLink(activity.registration_link);
}

const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
 ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const malaysiaTime = new Intl.DateTimeFormat('en-MY', {
 timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'full', timeStyle: 'short',
});
const formatTime = value => malaysiaTime.format(new Date(value)) + ' (Malaysia time, UTC+8)';

export function reminderIdempotencyKey(activity, recipient, stage = 'invite') {
 const occurrence = [activity.id, new Date(activity.starts_at).toISOString(), recipient.id];
 // Keep invite keys from before the stage migration so in-flight deliveries retain their identity.
 if (stage !== 'invite') occurrence.push(stage);
 const hash = createHash('sha256').update(occurrence.join('|')).digest('hex');
 return [hash.slice(0, 8), hash.slice(8, 12), '5' + hash.slice(13, 16), '8' + hash.slice(17, 20), hash.slice(20, 32)].join('-');
}

const subjectPrefix = { invite: 'Invitation', 'last-call': 'Registration reminder', final: 'Final event reminder' };

export function reminderMessage(activity, recipient, env = process.env, stage = 'invite') {
 const base = new URL(env.APP_BASE_URL);
 if (!['https:', 'http:'].includes(base.protocol)) throw new Error('APP_BASE_URL must use HTTP or HTTPS');
 const final = stage === 'final';
 const eventUrl = new URL(eventPath(activity.id), base).href;
 const registrationUrl = new URL(registrationTarget(activity) || eventUrl, base).href;
 const ics = new URL('/api/public/event-calendar', base);
 ics.searchParams.set('activity', activity.id);
 const google = googleCalendarUrl(activity, base);
 const end = eventEnd(activity);
 const locations = [activity.venue, activity.city].filter(Boolean);
 const facts = [
  `Starts: ${formatTime(activity.starts_at)}`,
  ...(!final && activity.registration_deadline ? [`Register by: ${formatTime(activity.registration_deadline)}`] : []),
  ...(end ? [`Ends: ${formatTime(end)}`] : []),
  `Where: ${locations.join(', ') || activity.mode || 'See event page'}`,
 ];
 const links = final ? [['View event details', eventUrl]] : [['View event and register', registrationUrl]];
 if (google) links.push(['Add to Google Calendar', google]);
 links.push(['Download calendar file for Apple Calendar or Outlook', ics.href]);
 const lines = [
  activity.title, ...facts, `Hello ${recipient.name},`,
  final ? 'Your registration is confirmed. Here are the details for attending.' : '',
  activity.general_instructions || '', activity.description || '',
 ].filter(Boolean);

 const footer = final ? 'You received this reminder because your event registration is confirmed.'
  : 'You receive this invitation because you opted in to RCBC email updates. This is not confirmation of event registration.';
 if (!final) {
  const unsubscribe = new URL('/get-updated', base);
  unsubscribe.searchParams.set('unsubscribe', unsubscribeToken(recipient.id, env.SUBSCRIBER_TOKEN_SECRET));
  links.push(['Unsubscribe', unsubscribe.href]);
 }
 const textContent = [...lines, ...links.map(([label, href]) => `${label}: ${href}`), footer].join('\n\n');
 const htmlContent = lines.map(line => `<p>${escape(line).replace(/\r\n|\r|\n/g, '<br>')}</p>`).join('')
  + links.map(([label, href]) => `<p><a href="${escape(href)}">${escape(label)}</a></p>`).join('')
  + `<p>${escape(footer)}</p>`;
 return {
  sender: { name: env.BREVO_SENDER_NAME || 'RCBC Dementia Care', email: env.BREVO_SENDER_EMAIL },
  to: [{ email: recipient.email, name: recipient.name }],
  subject: `${subjectPrefix[stage]}: ${activity.title}`, textContent, htmlContent,
  tags: [`project-activity-${stage}`], headers: { idempotencyKey: reminderIdempotencyKey(activity, recipient, stage) },
 };
}
