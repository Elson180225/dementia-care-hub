import test from 'node:test';
import assert from 'node:assert/strict';
import { rankSearch, publicSearchItems } from '../shared/site-search.js';
import { eventSchema, whatsappShareUrl, reviewedDate } from '../shared/public-features.js';
import { searchItems } from '../src/components/Search/searchItems.js';

test('search matches words in any order, prefixes, plurals and caregiver synonyms', () => {
  assert.ok(rankSearch(searchItems, 'support carer').some(row => row.title === 'Caregiver Wellbeing'));
  assert.ok(rankSearch(searchItems, 'events').length);
  assert.ok(rankSearch(searchItems, 'HEALTH hosp').length);
  assert.deepEqual(rankSearch(searchItems, '   '), []);
  assert.deepEqual(rankSearch(searchItems, 'caregiver xyzunknown'), []);
});

test('title matches rank first and repeated paths are deduplicated', () => {
  const items = [{ title: 'Support', description: 'memory', path: '/a' }, { title: 'Memory', path: '/b' }, { title: 'Memory', path: '/b' }];
  assert.deepEqual(rankSearch(items, 'memory').map(row => row.path), ['/b', '/a']);
});

test('public event search includes location and uses an encoded event URL', () => {
  const items = publicSearchItems([{ id: 'event/1', title: 'Family Workshop', city: 'Kuching' }], [{ id: 'example', is_example: true }]);
  assert.equal(items.length, 1);
  assert.equal(rankSearch(items, 'kuching workshop')[0].path, '/learn-events/event/event%2F1');
});

test('WhatsApp preserves Unicode and URL parameters without altering the message', () => {
  const share = new URL(whatsappShareUrl('照顾者 & families', 'https://care.example/event/1?a=2&b=3'));
  assert.equal(share.origin, 'https://wa.me');
  assert.equal(share.searchParams.get('text'), '照顾者 & families\nhttps://care.example/event/1?a=2&b=3');
  assert.throws(() => whatsappShareUrl('Bad', 'javascript:alert(1)'));
});

test('review stamps omit missing and invalid dates and use Malaysia dates', () => {
  assert.equal(reviewedDate(null), null);
  assert.equal(reviewedDate('invalid'), null);
  assert.match(reviewedDate('2026-11-20T20:00:00Z').label, /21 November 2026/);
});

test('event metadata preserves timezone, cancellation, unique URL and real venue', () => {
  const schema = eventSchema({ id: '1', title: 'Workshop', starts_at: '2026-12-01T09:00:00+08:00', venue: 'Community Hall', city: 'Kuching', cancelled_at: '2026-11-01' }, 'https://care.example');
  assert.equal(schema.startDate, '2026-12-01T01:00:00.000Z');
  assert.equal(schema.eventStatus, 'https://schema.org/EventCancelled');
  assert.equal(schema.url, 'https://care.example/learn-events/event/1');
  assert.equal(schema.location.address.addressLocality, 'Kuching');
  assert.equal(schema.offers, undefined);
  assert.equal(eventSchema({ id: '1', title: 'Undated' }, 'https://care.example'), null);
  assert.equal(eventSchema({ id: '1', title: 'No venue', starts_at: '2026-12-01' }, 'https://care.example'), null);
});
