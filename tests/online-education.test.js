import test from 'node:test';
import assert from 'node:assert/strict';
import {orderWebinars,topicDateFields,publicLink,resourceQaFolder} from '../shared/online-education.js';

test('upcoming dates sort nearest first, past dates newest first before pagination',()=>{
 const items=[{id:1,rawDate:'2025-01-01'},{id:2,rawDate:'2027-12-01'},{id:3,rawDate:'2026-08-01'},{id:4,rawDate:'2026-12-01'},{id:5,date:'not a date'}];
 const result=orderWebinars(items,Date.parse('2026-10-29'));
 assert.deepEqual(result.map(i=>i.id),[4,2,3,1,5]);assert.equal(result[2].status,'completed');assert.equal(items[2].status,undefined);
});
test('one date generates consistent badge and display fields in Malaysia time',()=>{
 assert.deepEqual(topicDateFields('2027-02-05'),{dateISO:'2027-02-05',date:'5 Feb 2027',day:'5',month:'FEB',year:'2027'});
 assert.equal(topicDateFields('5 Feb 2027').day,'5');assert.deepEqual(topicDateFields('invalid'),{});
});
test('empty and unsafe links are unavailable',()=>{
 for(const value of ['',null,'  ','javascript:alert(1)','#','not a link'])assert.equal(publicLink(value),'');
 assert.equal(publicLink('https://forms.gle/example'),'https://forms.gle/example');
});
test('Q&A identity uses explicit folder or legacy index, never card order',()=>{
 assert.equal(resourceQaFolder({qaFolder:'Understanding the Missing Pieces'}),'Understanding the Missing Pieces');
 assert.equal(resourceQaFolder({qaIndex:0}),'Oral Health Webinar');assert.equal(resourceQaFolder({}),'');
});
