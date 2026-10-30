import { useEffect, useState } from 'react';
import { headingSections } from '../../../../shared/online-headings';
import { translations } from '../../../i18n/translations';
import './PageTextEditor.css';

export default function PageTextEditor({content,onSave}) {
  const saved=content.onlineEducation?.sectionHeader || {};
  const [draft,setDraft]=useState(saved),[section,setSection]=useState('rcbc'),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const dirty=JSON.stringify(draft)!==JSON.stringify(saved);
  useEffect(()=>{
    if(!dirty)return;
    const warn=e=>{e.preventDefault();e.returnValue='';};
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
  },[dirty]);
  const info=headingSections.find(s=>s.id===section);
  const defaults=translations.en.learnEvents;
  const fallback=suffix=>defaults[section==='upcoming'?{Title:'upcomingEventsTitle',Desc:'upcomingEventsDesc',Label:'lookingAhead'}[suffix]:section+suffix] || '';
  const text=suffix=>draft[section+suffix]?.trim() || fallback(suffix);
  const update=(suffix,value)=>{setDraft({...draft,[section+suffix]:value});setMessage('');};
  async function save(){
    setBusy(true);setMessage('');
    try {const ok=await onSave({...content,onlineEducation:{...content.onlineEducation,sectionHeader:draft}});setMessage(ok?'Saved. Your English page text is now published.':'Could not save. Your edits are still here; please try again.');}
    catch{setMessage('Could not save. Your edits are still here; please try again.');}finally{setBusy(false);}
  }
  return <section className="page-text-editor">
    <header><span className="pte-language">English content</span><h2>Page titles & descriptions</h2><p>Change the headings and introductions visitors see on Online Education. Event details stay the same. Other languages keep their existing translations.</p></header>
    <fieldset disabled={busy}><legend className="tp-sr">Edit page text</legend>
      <div className="pte-layout"><nav aria-label="Choose a section to edit">{headingSections.map((s,index)=><button type="button" key={s.id} aria-current={section===s.id?'page':undefined} onClick={()=>setSection(s.id)}><span>{index+1}</span>{s.name}</button>)}</nav>
      <div><h3>{info.name}</h3><p className="pte-hint">{info.hint}</p>
        <div className="tp-field"><label htmlFor="pte-title">Section title</label><input id="pte-title" value={draft[section+'Title'] || ''} placeholder={fallback('Title')} maxLength={200} onChange={e=>update('Title',e.target.value)}/><small>The large heading visitors see. Leave blank to use the default wording.</small></div>
        <div className="tp-field"><label htmlFor="pte-desc">Introduction</label><textarea id="pte-desc" rows={4} value={draft[section+'Desc'] || ''} placeholder={fallback('Desc')} maxLength={2000} onChange={e=>update('Desc',e.target.value)}/><small>A short explanation below the title.</small></div>
        <details><summary>More options</summary><div className="tp-field"><label htmlFor="pte-label">Small label above the title</label><input id="pte-label" value={draft[section+'Label'] || ''} placeholder={fallback('Label')} maxLength={100} onChange={e=>update('Label',e.target.value)}/></div></details>
        <aside className="pte-preview" aria-label="Text preview"><small>TEXT PREVIEW · ENGLISH</small><span>{text('Label')}</span><h3>{text('Title')}</h3><p>{text('Desc')}</p></aside>
      </div></div>
      <footer><span role="status">{busy?'Saving…':dirty?'Unsaved changes':'All changes saved'}</span><button type="button" className="tp-btn tp-btn-ghost" disabled={!dirty} onClick={()=>{setDraft(saved);setMessage('Changes discarded.');}}>Discard changes</button><button type="button" className="tp-btn" disabled={!dirty} onClick={save}>Save changes</button></footer>
    </fieldset>
    {message && <p role="status">{message} {message.startsWith('Saved') && <a href="/learn-events/online-education" target="_blank" rel="noreferrer">View public page (opens a new tab) ↗</a>}</p>}
  </section>;
}
