// Only records explicitly identified as testing by the project owner are excluded.
export const excludedProgrammeIds=new Set(['dcs-track-1794038842414']);
export const excludedCmsIds=new Set(['topic-1793265675178','dcs-track-1794038842414','pillar-1794042812642']);
export const excludedEventTitles=new Set(['testing 1','testing 2','dementia care skill','dementia workshop','waka waka ei ei']);
const title=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,' ');
export function isTestingEvent(event){
 return excludedProgrammeIds.has(event.programme_id||event.programmeId)||excludedEventTitles.has(title(event.title));
}
export function deploymentEvent(event){
 return {...event,registration_link:null,registrationLink:null,registrationMethod:'closed'};
}
export function registrationSourceKey(key){
 return key.startsWith('registration/')||/^cms\/(onlineEducation\/upcomingTopics|physicalEducation\/programmes)\/[^/]+\/(registrationLink|registration_link|registrationOpen|registrationMethod|registrationFee|registrationGoogleUrl|paymentInstructions|registrationInstructions|buttonLabel|badge)$/.test(key);
}
export function cleanDeploymentContent(value,path=''){
 if(Array.isArray(value))return value.filter(row=>!excludedCmsIds.has(String(row?.id))).map((row,i)=>cleanDeploymentContent(row,path+'/'+(row?.id??i)));
 if(value&&typeof value==='object'){
  const clean=Object.fromEntries(Object.entries(value).filter(([key])=>key!=='_revision').map(([key,v])=>[key,cleanDeploymentContent(v,path+'/'+key)]));
  if(/^\/(onlineEducation\/upcomingTopics|physicalEducation\/programmes)\/[^/]+$/.test(path)){
   for(const key of ['registrationLink','registration_link','registrationGoogleUrl','registrationFee','paymentInstructions','registrationInstructions'])if(key in clean)clean[key]='';
   clean.registrationOpen=false;
   clean.registrationMethod='closed';
   if(path.startsWith('/physicalEducation/')){clean.badge='Programme information';clean.buttonLabel='View programme details';}
  }
  return clean;
 }
 return value;
}
export function translationImportStatus(row,source,{approver,expert,requiredType}={}){
 if(source===undefined)return 'excluded';
 if(row.source_text!==source)return 'needs-review';
 if(row.status!=='approved')return ['draft','review','needs-review'].includes(row.status)?row.status:'draft';
 if(!row.translated_text?.trim()||row.review_type!==requiredType||!approver||!row.approved_at)return 'review';
 if(requiredType!=='standard'&&(!expert||!row.expert_reviewed_at||row.expert_reviewed_by===row.edited_by))return 'review';
 return 'approved';
}
