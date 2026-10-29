import { readFile } from 'node:fs/promises';
import { pool, transaction } from '../server/db.js';
try {
 await transaction(async db => {
  await db.query('SELECT pg_advisory_xact_lock(718421)');
  await db.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now())');
  for (const name of ['001_shared_records.sql','003_admin_auth.sql','004_record_details.sql','005_admin_workflow.sql','006_portal_operations.sql','007_content_feedback.sql','008_idle_sessions.sql','010_seed_past_webinars.sql','011_seed_trainer_webinar.sql','012_participants.sql']) {
   if (!(await db.query('SELECT 1 FROM schema_migrations WHERE name=$1',[name])).rowCount) {
    await db.query(await readFile(new URL('../database/'+name,import.meta.url),'utf8'));
    await db.query('INSERT INTO schema_migrations(name) VALUES($1)',[name]);
   }
  }
 });
 console.log('PostgreSQL migrations applied.');
} finally { await pool.end(); }
