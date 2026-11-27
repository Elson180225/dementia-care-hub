export const REPORT_SHEETS=['Annual summary','Activities','Trainer contributions','Trainer totals','Geographical Activity Analysis'];
export function reportYear(value){const year=Number(value);if(!/^\d{4}$/.test(String(value))||year<2000||year>2200)throw Error('Choose a reporting year from 2000 to 2200.');return year;}
export function educationReport(records,year,trainerId=null,filters={}){
 year=reportYear(year);
 const activities=records.filter(a=>Number(a.year)===year&&(!filters.location||a.city===filters.location)&&(!filters.type||a.type===filters.type)&&(!filters.organiser||a.organiser_kind===filters.organiser)&&!a.cancelled_at&&!a.postponed_at&&(!trainerId||(a.trainers||[]).some(t=>t.trainerId===trainerId)));
 const verified=activities.filter(a=>a.completion_status==='verified'&&(!trainerId||(a.trainers||[]).some(t=>t.trainerId===trainerId&&t.contributionStatus==='verified')));
 const contributions=activities.flatMap(a=>(a.trainers||[]).filter(t=>!trainerId||t.trainerId===trainerId).map(t=>({...t,activity:a,verified:a.completion_status==='verified'&&t.contributionStatus==='verified'})));
 const counted=contributions.filter(t=>t.verified);
 const totals=new Map();for(const t of counted){const v=totals.get(t.trainerId)||{name:t.name,hours:0,activities:0};v.hours+=Number(t.hours||0);v.activities++;totals.set(t.trainerId,v);}
 const grouped=new Map();for(const a of verified){const key=JSON.stringify([a.city||'Unspecified',a.type,a.organiser_kind]);const v=grouped.get(key)||{location:a.city||'Unspecified',type:a.type,organiser:a.organiser_kind,activities:0,hours:0,participants:0};v.activities++;v.hours+=Number(a.actual_hours||0);v.participants+=Number(a.participants||0);grouped.set(key,v);}
 const breakdown=field=>{const groups=new Map();for(const a of verified){const key=a[field]||'Unspecified',v=groups.get(key)||{activities:0,hours:0,participants:0};v.activities++;v.hours+=Number(a.actual_hours||0);v.participants+=Number(a.participants||0);groups.set(key,v);}return [...groups].map(([key,v])=>[field==='city'?'Location':'Organiser',key,v.activities,v.hours,v.participants]);};
 return [
 {name:REPORT_SHEETS[0],rows:[['Year','Verified activities','Verified individual hours','Project attendance (event totals)','Active distinct trainers','Net activity hours'],[year,verified.length,counted.reduce((n,t)=>n+Number(t.hours||0),0),verified.reduce((n,a)=>n+Number(a.participants||0),0),new Set(counted.filter(t=>Number(t.hours)>0).map(t=>t.trainerId)).size,verified.reduce((n,a)=>n+Number(a.actual_hours||0),0)],[],['Breakdown','Name','Verified activities','Net activity hours','Attendance'],...breakdown('organiser_kind'),...breakdown('city')]},
 {name:REPORT_SHEETS[1],rows:[['Reference','Title','Organiser type','Organiser','Actual start (Malaysia)','Actual end (Malaysia)','Net hours','Completion status'],...activities.map(a=>[a.activity_reference,a.title,a.organiser_kind,a.organiser_name,a.actual_start||'',a.actual_end||'',a.actual_hours||'',a.completion_status])]},
 {name:REPORT_SHEETS[2],rows:[['Reference','Trainer','Topic','Role','Individual hours','Confirmation / review','Counts in total'],...contributions.map(t=>[t.activity.activity_reference,t.name,t.topic,t.role,t.hours??'',t.contributionStatus,t.verified?'Yes':'No'])]},
 {name:REPORT_SHEETS[3],rows:[['Trainer ID','Trainer','Verified activities','Verified hours'],...[...totals].map(([id,t])=>[id,t.name,t.activities,t.hours])]},
 {name:REPORT_SHEETS[4],rows:[['Location','Activity type','Organiser type','Verified activities','Net activity hours','Participants (once per event)'],...[...grouped.values()].map(v=>[v.location,v.type,v.organiser,v.activities,v.hours,v.participants])]}
 ];
}
