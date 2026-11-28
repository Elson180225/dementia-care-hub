import {publicLink} from './online-education.js';
export function publicEducationContent(content){
 const online=content.onlineEducation||{};
 return {...content,onlineEducation:{...online,upcomingTopics:(online.upcomingTopics||[]).filter(r=>r.publicationStatus==='approved'),approvedResources:[]},certifiedTrainers:{...content.certifiedTrainers,trainersList:[]}};
}
export function webinarReview(data){
 const result={};
 for(const key of ['source_url','speaker_name','speaker_intro','recording_url','qa_url','qa_text']){
  const value=String(data[key]||'').trim();if(value.length>(key==='qa_text'?10000:3000))throw Error('Please shorten '+key.replaceAll('_',' ')+'.');
  if(['source_url','recording_url','qa_url'].includes(key)&&value&&!publicLink(value))throw Error('Use a valid HTTP or HTTPS link.');
  result[key]=value;
 }
 if(!['pending','approved'].includes(data.content_approval_status))throw Error('Choose Pending review or Approved.');
 if(data.content_approval_status==='approved'&&data.rightsConfirmed!==true)throw Error('Confirm RCBC approval and publication permissions before publishing.');
 return {...result,content_approval_status:data.content_approval_status};
}
