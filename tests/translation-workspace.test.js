import test from 'node:test';
import assert from 'node:assert/strict';
import {translationPage,friendlyField,pageSummary,taskIncludes} from '../shared/translation-workspace.js';
test('familiar website pages include static, CMS and linked event content',()=>{
 for(const key of ['ui/learnEvents/title','cms/physicalEducation/programmes/family/title','activities/event/title','registration/event/instructions'])assert.equal(translationPage(key),'education');
 assert.equal(translationPage('ui/understandDementia/title'),'understanding');
 assert.equal(translationPage('ui/header/search'),'shared');
 assert.equal(translationPage('records/content_pages/id/title'),'resources');
});
test('page cards keep language progress separate',()=>{
 const entries=[{key:'ui/home/title',language:'ms',status:'approved'},{key:'ui/home/intro',language:'ms',status:'needs-review'},{key:'ui/home/title',language:'zh',status:'review'},{key:'ui/contact/title',language:'ms',status:'draft'}];
 assert.deepEqual(pageSummary(entries,'home','ms'),{total:2,published:1,review:0,changed:1,attention:1});
 assert.equal(pageSummary(entries,'home','zh').review,1);
});
test('review queues show only waiting items matching expert scope',()=>{
 const expert={admin:false,scopes:['medical']},admin={admin:true,scopes:[]};
 assert.equal(taskIncludes({status:'review',review_type:'professional'},'review',expert),false);
 assert.equal(taskIncludes({status:'draft',review_type:'medical'},'review',expert),false);
 assert.equal(taskIncludes({status:'review',review_type:'medical'},'review',expert),true);
 assert.equal(taskIncludes({status:'needs-review',review_type:'medical'},'changed',admin),true);
 assert.equal(taskIncludes({status:'needs-review',review_type:'professional'},'changed',expert),false);
});
test('content labels describe fields without exposing their storage reference',()=>{
 assert.equal(friendlyField('cms/programmes/family/description',{'cms/programmes/family/title':'DCS-Family'}),'DCS-Family — Description');
 assert.equal(friendlyField('registration/id/general_instructions'),'Registration instructions');
});
