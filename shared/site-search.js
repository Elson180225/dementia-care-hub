export function normalizeSearch(value) {
  return String(value || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

const synonyms = {
  events: 'event', workshops: 'workshop', webinars: 'webinar',
  carers: 'caregiver', carer: 'caregiver', caregivers: 'caregiver',
  alzheimers: 'alzheimer', doctors: 'doctor', hospitals: 'hospital',
  bantuan: 'financial', kewangan: 'financial', penjaga: 'caregiver',
  demensia: 'dementia', 失智症: 'dementia', 照顾者: 'caregiver',
};
const tokens = value => normalizeSearch(value).split(' ').filter(Boolean).map(word => synonyms[word] || word);

// All query terms must match; title matches rank above category and body matches.
export function rankSearch(items, query) {
  const terms = tokens(query);
  if (!terms.length) return [];
  const seen = new Set();
  return items.map(item => {
    const title = tokens(item.title), category = tokens(item.category);
    const body = tokens([item.description, item.keywords].join(' '));
    let score = 0;
    for (const term of terms) {
      const matches = words => words.some(word => word === term || word.startsWith(term));
      if (matches(title)) score += 10;
      else if (matches(category)) score += 5;
      else if (matches(body)) score += 1;
      else return { item, score: 0 };
    }
    if (normalizeSearch(item.title).includes(normalizeSearch(query))) score += 15;
    return { item, score };
  }).filter(row => row.score > 0).sort((a, b) => b.score - a.score)
    .filter(({ item }) => { const key = item.id || item.path; if (seen.has(key)) return false; seen.add(key); return true; })
    .map(({ item }) => item);
}

export function publicSearchItems(activities = [], organisations = [], resources = []) {
  return [
    ...activities.map(row => ({ id: `event-${row.id}`, title: row.title, description: row.description || '',
      category: 'Events', keywords: [row.type, row.mode, row.city, row.venue, row.language, row.audience].join(' '),
      path: `/learn-events/event/${encodeURIComponent(row.id)}` })),
    ...organisations.filter(row => !row.is_example).map(row => ({ id: `organisation-${row.id}`, title: row.name,
      description: row.specialist_field || row.eligibility || '', category: 'Find Help',
      keywords: [row.category, row.city, row.state, ...(Array.isArray(row.services) ? row.services : [row.services || ''])].join(' '),
      path: `/find-help/resource-finder?resource=${encodeURIComponent(row.id)}#finder-results` })),
    ...resources.map(row => ({ id: `resource-${row.id}`, title: row.title, description: row.description || '',
      category: 'Learning Resources', keywords: [row.topic, row.language, row.audience].join(' '),
      path: `/learn-events/online-education#learning-resource-${encodeURIComponent(row.id)}` })),
  ];
}
