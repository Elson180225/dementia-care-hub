import {useEffect,useState} from 'react';
import {api} from '../../trainer-portal/TrainerContext';
import {participantEventGroup,eventsForGroup} from '../../../shared/participant-event-groups';
import {eventDateTime} from '../../../shared/event-dates';
import {isPlannedProgramme} from '../../../shared/programme-intakes';
import './ParticipantEventPicker.css';

export default function ParticipantEventPicker({events,activityId,groupId,busy,onChoose}){
 const [programmes,setProgrammes]=useState(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;api('/api/admin/learn-events-content').then(c=>{if(active)setProgrammes(c.physicalEducation?.programmes||[]);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
 if(!programmes)return <section className="pm-group-picker">{error?<p role="alert">Unable to load programme groups: {error}. Refresh to try again. Existing registrations are unchanged.</p>:<p role="status">Loading programme groups…</p>}</section>;
 const selectedEvent=events.find(e=>e.id===activityId);
 const group=selectedEvent?participantEventGroup(selectedEvent,programmes):groupId;
 const programme=programmes.find(p=>p.id===group);
 const rows=eventsForGroup(events,programmes,group);
 const label=programme?.code||programme?.title||'Webinars & other / unlinked events';
 return <section className="pm-group-picker" aria-label="Choose a programme and intake">
  <h2>Choose a programme or event</h2>
  <p>Programme tracks organise the sessions below. Participants belong to a dated intake, not the programme overview.</p>
  <div className="pm-programme-grid">{[...programmes,{id:'other',code:'Webinars & other events',title:'Includes existing unlinked activities'}].map(p=><button type="button" disabled={busy} key={p.id} className="pm-programme-button" aria-pressed={group===p.id} onClick={()=>onChoose(p.id,'')}>
   <strong>{p.code||p.title}</strong><span>{p.code?p.title:''}</span><small>{p.id!=='other'&&isPlannedProgramme(p)?'Planned programme · ':''}{eventsForGroup(events,programmes,p.id).length} {p.id==='other'?'events':'intakes'}</small>
  </button>)}</div>
  {group&&<div className="pm-intake-list"><h3>{label}</h3>{!rows.length?<p>No intakes have been linked to this programme yet. Link an existing event or add an intake in Physical Education → Manage intakes.</p>:<><label className="tp-field">{programme?'Choose an intake':'Choose an event'}<select value={activityId} disabled={busy} onChange={e=>onChoose(group,e.target.value)}><option value="">Select a dated {programme?'intake':'event'}</option>{rows.map(e=><option key={e.id} value={e.id}>{e.title} — {eventDateTime(e.starts_at)}{e.cancelled_at?' — Cancelled':''}</option>)}</select></label><div className="pm-intake-options">{rows.map(e=><article key={e.id} className="pm-intake-option"><div><strong>{e.title}</strong><p>{eventDateTime(e.starts_at)} (Malaysia time) · {e.venue||'Venue to be confirmed'}</p><small>{e.cancelled_at?'Cancelled':e.status||'Status unavailable'}</small></div><button type="button" className="tp-btn tp-btn-ghost" disabled={busy} onClick={()=>onChoose(group,e.id)}>Open participants</button></article>)}</div></>}
  </div>}
  {selectedEvent&&<p className="pm-selected-context" role="status"><strong>{label}</strong> → {selectedEvent.title} → {eventDateTime(selectedEvent.starts_at)} (Malaysia time)</p>}
 </section>;
}
