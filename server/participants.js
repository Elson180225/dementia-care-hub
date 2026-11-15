import { pool, transaction } from './db.js';
import { body, currentUser, fail } from './auth.js';
import { isAllowedOrigin } from './origin.js';
import { validateParticipants } from '../shared/participants.js';
import { createBrevo } from './brevo.js';
import {decision} from './decisions.js';
import {registrationDuplicates} from '../shared/registration-duplicates.js';

export async function participantsHandler(req, res, url, send) {
  const user = await currentUser(req);
  if (user?.role !== 'admin') fail('Admin access required', user ? 403 : 401);
  if (!['GET','POST'].includes(req.method)) fail('Method not allowed',405);
  if (req.method === 'POST' && !isAllowedOrigin(req.headers.origin)) fail('Origin not allowed',403);
  const id = url.searchParams.get('activity');
  if (!id) {
    if (req.method !== 'GET') fail('Choose a workshop');
    return send(res,200,(await pool.query('SELECT id,title,starts_at,programme_id,venue,status,cancelled_at FROM activities ORDER BY starts_at DESC')).rows);
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) fail('Invalid workshop');
  const activity = (await pool.query('SELECT id,title,starts_at,programme_id,venue,status,cancelled_at FROM activities WHERE id=$1',[id])).rows[0];
  if (!activity) fail('Workshop not found',404);
  if (req.method === 'GET') return send(res,200,{
    activity,
    participants:(await pool.query('SELECT p.*,u.name AS removed_by_name FROM event_participants p LEFT JOIN users u ON u.id=p.removed_by WHERE p.activity_id=$1 ORDER BY p.name',[id])).rows,
    imports:(await pool.query('SELECT * FROM participant_imports WHERE activity_id=$1 ORDER BY imported_at DESC LIMIT 20',[id])).rows,
    deliveries:(await pool.query('SELECT r.*,p.email FROM participant_reminders r JOIN event_participants p ON p.id=r.participant_id WHERE p.activity_id=$1 ORDER BY r.created_at DESC LIMIT 100',[id])).rows,
  });
  const data = await body(req);
  if (data.action === 'import') {
    let rows; try { rows = validateParticipants(data.rows); } catch(e) { fail(e.message); }
    if (rows.some(r => r.error)) fail('Resolve invalid or duplicate rows before importing.');
    const result = await transaction(async db => {
      await db.query('SELECT id FROM activities WHERE id=$1 FOR UPDATE',[id]);
      const existing=(await db.query('SELECT email,phone,status FROM event_participants WHERE activity_id=$1',[id])).rows;
      const record = (await db.query('INSERT INTO participant_imports(activity_id,filename,imported_by,added,skipped) VALUES($1,$2,$3,0,0) RETURNING id',[id,String(data.filename || 'participants.csv').slice(0,255),user.id])).rows[0];
      let added = 0,phoneWarnings=0;
      for (const row of rows){
       const match=registrationDuplicates(row,existing);
       if(match.email)continue;
       const inserted=(await db.query('INSERT INTO event_participants(activity_id,name,email,phone,import_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT(activity_id,email) DO NOTHING',[id,row.name,row.email,row.phone,record.id])).rowCount;
       added+=inserted;
       if(inserted){if(match.phone)phoneWarnings++;existing.push(row);}
      }
      await db.query('UPDATE participant_imports SET added=$2,skipped=$3 WHERE id=$1',[record.id,added,rows.length-added]);
      return {added,skipped:rows.length-added,phoneWarnings};
    },user.id);
    return send(res,200,result);
  }
  if (data.action === 'status') {
    if (!['registered','cancelled'].includes(data.status)) fail('Invalid status');
    if(!/^[a-f0-9-]{36}$/i.test(data.id||''))fail('Invalid participant');
    await transaction(async db=>{
      const previous=(await db.query('SELECT status FROM event_participants WHERE id=$1 AND activity_id=$2 FOR UPDATE',[data.id,id])).rows[0];
      if(!previous)fail('Participant not found',404);
      if(previous.status===data.status)return;
      if(data.status==='cancelled')await db.query("UPDATE event_participants SET status='cancelled',removed_at=now(),removed_by=$2 WHERE id=$1",[data.id,user.id]);
      else await db.query("UPDATE event_participants SET status='registered',restored_at=now(),restored_by=$2 WHERE id=$1",[data.id,user.id]);
      await decision(db,user,'event_participants',data.id,data.status==='cancelled'?'removed':'restored','Recoverable participant list change',previous.status,data.status);
    },user.id);
    return send(res,200,{ok:true});
  }
  if (data.action !== 'remind') fail('Unknown action');
  if (activity.cancelled_at || new Date(activity.starts_at) <= new Date()) fail('Reminders are available for upcoming, non-cancelled workshops.');
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) fail('Configure Brevo API key and sender email before sending reminders.');
  const subject = String(data.subject || '').trim(), message = String(data.message || '').trim();
  if (!subject || subject.length > 200 || !message || message.length > 5000) fail('Provide a subject (up to 200 characters) and message (up to 5000 characters).');
  if (!Array.isArray(data.ids) || !data.ids.length || data.ids.length > 25) fail('Select 1–25 recipients per send.');
  const recipients = (await pool.query("SELECT p.id,p.name,p.email FROM event_participants p WHERE p.activity_id=$1 AND p.status='registered' AND p.id=ANY($2::uuid[]) AND (NOT EXISTS(SELECT 1 FROM event_registration_settings s WHERE s.activity_id=p.activity_id AND s.enabled) OR p.registration_state='confirmed')",[id,data.ids])).rows;
  if (recipients.length !== new Set(data.ids).size) fail('A selected participant is missing or cancelled. Refresh the list.');
  const request = createBrevo(); const counts = {sent:0,failed:0,uncertain:0,skipped:0};
  for (const participant of recipients) {
    const delivery = (await pool.query("INSERT INTO participant_reminders(participant_id,subject,message,created_by,status) VALUES($1,$2,$3,$4,'sending') ON CONFLICT DO NOTHING RETURNING id",[participant.id,subject,message,user.id])).rows[0];
    if (!delivery) {counts.skipped++;continue;}
    try {
      const receipt = await request('/smtp/email',{method:'POST',data:{sender:{email:process.env.BREVO_SENDER_EMAIL,name:process.env.BREVO_SENDER_NAME || 'RCBC'},to:[{email:participant.email,name:participant.name}],subject,textContent:message}});
      await pool.query("UPDATE participant_reminders SET status='sent',provider_id=$2 WHERE id=$1",[delivery.id,receipt.messageId || null]); counts.sent++;
    } catch(e) {
      const status = e.uncertain ? 'uncertain' : 'failed';
      await pool.query('UPDATE participant_reminders SET status=$2,error=$3 WHERE id=$1',[delivery.id,status,e.message]); counts[status]++;
    }
  }
  return send(res,200,counts);
}
