import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import EventPriceLabel from './EventPriceLabel';
import {eventDate,eventTime,eventDateTime} from '../../shared/event-dates';
import './ProgrammeIntakes.css';
import {programmeIntakes,isPlannedProgramme} from '../../shared/programme-intakes';
import {useLanguage} from '../i18n/LanguageContext';
export default function ProgrammeIntakes({programme,onSelect}){
 const {translateContent}=useLanguage();
 const [events,setEvents]=useState(null),[error,setError]=useState(''),[now,setNow]=useState(()=>Date.now());
 useEffect(()=>{let active=true;const refresh=()=>fetch('/api/activities',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Unable to load intakes.');return r.json();}).then(rows=>{if(!Array.isArray(rows))throw Error('Unable to load intakes.');if(active){setEvents(rows);setNow(Date.now());setError('');}}).catch(e=>{if(active)setError(e.message);});refresh();window.addEventListener('focus',refresh);return()=>{active=false;window.removeEventListener('focus',refresh);};},[]);
 const {upcoming,past}=programmeIntakes(translateContent(events||[],'activities'),programme.id,now);
 const select=e=>onSelect({...e,rawDate:e.starts_at,status:Date.parse(e.starts_at)<=now?'completed':'upcoming',date:eventDate(e.starts_at),time:eventTime(e.starts_at),registrationLink:e.registration_link,registrationDeadline:e.registration_deadline,registrationDeadlineFormatted:e.registration_deadline?eventDateTime(e.registration_deadline)+' (Malaysia time)':'',location:[e.venue,e.city].filter(Boolean).join(', '),poster:e.poster_url});
 const cards=(rows,history=false)=><ul className="programme-intake-grid">{rows.map(e=><li key={e.id} className="tp-card"><h4>{e.title}</h4><p>{eventDateTime(e.starts_at)} (Malaysia time)<br/>{e.venue} {e.city}<br/>{e.language}</p><EventPriceLabel event={e}/>{!history&&<p>{!e.registration_settings?.enabled?'Registration closed':e.registration_deadline&&Date.parse(e.registration_deadline)<=now?'Registration deadline passed':'View details for registration and payment instructions.'}</p>}<button type="button" className="tp-btn" onClick={()=>select(e)}>{history?'View past intake':'View intake details'}</button></li>)}</ul>;
 return <section id="programme-intakes" className="programme-intakes" aria-label={'Intakes for '+programme.title}>
 {programme.id==='dcs-family'&&<p className="tp-note">DCS-Family provides family caregiver education, not professional caregiver certification.</p>}
 {programme.id==='dcs-ttt'&&<p className="tp-note">Registering for DCS-TTT does not establish trainer qualification. Trainer Portal access and public listing require separate RCBC verification and approvals.</p>}
 <h3>{isPlannedProgramme(programme)?'Planned programme':'Upcoming intakes'} — {programme.code||programme.title}</h3>
 {isPlannedProgramme(programme)?<p>This programme is planned. <Link to="/about/contact">Contact RCBC</Link> for availability enquiries.</p>:error?<p role="alert">{error} Please <Link to="/about/contact">contact RCBC</Link>.</p>:!events?<p role="status">Loading intakes…</p>:upcoming.length?cards(upcoming):<p>No intake is currently scheduled. <Link to="/about/contact">Contact RCBC</Link> to enquire about future dates.</p>}
 {!!past.length&&<details><summary>Past intakes ({past.length})</summary><p>Completed sessions remain available as activity records. Registration has closed.</p>{cards(past,true)}</details>}
 </section>;
}
