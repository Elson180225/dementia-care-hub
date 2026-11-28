import test from 'node:test';
import assert from 'node:assert/strict';
import { posterFacilitators, posterFacilitatorIds, isPosterFacilitator } from '../shared/poster-facilitators.js';

test('poster catalog lists exactly nine certified facilitators', () => {
  assert.equal(posterFacilitators.length, 9);
  assert.deepEqual(posterFacilitators.map((r) => String(r.id)), posterFacilitatorIds);
});

test('only Catherine Suhani is recorded as Non-HCP on the poster', () => {
  const nonHcp = posterFacilitators.filter((r) => r.healthcare_professional === false);
  assert.equal(nonHcp.length, 1);
  assert.match(nonHcp[0].name, /Catherine Suhani/);
});

test('QA/QC advisory names are not in the poster facilitator catalog', () => {
  const names = posterFacilitators.map((r) => r.name).join(' ');
  for (const excluded of ['Sally Suriani', 'Tiong Ing Khieng', 'Ling Jia Nee', 'Pearly Chai', 'Sharon Lau']) {
    assert.ok(!names.includes(excluded), excluded);
  }
});

test('isPosterFacilitator guards legacy import ids', () => {
  assert.equal(isPosterFacilitator(3), true);
  assert.equal(isPosterFacilitator('10'), false);
});