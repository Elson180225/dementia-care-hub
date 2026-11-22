import { sourceLeaves } from '../../shared/translation-review.js';

/**
 * Build a local-development preview of the existing, unreviewed language copy.
 * Published translations always take precedence over bundled suggestions.
 * This is never enabled for a production build.
 */
export function bundledPreviewOverrides(english, localized, approved = {}) {
  const sources = sourceLeaves(english);
  const suggestions = sourceLeaves(localized);
  const preview = {};

  for (const [key, source] of Object.entries(sources)) {
    const translated = suggestions[key];
    if (typeof translated === 'string' && translated.trim()) {
      preview[key] = { source, text: translated };
    }
  }

  // An out-of-date approved row must not hide a still-valid local suggestion.
  const currentApproved = Object.fromEntries(
    Object.entries(approved).filter(([key, row]) => row?.source === sources[key])
  );
  return { ...preview, ...currentApproved };
}
