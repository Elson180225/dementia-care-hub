import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAnnualReport, reportYears } from '../src/admin/annualReport.js';
import { buildXlsx } from '../src/admin/xlsx.js';

// RCBC's worked example: one 4-hour activity, 30 attendances, trainers A/B/C = 3/2/1 hours.
const state = {
  users: [{ id: 'admin1', role: 'admin', name: 'Admin' }, { id: 'tA', role: 'trainer', name: 'Trainer A' }],
  profiles: [],
  activities: [
    { id: '11111111-aaaa', title: 'Family Caregiving Workshop', type: 'Workshop', mode: 'Physical', city: 'Bintulu', language: 'English', date: '2026-03-10T09:00', created_by: 'admin1',
      trainers: [{ trainerId: 'tA', name: 'Trainer A', role: 'Trainer', hours: 3 }, { trainerId: 'tB', name: 'Trainer B', role: 'Co-Trainer', hours: 2 }, { trainerId: 'tC', name: 'Trainer C', role: 'Speaker', hours: 1 }],
      completion: { status: 'verified', participants: 30, eventHours: 4, venue: 'Community Hall' } },
    { id: '22222222-bbbb', title: 'Online Dementia Talk', type: 'Seminar', mode: 'Online', city: '', language: 'Malay', date: '2026-07-01T20:00', created_by: 'tA',
      trainers: [{ trainerId: 'tA', name: 'Trainer A', role: 'Speaker', hours: 1.5 }],
      completion: { status: 'verified', participants: 45, eventHours: 1.5 } },
    { id: '33333333-cccc', title: 'Not yet verified', type: 'Workshop', mode: 'Physical', city: 'Miri', date: '2026-08-01T09:00', created_by: 'tA',
      trainers: [{ trainerId: 'tA', role: 'Trainer', hours: 5 }], completion: { status: 'submitted', participants: 99, eventHours: 5 } },
    { id: '44444444-dddd', title: 'Last year', type: 'Workshop', mode: 'Physical', city: 'Sibu', date: '2025-05-01T09:00', created_by: 'tA',
      trainers: [{ trainerId: 'tA', role: 'Trainer', hours: 2 }], completion: { status: 'verified', participants: 10, eventHours: 2 } },
  ],
};

test('totals follow RCBC counting rules and only count verified activities in the year', () => {
  const { totals, filename } = buildAnnualReport(state, 2026);
  assert.equal(filename, 'RCBC_Training_Annual_Report_2026.xlsx');
  assert.deepEqual(totals, { activities: 2, activeTrainers: 3, attendance: 75, trainerHours: 7.5, activityHours: 5.5, places: 2 });
});

test('five sheets: one row per activity and one row per trainer contribution', () => {
  const { sheets } = buildAnnualReport(state, 2026);
  assert.deepEqual(sheets.map((s) => s.name), ['01 Annual Summary', '02 Activity Master', '03 Trainer Contribution', '04 Trainer Annual Summary', '05 Geographical & Activity']);
  assert.equal(sheets[1].rows.length, 1 + 2);
  assert.equal(sheets[2].rows.length, 1 + 4);
  const trainerA = sheets[3].rows.find((r) => r[0] === 'Trainer A');
  assert.deepEqual(trainerA, ['Trainer A', 2, 4.5, 75]);
  assert.ok(sheets[4].rows.some((r) => r[0] === 'Bintulu' && r[1] === 1));
  assert.ok(sheets[4].rows.some((r) => r[0] === 'Online' && r[2] === 45));
});

test('years list includes years with verified activities', () => {
  assert.ok(reportYears(state.activities).includes(2025));
  assert.ok(reportYears(state.activities).includes(2026));
});

test('the workbook is a valid zip with the Excel parts and escaped text', () => {
  const bytes = buildXlsx([{ name: 'Sheet/1', rows: [['Name', 'Hours'], ['A & B <x>', 3], ['=cmd', 1.5]] }]);
  assert.equal(bytes[0], 0x50); assert.equal(bytes[1], 0x4b);
  const text = new TextDecoder().decode(bytes);
  for (const part of ['[Content_Types].xml', 'xl/workbook.xml', 'xl/styles.xml', 'xl/worksheets/sheet1.xml']) assert.ok(text.includes(part), part);
  assert.ok(text.includes('A &amp; B &lt;x&gt;'));
  assert.ok(text.includes('t="inlineStr"><is><t xml:space="preserve">=cmd'));
  assert.ok(text.includes('name="Sheet 1"'));
});
