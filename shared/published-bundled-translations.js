import { translations } from '../src/i18n/translations.js';
import { sourceLeaves } from './translation-review.js';
import { cmsTranslationForSource } from './cms-translation-catalog.js';

/** Bundled ms/zh wording plus explicit CMS suggestions. DB-approved rows still win on merge. */
export function bundledTranslationMap(sources, language) {
  if (language === 'en' || !['ms', 'zh'].includes(language)) return {};
  const wording = sourceLeaves(translations[language]);
  const approved = {};
  for (const [key, source] of Object.entries(sources)) {
    const fromUi = wording[key];
    const fromCms = cmsTranslationForSource(key, source, language);
    const text = (typeof fromUi === 'string' && fromUi.trim() ? fromUi : fromCms || '').trim();
    if (text) approved[key] = { source, text };
  }
  return approved;
}

export function mergePublishedTranslations(dbApproved, sources, language) {
  return { ...bundledTranslationMap(sources, language), ...dbApproved };
}

export const publishedBaselineComment =
  'Bundled catalogue wording published for the public site. RCBC may amend in Admin → Language & translations.';