import test from 'node:test';
import assert from 'node:assert/strict';
import { translations } from '../src/i18n/translations.js';
import { inlineCopy } from '../src/i18n/inlineCopy.js';
import { inlineCopyMetadata } from '../shared/inline-copy-metadata.js';
import { translationPage, translationPages } from '../shared/translation-workspace.js';
import { defaultReviewType, reviewTransition, sourceLeaves, translateTree } from '../shared/translation-review.js';
import { createLabelLookup, translateFixedLabel, translateCataloguedLabel } from '../src/i18n/labelLookup.js';

const original = translations.en;
const catalogue = sourceLeaves(original);
const pageIds = new Set(translationPages.map(page => page.id));

test('all 262 fixed labels are individually reviewable and assigned to a real admin page', () => {
  assert.equal(Object.keys(inlineCopy).length, 262);
  assert.deepEqual(new Set(Object.keys(inlineCopy)), new Set(Object.keys(inlineCopyMetadata)));
  for (const [key, [en, ms, zh]] of Object.entries(inlineCopy)) {
    const sourceKey = `ui/inlineCopy/${key}`;
    assert.equal(catalogue[sourceKey], en, key);
    assert.equal(translations.ms.inlineCopy[key], ms, key);
    assert.equal(translations.zh.inlineCopy[key], zh, key);
    assert.ok(pageIds.has(translationPage(sourceKey)), key);
    assert.ok(['standard', 'medical', 'professional'].includes(defaultReviewType(sourceKey)), key);
  }
});

test('ordinary UI labels are standard and domain-specific claims retain stronger review defaults', () => {
  const cases = [
    ['projectUpdates', 'home', 'standard'],
    ['groupsLoading', 'caregiver', 'standard'],
    ['providerCityFilter', 'help', 'standard'],
    ['eventDetailsClose', 'education', 'standard'],
    ['selectedTopic', 'understanding', 'standard'],
    ['leaveBlank', 'contact', 'standard'],
    ['mainNavigation', 'shared', 'standard'],
    ['providerDesc1', 'help', 'medical'],
    ['governanceText', 'education', 'professional'],
    ['caregiverEducation', 'caregiver', 'professional'],
  ];
  for (const [key, page, type] of cases) {
    assert.equal(translationPage(`ui/inlineCopy/${key}`), page, key);
    assert.equal(defaultReviewType(`ui/inlineCopy/${key}`), type, key);
  }
});

test('one approved translation cannot affect another identical English label', () => {
  const a = 'psychiatryMental';
  const b = 'psychiatryAndMentalHealth';
  const source = original.inlineCopy[a];
  assert.equal(source, original.inlineCopy[b]);
  const firstOnly = translateTree(original, 'ui', {
    [`ui/inlineCopy/${a}`]: { source, text: 'Khusus A' },
  });
  assert.equal(translateCataloguedLabel(source, a, original, firstOnly), 'Khusus A');
  assert.equal(translateCataloguedLabel(source, b, original, firstOnly), source);
  assert.equal(translateFixedLabel(source, createLabelLookup(original, firstOnly)), source);

  const both = translateTree(original, 'ui', {
    [`ui/inlineCopy/${a}`]: { source, text: 'Khusus A' },
    [`ui/inlineCopy/${b}`]: { source, text: 'Khusus B' },
  });
  assert.equal(translateCataloguedLabel(source, a, original, both), 'Khusus A');
  assert.equal(translateCataloguedLabel(source, b, original, both), 'Khusus B');
  assert.equal(translateFixedLabel(source, createLabelLookup(original, both)), source);
});

test('unapproved labels remain English and source mismatches cannot apply stale approvals', () => {
  const key = 'eventDetailsClose';
  const source = original.inlineCopy[key];
  const noApproval = translateTree(original, 'ui', {});
  assert.equal(translateCataloguedLabel(`  ${source}  `, key, original, noApproval), `  ${source}  `);
  const stale = translateTree(original, 'ui', {
    [`ui/inlineCopy/${key}`]: { source: 'outdated source', text: 'SALAH' },
  });
  assert.equal(translateCataloguedLabel(source, key, original, stale), source);
  const approved = translateTree(original, 'ui', {
    [`ui/inlineCopy/${key}`]: { source, text: 'Tutup butiran acara' },
  });
  assert.equal(translateCataloguedLabel(`  ${source}  `, key, original, approved), '  Tutup butiran acara  ');
  assert.equal(translateCataloguedLabel('Completely different copy', key, original, approved), 'Completely different copy');
});

test('standard review still requires RCBC admin approval and medical review still requires an expert', () => {
  const source = 'Close event details';
  const editor = { id: 'translator', admin: false, scopes: [] };
  const admin = { id: 'admin', admin: true, scopes: [] };
  const reviewer = { id: 'expert', admin: false, scopes: ['medical'] };
  const standardDraft = { source_text: source, translated_text: 'Tutup butiran acara', review_type: 'standard', status: 'draft', edited_by: 'translator' };
  const inReview = reviewTransition(standardDraft, source, 'submit', editor);
  assert.throws(() => reviewTransition(inReview, source, 'approve', editor), /admin approval/);
  assert.equal(reviewTransition(inReview, source, 'approve', admin).status, 'approved');

  const medicalDraft = { ...standardDraft, review_type: 'medical' };
  const medicalReview = reviewTransition(medicalDraft, source, 'submit', editor);
  assert.throws(() => reviewTransition(medicalReview, source, 'approve', admin), /expert review/);
  const expertReviewed = reviewTransition(medicalReview, source, 'expert-review', reviewer);
  assert.equal(reviewTransition(expertReviewed, source, 'approve', admin).status, 'approved');
});
