export function validateEventRegistration(data,settings){
 const name=String(data.name||'').trim(),email=String(data.email||'').trim().toLowerCase();
 const phone=settings.ask_phone?String(data.phone||'').trim():'';
 const notes=settings.ask_notes?String(data.notes||'').trim():'';
 if(!name||name.length>200||!/^\S+@\S+\.\S+$/.test(email)||email.length>254)throw new Error('Enter your name and a valid email address.');
 if((settings.ask_phone&&!phone)||phone.length>80||notes.length>2000)throw new Error('Check your phone number and notes (maximum 2000 characters).');
 if(data.consent!==true)throw new Error('Agree to RCBC using your registration details.');
 return {name,email,phone,notes};
}
export function canConfirmRegistration(settings,participant){return participant.status==='registered'&&(!settings.paid||!!participant.payment_verified_at);}
export function validateEventPricing(type,mode){
 if(!['free-online','paid-in-person'].includes(type))throw new Error('Choose free online webinar or paid in-person programme.');
 if(type==='free-online'&&mode!=='Online')throw new Error('Free online webinars must use Online delivery.');
 if(type==='paid-in-person'&&mode!=='Physical')throw new Error('Paid in-person programmes must use Physical delivery.');
 return type==='paid-in-person';
}
export function registrationAvailability(activity,settings,now=Date.now()){
 if(activity.cancelled_at)return 'This event is cancelled.';
 if(['completed','verified','archived'].includes(activity.status)||Date.parse(activity.starts_at)<=now)return 'This event has ended.';
 if(activity.registration_deadline&&Date.parse(activity.registration_deadline)<=now)return 'Registration is closed.';
 if(!settings.enabled)return 'Registration is not open.';
 return '';
}
export function participantExport(rows){
 const keys=['name','email','phone','registration_source','registration_state','status','payment_reference','payment_verified_at','confirmed_at','removed_at','removed_by_name','restored_at'];
 const cell=value=>'"'+String(value??'').replace(/^[=+@\-\t\r]/,'\'$&').replaceAll('"','""')+'"';
 return '\uFEFF'+[keys,...rows.map(row=>keys.map(k=>row[k]))].map(row=>row.map(cell).join(',')).join('\r\n');
}
