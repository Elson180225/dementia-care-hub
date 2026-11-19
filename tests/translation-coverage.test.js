import test from 'node:test';
import assert from 'node:assert/strict';
import {translations} from '../src/i18n/translations.js';
import {sourceLeaves,translateTree} from '../shared/translation-review.js';
import {translationPage} from '../shared/translation-workspace.js';
import {addMissingCopy} from '../shared/public-copy.js';
import {eventPriceLabel} from '../shared/event-registration.js';

test('screenshot sections and interface labels are discoverable in the admin catalogue',()=>{
 const sources=sourceLeaves(translations.en);
 for(const key of ['understandDementia/commonTypesTitle','understandDementia/commonTypes/0/title','understandDementia/reviewCopy/earlyIntro','understandDementia/reviewCopy/guideNotice','understandDementia/reviewCopy/webinarLink','understandDementia/healthcareLink','understandDementia/livingSections/0/description','caregiverSupport/programmeFamilyNotice','caregiverSupport/workerAvailabilityNotice','caregiverSupport/certReadyPrompt','contact/email','contact/enquiryOptions/0','projectServices/email','projectServices/city','projectServices/state','projectServices/getUpdatedIntro','supportDirectory/categories/0','supportDirectory/records/service-001/name','learnEvents/intakeLabels/upcoming','learnEvents/registrationCopy/notesLabel','learnEvents/priceLabels/free','learnEvents/activityModal/mode'])assert.ok(sources['ui/'+key],key);
 assert.equal(translationPage('ui/supportDirectory/records/service-001/name'),'help');
});

test('catalogue distinguishes display labels and descriptive programme fields from record metadata',()=>{
 const labels=sourceLeaves({email:'Email',city:'City',state:'State',healthcareLink:'Healthcare information'},'ui/projectServices');
 assert.equal(labels['ui/projectServices/city'],'City');assert.equal(labels['ui/projectServices/healthcareLink'],'Healthcare information');
 const record=sourceLeaves({id:'person',email:'person@example.test',phone:'0123456789',city:'Kuching',status:'published',mode:'Online',category:'Pharmacy',href:'#section',websiteLink:'https://example.test',title:'Visible title'},'records/organisations/person');
 assert.deepEqual(Object.values(record),['Visible title']);
 const programme=sourceLeaves({id:'dcs-family',mode:'In-person workshop',language:'English with support',availability:'open'},'cms/physicalEducation/programmes/dcs-family');
 assert.equal(programme['cms/physicalEducation/programmes/dcs-family/mode'],'In-person workshop');
 assert.equal(programme['cms/physicalEducation/programmes/dcs-family/availability'],undefined);
 assert.equal(sourceLeaves(translations.en)['ui/equipmentPracticalPage/heroCards/daily/category'],undefined);
});

test('new copy uses approved exact-source translations and keeps English fallback and canonical values',()=>{
 const key='ui/understandDementia/reviewCopy/earlyTitle';
 const approved={[key]:{source:'Early Signs',text:'Approved example'}};
 const rendered=translateTree(translations.en,'ui',approved);
 assert.equal(rendered.understandDementia.reviewCopy.earlyTitle,'Approved example');
 assert.equal(rendered.understandDementia.reviewCopy.selfCheckTitle,'Self-Assessment');
 assert.equal(translateTree({earlyTitle:'Updated English'},'ui/understandDementia/reviewCopy',approved).earlyTitle,'Updated English');
 assert.equal(rendered.supportDirectory.records[0].id,'service-001');
 assert.equal(rendered.supportDirectory.records[0].category,'Pharmacy');
 assert.equal(rendered.understandDementia.livingSections[0].webinarQuery,'Cataracts');
});

test('translated pricing labels preserve free/paid and delivery classification',()=>{
 const event={mode:'Physical',registration_settings:{paid:false,fee:'stale'}};
 assert.equal(eventPriceLabel(event,{free:'Percuma',physical:'Bersemuka'}),'Percuma · Bersemuka');
 assert.equal(event.mode,'Physical');assert.equal(event.registration_settings.paid,false);
});

test('adding missing copy never overwrites existing English wording',()=>{
 const original={title:'Existing',nested:{heading:'Saved'}};
 addMissingCopy(original,{title:'Replacement',nested:{heading:'Replacement',newLabel:'New'}});
 assert.deepEqual(original,{title:'Existing',nested:{heading:'Saved',newLabel:'New'}});
});
