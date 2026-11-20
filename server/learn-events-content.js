import { body, currentUser, fail } from './auth.js';
import { isAllowedOrigin } from './origin.js';
import {pool,transaction} from './db.js';
import { publicLink, topicDateFields } from '../shared/online-education.js';

export async function getLearnEventsData() {
  const row=(await pool.query("SELECT data,revision FROM learn_events_content WHERE id='main'")).rows[0];
  if(!row) fail('Learn & Events content is not initialized. Run database migrations.',503);
  return {...row.data,_revision:row.revision};
}

export async function saveLearnEventsData(data,actor=null) {
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      !['onlineEducation','physicalEducation','events','certifiedTrainers'].every(key=>data[key]&&typeof data[key]==='object')) {
    fail('Invalid content data structure',400);
  }
  if(!Number.isInteger(data._revision))fail('Reload the editor before saving.',409);
  for (const topic of data.onlineEducation?.upcomingTopics || []) {
    if (topic.registrationLink && !publicLink(topic.registrationLink)) fail('Registration link must be a valid HTTP or HTTPS URL.');
    const fields = topicDateFields(topic.dateISO || topic.date);
    if (!fields.dateISO) fail('Each upcoming topic needs a valid date.');
    Object.assign(topic, fields);
  }
  for (const resource of data.onlineEducation?.approvedResources || []) {
    for (const key of ['videoUrl','qaUrl']) if (resource[key] && !publicLink(resource[key])) fail('Recording and Q&A links must be valid HTTP or HTTPS URLs.');
  }
  const {_revision,...content}=data;
  await transaction(async db=>{
    const old=(await db.query("SELECT data,revision FROM learn_events_content WHERE id='main' FOR UPDATE")).rows[0];
    if(!old||old.revision!==_revision)fail('Another administrator changed this content. Reload before saving.',409);
    await db.query('INSERT INTO learn_events_content_history(data,revision,actor_id) VALUES($1,$2,$3)',[old.data,old.revision,actor]);
    await db.query("UPDATE learn_events_content SET data=$1,revision=revision+1,updated_by=$2,updated_at=now() WHERE id='main'",[content,actor]);
  },actor);
  return {...content,_revision:_revision+1};
}

export async function learnEventsContentHandler(req, res, url, send) {
  // Public GET endpoint:
  if (url.pathname === '/api/public/learn-events-content' && req.method === 'GET') {
    const data = await getLearnEventsData();
    return send(res, 200, data);
  }

  // Admin endpoints:
  if (url.pathname === '/api/admin/learn-events-content') {
    const user = await currentUser(req);
    if (user?.role !== 'admin') fail('Admin access required', user ? 403 : 401);

    if (req.method === 'GET') {
      const data = await getLearnEventsData();
      return send(res, 200, data);
    }

    if (req.method === 'POST') {
      if (!isAllowedOrigin(req.headers.origin)) fail('Origin not allowed', 403);
      const payload = await body(req);
      const content=await saveLearnEventsData(payload,user.id);
      return send(res, 200, { ok: true, content, message: 'Learn & Events content saved successfully' });
    }

    fail('Method not allowed', 405);
  }

  fail('Not found', 404);
}
