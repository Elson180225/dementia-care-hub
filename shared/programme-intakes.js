export const dcsProgrammes = [
 {id:'dcs-family', code:'DCS-Family'},
 {id:'dcs-ttt', code:'DCS-TTT'},
 {id:'dcs-care-worker', code:'DCS-Careworker'},
];
export function dcsProgrammeRecords(programmes) {
 return dcsProgrammes.flatMap(({id}) => {
  const programme = programmes.find(p => p.id === id);
  return programme ? [programme] : [];
 });
}
export function isPlannedProgramme(p) {
 return p.availability ? ['planned','future'].includes(p.availability) : ['dcs-care-worker','dcs-worker'].includes(p.id)||/^DCS[\s-]*(Care[\s-]*)?Worker$/i.test(p.code||'');
}
export function programmeIntakes(events,id,now) {
 const linked=events.filter(e=>e.programme_id===id&&!e.cancelled_at&&Number.isFinite(Date.parse(e.starts_at)));
 return {
 upcoming:linked.filter(e=>e.status==='published'&&Date.parse(e.starts_at)>now).sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at)),
 past:linked.filter(e=>['published','completed','verified','archived'].includes(e.status)&&Date.parse(e.starts_at)<=now).sort((a,b)=>Date.parse(b.starts_at)-Date.parse(a.starts_at))
 };
}

export function programmeLink(programme) {
 return '/learn-events/physical-education?programme='+encodeURIComponent(programme.id);
}
// Publication alone does not establish RCBC approval.
export function hasApprovedProgrammeIntake(events,id,now=Date.now()) {
 return events.some(e=>e.programme_id===id&&!e.cancelled_at&&e.status==='published'&&Date.parse(e.starts_at)>now&&(e.content_approval_status==='approved'||e.approval_status==='approved'||Number.isFinite(Date.parse(e.approved_at))));
}
export function canActivateProgramme(previous,next,events,now) {
 return !isPlannedProgramme(previous)||isPlannedProgramme(next)||hasApprovedProgrammeIntake(events,next.id,now);
}
