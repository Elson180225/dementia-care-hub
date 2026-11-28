import test from 'node:test';
import assert from 'node:assert/strict';
import { translations } from '../src/i18n/translations.js';
import { sourceLeaves } from '../shared/translation-review.js';

test('every catalogue English leaf has Malay and Chinese wording', () => {
  const en = sourceLeaves(translations.en);
  const ms = sourceLeaves(translations.ms);
  const zh = sourceLeaves(translations.zh);
  const missingMs = Object.keys(en).filter((key) => !ms[key]?.trim());
  const missingZh = Object.keys(en).filter((key) => !zh[key]?.trim());
  assert.deepEqual(
    missingMs,
    [],
    `Missing Malay for: ${missingMs.slice(0, 8).join(', ')}${missingMs.length > 8 ? '…' : ''}`
  );
  assert.deepEqual(
    missingZh,
    [],
    `Missing Chinese for: ${missingZh.slice(0, 8).join(', ')}${missingZh.length > 8 ? '…' : ''}`
  );
});