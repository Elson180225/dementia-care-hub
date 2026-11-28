import { readFile } from 'node:fs/promises';
import { pool, transaction } from '../server/db.js';
import { posterFacilitators } from '../shared/poster-facilitators.js';
import { publishBundledTranslations } from './publish-demo-translations.js';
try {
 await transaction(async db => {
  await db.query('SELECT pg_advisory_xact_lock(718421)');
  await db.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now())');
  for (const name of ['001_shared_records.sql','003_admin_auth.sql','004_record_details.sql','005_admin_workflow.sql','006_portal_operations.sql','007_content_feedback.sql','008_idle_sessions.sql','010_seed_past_webinars.sql','011_seed_trainer_webinar.sql','012_participants.sql','013_track_applications.sql','014_enquiry_notifications.sql','015_trainer_listing_approval.sql','016_trainer_certificate_evidence.sql','017_trainer_details_and_resource_examples.sql','018_trainer_assessment_status.sql','015_event_registration.sql','016_registration_setup.sql','017_participant_history.sql','019_programme_intakes.sql','020_translation_review.sql','021_translation_page_requirements.sql','022_registration_feedback.sql','022_password_reset.sql','023_trainer_governance.sql','024_trainer_archive.sql','025_persistent_learn_events.sql','026_review_reminder_deliveries.sql','027_event_attendance_reminders.sql','028_subscriber_country.sql','029_directory_service_listings.sql','030_contact_settings.sql','031_volunteer_resource_pool.sql','031_admin_mfa.sql','039_listing_requests.sql']) {
   if (!(await db.query('SELECT 1 FROM schema_migrations WHERE name=$1',[name])).rowCount) {
    await db.query(await readFile(new URL('../database/'+name,import.meta.url),'utf8'));
    if(name.startsWith('023_')){
     for(const legacy of posterFacilitators){
      if((await db.query('SELECT 1 FROM trainer_profiles WHERE legacy_source_id=$1',[String(legacy.id)])).rowCount)continue;
      const account=(await db.query("INSERT INTO users(email,name,password_hash,role,enabled) VALUES('legacy-'||gen_random_uuid()::text||'@unclaimed.invalid',$1,repeat('0',32)||':'||repeat('0',128),'trainer',false) RETURNING id",[legacy.name||'Trainer awaiting review'])).rows[0];
      await db.query("INSERT INTO trainer_profiles(id,city,language,short_profile,qualifications,photo_url,portal_access_enabled,legacy_source_id,legacy_source,healthcare_professional) VALUES($1,$2,$3,$4,$5,$6,false,$7,$8,$9)",[account.id,legacy.city||'',legacy.language||'',legacy.bio||'',legacy.role||'',legacy.avatarUrl||null,String(legacy.id),JSON.stringify(legacy),legacy.healthcare_professional]);
     }
    }
    await db.query('INSERT INTO schema_migrations(name) VALUES($1)',[name]);
   }
  }
  for(const name of ['028_dcs_registry.sql','029_activity_records.sql','030_webinar_publication.sql','031_participant_attendance.sql','032_learning_resource_master.sql','033_trainer_training_and_portal_preferences.sql','034_learning_qa_and_webinar_times.sql']){
   if(!(await db.query('SELECT 1 FROM schema_migrations WHERE name=$1',[name])).rowCount){
    await db.query(await readFile(new URL('../database/'+name,import.meta.url),'utf8'));
    await db.query('INSERT INTO schema_migrations(name) VALUES($1)',[name]);
   }
  }
  await db.query('SELECT seed_historical_webinars()');
  for(const name of ['035_historical_demo_approval.sql','036_learning_resources_public_repair.sql','037_poster_aligned_webinar_times.sql','038_poster_facilitators_only.sql']){
   if(!(await db.query('SELECT 1 FROM schema_migrations WHERE name=$1',[name])).rowCount){
    await db.query(await readFile(new URL('../database/'+name,import.meta.url),'utf8'));
    await db.query('INSERT INTO schema_migrations(name) VALUES($1)',[name]);
   }
  }
  await db.query('SELECT sync_poster_aligned_webinar_times()').catch(() => {});
  await db.query('SELECT apply_historical_demo_approval()');
  await db.query('SELECT repair_learning_resources_public()').catch(() => {});
  await db.query('SELECT sync_poster_facilitators_catalog()').catch(() => {});
  const pub = await publishBundledTranslations({ client: db });
  if (!pub.skipped) console.log('Published bundled translations:', pub.published, 'inserted/updated,', pub.preserved, 'preserved.');
  else console.log('Bundled translation publish skipped:', pub.reason || 'unknown');
 });
 console.log('PostgreSQL migrations applied.');
} finally { await pool.end(); }