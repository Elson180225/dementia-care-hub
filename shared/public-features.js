export function eventPath(id) {
  return `/learn-events/event/${encodeURIComponent(id)}`;
}

export function whatsappShareUrl(title, url) {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw Error('Invalid share URL');
  return `https://wa.me/?text=${encodeURIComponent(`${title}\n${parsed.href}`)}`;
}

export function reviewedDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return { iso: date.toISOString(), label: date.toLocaleDateString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'long', year: 'numeric',
  }) };
}

export function eventSchema(activity, origin) {
  const start = new Date(activity.starts_at || activity.rawDate);
  if (!activity.title || !activity.id || Number.isNaN(start.getTime())) return null;
  const online = activity.mode === 'Online';
  const url = new URL(eventPath(activity.id), origin).href;
  const location = online ? { '@type': 'VirtualLocation', url } : activity.venue ? {
    '@type': 'Place', name: activity.venue,
    ...(activity.city ? { address: { '@type': 'PostalAddress', addressLocality: activity.city, addressCountry: 'MY' } } : {}),
  } : null;
  // Do not claim a location or time that the organiser has not supplied.
  if (!location) return null;
  const schema = {
    '@context': 'https://schema.org', '@type': 'Event', '@id': url, url,
    name: activity.title, startDate: start.toISOString(), location,
    eventAttendanceMode: `https://schema.org/${online ? 'Online' : 'Offline'}EventAttendanceMode`,
    eventStatus: `https://schema.org/${activity.cancelled_at || activity.status === 'cancelled' ? 'EventCancelled' : activity.postponed_at||activity.status==='postponed' ? 'EventPostponed' : 'EventScheduled'}`,
    ...(activity.description ? { description: activity.description } : {}),
  };
  const poster = activity.poster_url || activity.poster;
  if (typeof poster === 'string' && /^(https?:\/\/|\/)/.test(poster)) schema.image = new URL(poster, origin).href;
  return schema;
}
