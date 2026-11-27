import test from 'node:test';
import assert from 'node:assert/strict';
import {programmeIntakes,isPlannedProgramme,programmeLink,canActivateProgramme,hasApprovedProgrammeIntake} from '../shared/programme-intakes.js';
test('programme intake selection separates and sorts upcoming and past records',()=>{
 const row=(id,date,patch={})=>({id,programme_id:'family',starts_at:date,status:'published',...patch});
 const rows=[row('later','2030-03-01'),row('soon','2030-02-01'),row('old','2029-01-01'),row('recent','2029-12-01',{status:'completed'}),row('draft','2030-02-01',{status:'draft'}),row('other','2030-02-01',{programme_id:'ttt'}),row('cancelled','2030-02-01',{cancelled_at:'2030-01-01'}),row('invalid','invalid')];
 const result=programmeIntakes(rows,'family',Date.parse('2030-01-01'));
 assert.deepEqual(result.upcoming.map(e=>e.id),['soon','later']);
 assert.deepEqual(result.past.map(e=>e.id),['recent','old']);
});
test('future care-worker defaults to planned but RCBC can change availability',()=>{
 assert.equal(isPlannedProgramme({id:'dcs-care-worker'}),true);
 assert.equal(isPlannedProgramme({id:'dcs-family'}),false);
 assert.equal(isPlannedProgramme({id:'dcs-care-worker',availability:'available'}),false);
});


test('future availability and DCS-Worker legacy code stay inactive',()=>{
 assert.equal(isPlannedProgramme({id:'custom',availability:'future'}),true);
 assert.equal(isPlannedProgramme({id:'dcs-worker'}),true);
 assert.equal(isPlannedProgramme({id:'custom',code:'DCS-Worker'}),true);
 assert.equal(isPlannedProgramme({id:'custom',code:'DCS-Care Worker'}),true);
 assert.equal(isPlannedProgramme({id:'dcs-worker',availability:'available'}),false);
});

test('permanent links preserve programme IDs safely',()=>{
 assert.equal(programmeLink({id:'dcs-family'}),'/learn-events/physical-education?programme=dcs-family');
 assert.equal(programmeLink({id:'a & b'}),'/learn-events/physical-education?programme=a%20%26%20b');
});

test('activation requires a linked approved future published intake',()=>{
 const now=Date.parse('2030-01-01');
 const previous={id:'dcs-worker',availability:'future'};
 const next={...previous,availability:'available'};
 const event={programme_id:next.id,status:'published',starts_at:'2030-02-01',approval_status:'approved'};
 assert.equal(canActivateProgramme(previous,next,[event],now),true);
 assert.equal(canActivateProgramme(previous,next,[],now),false);
 for(const patch of [{approval_status:null},{status:'draft'},{cancelled_at:'2030-01-01'},{starts_at:'2029-01-01'},{starts_at:'invalid'},{programme_id:'dcs-family'}])
  assert.equal(canActivateProgramme(previous,next,[{...event,...patch}],now),false);
 assert.equal(canActivateProgramme(previous,previous,[],now),true);
 assert.equal(hasApprovedProgrammeIntake([{...event,approval_status:null,approved_at:'2029-12-01'}],next.id,now),true);
});

test('content approval is compatible with published intake approval',()=>{
 assert.equal(hasApprovedProgrammeIntake([{programme_id:'worker',status:'published',starts_at:'2030-02-01',content_approval_status:'approved'}],'worker',Date.parse('2030-01-01')),true);
});
