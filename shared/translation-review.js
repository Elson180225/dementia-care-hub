import { inlineCopyMeta } from './inline-copy-metadata.js';
export const reviewLanguages=['ms','zh'];
const excluded=new Set(['id','slug','code','trackNumber','language','languages','mode','status','availability','registrationMethod','registrationType','type','date','time','dateISO','year','month','day','city','phone','email','postcode','state','category','resource_type','certificate_ref','webinarQuery']);
function isDisplayLabel(prefix,key){
 const uiLabel=prefix.startsWith('ui/')&&prefix.split('/').length===3
  || /^ui\/welcomeGuide\/questions\/(language|city)$/.test(prefix)
  || /^ui\/learnEvents\/(activityModal|programModal|stageSpecs)\//.test(prefix);
 const descriptiveProgramme=prefix.startsWith('cms/physicalEducation/programmes/')
  && ['mode','language','status'].includes(key);
 return descriptiveProgramme||uiLabel&&['email','phone','city','state','category','language','mode','status','type'].includes(key);
}
export function sourceLeaves(value,prefix='ui',result={}){
 if(typeof value==='string'){
  const key=prefix.split('/').at(-1);
  // Explicitly catalogued UI labels (e.g. "Event poster") are readable text,
  // even when their stable name ends with "poster" or "image". Other source
  // fields still obey the existing URL, media and identifier exclusions.
  const fixedLabel = prefix.startsWith('ui/inlineCopy/') && Boolean(inlineCopyMeta(decodeURIComponent(key)));
  if(value.trim()&&(fixedLabel||(!excluded.has(key)||isDisplayLabel(prefix,key))&&!/(url|image|poster|path|href|src)$/i.test(key)&&!/(At|_at|Id|_id)$/.test(key))&&!/^https?:|^\/|^#|^mailto:|^tel:|^data:|^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))result[prefix]=value;
 }else if(Array.isArray(value)){
  value.forEach((v,i)=>sourceLeaves(v,prefix+'/'+encodeURIComponent(v?.id??i),result));
 }else if(value&&typeof value==='object'){
  for(const [key,v]of Object.entries(value))sourceLeaves(v,prefix+'/'+encodeURIComponent(key),result);
 }
 return result;
}
export function translateTree(value,prefix,approved={}){
 if(typeof value==='string'){const row=approved[prefix];return row?.source===value?row.text:value;}
 if(Array.isArray(value))return value.map((v,i)=>translateTree(v,prefix+'/'+encodeURIComponent(v?.id??i),approved));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,translateTree(v,prefix+'/'+encodeURIComponent(k),approved)]));
 return value;
}
export function reviewStatus(row,source){
 if(!row)return 'missing';
 if(row.source_text!==source)return 'needs-review';
 return row.status;
}
export function defaultReviewType(key){
 if(key.startsWith('ui/inlineCopy/')) return inlineCopyMeta(decodeURIComponent(key.slice('ui/inlineCopy/'.length)))?.reviewType || 'standard';
 return /^ui\/(header|footer|common)\//.test(key)?'standard':'medical';
}
export function reviewTransition(row,source,action,actor){
 if(row.source_text!==source)throw Error('The English source changed. Reload and save a revised draft.');
 if(action==='submit'){
  if(row.status!=='draft')throw Error('Save a draft before submitting for review.');
  if(!row.translated_text.trim())throw Error('Enter a translation first.');
  return {...row,status:'review'};
 }
 if(action==='expert-review'){
  if(row.status!=='review')throw Error('Submit this translation for review first.');
  if(row.review_type==='standard'||!actor.scopes.includes(row.review_type))throw Error('A designated expert in this review category is required.');
  if(row.edited_by===actor.id)throw Error('Another designated expert must review a translation you edited.');
  return {...row,expert_reviewed_by:actor.id};
 }
 if(action==='approve'){
  if(!actor.admin)throw Error('RCBC admin approval is required.');
  if(row.status!=='review')throw Error('Submit this translation for review first.');
  if(row.review_type!=='standard'&&!row.expert_reviewed_by)throw Error('Relevant expert review is required before approval.');
  return {...row,status:'approved',approved_by:actor.id};
 }
 if(action==='return'){
  if(!actor.admin&&!actor.scopes.includes(row.review_type))throw Error('Reviewer access required.');
  return {...row,status:'draft',expert_reviewed_by:null,approved_by:null};
 }
 throw Error('Unknown review action.');
}
