/**
 * Legacy fallback for labels without a known source key. Never borrow an
 * approved translation from a different context when the English source is
 * duplicated: that would bypass approval for the second entry.
 *
 * New fixed labels use explicit ui/inlineCopy/<id> keys instead.
 */
export function createLabelLookup(english, displayed) {
  const candidates = new Map();
  function visit(original, translated) {
    if (typeof original === 'string' && typeof translated === 'string') {
      const source = original.trim();
      if (!source) return;
      const values = candidates.get(source) || [];
      values.push(translated);
      candidates.set(source, values);
    } else if (original && translated && typeof original === 'object' && typeof translated === 'object') {
      for (const [key, value] of Object.entries(original)) {
        if (Object.hasOwn(translated, key)) visit(value, translated[key]);
      }
    }
  }
  visit(english, displayed);
  const lookup = new Map();
  for (const [source, values] of candidates) {
    if (values.length && values.every(value => value === values[0]) && values[0] !== source) {
      lookup.set(source, values[0]);
    }
  }
  return lookup;
}

export function translateFixedLabel(label, lookup) {
  if (typeof label !== 'string') return label;
  const trimmed = label.trim();
  const text = lookup.get(trimmed);
  return text ? label.replace(trimmed, text) : label;
}

/**
 * Resolve a known label ONLY through its own review key; never through the
 * English-text lookup. Unapproved or stale entries keep their English source.
 */
export function translateCataloguedLabel(label, key, english, displayed) {
  if (typeof label !== 'string' || !key) return label;
  const source = english.inlineCopy?.[key];
  if (!source || label.trim().replace(/\s+/g, ' ') !== source.trim().replace(/\s+/g, ' ')) return label;
  const translation = displayed.inlineCopy?.[key] ?? source;
  const leading = label.match(/^\s*/)?.[0] || '';
  const trailing = label.match(/\s*$/)?.[0] || '';
  return `${leading}${translation}${trailing}`;
}
