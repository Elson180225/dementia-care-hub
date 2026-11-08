import {useEffect,useRef,useState} from 'react';
import UploadField from '../../../trainer-portal/UploadField';
import './ContentPreviewEditor.css';

const configurations={
 roadmap:{name:'Roadmap edition',sections:[['overview','Overview',[['editionLabel','Edition label',true],['title','Roadmap title',true],['theme','Theme'],['period','Period covered'],['intro','Introduction',false,'textarea']]],['milestones','Activities & milestones',[]],['image','Calendar poster',[]]]},
 story:{name:'Community story',sections:[['content','Story details',[['title','Story title',true],['subtitle','Image viewer subtitle'],['date','Date or period',true],['location','Location'],['description','Story summary',false,'textarea']]],['image','Photo & preview',[]]]},
 pillar:{name:'Dialogue pillar',sections:[['content','Pillar content',[['title','Pillar title',true],['desc','Description',true,'textarea'],['icon','Symbol / emoji']]]]},
 article:{name:'Press article',sections:[['content','Article details',[['outlet','Newspaper / publisher',true],['mainTitle','Headline',true],['intro','Summary',false,'textarea']]],['presentation','Display details',[['langPill','Language'],['subtitle','Image viewer subtitle'],['category','Category'],['date','Publication date or description']]],['image','Newspaper clipping',[]]]},
 trainer:{name:'Trainer / governance profile',sections:[['profile','Profile details',[['name','Full name',true],['role','Designation / specialty',true],['institution','Hospital / institution',true],['city','City']]],['background','Background',[['language','Languages'],['bio','Biography / experience',false,'textarea']]],['presentation','Public presentation',[['category','Directory category',false,'category'],['initials','Initials when no photo is available'],['badgeColor','Profile accent colour',false,'color']]],['image','Profile photo',[]]]}
};
const assets=import.meta.glob('../../../assets/**/*.{jpg,jpeg,png,webp}',{eager:true,query:'?url',import:'default'});
function media(value){
 if(!value)return '';
 if(/^https?:\/\//i.test(value)||value.startsWith('/api/files/'))return value;
 const path=value.replace(/^\/src\/assets\//,'');
 const aliases=[['yearly-calendar','1st_Half_Yearly_Activity_Calender'],['dialogue-1','2025_8_16(1)'],['dialogue-2','2025_8_16.'],['sinchew','Malaysia_Sin_Chew'],['seehua','See_Hua_Daily']];
 const alias=aliases.find(([key])=>path.includes(key));
 if(alias)return Object.entries(assets).find(([key])=>key.includes(alias[1]))?.[1]||'';
 return Object.entries(assets).find(([key])=>key.endsWith('/'+path))?.[1] || '';
}

export default function ContentPreviewEditor({kind,editing,onChange,onSave,onClose,errors={}}){
 const config=configurations[kind],v=editing.values;
 const [section,setSection]=useState(config.sections[0][0]),[busy,setBusy]=useState(false),[feedback,setFeedback]=useState(''),[localErrors,setLocalErrors]=useState({});
 const [uploading,setUploading]=useState(false);
 const [initial]=useState(()=>JSON.stringify(editing));const titleRef=useRef(null);const dirty=initial!==JSON.stringify(editing);
 useEffect(()=>{titleRef.current?.focus();},[]);
 useEffect(()=>{if(!dirty)return;const warn=e=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 const update=(key,value)=>{const values={...v,[key]:value};if(kind==='trainer'&&key==='name'&&(!v.initials||editing.isNew))values.initials=value.trim().split(/\s+/).map(n=>n[0]).slice(0,2).join('').toUpperCase();onChange({...editing,values});setFeedback('');};
 const imageKey=kind==='trainer'?'avatarUrl':'image';const image=media(v[imageKey]||v.poster);
 function close(){if(uploading)return;if(!dirty||window.confirm('Discard your unsaved changes?'))onClose();}
 async function save(){
   if(uploading)return;
   const found={};let target='';
   for(const [id,,fields] of config.sections)for(const [key,label,required] of fields)if(required&&!String(v[key]||'').trim()){found[key]=label+' is required.';target ||= id;}
   if(kind==='roadmap')for(const [i,h] of (v.highlights||[]).entries())if(!h.title?.trim()){found['milestone-'+i]='Enter a milestone title.';target='milestones';}
   if(Object.keys(found).length){setLocalErrors(found);setSection(target);setFeedback('Please complete the highlighted fields.');return;}
   setLocalErrors({});setBusy(true);setFeedback('');
   try{const ok=await onSave();if(ok!==true)setFeedback('Could not save. Check the message above. Your edits are still here.');}catch(e){setFeedback(e.message||'Could not save. Please try again.');}finally{setBusy(false);}
 }
 function field([key,label,required,type],values=v,change=update,prefix='content'){
   const error=localErrors[key]||errors[key],id=prefix+'-'+key;
   return <div className="tp-field" key={key}><label htmlFor={id}>{label}{required?' (required)':''}</label>{type==='textarea'?<textarea id={id} rows={4} value={values[key]||''} onChange={e=>change(key,e.target.value)} aria-invalid={!!error} aria-describedby={error?id+'-error':undefined}/>:type==='category'?<select id={id} value={values[key]||'medical-professional'} onChange={e=>change(key,e.target.value)}><option value="medical-professional">Clinical Frontline — doctors & educators</option><option value="advisory-support">Clinical Governance — advisory specialists</option></select>:<input id={id} type={type==='color'?'color':'text'} value={values[key]||(type==='color'?'#0d716b':'')} onChange={e=>change(key,e.target.value)} aria-invalid={!!error} aria-describedby={error?id+'-error':undefined}/>} {error&&<small id={id+'-error'} className="tp-error">{error}</small>}</div>;
 }
 const highlights=v.highlights||[];
 function milestone(index,key,value){update('highlights',highlights.map((h,i)=>i===index?{...h,[key]:value}:h));}
 function move(index,offset){const next=[...highlights];[next[index],next[index+offset]]=[next[index+offset],next[index]];update('highlights',next.map((h,i)=>({...h,num:String(i+1).padStart(2,'0')})));}
 return <section className="cp-editor"><header><div><span className="cp-eyebrow">LEARN & EVENTS · CONTENT EDITOR</span><h2 tabIndex={-1} ref={titleRef}>{editing.isNew?'Create':'Edit'} {config.name.toLowerCase()}</h2><p>Edit one section at a time. Your preview updates as you type.</p></div><button className="tp-btn tp-btn-ghost" disabled={busy||uploading} onClick={close}>← Back to list</button></header>
 {kind==='trainer'&&<p className="cp-note">This editor changes the public directory profile only. Account access and certification approval are managed separately under Users and access.</p>}
 <fieldset disabled={busy||uploading}><legend className="tp-sr">{config.name} editor</legend><nav aria-label={config.name+' editing sections'}>{config.sections.map(([id,label])=><button key={id} type="button" aria-current={section===id?'page':undefined} onClick={()=>setSection(id)}>{label}</button>)}</nav>
 <div className="cp-columns"><div className="cp-form"><h3>{config.sections.find(s=>s[0]===section)[1]}</h3>{config.sections.find(s=>s[0]===section)[2].map(f=>field(f))}
 {section==='image'&&<><p className="cp-help">Choose a clear image. Saving publishes this image with the record. Preview only: clicking here will not open the public viewer.</p><UploadField onBusyChange={setUploading} kind={kind==='trainer'?'photo':'poster'} label={kind==='trainer'?'Profile photo':kind==='article'?'Newspaper clipping':'Poster / photo'} value={v[imageKey]||v.poster} onChange={url=>{if(kind==='roadmap')onChange({...editing,values:{...v,image:url,poster:url}});else update(imageKey,url);}}/>{v[imageKey]&&<button type="button" className="tp-btn tp-btn-ghost" onClick={()=>{if(kind==='roadmap')onChange({...editing,values:{...v,image:'',poster:''}});else update(imageKey,'');}}>Remove selected image</button>}</>}
 {kind==='article'&&section==='presentation'&&<p className="cp-help">The public card opens the newspaper image in a viewer. It does not link to an external article.</p>}
 {section==='milestones'&&<><p className="cp-help">Milestones appear in this order. Use Move up / Move down to change the sequence.</p>{highlights.map((h,i)=><section key={i} className="cp-milestone"><h4>Milestone {i+1}</h4>{[['phase','Phase / period'],['title','Activity title',true],['desc','Description',false,'textarea'],['tag','Short category label']].map(f=>field(f,h,(key,val)=>milestone(i,key,val),'milestone-'+i))}{localErrors['milestone-'+i]&&<p role="alert" className="tp-error">{localErrors['milestone-'+i]}</p>}<div className="tp-actions"><button type="button" className="tp-btn tp-btn-ghost" disabled={i===0} onClick={()=>move(i,-1)}>Move up</button><button type="button" className="tp-btn tp-btn-ghost" disabled={i===highlights.length-1} onClick={()=>move(i,1)}>Move down</button><button type="button" className="tp-btn tp-btn-ghost" onClick={()=>update('highlights',highlights.filter((_,n)=>n!==i).map((item,n)=>({...item,num:String(n+1).padStart(2,'0')})))}>Remove milestone {i+1}</button></div></section>)}{!highlights.length&&<p>No milestones yet.</p>}<button type="button" className="tp-btn" onClick={()=>update('highlights',[...highlights,{num:String(highlights.length+1).padStart(2,'0'),phase:'',title:'',desc:'',tag:'',dotClass:'dot-'+(highlights.length%3+1)}])}>＋ Add milestone</button></>}
 </div><aside className={'cp-preview cp-preview-'+kind} aria-label={config.name+' live preview'}><small>LIVE CONTENT PREVIEW</small>{image?<img key={image} src={image} alt={kind==='trainer'?'Profile photo preview':'Selected content image preview'} onError={e=>{e.currentTarget.hidden=true;}}/>:<div className="cp-no-image">{kind==='trainer'?(v.initials||'Profile photo'):kind==='pillar'?(v.icon||'Symbol'):'No preview image selected'}</div>}
 <span className="cp-preview-label">{kind==='roadmap'?v.editionLabel:kind==='article'?v.outlet:kind==='trainer'?(v.category==='advisory-support'?'Clinical Governance':'Clinical Frontline'):kind==='pillar'?'Community dialogue':v.location}</span>
 <h3>{v.title||v.mainTitle||v.name||'Your title appears here'}</h3>{kind==='trainer'&&<><strong>{v.role}</strong><p>{v.institution}<br/>{v.city} {v.language&&'· '+v.language}</p></>}
 <p>{v.intro||v.description||v.desc||v.bio||'Your description will appear here.'}</p>
 {kind==='roadmap'&&<><strong>{v.theme}</strong><p>{v.period}</p><ol className="cp-timeline">{highlights.map((h,i)=><li key={i}><span>{h.num||i+1} · {h.phase} {h.tag&&'· '+h.tag}</span><h4>{h.title||'Milestone title'}</h4><p>{h.desc}</p></li>)}</ol></>}
 {(kind==='story'||kind==='article')&&<p className="cp-preview-meta">{v.date}{kind==='article'&&v.langPill?' · '+v.langPill:''}</p>}
 <p className="cp-preview-disclaimer">Text and image preview. The public page may use a different layout. No public action is triggered here.</p></aside></div>
 <footer><span role="status">{uploading?'Uploading image…':busy?'Saving…':dirty?'Unsaved changes':'No changes yet'}</span><button type="button" className="tp-btn tp-btn-ghost" onClick={close}>Cancel</button><button type="button" className="tp-btn" onClick={save}>{busy?'Saving…':'Save changes'}</button></footer></fieldset>{feedback&&<p role="alert" className="tp-error">{feedback}</p>}
 </section>;
}
