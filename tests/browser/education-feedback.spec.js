import {test,expect} from '@playwright/test';
import {workbookXlsx} from '../../server/education-reports.js';
const id='00000000-0000-4000-8000-000000000010';
const activity={id,title:'Approved family workshop',starts_at:'2099-12-01T01:00:00Z',status:'published',programme_id:'dcs-family',mode:'Physical',type:'Workshop',venue:'Community Hall',city:'Kuching',organiser_kind:'independent',organiser_name:'Community organiser',speaker:'Approved Speaker',speaker_intro:'An approved speaker introduction.',qa_text:'Question: What will I learn? Answer: Approved caregiving information.'};
const admin={id:'admin',name:'Test Administrator',role:'admin'};
test.beforeEach(async({page})=>{
 await page.route('**/api/**',async route=>{
  const url=new URL(route.request().url());const responses={
   '/api/auth/me':{user:admin},'/api/portal':{adminSession:admin,profile:{name:'Administrator'},activities:[],profiles:[],accessRequests:[],history:[]},
   '/api/activities':[activity],'/api/public/activity-resources':[], '/api/public/event-registration':{configured:true,settings:{enabled:true,paid:false,website_enabled:true,google_url:'https://example.test/form',ask_phone:true,ask_notes:true}},
   '/api/public/dcs-registry':{rows:[{name:'Approved Participant',programme:'DCS-Family',training_location:'Kuching',attendance_date:'2026-11-01',certificate_ref:null}],total:1,pageSize:20},
   '/api/admin/dcs-registry':{rows:[],total:0},'/api/public/learn-events-content':{physicalEducation:{programmes:[{id:'dcs-family',code:'DCS-Family',title:'Family programme',suitableFor:'Families',highlights:[],availability:'available'}]}},
   '/api/admin/learn-events-content':{onlineEducation:{},physicalEducation:{programmes:[]},events:{},certifiedTrainers:{},_revision:1},
   '/api/admin/webinar-library':[{...activity,starts_at:'2025-10-01T01:00:00Z',status:'completed',content_approval_status:'pending',updated_at:'2026-11-01T00:00:00Z'}],
  };await route.fulfill({json:responses[url.pathname]??[]});
 });
});
test('event page exposes approved Q&A, organiser and both registration choices',async({page})=>{
 await page.goto('/learn-events/event/'+id);
 await expect(page.getByRole('heading',{name:activity.title,exact:true})).toBeVisible();
 await expect(page.getByText(activity.speaker_intro)).toBeVisible();
 await expect(page.getByText(/Independently organised/)).toBeVisible();
 await expect(page.getByRole('heading',{name:'Reviewed questions & answers'})).toBeVisible();
 await expect(page.getByRole('button',{name:/Complete registration form/})).toBeVisible();
 await expect(page.locator('a[href="https://example.test/form"]')).toBeVisible();
 await page.getByRole('button',{name:/Complete registration form/}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await expect(page.getByRole('textbox',{name:/question|notes/i})).toBeVisible();
});
test('public training search shows approved limited fields on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/learn-events/dcs-participants');
 const programme=page.getByRole('combobox');
 await expect(programme.locator('option')).toHaveCount(4);
 await programme.selectOption('DCS-Family');
 await page.getByRole('button',{name:'Search registry',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Approved Participant'})).toBeVisible();
 await expect(page.getByText('No certificate issued yet')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'tmp/education-public-mobile.png',fullPage:true});
});
test('admin registry and publication review are reachable without duplicate account screens',async({page})=>{
 await page.goto('/admin/dcs-registry');await expect(page.getByRole('heading',{name:'DCS Training & Certification Registry'})).toBeVisible();
 await page.goto('/admin/learn-events?section=library');await expect(page.getByRole('heading',{name:'Activity publication & webinar library'})).toBeVisible();
 await page.getByRole('button',{name:'Review content',exact:true}).click();await expect(page.getByRole('combobox',{name:'Publication review',exact:true})).toHaveValue('pending');
 await page.screenshot({path:'tmp/education-publication-admin.png',fullPage:true});
});
test('Excel import parses worksheet values in browser without evaluating formulas',async({page})=>{
 const buffer=workbookXlsx([{name:'Template',rows:[['name','attendance_date'],['Example Person','2026-11-01']]}]);
 await page.goto('/learn-events/dcs-participants');
 const csv=await page.evaluate(async bytes=>{const {workbookCsv}=await import('/shared/workbook-import.js');return workbookCsv(new Uint8Array(bytes).buffer);},[...buffer]);
 expect(csv).toContain('"Example Person","2026-11-01"');
});

