import {useEffect,useId,useRef,useState} from 'react';
import {bulkApprovalSummary} from '../../../shared/bulk-translation-approval';
import {translationPages} from '../../../shared/translation-workspace';

export default function BulkTranslationApproval({entries,page='',language,onClose,onApprove,busy,error}){
 const [selectedLanguage,setSelectedLanguage]=useState(language),[confirmed,setConfirmed]=useState(false);
 const dialog=useRef(null),titleId=useId(),descriptionId=useId();
 const summary=bulkApprovalSummary(entries,{page,language:selectedLanguage});
 const pageTitle=translationPages.find(p=>p.id===page)?.title||'All website pages';
 useEffect(()=>{
  const previous=document.activeElement,overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';dialog.current?.focus();
  return()=>{document.body.style.overflow=overflow;previous?.focus?.();};
 },[]);
 useEffect(()=>{
  const escape=e=>{
   if(e.key==='Escape'&&!busy){e.preventDefault();onClose();return;}
   if(e.key!=='Tab')return;
   const controls=[...dialog.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled)')];
   const first=controls[0],last=controls.at(-1);
   if(!controls.length){e.preventDefault();return;}
   if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===dialog.current)){e.preventDefault();first.focus();}
  };
  document.addEventListener('keydown',escape);
  return()=>document.removeEventListener('keydown',escape);
 },[onClose,busy]);
 return <div className="tr-modal-backdrop"><section ref={dialog} tabIndex={-1} className="tr-approval-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
  <span className="tr-eyebrow">Review before publishing</span><h2 id={titleId}>Approve translations together</h2><p id={descriptionId}>This publishes only current translations waiting for review that have completed every required check.</p>
  <p><strong>Pages:</strong> {pageTitle}</p><label>Languages to publish<select disabled={busy} value={selectedLanguage} onChange={e=>{setSelectedLanguage(e.target.value);setConfirmed(false);}}><option value="ms">Bahasa Malaysia</option><option value="zh">Chinese 中文</option><option value="all">Both languages</option></select></label>
  <div className="tr-bulk-counts"><strong>{summary.eligible.length}</strong><span>ready to publish</span><p>{summary.byLanguage.ms} Bahasa Malaysia · {summary.byLanguage.zh} Chinese</p></div>
  <p className="tr-public-effect">{summary.blocked} pending items are not eligible and will remain unpublished. Drafts and text needing updates are not included.</p>
  <details><summary>See the translations included</summary><ul className="tr-bulk-preview">{summary.eligible.map(r=><li key={r.key+r.language}><strong>{r.label||'Page text'} · {r.language==='ms'?'Bahasa Malaysia':'Chinese'}</strong><p>{r.translated_text}</p></li>)}</ul></details>
  <label className="tr-bulk-consent"><input type="checkbox" checked={confirmed} disabled={busy||!summary.eligible.length} onChange={e=>setConfirmed(e.target.checked)}/><span>I have reviewed this selection and approve it for public display.</span></label>
  <div className="tr-primary-actions"><button disabled={busy} onClick={onClose}>Cancel</button><button className="tp-btn" disabled={busy||!confirmed||!summary.eligible.length||summary.eligible.length>5000} onClick={()=>onApprove({action:'approve-bulk',page,language:selectedLanguage,items:summary.eligible.map(r=>({key:r.key,language:r.language,revision:r.revision}))})}>{busy?'Publishing…':'Approve & publish '+summary.eligible.length+' translations'}</button></div>
  {error&&<p role="alert" className="tr-feedback tr-feedback-error">{error} Close this window and refresh the review list before trying again.</p>}
  {busy&&<p role="status">Publishing the confirmed selection. Please keep this window open.</p>}
 </section></div>;
}
