import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEventRegistration,canConfirmRegistration,participantExport} from '../shared/event-registration.js';
import {eventRegistrationHandler} from '../server/event-registration.js';
import {validateEventPricing,registrationAvailability} from '../shared/event-registration.js';
test('event classification matches free online and paid physical modes',()=>{
 assert.equal(validateEventPricing('free-online','Online'),false);
 assert.equal(validateEventPricing('paid-in-person','Physical'),true);
 for(const [type,mode]of [['','Online'],['free-online','Physical'],['paid-in-person','Online']])assert.throws(()=>validateEventPricing(type,mode));
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
 const data={name:' Mei ',email:' MEI@example.com ',consent:true,registration_state:'confirmed',payment_verified_at:'now',notes:'private'};
 const result=validateEventRegistration(data,{ask_notes:false});assert.equal(result.email,'mei@example.com');assert.equal(result.notes,'');assert.equal(result.registration_state,undefined);
 assert.throws(()=>validateEventRegistration({...data,consent:false},{}));assert.throws(()=>validateEventRegistration(data,{ask_phone:true}));assert.throws(()=>validateEventRegistration({...data,email:'bad'},{}));
});
test('export quotes commas and neutralizes spreadsheet formulas',()=>{
 const csv=participantExport([{name:'=1+1',email:'a@example.com',payment_reference:'A,"B"'}]);
 assert.ok(csv.includes('"\'=1+1"'));assert.ok(csv.includes('"A,""B"""'));assert.ok(csv.includes('registration_state'));
});
test('admin registration data is protected; unrelated origin cannot submit',async()=>{
 await assert.rejects(eventRegistrationHandler({method:'GET',headers:{}},{},new URL('http://localhost/api/admin/event-registration'),()=>assert.fail()),e=>e.status===401);
 await assert.rejects(eventRegistrationHandler({method:'POST',headers:{origin:'https://invalid.example'}},{},new URL('http://localhost/api/public/event-registration'),()=>assert.fail()),e=>e.status===403);
});
