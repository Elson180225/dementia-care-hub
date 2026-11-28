import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecord,previewRecords,parseRegistryCsv,registryCsv,publicRecord,searchOptions,columns,assertCurrentRecord,reviewChoices,requiredFields,registryPendingReview} from '../shared/dcs-registry.js';
import {dcsRegistryHandler} from '../server/dcs-registry.js';
import {pool} from '../server/db.js';
import {Readable} from 'node:stream';
import {dcsPublicCopy} from '../shared/dcs-public-copy.js';
import {translateCataloguedLabel} from '../src/i18n/labelLookup.js';
const row={participant_key:'person-001',name:'Mei Tan',email:'MEI@example.com',programme:'DCS',intake:'2026-01',status:'attended',training_location:'Kuching',attendance_date:'2026-01-01',organiser:'RCBC',source_reference:'Register 2026-01'};
test('attendance and completion work without certificates',()=>{
 assert.equal(normalizeRecord(row).email,'mei@example.com');
 assert.equal(normalizeRecord({...row,status:'completed',completion_date:'2026-02-01'}).certificate_ref,'');
 assert.throws(()=>normalizeRecord({...row,status:'completed'}),/Completion date/);
});
test('certificate requires valid completion, issue date and issuer',()=>{
 for(const change of [{certificate_ref:'ABC'},{completion_date:'2026-02-30'},{issued_at:'invalid'},{status:'other'},{participant_key:'x'},{email:'bad'}]) assert.throws(()=>normalizeRecord({...row,...change}));
 const valid={...row,status:'completed',completion_date:'2026-02-01',certificate_ref:'ABC',issued_at:'2026-02-02',issuer:'RCBC'};
 assert.equal(normalizeRecord(valid).certificate_ref,'ABC');
 assert.throws(()=>normalizeRecord({...valid,issued_at:'2026-01-01'}),/precedes/);
});
test('multiple programmes link only through explicit stable key, never name',()=>{
 const first=normalizeRecord(row);
 assert.equal(previewRecords([{...row,programme:'DCS Advanced'}],[first])[0].error,'');
 assert.equal(previewRecords([{...row,participant_key:'different-key'}],[first])[0].error,'');
 assert.match(previewRecords([{...row,name:'Someone else',programme:'DCS Advanced'}],[first])[0].error,/different identity/);
});
test('duplicates in file and existing registry block commit preview',()=>{
 assert.match(previewRecords([row,row])[1].error,/Duplicate participant/);
 const cert={...row,status:'completed',completion_date:'2026-01-01',certificate_ref:'abc',issued_at:'2026-01-02',issuer:'RCBC'};
 assert.match(previewRecords([cert,{...cert,participant_key:'another-key',certificate_ref:'ABC'}])[1].error,/Duplicate certificate/);
 assert.throws(()=>previewRecords([]));assert.throws(()=>previewRecords(Array(501).fill(row)));
});
test('CSV template round trips quoted multiline content and BOM',()=>{
 const input={...normalizeRecord(row),name:'Tan, "Mei"\nSecond line'};
 assert.deepEqual(parseRegistryCsv('\uFEFF'+registryCsv([input])),[input]);
 assert.throws(()=>parseRegistryCsv('name,email\nA,B'),/template/);
 assert.throws(()=>parseRegistryCsv('x'.repeat(1000001)),/1 MB/);
 assert.throws(()=>parseRegistryCsv(columns.join(',')+'\n"unclosed'));
});
test('CSV export neutralizes spreadsheet formulas',()=>{
 for(const value of ['=1+1','+SUM(A1)','@evil','-1','\t=1']) assert.match(registryCsv([{name:value}]),/"'/);
});
test('untrusted approval and internal fields never enter public output or normalized input',()=>{
 const privateRow={...row,id:'private',email:'secret',verified:true,public_consent:true,consent_note:'private',participant_id:'private'};
 assert.deepEqual(Object.keys(publicRecord(privateRow)),['name','programme','training_location','attendance_date','certificate_ref']);
 const normalized=normalizeRecord({...row,verified:true,public_consent:true,approved_public_display:true});
 assert.equal(normalized.verified,undefined);assert.equal(normalized.public_consent,undefined);assert.equal(normalized.approved_public_display,undefined);
});
test('pagination and filters are bounded and validated',()=>{
 assert.equal(searchOptions(new URLSearchParams('page=2')).offset,20);
 assert.equal(searchOptions(new URLSearchParams('pending=1')).pending,true);
 assert.throws(()=>searchOptions(new URLSearchParams('pending=yes')));
 for(const query of ['page=0','page=1.5','page=100001','status=valid','year=abc','year=26','year=2026.5','location='+ 'x'.repeat(201),'q='+ 'x'.repeat(201)]) assert.throws(()=>searchOptions(new URLSearchParams(query)));
});
test('pending review helper matches triple approval rule',()=>{
 assert.equal(registryPendingReview({verified:false,public_consent:true,approved_public_display:true}),true);
 assert.equal(registryPendingReview({verified:true,public_consent:true,approved_public_display:true}),false);
});
test('admin endpoints reject unauthenticated requests and public endpoint rejects writes',async()=>{
 for(const method of ['GET','POST']) await assert.rejects(dcsRegistryHandler({method,headers:{}},{},new URL('http://localhost/api/admin/dcs-registry'),()=>assert.fail()),e=>e.status===401);
 await assert.rejects(dcsRegistryHandler({method:'POST',headers:{}},{},new URL('http://localhost/api/public/dcs-registry'),()=>assert.fail()),e=>e.status===405);
});
test('authenticated writes require explicit permitted origin before reading body',async()=>{
 const original=pool.query;pool.query=async()=>({rows:[{id:'admin',role:'admin'}]});
 try{for(const origin of [undefined,'https://untrusted.example'])await assert.rejects(dcsRegistryHandler({method:'POST',headers:{cookie:'rcbc_session=test',origin}},{},new URL('http://localhost/api/admin/dcs-registry'),()=>assert.fail()),e=>e.status===403);}finally{pool.query=original;}
});
test('public query enforces all three approvals and explicit safe SQL projection',async()=>{
 const original=pool.query;const queries=[];
 pool.query=async(sql,args)=>{queries.push({sql,args});return sql.includes('count(*)')?{rows:[{count:'1'}]}:{rows:[{...row,email:'PRIVATE'}]};};
 try{let response;await dcsRegistryHandler({method:'GET',headers:{}},{setHeader(){}},new URL('http://localhost/api/public/dcs-registry?q=Mei&page=2&location=Kuching&year=2026'),(_r,_s,v)=>{response=v;});assert.equal(response.rows[0].email,undefined);assert.equal(response.page,2);assert.ok(queries.every(q=>q.sql.includes('r.verified AND r.public_consent AND r.approved_public_display')));assert.ok(!queries[1].sql.includes('p.email'));assert.deepEqual(queries[1].args,['Mei','','','Kuching','2026',20,20]);}finally{pool.query=original;}
});

test('required training details, private references and optional activity UUID are validated',()=>{
 for(const field of requiredFields)assert.throws(()=>normalizeRecord({...row,[field]:''}));
 for(const date of ['2026-02-30','2026-13-01','not a date'])assert.throws(()=>normalizeRecord({...row,attendance_date:date}));
 assert.throws(()=>normalizeRecord({...row,activity_id:'not-uuid'}),/UUID/);
 assert.throws(()=>normalizeRecord({...row,evidence_reference:'x'.repeat(2001)}),/2000/);
 assert.throws(()=>normalizeRecord({...row,assessment_reference:'x'.repeat(2001)}),/2000/);
 const activity='12345678-1234-1234-1234-123456789abc';
 const normalized=normalizeRecord({...row,activity_id:activity.toUpperCase(),assessment_reference:'Assessment 1',evidence_reference:'Evidence 1'});
 assert.equal(normalized.activity_id,activity);assert.equal(normalized.evidence_reference,'Evidence 1');
 assert.equal(normalizeRecord(row).certificate_ref,'');
 assert.throws(()=>normalizeRecord({...row,attendance_date:'2026-03-01',completion_date:'2026-02-01'}),/precedes attendance/);
});
test('public display approval is separate from verification and consent',()=>{
 const choices={verified:true,public_consent:true,approved_public_display:false,consent_note:'Signed consent form 1'};
 assert.equal(reviewChoices(choices).approved_public_display,false);
 assert.equal(reviewChoices({...choices,approved_public_display:true}).approved_public_display,true);
 for(const key of ['verified','public_consent','approved_public_display'])assert.throws(()=>reviewChoices({...choices,[key]:undefined}),/Explicit/);
 assert.throws(()=>reviewChoices({...choices,verified:false,approved_public_display:true}),/requires verification/);
 assert.throws(()=>reviewChoices({...choices,consent_note:''}),/Document public consent/);
});
test('optimistic record versions preserve microseconds and reject missing or stale versions',()=>{
 const current='2026-11-26 10:00:00.123456+00';
 assert.doesNotThrow(()=>assertCurrentRecord(current,current));
 for(const expected of [undefined,null,'','2026-11-26 10:00:00.123455+00'])assert.throws(()=>assertCurrentRecord(expected,current),e=>e.status===409);
});
async function fakeWrite(payload,query){
 const originalQuery=pool.query,originalConnect=pool.connect;const calls=[];
 pool.query=async()=>({rows:[{id:'12345678-1234-1234-1234-123456789abc',role:'admin'}]});
 pool.connect=async()=>({query:async(sql,args)=>{calls.push({sql,args});return await query(sql,args);},release(){}});
 const req=Readable.from([JSON.stringify(payload)]);req.method='POST';req.headers={cookie:'rcbc_session=test',origin:'http://localhost:5173'};
 try{let result;await dcsRegistryHandler(req,{},new URL('http://localhost/api/admin/dcs-registry'),(_r,_s,v)=>{result=v;});return {result,calls};}finally{pool.query=originalQuery;pool.connect=originalConnect;}
}
const recordId='12345678-1234-1234-1234-123456789abc';
const version='2026-11-26 10:00:00.123456+00';
test('backend edit rejects stale and missing versions before any update',async()=>{
 for(const expected_updated_at of [undefined,'old-version']){
  let updates=0;
  await assert.rejects(fakeWrite({action:'edit',id:recordId,expected_updated_at,record:row},async sql=>{
   if(sql.startsWith('UPDATE'))updates++;
   return {rows:sql.includes('WHERE r.id=$1')?[{...normalizeRecord(row),id:recordId,updated_at:version}]:[]};
  }),e=>e.status===409);
  assert.equal(updates,0);
 }
});
test('backend edit stores training fields and clears all approvals',async()=>{
 const old={...normalizeRecord(row),id:recordId,participant_id:recordId,updated_at:version};
 const {calls}=await fakeWrite({action:'edit',id:recordId,expected_updated_at:version,record:{...row,training_location:'Sibu'}},async sql=>({rows:sql.startsWith('SELECT r.*')?[old]:[]}));
 const update=calls.find(c=>c.sql.startsWith('UPDATE dcs_registry_records SET programme'));
 assert.ok(update.sql.includes('approved_public_display=false'));assert.ok(update.sql.includes('activity_id=$11'));assert.equal(update.args[8],'Sibu');assert.equal(update.args[9],row.attendance_date);assert.ok(calls.some(c=>c.sql==='COMMIT'));
});
test('backend review explicitly persists the third approval separately',async()=>{
 const {calls}=await fakeWrite({action:'review',id:recordId,expected_updated_at:version,verified:true,public_consent:true,approved_public_display:false,consent_note:'Signed consent'},async sql=>({rows:sql.includes('WHERE r.id=$1')?[{id:recordId,updated_at:version}]:[]}));
 const update=calls.find(c=>c.sql.startsWith('UPDATE'));
 assert.ok(update.sql.includes('approved_public_display=$4'));assert.deepEqual(update.args.slice(1,5),[true,true,false,'Signed consent']);
});
test('import preview rejects missing activities and commit revalidates without inserting',async()=>{
 const rows=[{...row,activity_id:recordId}];
 const query=async()=>({rows:[]});
 const {result}=await fakeWrite({action:'preview',rows},query);assert.equal(result.valid,false);assert.match(result.preview[0].error,/activity does not exist/);
 let inserts=0;
 await assert.rejects(fakeWrite({action:'commit',rows},async sql=>{if(sql.startsWith('INSERT'))inserts++;return {rows:[]};}),e=>e.status===409);
 assert.equal(inserts,0);
});
test('import commit stores added details and ignores supplied approvals',async()=>{
 const {calls}=await fakeWrite({action:'commit',rows:[{...row,approved_public_display:true,verified:true,public_consent:true}]},async sql=>({rows:sql.startsWith('INSERT INTO dcs_registry_participants')?[{id:recordId}]:[]}));
 const insert=calls.find(c=>c.sql.startsWith('INSERT INTO dcs_registry_records'));
 assert.ok(!insert.sql.includes('approved_public_display'));assert.ok(!insert.sql.includes('verified'));assert.equal(insert.args[9],row.training_location);assert.equal(insert.args[10],row.attendance_date);assert.equal(insert.args[11],null);assert.equal(insert.args[12],row.organiser);
});
test('public copy catalogue supports approval-scoped translation with English fallback',()=>{
 const english={inlineCopy:dcsPublicCopy};
 for(const [key,text] of Object.entries(dcsPublicCopy)){
  assert.ok(key.startsWith('dcsRegistry'));assert.ok(text.trim());
  assert.equal(translateCataloguedLabel(text,key,english,{inlineCopy:{}}),text);
  assert.equal(translateCataloguedLabel(text,key,english,{inlineCopy:{[key]:'Approved translation'}}),'Approved translation');
 }
});
