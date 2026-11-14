export function isPlannedProgramme(p) {
 return p.availability ? p.availability==='planned' : p.id==='dcs-care-worker';
}
export function programmeIntakes(events,id,now) {
 const linked=events.filter(e=>e.programme_id===id&&!e.cancelled_at&&Number.isFinite(Date.parse(e.starts_at)));
 return {
 upcoming:linked.filter(e=>e.status==='published'&&Date.parse(e.starts_at)>now).sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at)),
 past:linked.filter(e=>['published','completed','verified','archived'].includes(e.status)&&Date.parse(e.starts_at)<=now).sort((a,b)=>Date.parse(b.starts_at)-Date.parse(a.starts_at))
 };
}
