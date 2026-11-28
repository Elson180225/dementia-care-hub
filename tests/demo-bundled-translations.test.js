import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bundledTranslationMap,
  mergePublishedTranslations,
} from '../shared/published-bundled-translations.js';

test('bundled map includes UI and CMS suggestions', () => {
  const sources = {
    'ui/header/search': 'Search',
    'cms/certifiedTrainers/hero/title': 'Meet your facilitators.',
  };
  const ms = bundledTranslationMap(sources, 'ms');
  assert.ok(ms['ui/header/search']?.text);
  assert.equal(ms['cms/certifiedTrainers/hero/title'].text, 'Kenali fasilitator anda.');
});

test('published merge fills gaps and database-approved rows win', () => {
  const sources = { 'ui/header/search': 'Search', 'ui/header/topBar': 'Bar' };
  const dbApproved = {
    'ui/header/search': { source: 'Search', text: 'Carian kelulusan RCBC' },
  };
  const merged = mergePublishedTranslations(dbApproved, sources, 'ms');
  assert.equal(merged['ui/header/search'].text, 'Carian kelulusan RCBC');
  assert.notEqual(merged['ui/header/topBar'].text, 'Bar');
});