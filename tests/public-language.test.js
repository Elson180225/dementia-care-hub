import test from 'node:test';
import assert from 'node:assert/strict';
import { translations } from '../src/i18n/translations.js';
import { bundledPreviewOverrides } from '../src/i18n/bundledPreview.js';
import { createLabelLookup, translateFixedLabel } from '../src/i18n/labelLookup.js';
import { sourceLeaves, translateTree } from '../shared/translation-review.js';
import { inlineCopy } from '../src/i18n/inlineCopy.js';
import { supplementalCopy } from '../src/i18n/supplementalCopy.js';

function displayed(lang, approved = {}) {
  return translateTree(translations.en, 'ui', bundledPreviewOverrides(translations.en, translations[lang], approved));
}

test('local preview translates the first-visit welcome guide, dementia modules and new RCBC notices', () => {
  const ms = displayed('ms');
  const zh = displayed('zh');
  for (const localized of [ms, zh]) {
    assert.notEqual(localized.welcomeGuide.title, translations.en.welcomeGuide.title);
    assert.notEqual(localized.welcomeGuide.results.diagnosed.steps.money, translations.en.welcomeGuide.results.diagnosed.steps.money);
    assert.notEqual(localized.understandDementia.commonTypesTitle, translations.en.understandDementia.commonTypesTitle);
    assert.notEqual(localized.caregiverSupport.programmePlatformNotice, translations.en.caregiverSupport.programmePlatformNotice);
    assert.notEqual(localized.learnEvents.registrationCopy.dialogTitle, translations.en.learnEvents.registrationCopy.dialogTitle);
  }
});

test('all registered inline UI labels have complete Malay and Chinese suggestions', () => {
  for (const [key, translationsForLabel] of Object.entries(inlineCopy)) {
    assert.equal(translationsForLabel.length, 3, key);
    for (const text of translationsForLabel) assert.ok(typeof text === 'string' && text.trim(), key);
    assert.equal(translations.en.inlineCopy[key], translationsForLabel[0]);
    assert.equal(translations.ms.inlineCopy[key], translationsForLabel[1]);
    assert.equal(translations.zh.inlineCopy[key], translationsForLabel[2]);
  }
});

test('new suggestions retain English as public fallback without approval', () => {
  const unchanged = translateTree(translations.en, 'ui', {});
  assert.equal(unchanged.welcomeGuide.title, translations.en.welcomeGuide.title);
  assert.equal(unchanged.inlineCopy.registrationClosed, 'Registration Closed');
});

test('approved translations override preview suggestions and reject outdated English sources', () => {
  const key='ui/inlineCopy/registrationClosed';
  const ms=displayed('ms', {
    [key]:{source:'Registration Closed',text:'Ditutup dengan kelulusan RCBC'},
    'ui/inlineCopy/localPreview':{source:'OLD SOURCE',text:'INVALID'},
  });
  assert.equal(ms.inlineCopy.registrationClosed,'Ditutup dengan kelulusan RCBC');
  assert.equal(ms.inlineCopy.localPreview,translations.ms.inlineCopy.localPreview);
});

test('fixed label lookup translates presentation copy without modifying record identifiers', () => {
  const english=translations.en, local=displayed('zh');
  const lookup=createLabelLookup(english,local);
  assert.equal(translateFixedLabel('Loading support groups…',lookup), '正在加载支持小组…');
  assert.equal(translateFixedLabel('  Close event details  ',lookup), '  关闭活动详情  ');
  assert.equal(translateFixedLabel('/find-help/resource-finder',lookup), '/find-help/resource-finder');
  assert.equal(translateFixedLabel('provider-id-123',lookup), 'provider-id-123');
  assert.equal(translateFixedLabel(undefined,lookup), undefined);
});

test('all supplemental translations reference existing English source strings', () => {
  const enSources = sourceLeaves(translations.en);
  for (const [dotPath] of supplementalCopy) {
    const key='ui/'+dotPath.split('.').map(encodeURIComponent).join('/');
    assert.ok(enSources[key],key);
  }
});
