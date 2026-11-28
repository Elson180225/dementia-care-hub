import test from 'node:test';
import assert from 'node:assert/strict';
import { historicalWebinarSchedule } from '../shared/historical-webinar-schedule.js';

test('each historical webinar defines Malaysia poster-aligned start time', () => {
  assert.equal(historicalWebinarSchedule.length, 11);
  const osteoporosis = historicalWebinarSchedule.find((r) => r.id.endsWith('011'));
  assert.equal(osteoporosis.starts_at, '2025-10-18 20:00:00+08');
  assert.equal(osteoporosis.planned_hours, 1.25);
  for (const row of historicalWebinarSchedule) {
    assert.match(row.starts_at, /\+08$/);
    assert.ok(row.planned_hours > 0);
    assert.ok(row.poster);
  }
});