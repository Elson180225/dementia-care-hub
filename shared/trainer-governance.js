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
export function profileSnapshot(p,name){return {name,city:p.city,language:p.language,short_profile:p.short_profile,qualifications:p.qualifications,experience:p.experience,photo_url:p.photo_url,contact_email:p.contact_email||'',contact_phone:p.contact_phone||''};}
export function individualHours(trainers,values){
 if(!values||typeof values!=='object'||Array.isArray(values))throw Error('Record actual contribution hours for each assigned trainer.');
 const ids=new Set(trainers.map(t=>t.trainer_id||t.trainerId));
 if(Object.keys(values).some(id=>!ids.has(id)))throw Error('Hours include an unassigned trainer.');
 return trainers.map(t=>{const id=t.trainer_id||t.trainerId,v=values[id];if(v===''||v==null||!Number.isFinite(Number(v))||Number(v)<0||Number(v)>99999)throw Error('Enter valid individual hours for every assigned trainer.');return {id,hours:Number(v)};});
}
export function publicTrainer(row){
 return {...row,category:row.healthcare_professional?'hcp':'non-hcp',role:'RCBC-verified training record',institution:'RCBC',bio:row.short_profile||'',initials:row.name.trim().split(/\s+/).map(n=>n[0]).slice(0,2).join('').toUpperCase(),photo:row.photo_url||''};
}

