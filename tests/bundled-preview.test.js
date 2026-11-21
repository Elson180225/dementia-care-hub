import test from 'node:test';
import assert from 'node:assert/strict';
import { bundledPreviewOverrides } from '../src/i18n/bundledPreview.js';
import { translations } from '../src/i18n/translations.js';
import { translateTree } from '../shared/translation-review.js';

test('local preview restores existing Malay and Chinese text without modifying English', () => {
  for (const language of ['ms', 'zh']) {
    const en = translations.en;
    const overrides = bundledPreviewOverrides(en, translations[language]);
    const result = translateTree(en, 'ui', overrides);
    assert.equal(result.header.menu.findHelp, translations[language].header.menu.findHelp);
    assert.equal(result.findHelp.card2.link1, translations[language].findHelp.card2.link1);
    assert.equal(en.header.menu.findHelp, 'Find Help & Support');
    assert.equal(result.supportDirectory.records[0].id, en.supportDirectory.records[0].id);
  }
});

test('approved text takes precedence over the bundled preview suggestion', () => {
  const key = 'ui/header/menu/findHelp';
  const overrides = bundledPreviewOverrides(translations.en, translations.ms, {
    [key]: { source: 'Find Help & Support', text: 'Approved reviewed wording' },
  });
  const result = translateTree(translations.en, 'ui', overrides);
  assert.equal(result.header.menu.findHelp, 'Approved reviewed wording');
});

test('untranslated entries fall back to English, not fabricated translations', () => {
  const english = { title: 'Original English', detail: 'No suggestion', id: 'stable' };
  const other = { title: 'Judul terjemahan', id: 'changed' };
  const overrides = bundledPreviewOverrides(english, other);
  const result = translateTree(english, 'ui', overrides);
  assert.equal(result.title, 'Judul terjemahan');
  assert.equal(result.detail, 'No suggestion');
  assert.equal(result.id, 'stable');
});

test('new Find Help strings are reachable from the translation catalogue in all languages', () => {
  const english = translations.en.findHelp;
  const keys = ['planningEyebrow', 'planningTitle', 'planningText'];
  const cardKeys = ['shortTitle', 'shortText'];
  for (const lang of ['en', 'ms', 'zh']) {
    const section = translations[lang].findHelp;
    for (const key of keys) assert.ok(section[key], lang + '/' + key);
    for (const key of cardKeys) {
      assert.ok(section.card1[key], lang + '/card1/' + key);
      assert.ok(section.card2[key], lang + '/card2/' + key);
    }
    assert.ok(section.card2.peerSupport && section.card2.planningLink);
  }
  assert.equal(english.card1.shortTitle, 'Concerned about changes?');
  assert.equal(english.card2.shortTitle, 'Already diagnosed?');
});
