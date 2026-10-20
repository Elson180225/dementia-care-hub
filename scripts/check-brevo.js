import { createBrevo } from '../server/brevo.js';
import { validateReminderConfig } from '../server/reminders.js';
const request=createBrevo();
try {
 validateReminderConfig();
 const listId=Number(process.env.BREVO_LIST_ID);
 if(!Number.isSafeInteger(listId)||listId<1)throw new Error('Set BREVO_LIST_ID to a positive integer.');
 await request('/contacts/lists/'+listId);
 const {senders=[]}=await request('/senders');
 if(!senders.some(s=>s.active && s.email.toLowerCase()===process.env.BREVO_SENDER_EMAIL.toLowerCase()))throw new Error('BREVO_SENDER_EMAIL does not match an active verified Brevo sender.');
 const {attributes=[]}=await request('/contacts/attributes');
 for(const name of ['NAME','CITY','STATE','LANGUAGE']) {
  const existing=attributes.find(a=>a.name===name);
  if(existing && existing.type!=='text')throw new Error(name+' must be a text attribute. Existing attribute retained.');
  if(!existing) {
   if(!process.argv.includes('--setup'))throw new Error('Missing '+name+' attribute. Run npm run brevo:setup to create missing text attributes.');
   await request('/contacts/attributes/normal/'+name,{method:'POST',data:{type:'text'}});
   console.log('Created contact text attribute: '+name);
  }
 }
 console.log('Brevo configuration verified: active sender, list, contact attributes and reminder configuration. No emails sent.');
} catch(error){console.error(error.message);process.exitCode=1;}
