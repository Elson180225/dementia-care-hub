import test from 'node:test';
import assert from 'node:assert/strict';
import {programmeIntakes,isPlannedProgramme} from '../shared/programme-intakes.js';
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
