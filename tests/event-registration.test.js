import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEventRegistration,canConfirmRegistration,participantExport,capacitySummary} from '../shared/event-registration.js';
import {eventRegistrationHandler} from '../server/event-registration.js';
import {validateEventPricing,normaliseRegistrationType,eventPriceLabel,registrationAvailability} from '../shared/event-registration.js';
test('pricing is independent of delivery mode, with legacy values still readable',()=>{
 for(const mode of ['Online','Physical']){
  assert.equal(validateEventPricing('free',mode),false);
  assert.equal(validateEventPricing('paid',mode),true);
  assert.equal(validateEventPricing('free-online',mode),false);
  assert.equal(validateEventPricing('paid-in-person',mode),true);
 }
 assert.equal(normaliseRegistrationType('free-online'),'free');
 assert.equal(normaliseRegistrationType('paid-in-person'),'paid');
 for(const [type,mode]of [['','Online'],['invalid','Physical'],['free','Hybrid'],['paid','']])assert.throws(()=>validateEventPricing(type,mode));
});
test('public pricing labels reflect both delivery and price without inventing a webinar category',()=>{
 assert.equal(eventPriceLabel({mode:'Physical',registration_settings:{paid:false,fee:'stale'}}),'Free · In person');
 assert.equal(eventPriceLabel({mode:'Online',registration_settings:{paid:false}}),'Free · Online');
 assert.equal(eventPriceLabel({mode:'Physical',registration_settings:{paid:true,fee:'RM 120'}}),'Paid · In person · RM 120');
 assert.equal(eventPriceLabel({mode:'Online',registration_settings:{paid:true,fee:'RM 50'}}),'Paid · Online · RM 50');
 assert.equal(eventPriceLabel({mode:'Physical'}),'Registration details pending');
});
test('closed, ended, cancelled and deadline expired events block registration',()=>{
 const now=Date.parse('2026-11-12T12:00:00Z'),event={status:'published',starts_at:'2026-12-12T12:00:00Z'};
 assert.equal(registrationAvailability(event,{enabled:true},now),'');
 assert.ok(registrationAvailability(event,{enabled:false},now));
 assert.ok(registrationAvailability({...event,cancelled_at:'2026-11-11'},{enabled:true},now));
 assert.ok(registrationAvailability({...event,registration_deadline:'2026-11-12T12:00:00Z'},{enabled:true},now));
 assert.ok(registrationAvailability({...event,status:'archived'},{enabled:true},now));
 assert.ok(registrationAvailability({...event,starts_at:'2026-11-01'},{enabled:true},now));
});
test('paid confirmation requires RCBC payment verification and active registration',()=>{
 assert.equal(canConfirmRegistration({paid:true},{status:'registered'}),false);
 assert.equal(canConfirmRegistration({paid:true},{status:'registered',payment_verified_at:'2026-11-11'}),true);
 assert.equal(canConfirmRegistration({paid:true},{status:'cancelled',payment_verified_at:'2026-11-11'}),false);
 assert.equal(canConfirmRegistration({paid:false},{status:'registered'}),true);
});
test('form validates consent, enabled fields and ignores client supplied payment state',()=>{
 const data={name:' Mei ',email:' MEI@example.com ',consent:true,phone:'0123456789',registration_state:'confirmed',payment_verified_at:'now',notes:'private'};
 const result=validateEventRegistration(data,{ask_notes:false});assert.equal(result.email,'mei@example.com');assert.equal(result.notes,'private');assert.equal(result.registration_state,undefined);
 assert.throws(()=>validateEventRegistration({...data,consent:false},{}));assert.throws(()=>validateEventRegistration({...data,phone:''},{ask_phone:false}));assert.throws(()=>validateEventRegistration({...data,email:'bad'},{}));
});
test('export quotes commas and neutralizes spreadsheet formulas',()=>{
 const csv=participantExport([{name:'=1+1',email:'a@example.com',payment_reference:'A,"B"'}]);
 assert.ok(csv.includes('"\'=1+1"'));assert.ok(csv.includes('"A,""B"""'));assert.ok(csv.includes('registration_state'));
});
test('admin registration data is protected; unrelated origin cannot submit',async()=>{
 await assert.rejects(eventRegistrationHandler({method:'GET',headers:{}},{},new URL('http://localhost/api/admin/event-registration'),()=>assert.fail()),e=>e.status===401);
 await assert.rejects(eventRegistrationHandler({method:'POST',headers:{origin:'https://invalid.example'}},{},new URL('http://localhost/api/public/event-registration'),()=>assert.fail()),e=>e.status===403);
});
test('capacity counts only active confirmed participants and is advisory',()=>{
 const rows=[{status:'registered',registration_state:'confirmed'},{status:'registered',registration_state:'submitted'},{status:'cancelled',registration_state:'confirmed'},{status:'registered',registration_state:'confirmed'}];
 assert.deepEqual(capacitySummary({capacity:1},rows),{capacity:1,confirmed:2,exceeded:1,duplicatePhones:0});
 assert.equal(registrationAvailability({starts_at:'2099-01-01',capacity:1},{enabled:true}),'');
});
