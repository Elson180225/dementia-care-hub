import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceLeaves,translateTree,reviewStatus,reviewTransition} from '../shared/translation-review.js';
const admin={id:'admin',admin:true,scopes:[]},expert={id:'expert',admin:false,scopes:['medical']};
const draft={source_text:'English',translated_text:'Translation',status:'draft',review_type:'medical',edited_by:'admin',expert_reviewed_by:null};
test('only exact current source translations replace English; metadata and links stay unchanged',()=>{
 const tree={id:'p1',title:'English',url:'https://example.org',children:[{id:'stable',title:'Child'}]};
 const leaves=sourceLeaves(tree,'cms');
 assert.equal(leaves['cms/id'],undefined);assert.equal(leaves['cms/url'],undefined);
 assert.equal(leaves['cms/children/stable/title'],'Child');
 assert.equal(translateTree(tree,'cms',{'cms/title':{source:'English',text:'Approved'}}).title,'Approved');
 assert.equal(translateTree(tree,'cms',{'cms/title':{source:'Old English',text:'Unverified'}}).title,'English');
 assert.equal(tree.title,'English');
});
test('missing, outdated, draft and approved statuses remain distinct',()=>{
 assert.equal(reviewStatus(null,'English'),'missing');
 assert.equal(reviewStatus({...draft,status:'approved'},'Changed'),'needs-review');
 assert.equal(reviewStatus(draft,'English'),'draft');
});
test('medical translations need relevant expert review and separate RCBC approval',()=>{
 const submitted=reviewTransition(draft,'English','submit',admin);
 assert.throws(()=>reviewTransition(submitted,'English','approve',admin),/expert review/);
 assert.throws(()=>reviewTransition(submitted,'English','expert-review',{...expert,scopes:['professional']}),/designated expert/);
 assert.throws(()=>reviewTransition(submitted,'English','expert-review',{...expert,id:'admin'}),/Another/);
 const reviewed=reviewTransition(submitted,'English','expert-review',expert);
 assert.throws(()=>reviewTransition(reviewed,'English','approve',expert),/admin approval/);
 assert.equal(reviewTransition(reviewed,'English','approve',admin).status,'approved');
 assert.throws(()=>reviewTransition(reviewed,'Changed','approve',admin),/English source changed/);
 assert.equal(reviewTransition(reviewed,'English','return',expert).expert_reviewed_by,null);
});
test('standard text can be approved by RCBC after review submission',()=>{
 const submitted=reviewTransition({...draft,review_type:'standard'},'English','submit',admin);
 assert.equal(reviewTransition(submitted,'English','approve',admin).status,'approved');
 assert.throws(()=>reviewTransition(draft,'English','approve',admin),/Submit/);
});
