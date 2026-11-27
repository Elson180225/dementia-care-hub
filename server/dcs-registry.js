import {pool,transaction} from './db.js';
import {body,currentUser,fail} from './auth.js';
import {isAllowedOrigin} from './origin.js';
import {normalizeRecord,previewRecords,publicRecord,registryCsv,searchOptions,assertCurrentRecord,reviewChoices} from '../shared/dcs-registry.js';
const select=`SELECT r.*,to_char(r.updated_at,'YYYY-MM-DD HH24:MI:SS.USOF') AS updated_at,to_char(r.attendance_date,'YYYY-MM-DD') AS attendance_date,to_char(r.completion_date,'YYYY-MM-DD') AS completion_date,to_char(r.issued_at,'YYYY-MM-DD') AS issued_at,p.participant_key,p.name,p.email FROM dcs_registry_records r JOIN dcs_registry_participants p ON p.id=r.participant_id`;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function all(db) {return (await db.query(select+' ORDER BY p.name,r.programme,r.intake,r.id')).rows;}
async function validateActivities(db,preview) {
 const ids=[...new Set(preview.filter(r=>!r.error&&r.record.activity_id).map(r=>r.record.activity_id))];
 if(!ids.length)return;
 const found=new Set((await db.query('SELECT id FROM activities WHERE id=ANY($1::uuid[])',[ids])).rows.map(r=>r.id));
 for(const r of preview)if(!r.error&&r.record.activity_id&&!found.has(r.record.activity_id))r.error='Linked activity does not exist';
}
async function insert(db,r,legacy=null) {
 let p=(await db.query('SELECT * FROM dcs_registry_participants WHERE participant_key=$1',[r.participant_key])).rows[0];
 if(!p) p=(await db.query('INSERT INTO dcs_registry_participants(participant_key,name,email) VALUES($1,$2,$3) RETURNING *',[r.participant_key,r.name,r.email])).rows[0];
 await db.query(`INSERT INTO dcs_registry_records(participant_id,programme,intake,status,completion_date,certificate_ref,issued_at,issuer,legacy_certificate_id,training_location,attendance_date,activity_id,organiser,source_reference,assessment_reference,evidence_reference) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,[p.id,r.programme,r.intake,r.status,r.completion_date||null,r.certificate_ref||null,r.issued_at||null,r.issuer||null,legacy,r.training_location,r.attendance_date,r.activity_id||null,r.organiser,r.source_reference,r.assessment_reference,r.evidence_reference]);
}
export async function dcsRegistryHandler(req,res,url,send) {
 const publicAccess=url.pathname==='/api/public/dcs-registry';
 if(!publicAccess&&url.pathname!=='/api/admin/dcs-registry') fail('Not found',404);
 if(publicAccess&&req.method!=='GET') fail('Method not allowed',405);
 const user=publicAccess?null:await currentUser(req);
 if(!publicAccess&&user?.role!=='admin') fail('Admin access required',user?403:401);
 if(!['GET','POST'].includes(req.method)) fail('Method not allowed',405);
 if(req.method==='POST'&&(!req.headers.origin||!isAllowedOrigin(req.headers.origin))) fail('Origin not allowed',403);
 if(req.method==='GET') {
  let o;try{o=searchOptions(url.searchParams);}catch(e){fail(e.message);}
  const args=[o.q,o.programme,publicAccess?'':o.status,o.location,o.year];
  const where=` WHERE ($1='' OR strpos(lower(p.name),lower($1))>0 OR strpos(lower(coalesce(r.certificate_ref,'')),lower($1))>0) AND ($2='' OR r.programme=$2) AND ($3='' OR r.status=$3) AND ($4='' OR r.training_location=$4) AND ($5='' OR extract(year FROM r.attendance_date)::text=$5)`+(publicAccess?' AND r.verified AND r.public_consent AND r.approved_public_display':'');
  if(!publicAccess&&url.searchParams.get('export')==='csv') return send(res,200,{csv:registryCsv((await pool.query(select+where+' ORDER BY p.name,r.id',args)).rows)});
  const total=Number((await pool.query('SELECT count(*) FROM dcs_registry_records r JOIN dcs_registry_participants p ON p.id=r.participant_id'+where,args)).rows[0].count);
  // Explicit public projection prevents accidental contact/identity metadata exposure.
  const projection=publicAccess?`SELECT p.name,r.programme,r.training_location,to_char(r.attendance_date,'YYYY-MM-DD') AS attendance_date,r.certificate_ref FROM dcs_registry_records r JOIN dcs_registry_participants p ON p.id=r.participant_id`:select;
  const rows=(await pool.query(projection+where+' ORDER BY p.name,r.programme,r.intake,r.id LIMIT $6 OFFSET $7',[...args,o.limit,o.offset])).rows;
  res.setHeader('Cache-Control','no-store');
  return send(res,200,{rows:publicAccess?rows.map(publicRecord):rows,total,page:o.page,pageSize:o.limit});
 }
 const data=await body(req,1100000);
 try {
  const result=await transaction(async db=>{
   // Serialize registry writes so preview/commit duplicate checks cannot race.
   await db.query('LOCK TABLE dcs_registry_participants,dcs_registry_records IN SHARE ROW EXCLUSIVE MODE');
   if(['preview','commit','create','backfill'].includes(data.action)) {
    let rows=data.action==='create'?[data.record]:data.rows,legacy=null;
    if(data.action==='backfill') {
     if(!uuid.test(data.legacyId||'')) fail('Invalid legacy certificate');
     const old=(await db.query(`SELECT *,to_char(completion_date,'YYYY-MM-DD') AS completion_date,to_char(issued_at,'YYYY-MM-DD') AS issued_at FROM dcs_certificates WHERE id=$1`,[data.legacyId])).rows[0];
     if(!old) fail('Legacy certificate not found',404);
     if(old.status!=='valid') fail('Revoked legacy certificates require manual review');
     const identity=(await db.query('SELECT email FROM dcs_registry_participants WHERE participant_key=$1',[String(data.participant_key||'').trim()])).rows[0];
     const date=v=>v instanceof Date?v.toISOString().slice(0,10):v;
     rows=[{participant_key:data.participant_key,name:old.recipient_name,email:identity?.email||'',programme:old.programme,intake:data.intake,training_location:data.training_location,attendance_date:data.attendance_date,activity_id:data.activity_id,organiser:data.organiser,source_reference:data.source_reference,assessment_reference:data.assessment_reference,evidence_reference:data.evidence_reference,status:'completed',completion_date:date(old.completion_date),certificate_ref:old.certificate_ref,issued_at:date(old.issued_at),issuer:old.issuer}];legacy=old.id;
    }
    const preview=previewRecords(rows,await all(db));
    await validateActivities(db,preview);
    if(data.action==='preview') return {preview,valid:preview.every(r=>!r.error)};
    if(preview.some(r=>r.error)) fail(preview.filter(r=>r.error).map(r=>`Row ${r.row}: ${r.error}`).join('; '),409);
    for(const r of preview) await insert(db,r.record,legacy);
    return {added:preview.length};
   }
   if(!uuid.test(data.id||'')) fail('Invalid record');
   const old=(await db.query(select+' WHERE r.id=$1',[data.id])).rows[0];
   if(!old) fail('Record not found',404);
   if(data.action==='review') {
    assertCurrentRecord(data.expected_updated_at,old.updated_at);
    const choices=reviewChoices(data);
    await db.query('UPDATE dcs_registry_records SET verified=$2,public_consent=$3,approved_public_display=$4,consent_note=$5,reviewed_by=$6,reviewed_at=now(),updated_at=clock_timestamp() WHERE id=$1',[old.id,choices.verified,choices.public_consent,choices.approved_public_display,choices.consent_note,user.id]);
    return {ok:true};
   }
   if(data.action==='edit') {
    assertCurrentRecord(data.expected_updated_at,old.updated_at);
    const r=normalizeRecord(data.record);
    if(r.participant_key!==old.participant_key) fail('Participant key cannot be changed');
    // Identity changes invalidate public approval on every linked programme record.
    const identityChanged=r.name!==old.name||r.email!==old.email;
    const others=(await all(db)).filter(v=>v.id!==old.id).map(v=>identityChanged&&v.participant_key===r.participant_key?{...v,name:r.name,email:r.email}:v);
    const check=previewRecords([r],others)[0]; await validateActivities(db,[check]); if(check.error) fail(check.error,409);
    await db.query('UPDATE dcs_registry_participants SET name=$2,email=$3,updated_at=clock_timestamp() WHERE id=$1',[old.participant_id,r.name,r.email]);
    if(identityChanged) await db.query('UPDATE dcs_registry_records SET verified=false,public_consent=false,approved_public_display=false,reviewed_by=NULL,reviewed_at=NULL,updated_at=clock_timestamp() WHERE participant_id=$1',[old.participant_id]);
    await db.query(`UPDATE dcs_registry_records SET programme=$2,intake=$3,status=$4,completion_date=$5,certificate_ref=$6,issued_at=$7,issuer=$8,training_location=$9,attendance_date=$10,activity_id=$11,organiser=$12,source_reference=$13,assessment_reference=$14,evidence_reference=$15,verified=false,public_consent=false,approved_public_display=false,reviewed_by=NULL,reviewed_at=NULL,updated_at=clock_timestamp() WHERE id=$1`,[old.id,r.programme,r.intake,r.status,r.completion_date||null,r.certificate_ref||null,r.issued_at||null,r.issuer||null,r.training_location,r.attendance_date,r.activity_id||null,r.organiser,r.source_reference,r.assessment_reference,r.evidence_reference]);
    return {ok:true};
   }
   fail('Unknown action');
  },user.id);
  return send(res,200,result);
 } catch(e) {
  if(e.status) throw e;
  if(e.code==='23503') fail('Linked activity does not exist. Choose an existing activity or leave the link empty.');
  if(e.code==='23505') fail('Duplicate identity, programme, legacy link or certificate reference',409);
  if(e.code) throw e;
  fail(e.message);
 }
}
