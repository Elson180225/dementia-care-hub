import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanDeploymentContent,isTestingEvent,translationImportStatus,deploymentEvent,registrationSourceKey} from '../shared/deployment-content.js';
test('only explicitly identified test content is excluded from deployment',()=>{
 for(const name of ['Testing 1','Testing 2','Dementia Care skill','Dementia workshop','Waka Waka Ei Ei'])assert.ok(isTestingEvent({title:name}));
 assert.equal(isTestingEvent({title:'Basic Dementia Care Skill (Family) Course'}),false);
 const input={physicalEducation:{programmes:[{id:'dcs-family'},{id:'dcs-track-1794038842414'}]},events:{pillars:[{id:'pillar-1794042812642'}]}};
 const clean=cleanDeploymentContent(input);
 assert.equal(clean.physicalEducation.programmes.length,1);assert.equal(input.physicalEducation.programmes.length,2);
 assert.equal(clean.events.pillars.length,0);
});
test('transferred approvals require exact English and identifiable authorized reviewers',()=>{
 const row={source_text:'English',translated_text:'Translation',status:'approved',review_type:'medical',approved_at:'2026-01-01',expert_reviewed_at:'2026-01-01',expert_reviewed_by:'expert',edited_by:'editor'};
 assert.equal(translationImportStatus(row,undefined),'excluded');
 assert.equal(translationImportStatus(row,'Changed'),'needs-review');
 assert.equal(translationImportStatus(row,'English',{requiredType:'medical',approver:true}),'review');
 assert.equal(translationImportStatus(row,'English',{requiredType:'medical',approver:true,expert:true}),'approved');
 assert.equal(translationImportStatus({...row,expert_reviewed_by:'editor'},'English',{requiredType:'medical',approver:true,expert:true}),'review');
 assert.equal(translationImportStatus({...row,review_type:'standard'},'English',{requiredType:'medical',approver:true,expert:true}),'review');
});

test('deployment closes unreviewed registration without changing event content or the local source',()=>{
 const event={id:'real',title:'RCBC webinar',starts_at:'2026-01-01',poster_url:'/poster.jpg',registration_link:'https://example.test/testing-form'};
 const clean=deploymentEvent(event);
 assert.equal(clean.registration_link,null);assert.equal(clean.registrationMethod,'closed');
 assert.equal(clean.title,event.title);assert.equal(clean.poster_url,event.poster_url);
 assert.equal(event.registration_link,'https://example.test/testing-form');
 const cms={onlineEducation:{upcomingTopics:[{id:'real',title:'RCBC webinar',registrationLink:'https://example.test/form'}]},physicalEducation:{programmes:[{id:'dcs-family',title:'Family course',badge:'Open for Registration',registrationOpen:true,paymentInstructions:'Test bank'}]}};
 const result=cleanDeploymentContent(cms);
 assert.equal(result.onlineEducation.upcomingTopics[0].registrationLink,'');
 assert.equal(result.physicalEducation.programmes[0].registrationOpen,false);
 assert.equal(result.physicalEducation.programmes[0].paymentInstructions,'');
 assert.equal(result.physicalEducation.programmes[0].badge,'Programme information');
 assert.equal(cms.physicalEducation.programmes[0].registrationOpen,true);
 assert.ok(registrationSourceKey('registration/real/instructions'));
 assert.ok(registrationSourceKey('cms/physicalEducation/programmes/dcs-family/badge'));
 assert.equal(registrationSourceKey('activities/real/description'),false);
});
