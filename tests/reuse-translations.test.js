import test from 'node:test';
import assert from 'node:assert/strict';
import {reusePlan} from '../scripts/reuse-translations.js';
test('reuse plan preserves existing edits and respects page review requirements',()=>{
 const saved={source_key:'ui/header/search',language:'ms',translated_text:'Manually edited',status:'draft'};
 const plan=reusePlan([saved],{shared:'professional'});
 const row=plan.find(r=>r.key===saved.source_key&&r.language==='ms');
 assert.equal(row.existing,saved);
 assert.equal(row.reviewType,'professional');
 assert.equal(row.existing.translated_text,'Manually edited');
 assert.ok(plan.filter(r=>r.language==='ms').length>1000);
 assert.ok(plan.filter(r=>r.language==='zh').length>1000);
 assert.ok(plan.every(r=>r.source.trim()&&r.text.trim()));
});
