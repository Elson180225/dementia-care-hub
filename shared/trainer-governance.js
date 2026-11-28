export const ASSESSMENTS=['not_assessed','completed','pass','independent','unsuccessful'];
export function teachingPermission(profile,activity){
 if(profile?.archived_at||!profile?.teaching_allowed)return false;
 const scope=activity.programme_id||activity.programmeId||activity.type;
 return (profile.teaching_permissions||[]).some(p=>p.scope===scope&&(!p.modules?.length||p.modules.includes(activity.teaching_module||activity.teachingModule||'')));
}
export function validatePermissions(permissions){
 if(!Array.isArray(permissions)||permissions.length>50)throw Error('Choose up to 50 teaching permissions.');
 const scopes=new Set();
 for(const p of permissions){
  if(!p||typeof p.scope!=='string'||!p.scope.trim()||p.scope.length>100||scopes.has(p.scope))throw Error('Choose distinct teaching programmes.');
  if(!Array.isArray(p.modules)||p.modules.length>100||p.modules.some(m=>typeof m!=='string'||!m.trim()||m.length>300))throw Error('Check permitted module names.');
  scopes.add(p.scope);
 }
 return permissions;
}
export function profileSnapshot(p,name){return {name,city:p.city,language:p.language,short_profile:p.short_profile,qualifications:p.qualifications,experience:p.experience,photo_url:p.photo_url,public_teaching_conditions:p.public_teaching_conditions||'',contact_email:p.contact_email||'',contact_phone:p.contact_phone||''};}
export function individualHours(trainers,values,netHours=Infinity){
 if(!values||typeof values!=='object'||Array.isArray(values))throw Error('Record actual contribution hours for each assigned trainer.');
 const ids=new Set(trainers.map(t=>t.trainer_id||t.trainerId));
 if(Object.keys(values).some(id=>!ids.has(id)))throw Error('Hours include an unassigned trainer.');
 return trainers.map(t=>{const id=t.trainer_id||t.trainerId,v=values[id];if(v===''||v==null||!Number.isFinite(Number(v))||Number(v)<0||Number(v)>99999||Number(v)>netHours)throw Error('Enter valid individual hours for every assigned trainer.');return {id,hours:Number(v)};});
}
export function publicTrainer(row){
 return {...row,category:row.healthcare_professional?'hcp':'non-hcp',role:'RCBC-verified training record',institution:'RCBC',bio:row.short_profile||'',initials:row.name.trim().split(/\s+/).map(n=>n[0]).slice(0,2).join('').toUpperCase(),photo:row.photo_url||''};
}


export function activityTime(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value))throw Error('Choose a valid date and time.');
 const date=new Date(value+'+08:00');
 if(!Number.isFinite(date.getTime())||new Date(date.getTime()+28800000).toISOString().slice(0,16)!==value.slice(0,16))throw Error('Choose a valid date and time.');
 return date;
}
export function activityTiming(start,end,hours){
 const from=activityTime(start),to=activityTime(end),net=Number(hours);
 if(to<=from||!Number.isFinite(net)||net<=0||net>(to-from)/3600000+0.000001)throw Error('Net hours must be positive and cannot exceed start-to-end duration.');
 return {start:from,end:to,hours:net};
}
export function organiserRecord(kind,name){
 if(!['rcbc','joint','independent'].includes(kind))throw Error('Choose RCBC, joint or independent organiser.');
 if(typeof name!=='string'||name.length>300||(kind!=='rcbc'&&!name.trim()))throw Error('Enter the organiser name.');
 return {kind,name:kind==='rcbc'?'RCBC':name.trim()};
}
