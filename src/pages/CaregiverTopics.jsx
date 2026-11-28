import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
const safeUrl = value => /^https?:\/\//i.test(value || '');
export function CaregiverTopics({ mode, slug }) {
  const { t, translateContent } = useLanguage();
  const d = t.caregiverDraft;
  const [activeIndex,setActiveIndex] = useState(0);
  const [raw,setRaw] = useState({pages:[],resources:[]});
  useEffect(()=>{
    const controller=new AbortController();
    const load=async path=>{try {const r=await fetch(path,{signal:controller.signal});const data=r.ok?await r.json():[];return Array.isArray(data)?data:[];}catch{return [];}};
    Promise.all([load('/api/public/content_pages'),load('/api/public/learning_resources')]).then(([pages,resources])=>{if(!controller.signal.aborted)setRaw({pages,resources});});
    return ()=>controller.abort();
  },[]);
  const pages=translateContent(raw.pages,'records/content_pages');
  const resources=translateContent(raw.resources,'records/learning_resources');
  const selfCare=t.caregiverSupport.guidanceTopics?.find(item=>item.id==='self-care');
  const renderRecords = key => pages.filter(r=>r.slug===key).map(r=><div key={r.id} className="caregiver-approved"><p style={{whiteSpace:'pre-line'}}>{r.body?.text}</p>{safeUrl(r.source_url)&&<a href={r.source_url}>{d.references}</a>}{r.last_reviewed_at&&<p>{d.reviewed}: {String(r.last_reviewed_at).slice(0,10)}</p>}</div>);
  if(slug)return <>{renderRecords(slug)}</>;
  const topics=mode==='family'?d.familyTopics:d.wellbeingTopics;
  const descriptions=mode==='family'?d.familyDescriptions:d.wellbeingDescriptions;
  const resourceTitles=mode==='family'?d.familyResources:d.assessmentTopics;
  const family = mode === 'family';
  const symbols = family ? ['⌂','“','◎','♡','▤','✦'] : ['☀','↝','♡','✦','◎','⌂'];
  const selected = topics[activeIndex];
  return <>
    <section className="caregiver-section caregiver-section-soft caregiver-topic-section">
      <div className="caregiver-container">
        <div className="caregiver-section-heading"><p className="caregiver-eyebrow">{d.pathways}</p><h2>{family ? d.family : d.wellbeing}</h2></div>
        <div className="caregiver-guidance-layout caregiver-topic-layout">
          <div className="caregiver-guidance-menu" role="group" aria-label={family ? d.family : d.wellbeing}>
            {topics.map((title,i)=><button key={i} type="button" className={`caregiver-guidance-option${i===activeIndex?' is-active':''}`} aria-pressed={i===activeIndex} aria-controls="caregiver-topic-detail" onClick={()=>setActiveIndex(i)}><span className="caregiver-guidance-symbol" aria-hidden="true">{symbols[i]}</span><span className="caregiver-guidance-option-text"><strong>{title}</strong><small>{descriptions[i]}</small></span><span className="caregiver-guidance-arrow" aria-hidden="true">→</span></button>)}
          </div>
          <article className="caregiver-guidance-detail caregiver-topic-detail" id="caregiver-topic-detail" aria-live="polite">
            <div className="caregiver-topic-marker"><span className="caregiver-detail-label">{String(activeIndex+1).padStart(2,'0')} / {String(topics.length).padStart(2,'0')}</span><span className="caregiver-guidance-symbol" aria-hidden="true">{symbols[activeIndex]}</span></div>
            <h3>{selected}</h3><p className="caregiver-detail-intro">{descriptions[activeIndex]}</p>
            {renderRecords(`caregiver-${mode}-${activeIndex+1}`)}
            {!family&&activeIndex===3&&selfCare&&<ul className="caregiver-check-list">{selfCare.tips.map(tip=><li key={tip}>{tip}</li>)}</ul>}
            {!family&&activeIndex===4&&<a className="caregiver-text-action" href="#caregiver-resources">{d.assessment} <span aria-hidden="true">↓</span></a>}
            <div className="caregiver-topic-detail-footer"><Link className="caregiver-text-action" to="/find-help">{d.professional} <span aria-hidden="true">→</span></Link></div>
          </article>
        </div>
      </div>
    </section>
    <section className="caregiver-section caregiver-resources-section" id="caregiver-resources">
      <div className="caregiver-container caregiver-resources-layout">
        <div className="caregiver-section-heading"><p className="caregiver-eyebrow">{family ? d.family : d.wellbeing}</p><h2>{family?d.resources:d.assessment}</h2>{!family&&<p>{d.assessmentNotice}</p>}</div>
        <div className="caregiver-resource-list">{resourceTitles.map((title,i)=>{
          const matches=resources.filter(r=>raw.resources.find(original=>original.id===r.id)?.topic===`caregiver-${mode}-resource-${i+1}`&&safeUrl(r.url));
          return <article key={i} className="caregiver-resource-row"><span className="caregiver-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><div><h3>{title}</h3>{matches.length?matches.map(r=><p key={r.id}><a href={r.url}>{r.title}</a>{r.description&&<span> — {r.description}</span>}</p>):<p>{d.pending}</p>}</div></article>;
        })}</div>
      </div>
    </section>
  </>;
}
