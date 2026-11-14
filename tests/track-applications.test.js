import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTrackApplication,applicationStatuses} from '../shared/track-applications.js';
import {trackApplicationsHandler} from '../server/track-applications.js';
const valid={trackId:'family',fullName:' Mei ',email:' MEI@example.com ',phone:'0123456789',consent:true};
test('application validation normalizes contact details and limits stored fields',()=>{
 const result=validateTrackApplication({...valid,admin:true,status:'accepted'});
 assert.equal(result.fullName,'Mei');assert.equal(result.email,'mei@example.com');assert.equal(result.status,undefined);assert.equal(result.admin,undefined);
});
test('applications require consent, contact details and bounded field lengths',()=>{
 for(const patch of [{consent:false},{email:'invalid'},{phone:''},{trackId:''},{fullName:''},{notes:'x'.repeat(2001)},{fullName:{}}])assert.throws(()=>validateTrackApplication({...valid,...patch}));
 assert.ok(applicationStatuses.includes('under-review'));
});
test('application records are inaccessible to anonymous visitors',async()=>{
 for(const method of ['GET','POST'])await assert.rejects(trackApplicationsHandler({method,headers:{}},{},new URL('http://localhost/api/admin/track-applications'),()=>assert.fail()),e=>e.status===401);
});
test('public application endpoint rejects unrelated origins before accepting data',async()=>{
 await assert.rejects(trackApplicationsHandler({method:'POST',headers:{origin:'https://unrelated.invalid'}},{},new URL('http://localhost/api/public/track-applications'),()=>assert.fail()),e=>e.status===403);
});

test('retired public application route directs visitors to dated intakes',async()=>{
 for(const method of ['GET','POST']){
  let response;
  await trackApplicationsHandler({method,headers:{}},{},new URL('http://localhost/api/public/track-applications'),(_res,status,body)=>{response={status,body};});
  assert.equal(response.status,410);
  assert.match(response.body.error,/dated intake/);
 }
});
