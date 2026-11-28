const zone='Asia/Kuala_Lumpur';
function date(value){
 if(!value)return null;
 const result=new Date(value);
 return Number.isNaN(result.getTime())?null:result;
}
export function eventDate(value){
 return date(value)?.toLocaleDateString('en-GB',{timeZone:zone,day:'numeric',month:'long',year:'numeric'})||'Date to be confirmed';
}
export function eventTime(value){
 return date(value)?.toLocaleTimeString('en-GB',{timeZone:zone,hour:'numeric',minute:'2-digit',hour12:true})||'Time to be confirmed';
}
export function eventDateTime(value){
 return date(value)?eventDate(value)+', '+eventTime(value):'Date and time to be confirmed';
}
export function eventTimeRange(start,end,plannedHours){
 const s=date(start);
 if(!s)return 'Time to be confirmed';
 const finish=end?date(end):Number(plannedHours)>0?new Date(s.getTime()+Number(plannedHours)*3600000):null;
 const from=eventTime(start);
 if(!finish||finish<=s)return from;
 const to=finish.toLocaleTimeString('en-GB',{timeZone:zone,hour:'numeric',minute:'2-digit',hour12:true});
 return from+' – '+to;
}
