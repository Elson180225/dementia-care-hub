import test from 'node:test';
import assert from 'node:assert/strict';
import {eventDate,eventTime,eventDateTime} from '../shared/event-dates.js';
import {participantEventGroup,eventsForGroup} from '../shared/participant-event-groups.js';
test('UTC deadlines display Malaysia day rollover with no seconds or raw timestamp',()=>{
 const value='2027-02-04T16:00:00.000Z';
 assert.equal(eventDate(value),'5 February 2027');
 assert.match(eventTime(value),/12:00\s*am/i);
 assert.doesNotMatch(eventDateTime(value),/T16|\.000Z|:00:00/);
});
test('event time uses explicit Malaysia timezone and invalid dates have readable fallbacks',()=>{
 assert.equal(eventDate('2027-02-10T23:00:00Z'),'11 February 2027');
 assert.match(eventTime('2027-02-10T23:00:00Z'),/7:00\s*am/i);
 assert.equal(eventDateTime('invalid'),'Date and time to be confirmed');
 assert.equal(eventDateTime(null),'Date and time to be confirmed');
});
test('participant groups use programme IDs, never title matching, and retain orphaned records',()=>{
 const programmes=[{id:'family'},{id:'ttt'}];
 const events=[{id:'a',programme_id:'family'},{id:'b',title:'DCS-Family webinar'},{id:'c',programme_id:'removed-programme'},{id:'d',programme_id:'ttt'}];
 assert.equal(participantEventGroup(events[1],programmes),'other');
 assert.deepEqual(eventsForGroup(events,programmes,'family').map(e=>e.id),['a']);
 assert.deepEqual(eventsForGroup(events,programmes,'other').map(e=>e.id),['b','c']);
});