test('admin online activity counts and publication links reflect review status', async ({page}) => {
 const online={id,date:'2026-12-01T09:00',title:'Historical online webinar',mode:'Online',status:'completed',contentApprovalStatus:'pending'};
 const physical={id:'physical',date:'2026-12-02T09:00',title:'Published workshop',mode:'Physical',status:'published',isPublic:true,contentApprovalStatus:'approved'};
 await page.route('**/api/portal', route=>route.fulfill({json:{
  adminSession:admin,profile:{name:'Administrator'},activities:[online,physical].map(activity=>({...activity,completion:{status:"none"},trainers:[]})),profiles:[],accessRequests:[],history:[{
   id:'review',entity:'learning_resources',entityLabel:'Webinar material',decision:'created',by:'System',
   at:'2026-11-26T08:58:00Z',comment:'Legacy CMS material: verify source. Original metadata: {}',
  }],
 }}));
 await page.goto('/admin/review');
 await expect(page.getByText(/Imported for RCBC review/)).toBeVisible();
 await page.getByRole('link',{name:/Review publication.*1 pending/}).click();
 await expect(page.getByRole('combobox',{name:'Publication review',exact:true})).toHaveValue('pending');
 const onlineSection=page.getByRole('button',{name:'Online Education',exact:true});
 await onlineSection.focus();
 await page.keyboard.press('Enter');
 await expect(onlineSection).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.tp-stat').filter({hasText:'Matching activities'})).toHaveText('Matching activities1');
 await expect(page.locator('.tp-stat').filter({hasText:'Needs publication review'})).toHaveText('Needs publication review1');
 await expect(page.getByText(physical.title)).toHaveCount(0);
});

test('admin registry reveals completion and certificate fields as needed on mobile', async ({page}) => {
 await page.setViewportSize({width:390,height:844});
 await page.goto('/admin/dcs-registry');
 await expect(page.getByLabel('Participant name')).toHaveCount(0);
 await page.getByRole('button',{name:'Add programme record'}).click();
 await expect(page.getByRole('combobox',{name:'Link to an event (optional)'})).toBeVisible();
 await expect(page.getByLabel('Completion date')).toHaveCount(0);
 await page.getByLabel('Training status').selectOption('completed');
 await expect(page.getByLabel('Completion date')).toBeVisible();
 await expect(page.locator('form').getByLabel('Certificate number',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Add certificate details'}).click();
 await expect(page.locator('form').getByLabel('Certificate number',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});

test('trainer review shows correction notes only on request', async ({page}) => {
 const date = new Date().getFullYear() + '-10-27T16:05';
 const activity = {id,title:'Family training',date,completion:{status:'verified',actualStart:date,eventHours:6,participants:12},trainers:[
  {trainerId:'one',name:'Trainer One',role:'Trainer',hours:4,contributionStatus:'verified'},
 ]};
 await page.route('**/api/portal', route=>route.fulfill({json:{
  adminSession:admin,profile:{name:'Administrator'},activities:[activity],profiles:[],accessRequests:[],history:[],
 }}));
 await page.goto('/admin/contribution');
 await expect(page.getByRole('link',{name:'Download annual Excel report'})).toBeVisible();
 await expect(page.getByText(/27 October.*4:05/)).toBeVisible();
 await expect(page.getByRole('textbox',{name:'What should the trainer correct?'})).toHaveCount(0);
 await page.getByRole('button',{name:'Request correction'}).click();
 await expect(page.getByRole('textbox',{name:'What should the trainer correct?'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Send correction request'})).toBeDisabled();
});

test('a DCS course links its scheduled intake to the activity page', async ({page})=>{
 await page.goto('/learn-events/physical-education?programme=dcs-family');
 await expect(page.getByRole('heading',{name:'Family programme',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'ADFM Training Partnership'})).toBeVisible();
 const intake=page.locator('#programme-intakes').getByRole('link').filter({hasText:/intake details/i});
 await expect(intake).toHaveAttribute('href','/learn-events/event/'+id);
 await intake.click();
 await expect(page.getByRole('heading',{name:activity.title,exact:true})).toBeVisible();
});
