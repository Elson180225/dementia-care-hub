import {normalisePhone} from './registration-duplicates.js';
export function capacitySummary(activity,participants){
 const confirmed=participants.filter(p=>p.status==='registered'&&p.registration_state==='confirmed').length;
 const capacity=Number(activity.capacity)||0;
 const contacts=new Set();let duplicatePhones=0;
 for(const p of participants.filter(p=>p.status==='registered')){const key=normalisePhone(p.phone);if(key&&contacts.has(key))duplicatePhones++;if(key)contacts.add(key);}
 return {confirmed,capacity,exceeded:capacity?Math.max(0,confirmed-capacity):0,duplicatePhones};
}
export function validateEventRegistration(data,settings){
 const name=String(data.name||'').trim(),email=String(data.email||'').trim().toLowerCase();
 const phone=String(data.phone||'').trim();
 const notes=String(data.notes||'').trim();
 if(!name||name.length>200||!/^\S+@\S+\.\S+$/.test(email)||email.length>254)throw new Error('Enter your name and a valid email address.');
 if((!phone||normalisePhone(phone).length<7||normalisePhone(phone).length>15)||phone.length>80||notes.length>2000)throw new Error('Check your phone number and notes (maximum 2000 characters).');
 if(data.consent!==true)throw new Error('Agree to RCBC using your registration details.');
 return {name,email,phone,notes};
}
export function canConfirmRegistration(settings,participant){return participant.status==='registered'&&(!settings.paid||!!participant.payment_verified_at);}
export function normaliseRegistrationType(type){
 if(['free','free-online'].includes(type))return 'free';
 if(['paid','paid-in-person'].includes(type))return 'paid';
 return '';
}
export function validateEventPricing(type,mode){
 if(!['Online','Physical'].includes(mode))throw new Error('Choose Online or Physical delivery.');
 const pricing=normaliseRegistrationType(type);
 if(!pricing)throw new Error('Choose whether registration is Free or Paid.');
 return pricing==='paid';
}
export function eventPriceLabel(event,labels={}){
 const settings=event.registration_settings;
 if(!settings)return labels.pending||'Registration details pending';
 const mode=event.mode==='Physical'?' · '+(labels.physical||'In person'):event.mode==='Online'?' · '+(labels.online||'Online'):'';
 return (settings.paid?(labels.paid||'Paid'):(labels.free||'Free'))+mode+(settings.paid&&settings.fee?' · '+settings.fee:'');
}
export function registrationAvailability(activity,settings,now=Date.now()){
 if(activity.cancelled_at)return 'This event is cancelled.';
 if(activity.postponed_at)return 'This event is postponed. Registration will reopen after the event is rescheduled.';
 if(['completed','verified','archived'].includes(activity.status)||Date.parse(activity.starts_at)<=now)return 'This event has ended.';
 if(activity.registration_deadline&&Date.parse(activity.registration_deadline)<=now)return 'Registration is closed.';
 if(!settings.enabled)return 'Registration is not open.';
 return '';
}
export function participantExport(rows){
 const keys=['name','email','phone','notes','registration_source','registration_state','status','attendance_status','attendance_recorded_at','attendance_recorded_by_name','payment_reference','payment_verified_at','confirmed_at','removed_at','removed_by_name','restored_at'];
 const cell=value=>'"'+String(value??'').replace(/^[=+@\-\t\r]/,'\'$&').replaceAll('"','""')+'"';
 return '\uFEFF'+[keys,...rows.map(row=>keys.map(k=>row[k]))].map(row=>row.map(cell).join(',')).join('\r\n');
}
