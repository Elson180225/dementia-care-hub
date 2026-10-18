import { useState } from 'react';
import { useTrainer } from '../../trainer-portal/TrainerContext';
import { buildQueue } from '../../trainer-portal/selectors';
export default function ReviewQueue() {
 const {state,dispatch}=useTrainer();const queue=buildQueue(state);
 const [comments,setComments]=useState({});const [refs,setRefs]=useState({});const [busy,setBusy]=useState(false);const [search,setSearch]=useState('');
 async function decide(target,id,decision) {
  setBusy(true);try{await dispatch({type:'ADMIN_REVIEW',target,id,decision,comment:comments[id] || '',certificateRef:refs[id] || ''});}finally{setBusy(false);}
 }
 const comment=id=><label className="tp-field">Admin comment (required for return, rejection or cancellation)<textarea value={comments[id] || ''} onChange={e=>setComments({...comments,[id]:e.target.value})}/></label>;
 return <><h1>Review queue</h1><p>Review submitted evidence before approving. Every decision is saved with your identity, date and comment.</p>
 {!queue.length && <p className="tp-card">Nothing is awaiting review.</p>}
 <ul className="tp-cards">{queue.map(item=>{
  const p=state.profiles.find(p=>p.id===item.id);const a=state.activities.find(a=>a.id===item.id);
  return <li key={item.key} className="tp-card"><p>{item.kind}</p><h2>{item.title}</h2><p>{item.detail}</p>
  {item.target==='access' && <><p>Application date: {new Date(state.accessRequests.find(r=>r.id===item.id)?.submitted_at).toLocaleString('en-MY')}</p><label className="tp-field">RCBC verified certificate reference<input value={refs[item.id] || ''} onChange={e=>setRefs({...refs,[item.id]:e.target.value})}/></label></>}
  {p && item.target==='profile' && <><p>{p.shortProfile}</p><h3>Qualifications</h3><p>{p.qualifications}</p><h3>Experience</h3><p>{p.experience}</p>{p.photoUrl && <img className="tp-preview" src={p.photoUrl} alt={p.name}/>}<ul>{p.supportingDocuments.map((url,i)=><li key={url}><a href={url} target="_blank" rel="noreferrer">Supporting document {i+1}</a></li>)}</ul></>}
  {a && <><p>{a.description}</p><p>Venue: {a.venue} | Audience: {a.audience} | Planned hours: {a.plannedHours}</p><p>Trainers: {a.trainers.map(t=>(state.profiles.find(p=>p.id===t.trainerId)?.name || t.trainerId)+' ('+t.role+')').join(', ')}</p>{a.registrationLink && <a href={a.registrationLink} target="_blank" rel="noreferrer">Registration link</a>}{a.posterUrl && <p><a href={a.posterUrl} target="_blank" rel="noreferrer">Poster</a></p>}{item.target==='completion' && <><p>Actual venue: {a.completion.venue}</p>{a.completion.photos.map((url,i)=><a key={url} href={url} target="_blank" rel="noreferrer">Activity photo {i+1} </a>)}</>}</>}
  {comment(item.id)}<div className="tp-actions"><button className="tp-btn" disabled={busy} onClick={()=>decide(item.target,item.id,'approved')}>{item.approveLabel}</button><button className="tp-btn tp-btn-ghost" disabled={busy} onClick={()=>decide(item.target,item.id,'returned')}>Return for amendment</button>{item.target==='access' && <button className="tp-btn tp-btn-ghost" disabled={busy} onClick={()=>decide(item.target,item.id,'rejected')}>Reject access</button>}</div></li>;
 })}</ul>
 <h2>Publication and archive</h2>
 {state.activities.filter(a=>['approved','published','verified'].includes(a.status)).map(a=><section className="tp-card" key={a.id}><h3>{a.title}</h3><p>{a.status}{a.cancelledAt?' - cancelled':''}</p>{comment(a.id)}<div className="tp-actions">
 {a.status==='approved' && !a.cancelledAt && <button className="tp-btn" disabled={busy} onClick={()=>decide('activity',a.id,'published')}>Publish</button>}
 {a.status==='published' && <button className="tp-btn tp-btn-ghost" disabled={busy} onClick={()=>decide('activity',a.id,'unpublished')}>Unpublish</button>}
 {['approved','published'].includes(a.status) && !a.cancelledAt && <button className="tp-btn tp-btn-ghost" disabled={busy} onClick={()=>decide('activity',a.id,'cancelled')}>Cancel activity</button>}
 {(a.status==='verified' || a.cancelledAt) && <button className="tp-btn" disabled={busy} onClick={()=>decide('activity',a.id,'archived')}>Archive</button>}
 </div></section>)}
 <h2>Access request history</h2><ul className="tp-cards">{state.accessRequests.filter(r=>r.status!=='submitted').map(r=><li className="tp-card" key={r.id}>{r.name} | {r.status}<p>{r.adminComment}</p></li>)}</ul>
 <h2>Status history and audit</h2><label className="tp-field">Filter history<input value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="tp-table-wrap"><table className="tp-table"><thead><tr><th>When</th><th>Record</th><th>Decision / change</th><th>By</th><th>Comment</th><th>Changes</th></tr></thead><tbody>{state.history.filter(h=>JSON.stringify(h).toLowerCase().includes(search.toLowerCase())).map(h=><tr key={h.id}><td>{new Date(h.at).toLocaleString('en-MY')}</td><td>{h.entity}: {h.entityLabel}</td><td>{h.decision}</td><td>{h.by}</td><td>{h.comment}</td><td>{(h.before_data || h.after_data) && <details><summary>View changes</summary><pre>{JSON.stringify({before:h.before_data,after:h.after_data},null,2)}</pre></details>}</td></tr>)}</tbody></table></div></>;
}
