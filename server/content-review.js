const dueContent = `
 WITH content AS (
  SELECT 'Directory' AS kind, 'Directory listing' AS type, name AS title, review_status, next_review_at FROM organisations
  UNION ALL SELECT 'Learning resources', 'Learning resource', title, review_status, next_review_at FROM learning_resources
  UNION ALL SELECT 'Content and FAQs', 'Content page', title, review_status, next_review_at FROM content_pages
  UNION ALL SELECT 'Content and FAQs', 'FAQ', question, review_status, next_review_at FROM faqs
 ), due AS (
  SELECT kind, type, title, next_review_at FROM content
  WHERE review_status = 'needs review' OR (review_status <> 'archived' AND next_review_at <= now())
 )`;

export async function dueContentItems(db) {
 return (await db.query(dueContent + `
  SELECT type, title, next_review_at FROM due ORDER BY next_review_at NULLS LAST, type, title`)).rows;
}

export async function maintenanceCounts(db) {
 return (await db.query(dueContent + `
  SELECT kind, count FROM (
   SELECT 1 AS position, 'Directory' AS kind, count(*)::int AS count FROM due WHERE kind = 'Directory'
   UNION ALL SELECT 2, 'Learning resources', count(*)::int FROM due WHERE kind = 'Learning resources'
   UNION ALL SELECT 3, 'Content and FAQs', count(*)::int FROM due WHERE kind = 'Content and FAQs'
   UNION ALL SELECT 4, 'Enquiries', count(*)::int FROM enquiries WHERE status <> 'closed'
  ) AS totals ORDER BY position`)).rows;
}
