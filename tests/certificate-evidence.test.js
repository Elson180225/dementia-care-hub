import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeCertificateEvidence, certificateFileId } from '../server/certificate-evidence.js';

test('certificate evidence accepts images/PDFs and sanitizes filenames',()=>{
 const pdf=decodeCertificateEvidence({name:'certificate\n".pdf',data:Buffer.from('%PDF-1.4 test').toString('base64')});
 assert.equal(pdf.mime,'application/pdf');assert.equal(pdf.name,'certificate__.pdf');
 const png=decodeCertificateEvidence({name:'certificate.png',data:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII='});
 assert.equal(png.mime,'image/png');assert.equal(decodeCertificateEvidence(null),null);
});

test('certificate evidence rejects disguised files, malformed data and oversized files',()=>{
 for(const evidence of [
  {name:'certificate.png',data:Buffer.from('<svg>not a photo</svg>').toString('base64')},
  {name:'certificate.pdf',data:'!invalid!'},
  {name:'certificate.pdf',data:''},
  {name:'certificate.pdf',data:'A'.repeat(11184816)},
 ]) assert.throws(()=>decodeCertificateEvidence(evidence),{status:400});
});

test('certificate links require private document uploads and owner/admin access',async()=>{
 const id='a0000000-0000-4000-8000-000000000001',url='/api/files/'+id;
 const db={query:async sql=>({rows:sql.includes('owner_id')?[{owner_id:'owner'}]:[],rowCount:0})};
 assert.equal(await certificateFileId(db,{id:'owner',role:'trainer'},url),id);
 assert.equal(await certificateFileId(db,{id:'admin',role:'admin'},url),id);
 await assert.rejects(certificateFileId(db,{id:'other',role:'trainer'},url),{status:400});
 await assert.rejects(certificateFileId(db,{id:'owner',role:'trainer'},'https://example.org/cert.png'),{status:400});
});
