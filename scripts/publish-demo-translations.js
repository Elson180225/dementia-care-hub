import { pathToFileURL } from 'node:url';
import { translations } from '../src/i18n/translations.js';
import { defaultReviewType } from '../shared/translation-review.js';
import { translationPage } from '../shared/translation-workspace.js';
import { translationSources } from '../server/translations.js';
import { publishedBaselineComment, bundledTranslationMap } from '../shared/published-bundled-translations.js';
import { pool, databaseTransaction } from '../server/db.js';

/**
 * Seed or promote bundled ms/zh copy as approved so production builds show translations
 * without VITE preview. Skips rows RCBC has already approved or customized.
 */
async function publishBundledTranslationsWork(db, admin) {
    const sources = await translationSources(db);
    const bundledMs = bundledTranslationMap(sources, 'ms');
    const bundledZh = bundledTranslationMap(sources, 'zh');
    const requirements = Object.fromEntries(
      (await db.query('SELECT page_id, review_type FROM translation_page_requirements')).rows.map((r) => [
        r.page_id,
        r.review_type,
      ])
    );
    const summary = { ms: { published: 0, preserved: 0 }, zh: { published: 0, preserved: 0 } };

    for (const language of ['ms', 'zh']) {
      const bundled = language === 'ms' ? bundledMs : bundledZh;
      for (const [key, source] of Object.entries(sources).sort(([a], [b]) => a.localeCompare(b))) {
        const text = bundled[key]?.text?.trim();
        if (!text) continue;
        const reviewType = requirements[translationPage(key)] || defaultReviewType(key);
        const row = (await db.query(
          'SELECT * FROM translation_entries WHERE source_key = $1 AND language = $2 FOR UPDATE',
          [key, language]
        )).rows[0];

        if (row) {
          if (row.status === 'approved' && row.source_text === source) {
            summary[language].preserved++;
            continue;
          }
          if (row.translated_text.trim() && row.translated_text !== text) {
            summary[language].preserved++;
            continue;
          }
          const expertId = reviewType !== 'standard' ? admin.id : null;
          await db.query(
            `UPDATE translation_entries SET
              source_text = $3, translated_text = $4, review_type = $5, status = 'approved',
              edited_by = coalesce(edited_by, $6),
              expert_reviewed_by = coalesce($7, expert_reviewed_by),
              expert_reviewed_at = CASE WHEN $7 IS NOT NULL THEN coalesce(expert_reviewed_at, now()) ELSE expert_reviewed_at END,
              approved_by = $6, approved_at = now(), revision = revision + 1,
              review_comment = CASE WHEN review_comment = '' THEN $8 ELSE review_comment END,
              updated_at = now()
            WHERE source_key = $1 AND language = $2`,
            [key, language, source, text, reviewType, admin.id, expertId, publishedBaselineComment]
          );
          await db.query(
            'INSERT INTO translation_history(source_key, language, action, actor_id, snapshot) VALUES ($1, $2, $3, $4, $5)',
            [
              key,
              language,
              'approve',
              admin.id,
              JSON.stringify({
                origin: 'bundled-public-baseline',
                comment: publishedBaselineComment,
              }),
            ]
          );
          summary[language].published++;
          continue;
        }

        const expertId = reviewType !== 'standard' ? admin.id : null;
        const expertAt = expertId ? new Date() : null;
        await db.query(
          `INSERT INTO translation_entries(
            source_key, language, source_text, translated_text, review_type, status,
            edited_by, expert_reviewed_by, expert_reviewed_at, approved_by, approved_at,
            revision, review_comment
          ) VALUES ($1, $2, $3, $4, $5, 'approved', $6,
            $7::uuid, $9::timestamptz,
            $6, now(), 1, $8)`,
          [key, language, source, text, reviewType, admin.id, expertId, publishedBaselineComment, expertAt]
        );
        await db.query(
          'INSERT INTO translation_history(source_key, language, action, actor_id, snapshot) VALUES ($1, $2, $3, $4, $5)',
          [
            key,
            language,
            'approve',
            admin.id,
            JSON.stringify({
              origin: 'bundled-public-baseline',
              comment: publishedBaselineComment,
            }),
          ]
        );
        summary[language].published++;
      }
    }

    return { skipped: false, published: summary.ms.published + summary.zh.published, preserved: summary.ms.preserved + summary.zh.preserved, summary };
}

export async function publishBundledTranslations({ database = pool, client = null } = {}) {
  const lookupDb = client || database;
  const adminRow = (await lookupDb.query(
    "SELECT id FROM users WHERE role = 'admin' AND enabled ORDER BY created_at, id LIMIT 1"
  )).rows[0];
  if (!adminRow) return { skipped: true, reason: 'no-admin', published: 0, preserved: 0 };

  if (client) {
    await client.query("SELECT set_config('app.actor_id', $1, true)", [adminRow.id]);
    return publishBundledTranslationsWork(client, adminRow);
  }

  return databaseTransaction(database, (db) => publishBundledTranslationsWork(db, adminRow), adminRow.id);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(await publishBundledTranslations(), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}