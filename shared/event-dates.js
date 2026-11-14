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
