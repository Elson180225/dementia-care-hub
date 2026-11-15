export const translationPages=[
 {id:'home',title:'Home',description:'Welcome text, visitor pathways and statistics'},
 {id:'understanding',title:'Understanding Dementia',description:'Dementia information and educational guidance'},
 {id:'education',title:'Education & Events',description:'Programmes, intakes, webinars and registration instructions'},
 {id:'help',title:'Find Help & Support',description:'Support pathways and Resource Finder guidance'},
 {id:'caregiver',title:'Caregiver Support',description:'Caregiver guidance, training and support groups'},
 {id:'about',title:'About the Project',description:'Project information, partners and acknowledgements'},
 {id:'contact',title:'Contact',description:'Contact information and enquiry form guidance'},
 {id:'updates',title:'Get Updated & Access',description:'Subscriptions and public service messages'},
 {id:'resources',title:'Published resources & directory',description:'Published articles, FAQs, resources and directory descriptions'},
 {id:'shared',title:'Navigation & shared buttons',description:'Menus, search, footer and common website labels'}
];
export const translationStatusLabels={missing:'Not translated',draft:'Work in progress',review:'Waiting for review',approved:'Published','needs-review':'English changed — please update'};
export function translationPage(key){
 const [root,section]=key.split('/');
 if(['cms','activities','registration'].includes(root))return 'education';
 if(root==='records')return 'resources';
 return {home:'home',statistics:'home',understandDementia:'understanding',learnEvents:'education',findHelp:'help',assessmentHealthcare:'help',supportServicesPage:'help',governmentFinancialPage:'help',equipmentPracticalPage:'help',resourceFinderPage:'help',caregiverSupport:'caregiver',aboutProject:'about',contact:'contact',projectServices:'updates',faq:'resources',publishedRecords:'resources'}[section]||'shared';
}
export function friendlyField(key,sources={}){
 const parts=key.split('/').map(decodeURIComponent),field=parts.at(-1);
 const names={title:'Heading',description:'Description',shortIntro:'Short introduction',body:'Page content',text:'Text',audience:'Who it is for',suitableFor:'Who it is for',instructions:'Payment instructions',general_instructions:'Registration instructions',fee:'Fee description',question:'Question',answer:'Answer',venue:'Venue',name:'Name',label:'Label',intro:'Introduction'};
 const label=names[field]||(/^\d+$/.test(field)?'List item '+(Number(field)+1):field.replace(/([a-z])([A-Z])/g,'$1 $2').replaceAll('_',' ').replace(/^./,c=>c.toUpperCase()));
 const parent=key.split('/').slice(0,-1).join('/');
 const context=sources[parent+'/title']||sources[parent+'/name']||sources[parent+'/question'];
 return context&&context!==sources[key]?context+' — '+label:label;
}
export function pageSummary(entries,page,language){
 const rows=entries.filter(r=>r.language===language&&translationPage(r.key)===page);
 return {total:rows.length,published:rows.filter(r=>r.status==='approved').length,review:rows.filter(r=>r.status==='review').length,changed:rows.filter(r=>r.status==='needs-review').length,attention:rows.filter(r=>r.status!=='approved').length};
}
export function taskIncludes(row,task,actor){
 if(!actor.admin&&!actor.scopes.includes(row.review_type))return false;
 if(task==='changed')return row.status==='needs-review';
 if(task==='review')return row.status==='review';
 return actor.admin||actor.scopes.includes(row.review_type);
}
