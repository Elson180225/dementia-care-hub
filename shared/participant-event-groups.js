export function participantEventGroup(event,programmes){
 return programmes.some(p=>p.id===event?.programme_id)?event.programme_id:'other';
}
export function eventsForGroup(events,programmes,group){
 return events.filter(e=>participantEventGroup(e,programmes)===group);
}
