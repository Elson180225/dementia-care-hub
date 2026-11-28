import {parseParticipantCsv} from './participants.js';
export const columns=['participant_key','name','email','programme','intake','training_location','attendance_date','activity_id','organiser','source_reference','assessment_reference','evidence_reference','status','completion_date','certificate_ref','issued_at','issuer'];
export const fieldLabels={participant_key:'Participant reference',name:'Participant name',email:'Email address (private)',programme:'Programme',intake:'Batch / intake',training_location:'Training location',attendance_date:'Attendance date',activity_id:'Linked activity ID (optional)',organiser:'Organiser',source_reference:'Source reference (private)',assessment_reference:'Assessment reference (private)',evidence_reference:'Evidence reference (private)',status:'Training status',completion_date:'Completion date',certificate_ref:'Certificate number',issued_at:'Certificate issue date',issuer:'Certificate issuer',legacyId:'Legacy certificate ID'};
export const requiredFields=['participant_key','name','programme','intake','training_location','attendance_date','organiser','source_reference'];
export const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function normalizeRecord(input) {
 if(!input || typeof input!=='object') throw new Error('Record required');
 const r=Object.fromEntries(columns.map(k=>[k,String(input[k]??'').trim()]));
 r.email=r.email.toLowerCase();r.activity_id=r.activity_id.toLowerCase();
 if(!/^[a-z0-9][a-z0-9._:-]{2,99}$/i.test(r.participant_key)) throw new Error('Participant reference must be 3–100 letters, digits, dots, colons, underscores or hyphens');
 for(const k of ['name','programme','intake','training_location','organiser','source_reference']) if(!r[k] || r[k].length>200) throw new Error(`${fieldLabels[k]} required, maximum 200 characters`);
 for(const k of ['assessment_reference','evidence_reference']) if(r[k].length>2000) throw new Error(`${fieldLabels[k]} must be 2000 characters or fewer`);
 if(r.activity_id&&!uuidPattern.test(r.activity_id)) throw new Error('Linked activity ID must be a valid UUID');
 if(r.email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)||r.email.length>254)) throw new Error('Invalid email');
 if(!['attended','completed'].includes(r.status)) throw new Error('Status must be attended or completed');
 if(!r.attendance_date) throw new Error('Attendance date required');
 for(const k of ['attendance_date','completion_date','issued_at']) if(r[k] && (!/^\d{4}-\d{2}-\d{2}$/.test(r[k]) || !Number.isFinite(Date.parse(r[k])) || new Date(r[k]).toISOString().slice(0,10)!==r[k])) throw new Error(`Invalid ${fieldLabels[k].toLowerCase()}`);
 if(r.status==='completed'&&!r.completion_date) throw new Error('Completion date required');
 if(r.completion_date&&r.completion_date<r.attendance_date) throw new Error('Completion date precedes attendance');
 if(r.certificate_ref.length>150 || r.issuer.length>200) throw new Error('Certificate fields too long');
 if(r.certificate_ref && (r.status!=='completed'||!r.issued_at||!r.issuer)) throw new Error('Certificate requires completion, issue date and issuer');
 if(!r.certificate_ref && (r.issued_at||r.issuer)) throw new Error('Certificate reference required');
 if(r.issued_at && r.issued_at<r.completion_date) throw new Error('Issue date precedes completion');
 return r;
}
export function assertCurrentRecord(expected,actual) {
 if(typeof expected!=='string'||!expected||expected!==actual) throw Object.assign(new Error('Record changed. Reload and review the latest record.'),{status:409});
}
export function reviewChoices(data) {
 if(['verified','public_consent','approved_public_display'].some(k=>typeof data[k]!=='boolean')) throw new Error('Explicit verification, consent and public display approval choices required');
 const note=String(data.consent_note||'').trim();
 if(note.length>2000||data.public_consent&&!note) throw new Error('Document public consent (maximum 2000 characters)');
 if(data.approved_public_display&&(!data.verified||!data.public_consent)) throw new Error('Public display approval requires verification and public consent');
 return {verified:data.verified,public_consent:data.public_consent,approved_public_display:data.approved_public_display,consent_note:note};
}
export function parseRegistryCsv(text) {
 if(typeof text!=='string'||text.length>1000000) throw new Error('CSV exceeds 1 MB');
 const {headers,rows}=parseParticipantCsv(text);
 if(headers.length!==columns.length||columns.some(k=>!headers.includes(k))) throw new Error('Use the registry CSV template headings');
 return rows.map(values=>Object.fromEntries(headers.map((k,i)=>[k,values[i]])));
}
export function previewRecords(rows,existing=[]) {
 if(!Array.isArray(rows)||!rows.length||rows.length>500) throw new Error('Provide 1–500 records');
 const seen=[...existing];
 return rows.map((input,i)=>{
  try {
   const record=normalizeRecord(input);
   const identity=seen.find(r=>r.participant_key===record.participant_key);
   if(identity&&(identity.name!==record.name||identity.email!==record.email)) throw new Error('Participant reference has different identity details; edit identity separately');
   if(seen.some(r=>r.participant_key===record.participant_key&&r.programme===record.programme&&r.intake===record.intake)) throw new Error('Duplicate participant/programme/intake');
   if(record.certificate_ref&&seen.some(r=>r.certificate_ref?.toLowerCase()===record.certificate_ref.toLowerCase())) throw new Error('Duplicate certificate reference');
   seen.push(record); return {row:i+2,record,error:''};
  } catch(e) {return {row:i+2,error:e.message};}
 });
}
export function registryCsv(rows) {
 const cell=v=>'"'+String(v??'').replace(/^\s*[=+@-]|^[\t\r\n]/,"'$&").replaceAll('"','""')+'"';
 return [columns,...rows.map(r=>columns.map(k=>r[k]))].map(row=>row.map(cell).join(',')).join('\r\n');
}
export function publicRecord(r) {
 return {name:r.name,programme:r.programme,training_location:r.training_location,attendance_date:r.attendance_date,certificate_ref:r.certificate_ref};
}
export function searchOptions(params) {
  const page=Number(params.get('page')||1);
  if(!Number.isSafeInteger(page)||page<1||page>100000) throw new Error('Invalid page');
  const q=(params.get('q')||'').trim(),programme=(params.get('programme')||'').trim(),status=params.get('status')||'',location=(params.get('location')||'').trim(),year=params.get('year')||'';
  const pendingParam=params.get('pending');
  const pending=pendingParam==='1';
  if(q.length>200||programme.length>200||location.length>200||status&&!['attended','completed'].includes(status)||year&&!/^[1-9]\d{3}$/.test(year)||(pendingParam!=null&&pendingParam!==''&&!pending)) throw new Error('Invalid filter');
  return {page,q,programme,status,location,year,pending,limit:20,offset:(page-1)*20};
}

export function registryPendingReview(record) {
  return !(record.verified && record.public_consent && record.approved_public_display);
}
