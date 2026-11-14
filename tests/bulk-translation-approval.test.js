import test from 'node:test';
import assert from 'node:assert/strict';
import {canBulkApprove,bulkApprovalSummary} from '../shared/bulk-translation-approval.js';
const row={key:'ui/home/title',language:'ms',status:'review',source:'English',source_text:'English',translated_text:'Translation',review_type:'standard'};
test('bulk approval requires current submitted text and all required expert checks',()=>{
 assert.equal(canBulkApprove(row),true);
 for(const patch of [{status:'draft'},{status:'needs-review'},{status:'approved'},{source_text:'Old English'},{translated_text:'  '},{review_type:'medical'},{review_type:'professional'}])assert.equal(canBulkApprove({...row,...patch}),false);
 assert.equal(canBulkApprove({...row,review_type:'medical',expert_reviewed_by:'expert'}),true);
});
test('bulk summary respects page/language scope and identifies blocked pending reviews',()=>{
 const entries=[row,{...row,language:'zh'},{...row,key:'ui/contact/title'},{...row,key:'ui/home/description',review_type:'medical'},{...row,key:'ui/home/intro',status:'draft'}];
 const all=bulkApprovalSummary(entries);
 assert.equal(all.eligible.length,3);assert.equal(all.blocked,1);assert.deepEqual(all.byLanguage,{ms:2,zh:1});
 const home=bulkApprovalSummary(entries,{page:'home',language:'ms'});
 assert.equal(home.eligible.length,1);assert.equal(home.blocked,1);
});
