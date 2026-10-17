// Isolated PostgreSQL engine check. Install @electric-sql/pglite outside the app,
// then set TEST_PGLITE_MODULE to its dist/index.js absolute path.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(process.env.TEST_PGLITE_MODULE ? pathToFileURL(process.env.TEST_PGLITE_MODULE).href : '@electric-sql/pglite');
const db = new PGlite();
try {
 await db.exec(await readFile(new URL('./001_shared_records.sql', import.meta.url), 'utf8'));
 const admin='00000000-0000-4000-8000-000000000001';
 const trainer1='00000000-0000-4000-8000-000000000002';
 const trainer2='00000000-0000-4000-8000-000000000003';
 await db.exec(`SET search_path=rcbc,public; SET rcbc.actor_id='${admin}';
 INSERT INTO users(id,email,display_name,password_hash,role,active,created_by,activated_by,activated_at)
 VALUES ('${admin}','admin@example.test','RCBC Admin','$argon2id$test-hash','admin',true,'${admin}','${admin}',now()),
 ('${trainer1}','one@example.test','Trainer One','$argon2id$test-hash','certified_trainer',true,'${admin}','${admin}',now()),
 ('${trainer2}','two@example.test','Trainer Two','$argon2id$test-hash','certified_trainer',true,'${admin}','${admin}',now());`);
 const p1=(await db.query(`INSERT INTO trainer_profiles(user_id) VALUES ($1) RETURNING id`,[trainer1])).rows[0].id;
 const p2=(await db.query(`INSERT INTO trainer_profiles(user_id) VALUES ($1) RETURNING id`,[trainer2])).rows[0].id;
 const activity=(await db.query(`INSERT INTO activities(created_by,title,type_code) VALUES ($1,'Test workshop','workshop') RETURNING id`,[trainer1])).rows[0].id;
 await db.query(`INSERT INTO activity_trainers VALUES ($1,$2,'trainer'),($1,$3,'speaker')`,[activity,p1,p2]);
 async function rejected(sql, params=[]) { await assert.rejects(db.query(sql,params)); }
 await rejected(`UPDATE activities SET status='submitted' WHERE id=$1`,[activity]);
 await rejected(`UPDATE trainer_profiles SET status='returned' WHERE id=$1`,[p1]);
 await rejected(`INSERT INTO activity_trainers VALUES ($1,$2,'co_trainer')`,[activity,p1]);
 await rejected(`INSERT INTO users(email,display_name,password_hash,role) VALUES ('x@y.test','X','plaintext','admin')`);
 await rejected(`INSERT INTO subscribers(name,email,city,state,preferred_language,consent_given,consent_at,consent_text_version,privacy_notice_version,unsubscribe_token_hash) VALUES ('X','x@y.test','Bintulu','Sarawak','en',false,now(),'v1','v1','hash')`);
 await db.query(`UPDATE activities SET starts_at='2026-09-12 10:00+08',mode='online',language_code='en',target_audience='Public',description='Example',planned_hours=2,status='submitted' WHERE id=$1`,[activity]);
 await db.query(`UPDATE activities SET status='approved',reviewed_by=$2,reviewed_at=now(),lifecycle='published',published_at=now() WHERE id=$1`,[activity,admin]);
 assert.equal((await db.query('SELECT * FROM public_activities')).rows.length,1);
 await db.query(`UPDATE activities SET lifecycle='completed',completed_at=now(),actual_venue='Online',participant_count=48,actual_hours=2,completion_status='submitted',completion_submitted_by=$2,completion_submitted_at=now() WHERE id=$1`,[activity,trainer1]);
 assert.equal((await db.query('SELECT * FROM trainer_annual_totals')).rows.length,0);
 await db.query(`UPDATE activities SET lifecycle='verified',completion_status='verified',completion_reviewed_by=$2,completion_reviewed_at=now() WHERE id=$1`,[activity,admin]);
 const trainers=(await db.query('SELECT * FROM trainer_annual_totals')).rows;
 assert.equal(trainers.length,2);
 assert.ok(trainers.every(r=>Number(r.verified_hours)===2 && Number(r.participants_reached)===48 && r.year===2026));
 const project=(await db.query('SELECT * FROM project_annual_totals')).rows[0];
 assert.equal(Number(project.participant_attendances),48);
 assert.equal(Number(project.activities_conducted),1);
 await db.query(`UPDATE activities SET lifecycle='archived',archived_at=now() WHERE id=$1`,[activity]);
 assert.equal((await db.query('SELECT * FROM trainer_annual_totals')).rows.length,2);
 await db.query(`UPDATE activities SET lifecycle='completed',completion_status='returned',completion_admin_comment='Correct participant count' WHERE id=$1`,[activity]);
 assert.equal((await db.query('SELECT * FROM trainer_annual_totals')).rows.length,0);
 const history=(await db.query(`SELECT * FROM audit_log WHERE entity_table='activities' AND entity_id=$1 ORDER BY id`,[activity])).rows;
 assert.ok(history.length>=6);
 assert.equal(history.at(-1).actor_id,admin);
 assert.equal(history.at(-1).admin_comment,'Correct participant count');
 const secretAudit=(await db.query(`SELECT * FROM audit_log WHERE entity_table='users'`)).rows;
 assert.ok(secretAudit.every(r=>!('password_hash' in r.new_values)));
 await rejected(`DELETE FROM audit_log`);
 await rejected(`TRUNCATE audit_log`);
 await db.exec(`RESET rcbc.actor_id`);
 await rejected(`UPDATE activities SET title='Unaudited edit' WHERE id=$1`,[activity]);
 console.log('PASS: migration, constraints, audit attribution/immutability, public projection, verified totals, archive inclusion, and multi-trainer project reach.');
} catch (error) { console.error(error.message); process.exitCode=1; } finally { await db.close(); }

