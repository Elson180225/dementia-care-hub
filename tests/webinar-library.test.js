import test from 'node:test';
import assert from 'node:assert/strict';
import {publicEducationContent,webinarReview} from '../shared/webinar-library.js';
import {webinarLibraryHandler} from '../server/webinar-library.js';
import {sourceLeaves,defaultReviewType} from '../shared/translation-review.js';
import {translationPage} from '../shared/translation-workspace.js';
import {translations} from '../src/i18n/translations.js';
import {workbookEntries} from '../shared/workbook-import.js';
import {workbookXlsx} from '../server/education-reports.js';
test('public CMS hides unreviewed and legacy cards without mutating stored records',()=>{
 const content={onlineEducation:{upcomingTopics:[{id:'old'},{id:'pending',publicationStatus:'pending'},{id:'approved',publicationStatus:'approved'}],approvedResources:[{id:'draft',publicationStatus:'pending'}]},certifiedTrainers:{trainersList:[{name:'Private legacy record'}]}};
 const result=publicEducationContent(content);assert.deepEqual(result.onlineEducation.upcomingTopics.map(r=>r.id),['approved']);assert.equal(result.onlineEducation.approvedResources.length,0);assert.equal(result.certifiedTrainers.trainersList.length,0);assert.equal(content.onlineEducation.upcomingTopics.length,3);
});
test('publication requires explicit permission review and safe resource URLs',()=>{
 assert.throws(()=>webinarReview({content_approval_status:'approved'}),/permissions/);
 assert.throws(()=>webinarReview({content_approval_status:'approved',rightsConfirmed:true,qa_url:'javascript:alert(1)'}),/HTTPS/);
 assert.equal(webinarReview({content_approval_status:'pending',speaker_name:' Speaker '}).speaker_name,'Speaker');
 assert.equal(webinarReview({content_approval_status:'approved',rightsConfirmed:true,recording_url:'https://example.test/video'}).content_approval_status,'approved');
});
test('webinar review remains administrator-only',async()=>{
 await assert.rejects(webinarLibraryHandler({method:'GET',headers:{}},{},new URL('http://localhost/api/admin/webinar-library'),()=>assert.fail()),e=>e.status===401);
});
test('new public wording is discoverable under Education and credential claims require expert review',()=>{
 const sources=sourceLeaves(translations.en);
 for(const key of ['educationBackLibrary','educationTttCertificate','dcsRegistryTitle']){assert.ok(sources['ui/inlineCopy/'+key]);assert.equal(translationPage('ui/inlineCopy/'+key),'education');}
 assert.equal(defaultReviewType('ui/inlineCopy/educationTttCertificate'),'professional');
});
test('workbook import reads a real stored XLSX and rejects invalid archives',async()=>{
 const data=workbookXlsx([{name:'Template',rows:[['name'],['Person']]}]);
 const files=await workbookEntries(data.buffer.slice(data.byteOffset,data.byteOffset+data.length));assert.match(files.get('xl/worksheets/sheet1.xml'),/Person/);
 await assert.rejects(workbookEntries(new Uint8Array(30).buffer),/supported XLSX/);
});
