import {translationPage} from './translation-workspace.js';
export function canBulkApprove(row){
 return row.status==='review'&&typeof row.source==='string'&&row.source===row.source_text&&!!row.translated_text?.trim()&&(row.review_type==='standard'||!!row.expert_reviewed_by);
}
export function bulkApprovalSummary(entries,{page='',language='all'}={}){
 const pending=entries.filter(r=>r.status==='review'&&(!page||translationPage(r.key)===page)&&(language==='all'||r.language===language));
 const eligible=pending.filter(canBulkApprove);
 return {pending:pending.length,eligible,blocked:pending.length-eligible.length,byLanguage:{ms:eligible.filter(r=>r.language==='ms').length,zh:eligible.filter(r=>r.language==='zh').length}};
}
