import test from 'node:test';
import assert from 'node:assert/strict';
import {teachingPermission,validatePermissions,individualHours,publicTrainer} from '../shared/trainer-governance.js';
import {teachingEligibility} from '../shared/teaching-eligibility.js';
test('background and assessment never grant teaching permission',()=>{
 for(const healthcare_professional of [true,false,null])for(const assessment_status of ['completed','pass','independent']){
  assert.equal(teachingPermission({healthcare_professional,assessment_status,teaching_permissions:[{scope:'Workshop',modules:[]}]},{type:'Workshop'}),false);
  assert.match(teachingEligibility(assessment_status,healthcare_professional),/Not approved/);
 }
 for(const healthcare_professional of [true,false])assert.equal(teachingPermission({healthcare_professional,teaching_allowed:true,teaching_permissions:[{scope:'Workshop',modules:[]}]},{type:'Workshop'}),true);
});
test('programme/module scope cannot be bypassed with a general event type',()=>{
 const p={teaching_allowed:true,teaching_permissions:[{scope:'dcs-family',modules:['Communication']},{scope:'Workshop',modules:[]}]};
 assert.equal(teachingPermission(p,{programmeId:'dcs-family',type:'Workshop',teachingModule:'Communication'}),true);
 assert.equal(teachingPermission(p,{programmeId:'dcs-family',type:'Workshop'}),false);
 assert.equal(teachingPermission(p,{programmeId:'dcs-ttt',type:'Workshop'}),false);
 assert.throws(()=>validatePermissions([{scope:'Workshop',modules:[]},{scope:'Workshop',modules:[]}]));
});
test('individual hours require an explicit figure for every assigned trainer',()=>{
 const trainers=[{trainerId:'a'},{trainerId:'b'}];
 assert.deepEqual(individualHours(trainers,{a:2,b:4}),[{id:'a',hours:2},{id:'b',hours:4}]);
 for(const value of [undefined,{a:2},{a:2,b:-1},{a:2,b:''},{a:2,b:4,c:5}])assert.throws(()=>individualHours(trainers,value));
});
test('public trainer grouping uses verified background, not legacy categories',()=>{
 assert.equal(publicTrainer({name:'Test Name',healthcare_professional:false,category:'medical-professional'}).category,'non-hcp');
});
