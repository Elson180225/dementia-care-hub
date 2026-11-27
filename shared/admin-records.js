import { groupTypes, serviceCategories } from './directory.js';

// Whitelisted fields shared by the management forms and SQL writer.
const review = [
 ['source','Source / verification reference','text'],['source_url','Source URL','url'],
 ['language','Language','text'],['last_reviewed_at','Last reviewed','datetime-local'],
 ['next_review_at','Next review','datetime-local'],
 ['review_status','Review status',['needs review','current','archived']],
 ['publication_status','Visibility',['unpublished','published']],['admin_comment','Admin comment','textarea'],
];
export const recordTypes = {
 organisations:{label:'Organisations',table:'organisations',title:'name',fields:[
 ['is_example','Example only (not a real service)','checkbox'],['name','Organisation / facility name','text',true],['category','Organisation type','text',true],
 ['address','Address','textarea'],['city','City','text'],['state','State','text'],['postcode','Postcode','text'],
 ['contact_name','Contact person','text'],['phone','Phone','text'],['email','Email','email'],['website','Website','url'],...review]},
 directory_services:{label:'Service listings',table:'directory_services',title:'service_type',fields:[
 ['organisation_id','Organisation','organisation',true],['category','Service category',serviceCategories],
 ['service_type','Type of support / service name','text',true],['description','Service description','textarea'],
 ['group_type','Group type',['',...groupTypes]],
 ['address','Service address','textarea'],['city','Service city','text'],['state','Service state','text'],['postcode','Service postcode','text'],
 ['languages','Service languages (one per line)','array'],['opening_hours','Opening hours','text'],['eligibility','Eligibility','textarea'],['fees','Fees','text'],
 ['accepting_volunteers','Accepting volunteers','checkbox'],['volunteer_details','Volunteer details','textarea'],...review]},
 learning_resources:{label:'Learning resources',table:'learning_resources',title:'title',fields:[
 ['title','Title','text',true],['resource_type','Resource type',['Guide','Recording','Video','Q&A','Slides','Other']],['activity_id','Related activity ID (optional)','text'],
 ['topic','Topic','text'],['audience','Audience','text'],['description','Description','textarea'],['url','Resource URL','url'],['copyright_permission','Copyright / permission evidence','textarea'],...review]},
 faqs:{label:'FAQs',table:'faqs',title:'question',fields:[['slug','Stable slug','text',true],['question','Question','text',true],['answer','Answer','textarea',true],['category','Category','text'],...review]},
 content_pages:{label:'Website content',table:'content_pages',title:'title',fields:[['slug','Page slug','text',true],['title','Title','text',true],['body','Content (plain text)','textarea',true],['reviewer','Reviewer','text'],...review]},
 subscribers:{label:'Subscribers',table:'subscribers',title:'name',fields:[['name','Name','text',true],['email','Email','email',true],['country','Country','text'],['state','State / Province / Region','text',true],['city','City / Town','text',true],['consent_version','Consent notice / evidence','text',true],['consent_at','Opt-in consent date','datetime-local',true],['confirmed_at','Confirmed date','datetime-local'],['unsubscribed_at','Unsubscribed date','datetime-local'],['provider_reference','Email platform reference','text']]},
 dcs_certificates:{label:'DCS certificates',table:'dcs_certificates',title:'certificate_ref',fields:[['certificate_ref','Certificate reference','text',true],['recipient_name','Recipient name','text',true],['programme','Programme',['DCS-Family','DCS-TTT','DCS-Worker']],['issuer','Issuer','text',true],['issued_at','Issue date','date',true],['completion_date','Completion date','date'],['training_location','Training location','text'],['activity_id','Related activity ID','text'],['status','Validity',['valid','revoked']],['verification_consent_at','Consent for public verification','datetime-local'],['admin_comment','Admin comment','textarea']]},
 enquiries:{label:'Enquiries',table:'enquiries',title:'name',readonlyCreate:true,fields:[['status','Follow-up status',['new','follow-up','closed']],['admin_comment','Follow-up note','textarea']]},
};
