import test from 'node:test';
import assert from 'node:assert/strict';
import { parseParticipantCsv, validateParticipants } from '../shared/participants.js';
import { participantsHandler } from '../server/participants.js';

test('participant lists and writes reject unauthenticated requests before accessing data',async()=>{
  for (const method of ['GET','POST']) {
    await assert.rejects(participantsHandler({method,headers:{}},{},new URL('http://localhost/api/admin/participants'),()=>assert.fail('Must not return participant data')),e=>e.status===401);
  }
});

test('Google CSV supports BOM, CRLF, quoted commas, quotes and multiline answers',()=>{
  const csv=parseParticipantCsv('\uFEFFName,Email,Notes\r\n"Tan, Mei",mei@example.com,"Said ""hello""\nSecond line"\r\n');
  assert.deepEqual(csv.headers,['Name','Email','Notes']);
  assert.equal(csv.rows[0][0],'Tan, Mei');assert.equal(csv.rows[0][2],'Said "hello"\nSecond line');
});
test('malformed and oversized imports are rejected',()=>{
  for(const csv of ['Name,Name\na,b','Name,Email\na','Name,Email\n"a,b','Name,Email']) assert.throws(()=>parseParticipantCsv(csv));
  assert.throws(()=>parseParticipantCsv('Name,Email\n'+Array(501).fill('A,a@example.com').join('\n')));
});
test('validation normalizes email and identifies duplicates and invalid fields',()=>{
  const rows=validateParticipants([{name:' Mei ',email:' MEI@example.com '},{name:'Mei',email:'mei@example.com'},{name:'',email:'b@example.com'},{name:'B',email:'invalid'},{name:'C',email:'c@example.com',phone:'0'.repeat(81)}]);
  assert.equal(rows[0].email,'mei@example.com');assert.equal(rows[0].name,'Mei');assert.equal(rows[0].error,'');
  assert.ok(rows.slice(1).every(r=>r.error));
});
