import Trans from "../i18n/Trans";
import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import EventPriceLabel from './EventPriceLabel';
import {eventDateTime} from '../../shared/event-dates';
import './ProgrammeIntakes.css';
import {programmeIntakes,isPlannedProgramme} from '../../shared/programme-intakes';
import {useLanguage} from '../i18n/LanguageContext';
export default function ProgrammeIntakes({programme}){
 const {translateContent,t}=useLanguage();
 const copy=t.learnEvents.intakeLabels;
 const [events,setEvents]=useState(null),[error,setError]=useState(''),[now,setNow]=useState(()=>Date.now());
 useEffect(()=>{let active=true;const refresh=()=>fetch('/api/activities',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Unable to load intakes.');return r.json();}).then(rows=>{if(!Array.isArray(rows))throw Error('Unable to load intakes.');if(active){setEvents(rows);setNow(Date.now());setError('');}}).catch(e=>{if(active)setError(e.message);});refresh();window.addEventListener('focus',refresh);return()=>{active=false;window.removeEventListener('focus',refresh);};},[]);
 const {upcoming,past}=programmeIntakes(translateContent(events||[],'activities'),programme.id,now);
 const cards=(rows,history=false)=><ul className="programme-intake-grid">{rows.map(e=><li key={e.id} className="tp-card"><h4>{e.title}</h4><p>{eventDateTime(e.starts_at)} ({copy.malaysiaTime})<br/>{e.venue} {e.city}<br/>{e.language}</p><EventPriceLabel event={e}/>{!history&&<p>{!e.registration_settings?.enabled?copy.closed:e.registration_deadline&&Date.parse(e.registration_deadline)<=now?copy.deadline:copy.details}</p>}<Link className="tp-btn" to={"/learn-events/event/"+e.id}>{history?copy.viewPast:copy.view}</Link></li>)}</ul>;
 return <section id="programme-intakes" className="programme-intakes" aria-label={'Intakes for '+programme.title}>
 <h3>{isPlannedProgramme(programme)?copy.planned:copy.upcoming} — {programme.code||programme.title}</h3>
 {isPlannedProgramme(programme)?<p>{copy.plannedNotice} <Link to="/about/contact">{copy.contact}</Link> {copy.enquiries}</p>:error?<p role="alert">{error}<Trans id="please"> Please </Trans><Link to="/about/contact">{copy.contact}</Link>.</p>:!events?<p role="status">{copy.loading}</p>:upcoming.length?cards(upcoming):<p>{copy.none} <Link to="/about/contact">{copy.contact}</Link> {copy.future}</p>}
 {!!past.length&&<details><summary>{copy.past} ({past.length})</summary><p>{copy.pastNotice}</p>{cards(past,true)}</details>}
 </section>;
}
