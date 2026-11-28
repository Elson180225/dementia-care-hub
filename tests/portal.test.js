import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { digest, hashPassword, checkPassword } from '../server/auth.js';
import { recordTypes } from '../shared/admin-records.js';
import { unsubscribeToken } from '../server/subscriber-tokens.js';

test('passwords use salted hashes',()=>{
 const a=hashPassword('a long test password');
 assert.notEqual(a,hashPassword('a long test password'));
 assert.ok(checkPassword('a long test password',a));
 assert.ok(!checkPassword('wrong',a));
});

test('PostgreSQL portal and administrative workflows',{skip:!process.env.TEST_DATABASE_URL},async()=>{
 const root=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});
 const schema='test_'+randomUUID().replaceAll('-','');await root.query(`CREATE SCHEMA ${schema}`);
 const connection=new URL(process.env.TEST_DATABASE_URL);connection.searchParams.set('options',`-c search_path=${schema},public`);
 const db=new pg.Pool({connectionString:connection.toString()});let server;
 try {
  for(const name of ['001_shared_records.sql','003_admin_auth.sql','004_record_details.sql','005_admin_workflow.sql','006_portal_operations.sql','007_content_feedback.sql','008_idle_sessions.sql','014_enquiry_notifications.sql','015_trainer_listing_approval.sql','016_trainer_certificate_evidence.sql','017_trainer_details_and_resource_examples.sql','018_trainer_assessment_status.sql','012_participants.sql','015_event_registration.sql','016_registration_setup.sql','017_participant_history.sql','019_programme_intakes.sql','022_password_reset.sql','023_trainer_governance.sql','024_trainer_archive.sql','025_persistent_learn_events.sql','026_review_reminder_deliveries.sql','027_event_attendance_reminders.sql','028_subscriber_country.sql','029_directory_service_listings.sql','030_contact_settings.sql','031_volunteer_resource_pool.sql','031_admin_mfa.sql','028_dcs_registry.sql','029_activity_records.sql','030_webinar_publication.sql','031_participant_attendance.sql','032_learning_resource_master.sql','033_trainer_training_and_portal_preferences.sql','034_learning_qa_and_webinar_times.sql']) await db.query(await readFile(new URL('../database/'+name,import.meta.url),'utf8'));
  server=spawn(process.execPath,['server/index.js'],{env:{...process.env,DATABASE_URL:connection.toString(),SUBSCRIBER_DATABASE_URL:'',SUBSCRIBER_TOKEN_SECRET:'test-secret-'.repeat(5),REMINDERS_ENABLED:'false',BREVO_API_KEY:'',ADMIN_MFA:'off',PASSWORD_BREACH_CHECK:'off',API_PORT:'3098'},stdio:['ignore','pipe','pipe']});
  let serverErrors='';server.stderr.on('data',d=>{serverErrors+=d;});
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',()=>reject(new Error('Test API exited: '+serverErrors)));});
  async function request(path,data,cookie='',method) {
   const r=await fetch('http://127.0.0.1:3098/api/'+path,{headers:{'Content-Type':'application/json',cookie},...(data?{method:method || 'POST',body:JSON.stringify(data)}:{})});
   return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
  }
  function ok(result,status=200){assert.equal(result.status,status,JSON.stringify(result.data));return result;}
  const credentials={name:'Test Trainer',email:'trainer@test.example',password:'a sufficiently long password',city:'Bintulu',certificateRef:'CLAIM-1'};
  const certificateEvidence={name:'certificate.png',data:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII='};
  ok(await request('auth/register',{...credentials,certificateEvidence}),201);ok(await request('auth/register',credentials),409);
  ok(await request('auth/login',credentials),403);
  ok(await request('auth/admin-register',{...credentials,email:'admin@test.example'}),403);
  await db.query('INSERT INTO admin_invitations(token_hash,email) VALUES($1,$2)',[digest('test-invite'),'admin@test.example']);
  const adminData={...credentials,email:'admin@test.example',invitation:'test-invite'};
  ok(await request('auth/admin-register',adminData),201);ok(await request('auth/admin-register',adminData),403);
  const admin=ok(await request('auth/login',{...adminData,role:'admin'}));
  const action=(data,cookie=admin.cookie)=>request('portal/actions',data,cookie);
  const pending=ok(await request('auth/application',credentials)).data.application;
  assert.equal(pending.has_certificate_evidence,true);
  const pendingSnapshot=ok(await request('portal',null,admin.cookie)).data;
  const evidenceId=pendingSnapshot.accessRequests.find(r=>r.id===pending.id).certificate_file_id;
  assert.ok(evidenceId);
  assert.equal((await fetch('http://127.0.0.1:3098/api/files/'+evidenceId)).status,403);
  const adminEvidence=await fetch('http://127.0.0.1:3098/api/files/'+evidenceId,{headers:{cookie:admin.cookie}});
  assert.equal(adminEvidence.status,200);assert.equal(adminEvidence.headers.get('content-type'),'image/png');

  ok(await action({type:'ADMIN_REVIEW',target:'access',id:pending.id,decision:'returned',comment:'Confirm the reference'}));
  assert.equal(ok(await request('auth/application',credentials)).data.application.status,'returned');
  ok(await request('auth/resubmit',{...credentials,certificateRef:'CLAIM-CORRECTED',certificateEvidence:{name:'amended.pdf',data:Buffer.from('%PDF-1.4 amended').toString('base64')}}));
  const amended=ok(await request('portal',null,admin.cookie)).data.accessRequests.find(r=>r.id===pending.id);
  assert.notEqual(amended.certificate_file_id,evidenceId);

  ok(await action({type:'ADMIN_REVIEW',target:'access',id:pending.id,decision:'approved',certificateRef:'OFFICIAL-1'}));
  const trainer=ok(await request('auth/login',{...credentials,role:'trainer'}));const trainerId=trainer.data.user.id;
  ok(await request('portal'),401);ok(await request('admin/records/faqs',null,trainer.cookie),403);
  ok(await action({type:'ADMIN_REVIEW',target:'access',id:pending.id,decision:'rejected',comment:'test'},trainer.cookie),403);
  const trainerSnapshot=ok(await request('portal',null,trainer.cookie)).data;
  assert.equal(trainerSnapshot.profile.certificateEvidenceUrl,'/api/files/'+amended.certificate_file_id);
  assert.equal((await fetch('http://127.0.0.1:3098'+trainerSnapshot.profile.certificateEvidenceUrl,{headers:{cookie:trainer.cookie}})).status,200);
  const profile={city:'Bintulu',language:'English',shortProfile:'Test profile',qualifications:'Test qualification',experience:'Test experience'};
  ok(await action({type:'PROFILE_SAVE',values:profile},trainer.cookie));
  async function upload(kind,data,cookie=trainer.cookie) {
   const r=await fetch('http://127.0.0.1:3098/api/uploads?kind='+kind,{method:'POST',headers:{cookie,'X-File-Name':'test-file'},body:data});return {status:r.status,data:await r.json()};
  }
  const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=','base64');
  const photo=ok(await upload('photo',image),201).data.url;
  const document=ok(await upload('document',Buffer.from('%PDF-1.4 test')),201).data.url;
  assert.equal((await fetch('http://127.0.0.1:3098'+document)).status,403);
  ok(await upload('photo',Buffer.from('<svg>bad</svg>')),400);
  ok(await action({type:'PROFILE_SAVE',values:{...profile,photoUrl:photo,supportingDocuments:[document],certified_status:'suspended'}},trainer.cookie));
  assert.equal(ok(await request('portal',null,trainer.cookie)).data.profile.certifiedStatus,'certified');
  assert.equal(ok(await request('trainers')).data.length,0);
  // A saved profile and portal approval do not grant a public listing.
  ok(await action({type:'LISTING_REQUEST',consent:false},trainer.cookie),400);
  await db.query('UPDATE trainer_profiles SET healthcare_professional=true WHERE id=$1',[trainerId]);
  if((await db.query('SELECT status FROM trainer_profiles WHERE id=$1',[trainerId])).rows[0].status==='submitted')ok(await action({type:'ADMIN_REVIEW',target:'profile',id:trainerId,decision:'approved'}));
  ok(await action({type:'LISTING_REQUEST',consent:true},trainer.cookie));
  assert.equal(ok(await request('trainers')).data.length,0);
  ok(await action({type:'ADMIN_REVIEW',target:'listing',id:trainerId,decision:'approved'}));
  assert.equal(ok(await request('trainers')).data.length,1);
  ok(await action({type:'ADMIN_LISTING',id:trainerId,listing:'suspended',comment:'Check updated certificate'}));
  assert.equal(ok(await request('trainers')).data.length,0);
  ok(await request('portal',null,trainer.cookie));
  ok(await action({type:'ADMIN_LISTING',id:trainerId,listing:'approved'}));
  assert.equal(ok(await request('trainers')).data.length,1);
  // RCBC review keeps the prior public version until the update is approved.
  ok(await action({type:'PROFILE_SAVE',values:{...profile,photoUrl:photo,supportingDocuments:[document],shortProfile:'Updated profile'}},trainer.cookie));
  assert.equal(ok(await request('trainers')).data[0].short_profile,'Test profile');
  ok(await action({type:'ADMIN_REVIEW',target:'profile',id:trainerId,decision:'approved'}));
  assert.equal(ok(await request('trainers')).data[0].short_profile,'Updated profile');
  ok(await action({type:'LISTING_WITHDRAW'},trainer.cookie));
  assert.equal(ok(await request('trainers')).data.length,0);
  ok(await action({type:'LISTING_REQUEST',consent:true},trainer.cookie));
  ok(await action({type:'ADMIN_REVIEW',target:'listing',id:trainerId,decision:'approved'}));
  assert.equal(ok(await request('trainers')).data.length,1);
  ok(await request('admin/users',{id:trainerId,enabled:true,certifiedStatus:'certified',certificateRef:'OFFICIAL-1',assessmentResult:'Passed practical assessment',healthcareProfessional:true,independentTeachingScope:'Family education'},admin.cookie));
  const checked=ok(await request('portal',null,admin.cookie)).data.profiles.find(p=>p.id===trainerId);
  assert.equal(checked.assessment_result,'Passed practical assessment');
  assert.equal(checked.healthcare_professional,true);
  assert.ok(checked.listingConsentAt);
  assert.equal(ok(await request('public/organisations')).data.filter(r=>r.is_example).length,0);

  assert.equal((await fetch('http://127.0.0.1:3098'+photo)).status,200);
  assert.equal((await fetch('http://127.0.0.1:3098'+document)).status,403);
  const second={...credentials,name:'Second Trainer',email:'second@test.example'};ok(await request('auth/register',second),201);
  const secondRequest=ok(await request('auth/application',second)).data.application;
  ok(await action({type:'ADMIN_REVIEW',target:'access',id:secondRequest.id,decision:'approved',certificateRef:'OFFICIAL-2'}));
  const secondLogin=ok(await request('auth/login',second));const secondId=secondLogin.data.user.id;
  assert.equal((await fetch('http://127.0.0.1:3098'+trainerSnapshot.profile.certificateEvidenceUrl,{headers:{cookie:secondLogin.cookie}})).status,403);
  ok(await action({type:'PROFILE_SAVE',values:{...profile,certificateEvidenceUrl:trainerSnapshot.profile.certificateEvidenceUrl}},secondLogin.cookie),400);
  ok(await action({type:'PROFILE_SAVE',values:{...profile,certificateEvidenceUrl:document}},trainer.cookie));
  assert.equal(ok(await request('portal',null,trainer.cookie)).data.profile.certificateEvidenceUrl,document);
  ok(await action({type:'PROFILE_SAVE',values:{...profile,certificateEvidenceUrl:''}},trainer.cookie));
  assert.equal(ok(await request('portal',null,trainer.cookie)).data.profile.certificateEvidenceUrl,'');

  ok(await action({type:'PROFILE_SAVE',values:{...profile,photoUrl:photo}},secondLogin.cookie),403);
  await db.query('UPDATE trainer_profiles SET healthcare_professional=coalesce(healthcare_professional,false),teaching_allowed=true,teaching_permissions=$2 WHERE id=ANY($1::uuid[])',[[trainerId,secondId],JSON.stringify([{scope:'Workshop',modules:[]}])]);
  const activity={id:randomUUID(),title:'Test workshop',date:'2026-01-01T10:00',endDate:'2026-01-01T13:00',organiserKind:'rcbc',organiserName:'RCBC',type:'Workshop',mode:'Online',venue:'Online',language:'English',audience:'Caregivers',description:'Practical learning',plannedHours:3,trainers:[{trainerId,role:'Trainer'},{trainerId:secondId,role:'Co-Trainer'}]};
  ok(await action({type:'ACTIVITY_SAVE',activity},trainer.cookie));
  ok(await action({type:'ACTIVITY_SAVE',activity},secondLogin.cookie),403);
  ok(await action({type:'ACTIVITY_SUBMIT',id:activity.id},trainer.cookie));
  ok(await action({type:'ACTIVITY_SAVE',activity},trainer.cookie),409);
  assert.equal(ok(await request('activities')).data.some(a=>a.id===activity.id),false);
  // Operational publication never grants content publication permission.
  ok(await action({type:'ADMIN_REVIEW',target:'activity',id:activity.id,decision:'published'},trainer.cookie),403);
  ok(await action({type:'ADMIN_REVIEW',target:'activity',id:activity.id,decision:'published'}));
  const publishedActivity=(await db.query('SELECT status,published_at FROM activities WHERE id=$1',[activity.id])).rows[0];
  assert.equal(publishedActivity.status,'published');
  assert.ok(publishedActivity.published_at);
  assert.equal(ok(await request('activities')).data.some(a=>a.id===activity.id),false);
  const publication=ok(await request('admin/webinar-library',null,admin.cookie)).data.find(a=>a.id===activity.id);
  ok(await request('admin/webinar-library',{...publication,revision:publication.updated_at,content_approval_status:'approved',rightsConfirmed:true},trainer.cookie),403);
  ok(await request('admin/webinar-library',{...publication,revision:publication.updated_at,content_approval_status:'approved',rightsConfirmed:true},admin.cookie));
  assert.ok(ok(await request('activities')).data.some(a=>a.id===activity.id));
  ok(await action({type:'ADMIN_REVIEW',target:'activity',id:activity.id,decision:'published'}),409);
  ok(await action({type:'COMPLETION_SAVE',id:activity.id,values:{actualStart:'2026-01-01T10:00',actualEnd:'2026-01-01T13:00',venue:'Online',hours:2,trainerHours:{[trainerId]:2,[secondId]:2},participants:12}},trainer.cookie));
  assert.equal((await db.query('SELECT * FROM annual_trainer_contributions')).rowCount,0);
  ok(await action({type:'ADMIN_REVIEW',target:'completion',id:activity.id,decision:'returned',comment:'Add photo evidence'}));
  const completionPhoto=ok(await upload('activity-photo',image),201).data.url;
  ok(await action({type:'COMPLETION_SAVE',id:activity.id,values:{actualStart:'2026-01-01T10:00',actualEnd:'2026-01-01T13:00',venue:'Online',hours:2,trainerHours:{[trainerId]:2,[secondId]:2},participants:12,photos:[completionPhoto]}},trainer.cookie));
  ok(await action({type:'ADMIN_REVIEW',target:'completion',id:activity.id,decision:'approved'}));
  assert.equal((await db.query('SELECT * FROM annual_trainer_contributions')).rowCount,0);
  ok(await action({type:'CONTRIBUTION_REVIEW',id:activity.id,trainerId,decision:'verified'}),409);
  ok(await action({type:'CONTRIBUTION_CONFIRM',id:activity.id},trainer.cookie));
  // A trainer-supplied target ID cannot confirm another trainer's contribution.
  ok(await action({type:'CONTRIBUTION_CONFIRM',id:activity.id,trainerId:secondId},trainer.cookie),409);
  assert.equal((await db.query('SELECT contribution_status FROM activity_trainers WHERE activity_id=$1 AND trainer_id=$2',[activity.id,secondId])).rows[0].contribution_status,'pending');
  ok(await action({type:'CONTRIBUTION_CONFIRM',id:activity.id,trainerId:secondId}),400);
  ok(await action({type:'CONTRIBUTION_CONFIRM',id:activity.id},secondLogin.cookie));
  ok(await action({type:'CONTRIBUTION_REVIEW',id:activity.id,trainerId,decision:'verified'}));
  ok(await action({type:'CONTRIBUTION_REVIEW',id:activity.id,trainerId:secondId,decision:'verified'}));
  ok(await action({type:'ADMIN_REVIEW',target:'activity',id:activity.id,decision:'archived'}));
  const totals=(await db.query('SELECT * FROM annual_trainer_contributions')).rows;
  assert.equal(totals.length,2);assert.equal(Number(totals[0].hours),2);assert.equal(Number(totals[1].participants),12);
  assert.equal(Number((await db.query('SELECT * FROM annual_project_reach')).rows[0].participants),12);
  const adminEvent={
   ...activity,
   id:randomUUID(),
   title:'RCBC webinar',
   type:'RCBC Webinar',
   trainers:[],
   date:'2026-02-01T10:00',
   endDate:'2026-02-01T13:00',
   registrationType:'free-online',
   registrationMethod:'closed',
  };
  ok(await action({type:'ACTIVITY_SAVE',activity:adminEvent}));ok(await action({type:'ACTIVITY_SUBMIT',id:adminEvent.id}));
  ok(await action({type:'ADMIN_REVIEW',target:'activity',id:adminEvent.id,decision:'approved'}));
  ok(await action({type:'ADMIN_REVIEW',target:'activity',id:adminEvent.id,decision:'published'}));
  ok(await action({type:'ACTIVITY_SAVE',activity:{...adminEvent,date:'2026-02-02T10:00',endDate:'2026-02-02T13:00'}}));
  ok(await action({type:'ADMIN_REVIEW',target:'activity',id:adminEvent.id,decision:'cancelled',comment:'Venue unavailable'}));
  ok(await action({type:'ADMIN_REVIEW',target:'activity',id:adminEvent.id,decision:'archived'}));
  const review={language:'English',source:'RCBC verified source',source_url:'',last_reviewed_at:'2026-10-18T10:00',next_review_at:'',review_status:'current',publication_status:'published',admin_comment:''};
  const faq={slug:'test-faq',question:'Test question',answer:'Test answer',category:'General',...review};
  const faqId=ok(await request('admin/records/faqs',{values:faq},admin.cookie)).data.id;
  assert.equal(ok(await request('public/faqs')).data.length,1);
  ok(await request('admin/records/faqs',{id:faqId,values:{...faq,publication_status:'unpublished'}},admin.cookie));
  assert.equal(ok(await request('public/faqs')).data.length,0);
  function record(kind,overrides={}) {
   const values={};for(const [name,,type] of recordTypes[kind].fields) values[name]=type==='array'?[]:type==='checkbox'?false:Array.isArray(type)?type[0]:name==='language'?'English':'';
   return {...values,...review,...overrides};
  }
  const organisation=record('organisations',{name:'Test facility',category:'Community-led',phone:'1234'});
  const orgId=ok(await request('admin/records/organisations',{values:organisation},admin.cookie)).data.id;
  const respite=record('directory_services',{organisation_id:orgId,service_type:'Respite',category:'services',city:'Miri'});
  const group=record('directory_services',{organisation_id:orgId,service_type:'Caregiver meetings',category:'support-group',group_type:'Community-led'});
  const respiteId=ok(await request('admin/records/directory_services',{values:respite},admin.cookie)).data.id;
  const groupId=ok(await request('admin/records/directory_services',{values:group},admin.cookie)).data.id;
  assert.equal(ok(await request('public/organisations?category=services')).data[0].id,respiteId);
  assert.deepEqual(ok(await request('public/organisations?category=support-group')).data.map(row=>row.id),[groupId]);
  ok(await request('admin/records/organisations',{id:orgId,values:{...organisation,phone:'5678'}},admin.cookie));
  assert.deepEqual(ok(await request('public/organisations')).data.map(row=>row.phone),['5678','5678']);
  assert.equal(ok(await request('admin/records/directory_services?category=services&location=Miri',null,admin.cookie)).data[0].id,respiteId);
  ok(await request('admin/records/directory_services',{id:respiteId,values:{...respite,publication_status:'unpublished'}},admin.cookie));
  assert.deepEqual(ok(await request('public/organisations')).data.map(row=>row.id),[groupId]);
  ok(await request('admin/records/organisations',{id:orgId,values:{...organisation,review_status:'archived'}},admin.cookie));
  assert.equal(ok(await request('public/organisations')).data.filter(r=>!r.is_example).length,0);
  const resource=record('learning_resources',{title:'Test guide',activity_id:activity.id,url:'https://example.org/guide',copyright_permission:'RCBC permission recorded'});
  const resourceId=ok(await request('admin/records/learning_resources',{values:resource},admin.cookie)).data.id;
  assert.equal(ok(await request('public/learning_resources')).data.length,1);
  ok(await request('admin/records/learning_resources',{id:resourceId,values:{...resource,publication_status:'unpublished'}},admin.cookie));
  assert.equal(ok(await request('public/learning_resources')).data.length,0);
  const qaOnly=record('learning_resources',{title:'Grouped Q&A pack',resource_type:'Q&A',activity_id:activity.id,qa_folder:'Oral Health Webinar',url:'',copyright_permission:'RCBC permission recorded'});
  const qaId=ok(await request('admin/records/learning_resources',{values:qaOnly},admin.cookie)).data.id;
  assert.equal(ok(await request('public/learning_resources')).data.filter(r=>r.id===qaId).length,1);
  assert.equal(ok(await request('public/learning_resources')).data.find(r=>r.id===qaId).qa_folder,'Oral Health Webinar');
  ok(await request('admin/records/learning_resources',{values:{...record('learning_resources',{title:'Broken Q&A',resource_type:'Q&A',activity_id:activity.id,url:''}),publication_status:'published',review_status:'current',source:'RCBC',last_reviewed_at:'2026-10-18T10:00',copyright_permission:'RCBC'}},admin.cookie),400);
  ok(await request('admin/records/content_pages',{values:record('content_pages',{slug:'home',title:'Project note',body:'Plain text update'})},admin.cookie));
  assert.equal(ok(await request('public/content_pages')).data[0].body.text,'Plain text update');
  const enquiry={id:randomUUID(),name:'Visitor',email:'visitor@test.example',type:'Collaboration & Partnership',message:'Please contact me about the project.',website:'',startedAt:Date.now()-3000};
  ok(await request('enquiries',enquiry));ok(await request('enquiries',enquiry));
  const enquiries=ok(await request('admin/records/enquiries',null,admin.cookie)).data;assert.equal(enquiries.length,1);
  ok(await request('admin/records/enquiries',{id:enquiries[0].id,values:{status:'closed',admin_comment:''}},admin.cookie),400);
  ok(await request('admin/records/enquiries',{id:enquiries[0].id,values:{status:'follow-up',admin_comment:'Replied by email'}},admin.cookie));
  ok(await request('admin/records/enquiries',{id:enquiries[0].id,values:{status:'closed',admin_comment:'Followed up internally'}},admin.cookie));
  assert.equal(ok(await request('admin/records/enquiries?status=new',null,admin.cookie)).data.length,0);
  assert.equal(ok(await request('admin/records/enquiries?status=closed&type=Collaboration%20%26%20Partnership',null,admin.cookie)).data.length,1);
  const closed=(await db.query('SELECT * FROM enquiries')).rows[0];
  assert.equal(closed.status,'closed');assert.ok(closed.followed_up_at);assert.ok(closed.closed_at);
  const history=ok(await request('admin/enquiry-history?id='+closed.id,null,admin.cookie)).data;
  assert.equal(history.length,2);assert.ok(history.some(r=>r.admin_comment==='Replied by email'));
  ok(await request('admin/enquiry-history?id='+closed.id),401);
  ok(await request('admin/records/content_pages',{values:record('content_pages',{slug:'about-overview',title:'About',body:'Approved text',reviewer:''})},admin.cookie),400);
  const approvedPage=ok(await request('admin/records/content_pages',{values:record('content_pages',{slug:'about-overview',title:'About',body:'Approved text',reviewer:'RCBC approver'})},admin.cookie));
  assert.ok(approvedPage.data.id);
  ok(await request('admin/records/faqs',{id:faqId,remove:true},admin.cookie),400);
  ok(await request('admin/records/faqs',{id:faqId,values:{...faq,review_status:'archived'}},admin.cookie));
  assert.equal(ok(await request('public/faqs')).data.length,0);
  const subscriber=ok(await request('public/subscribe',{name:'Subscriber',email:'subscriber@test.example',country:'Malaysia',city:'Bintulu',state:'Sarawak',consent:true}));
  assert.ok(subscriber.data.unsubscribeLink);
  assert.equal(ok(await request('admin/records/subscribers?country=malaysia&status=active',null,admin.cookie)).data.length,1);
  assert.equal(ok(await request('admin/records/subscribers?country=Singapore',null,admin.cookie)).data.length,0);
  ok(await request('admin/contact-settings'),401);
  const contactDetails={projectEmail:'contact@test.example', organiserFacebook:'https://www.facebook.com/example-rotary', whatsappCommunity:'https://chat.whatsapp.com/exampleInvite'};
  ok(await request('admin/contact-settings',{...contactDetails,whatsappCommunity:'https://other.example/invalid'},admin.cookie),400);
  ok(await request('admin/contact-settings',contactDetails,admin.cookie));
  assert.deepEqual(ok(await request('public/contact-settings')).data,contactDetails);
  const exportAudience=async(cookie='')=>fetch('http://127.0.0.1:3098/api/admin/subscribers/export',{headers:{cookie}});
  assert.equal((await exportAudience()).status,401);
  assert.equal((await exportAudience(trainer.cookie)).status,403);
  assert.match(await (await exportAudience(admin.cookie)).text(),/subscriber@test.example/);
  const subscriberId=(await db.query('SELECT id FROM subscribers')).rows[0].id;
  ok(await request('public/unsubscribe',{token:unsubscribeToken(subscriberId,'test-secret-'.repeat(5))}));
  assert.ok(!(await (await exportAudience(admin.cookie)).text()).includes('subscriber@test.example'));
  ok(await request('public/unsubscribe',{token:subscriber.data.unsubscribeLink.split('=')[1]}));
  assert.ok((await db.query('SELECT unsubscribed_at FROM subscribers')).rows[0].unsubscribed_at);
  ok(await request('public/subscribe',{email:'bad'}),400);
  ok(await request('admin/records/dcs_certificates',{values:{certificate_ref:'DCS-1',recipient_name:'Recipient',programme:'DCS-Family',issuer:'RCBC',issued_at:'2026-01-01',completion_date:'2026-01-01',training_location:'Bintulu',activity_id:'',status:'valid',verification_consent_at:'2026-01-01T12:00',admin_comment:''}},admin.cookie));
  assert.equal(ok(await request('public/verify-certificate',{name:'Recipient',certificateRef:'DCS-1'})).data.certificate,null);
  const person=(await db.query("INSERT INTO dcs_registry_participants(participant_key,name) VALUES('verified-recipient','Recipient') RETURNING id")).rows[0];
  await db.query("INSERT INTO dcs_registry_records(participant_id,programme,intake,training_location,attendance_date,organiser,source_reference,status,completion_date,certificate_ref,issued_at,issuer,verified,public_consent,approved_public_display,consent_note) VALUES($1,'DCS-Family','Batch 1','Bintulu','2026-01-01','RCBC','Verified register','completed','2026-01-01','DCS-1','2026-01-01','RCBC',true,true,true,'Explicit public disclosure approval')",[person.id]);
  assert.equal(ok(await request('public/verify-certificate',{name:'Recipient',certificateRef:'DCS-1'})).data.certificate.status,'completed');
  assert.equal(ok(await request('public/verify-certificate',{name:'Wrong name',certificateRef:'DCS-1'})).data.certificate,null);
  ok(await request('admin/users',{id:trainerId,enabled:false,certifiedStatus:'certified',certificateRef:'OFFICIAL-1'},admin.cookie));
  ok(await request('portal',null,trainer.cookie),401);
  ok(await request('admin/users',{id:admin.data.user.id,enabled:false},admin.cookie),403);
  assert.ok((await db.query("SELECT * FROM audit_log WHERE operation='DECISION' AND decision='verified' AND actor_id=$1",[admin.data.user.id])).rowCount);
  assert.ok(!(await db.query("SELECT * FROM audit_log WHERE after_data ? 'password_hash'")).rowCount);
  ok(await request('auth/logout',{},admin.cookie));ok(await request('portal',null,admin.cookie),401);
  for(const login of [second,adminData]) {
   const active=ok(await request('auth/login',login));
   const hash=digest(active.cookie.split('=')[1]);
   await db.query("UPDATE sessions SET expires_at=now()+interval '30 seconds' WHERE token_hash=$1",[hash]);
   ok(await request('auth/activity',{idleMs:0},active.cookie));
   const remaining=Number((await db.query('SELECT extract(epoch FROM expires_at-now()) AS seconds FROM sessions WHERE token_hash=$1',[hash])).rows[0].seconds);
   assert.ok(remaining>295 && remaining<=300);
   await db.query("UPDATE sessions SET expires_at=now()+interval '20 seconds' WHERE token_hash=$1",[hash]);
   ok(await request('auth/me',null,active.cookie));
   assert.ok(Number((await db.query('SELECT extract(epoch FROM expires_at-now()) AS seconds FROM sessions WHERE token_hash=$1',[hash])).rows[0].seconds)<=20);
   await db.query("UPDATE sessions SET expires_at=now()-interval '1 second' WHERE token_hash=$1",[hash]);
   assert.equal(ok(await request('auth/me',null,active.cookie)).data.user,null);
   ok(await request('portal',null,active.cookie),401);
   ok(await request('auth/activity',{idleMs:0},active.cookie),401);
  }
  const resetSession=ok(await request('auth/login',adminData));
  const resetToken='admin-reset-test-token-'.repeat(3);
  await db.query("INSERT INTO password_reset_tokens(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 minutes')",[digest(resetToken),admin.data.user.id]);
  ok(await request('auth/reset-password',{token:resetToken,password:'short'}),400);
  ok(await request('auth/reset-password',{token:'invalid-token-'.repeat(4),password:'a new sufficiently long password'}),400);
  const newPassword='a new sufficiently long password';
  ok(await request('auth/reset-password',{token:resetToken,password:newPassword}));
  ok(await request('portal',null,resetSession.cookie),401);
  ok(await request('auth/login',adminData),401);
  ok(await request('auth/login',{...adminData,password:newPassword}));
  ok(await request('auth/reset-password',{token:resetToken,password:newPassword}),400);
  assert.equal(serverErrors,'');
 }finally{server?.kill();await db.end();await root.query(`DROP SCHEMA ${schema} CASCADE`);await root.end();}
});
