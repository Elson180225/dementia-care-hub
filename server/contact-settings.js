import { defaultProjectEmail } from '../shared/contact-settings.js';
import { fail } from './auth.js';

export async function contactSettings(db) {
  const row = (await db.query(`SELECT project_email AS "projectEmail",
    organiser_facebook AS "organiserFacebook", whatsapp_community AS "whatsappCommunity"
    FROM website_contact_settings WHERE id='main'`)).rows[0];
  return row ?? { projectEmail: defaultProjectEmail, organiserFacebook: '', whatsappCommunity: '' };
}

function optionalUrl(raw, label, host) {
  if (typeof raw !== 'string' || raw.length > 2000) fail(`Enter a valid ${label}.`);
  if (!raw.trim()) return '';
  let url;
  try { url = new URL(raw.trim()); }
  catch { fail(`Enter a valid ${label}.`); }
  if (url.protocol !== 'https:' || !host(url.hostname) || !url.pathname.slice(1) ||
      url.username || url.password || url.port) fail(`Enter a valid ${label}.`);
  return url.href;
}

export async function saveContactSettings(db, values, actor) {
  const email = typeof values.projectEmail === 'string' ? values.projectEmail.trim() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Enter a valid project email.');
  const facebook = optionalUrl(values.organiserFacebook, 'Facebook Page URL', host => host === 'facebook.com' || host.endsWith('.facebook.com'));
  const whatsapp = optionalUrl(values.whatsappCommunity, 'WhatsApp Community invite URL', host => host === 'chat.whatsapp.com');
  await db.query(`INSERT INTO website_contact_settings(id,project_email,organiser_facebook,whatsapp_community,updated_by)
    VALUES('main',$1,$2,$3,$4) ON CONFLICT (id) DO UPDATE SET
    project_email=excluded.project_email, organiser_facebook=excluded.organiser_facebook,
    whatsapp_community=excluded.whatsapp_community, updated_by=excluded.updated_by, updated_at=now()`,
  [email, facebook, whatsapp, actor]);
  return { projectEmail: email, organiserFacebook: facebook, whatsappCommunity: whatsapp };
}
