import { body, currentUser, fail } from './auth.js';
import { isAllowedOrigin } from './origin.js';
import {pool,transaction} from './db.js';
import { publicLink, topicDateFields } from '../shared/online-education.js';
import {publicEducationContent} from '../shared/webinar-library.js';
import {canActivateProgramme} from '../shared/programme-intakes.js';
import {eventTime} from '../shared/event-dates.js';

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
  for(const list of [data.onlineEducation?.upcomingTopics||[],data.onlineEducation?.approvedResources||[]])for(const item of list){
    if(!['pending','approved'].includes(item.publicationStatus||'pending'))fail('Choose a publication review status.');
    if(item.publicationStatus==='approved'){
      if(!/^[a-f0-9-]{36}$/i.test(item.activityId||''))fail('Link published webinar previews and resources to their master activity.');
      const activity=(await pool.query("SELECT id FROM activities WHERE id=$1 AND content_approval_status='approved' AND published_at IS NOT NULL",[item.activityId])).rows[0];
      if(!activity)fail('Approve and publish the linked master activity before publishing its preview or resource.');
    }
  }
  const {_revision,...content}=data;
  await transaction(async db=>{
    const old=(await db.query("SELECT data,revision FROM learn_events_content WHERE id='main' FOR UPDATE")).rows[0];
    if(!old||old.revision!==_revision)fail('Another administrator changed this content. Reload before saving.',409);
    for(const programme of content.physicalEducation?.programmes||[]){
      const previous=old.data.physicalEducation?.programmes?.find(p=>p.id===programme.id);
      if(previous){const events=(await db.query("SELECT programme_id,status,starts_at,cancelled_at,content_approval_status FROM activities WHERE programme_id=$1",[programme.id])).rows;if(!canActivateProgramme(previous,programme,events))fail('Approve a future intake before activating this planned programme. Create its preparation record under Activities with registration closed.');}
    }
    await db.query('INSERT INTO learn_events_content_history(data,revision,actor_id) VALUES($1,$2,$3)',[old.data,old.revision,actor]);
    await db.query("UPDATE learn_events_content SET data=$1,revision=revision+1,updated_by=$2,updated_at=now() WHERE id='main'",[content,actor]);
  },actor);
  return {...content,_revision:_revision+1};
}

export async function learnEventsContentHandler(req, res, url, send) {
  // Public GET endpoint:
  if (url.pathname === '/api/public/learn-events-content' && req.method === 'GET') {
    const data = await getLearnEventsData();
    const visible=publicEducationContent(data);
    const masters=new Map((await pool.query("SELECT * FROM activities WHERE content_approval_status='approved' AND published_at IS NOT NULL AND status IN ('published','completed','verified','archived')")).rows.map(r=>[r.id,r]));
    visible.onlineEducation.upcomingTopics=visible.onlineEducation.upcomingTopics.filter(r=>masters.has(r.activityId)).map(r=>{const a=masters.get(r.activityId);return {...r,id:a.id,title:a.title,description:a.description,...topicDateFields(a.starts_at),time:eventTime(a.starts_at),rawDate:a.starts_at,mode:a.mode,location:a.venue,language:a.language,speaker:a.speaker_name,suitableFor:a.audience,image:a.poster_url,registrationLink:a.registration_link};});
    return send(res, 200, visible);
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
