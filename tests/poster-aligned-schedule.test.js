import test from 'node:test';
import assert from 'node:assert/strict';
import content from '../shared/learn-events-content.json' with { type: 'json' };
import { historicalWebinarSchedule } from '../shared/historical-webinar-schedule.js';
import { upcomingPosterTimes } from '../shared/poster-aligned-schedule.js';

test('historical webinars use Malaysia start times aligned with seed posters', () => {
  assert.equal(historicalWebinarSchedule.length, 11);
  for (const row of historicalWebinarSchedule) {
    assert.match(row.starts_at, /\+08$/);
    assert.ok(row.planned_hours >= 1.25);
  }
});

test('upcoming CMS topics match poster-aligned clock times', () => {
  for (const topic of content.onlineEducation.upcomingTopics) {
    const expected = upcomingPosterTimes[topic.id];
    assert.ok(expected, `missing poster time for ${topic.id}`);
    assert.equal(topic.time, expected);
    assert.ok(!/^\d+\s*minutes$/i.test(topic.time));
  }
});