// One-time baseline for SQL previously run manually in pgAdmin.
// Compare every expected column and constraint before recording any migration.
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { pool, transaction } from '../server/db.js';
const files=['001_shared_records.sql','003_admin_auth.sql','004_record_details.sql','005_admin_workflow.sql'];
try {
 await transaction(async db=>{
  await db.query('SELECT pg_advisory_xact_lock(718421)');
  const target=(await db.query('SELECT current_schema() AS name')).rows[0].name;
  const temporary='baseline_'+randomUUID().replaceAll('-','');
  await db.query(`CREATE SCHEMA ${temporary}`);
  await db.query(`SET LOCAL search_path TO ${temporary},public`);
  for(const file of files) await db.query(await readFile(new URL('../database/'+file,import.meta.url),'utf8'));
  const columns=async schema=>(await db.query(`SELECT table_name,column_name,udt_name,is_nullable,column_default,is_identity
   FROM information_schema.columns WHERE table_schema=$1 ORDER BY table_name,ordinal_position`,[schema])).rows;
  const expected=await columns(temporary),actual=await columns(target);
  const expectedTables=new Set(expected.map(c=>c.table_name));
  const actualRelevant=actual.filter(c=>expectedTables.has(c.table_name));
  if(JSON.stringify(expected)!==JSON.stringify(actualRelevant)) throw new Error('Existing columns differ from the expected baseline. No changes applied.');
  const constraints=async schema=>(await db.query(`SELECT r.relname,c.conname,pg_get_constraintdef(c.oid) AS definition
   FROM pg_constraint c JOIN pg_class r ON r.oid=c.conrelid JOIN pg_namespace n ON n.oid=r.relnamespace
   WHERE n.nspname=$1 ORDER BY r.relname,c.conname`,[schema])).rows;
  const exp=await constraints(temporary),act=(await constraints(target)).filter(c=>expectedTables.has(c.relname));
  const normal=rows=>JSON.stringify(rows).replaceAll(temporary+'.','').replaceAll(target+'.','');
  if(normal(exp)!==normal(act)) throw new Error('Existing constraints differ from the expected baseline. No changes applied.');
  await db.query(`SET LOCAL search_path TO "${target.replaceAll('"','""')}",public`);
  // Update the reviewed routine's accepted decisions without replaying any data.
  const draft=await readFile(new URL('../database/005_admin_workflow.sql',import.meta.url),'utf8');
  const start=draft.indexOf('CREATE FUNCTION record_admin_decision(');
  const end=draft.indexOf('END $$;',start)+'END $$;'.length;
  await db.query(draft.slice(start,end).replace('CREATE FUNCTION','CREATE OR REPLACE FUNCTION'));
  await db.query('CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY,applied_at timestamptz DEFAULT now())');
  for(const file of files) await db.query('INSERT INTO schema_migrations(name) VALUES($1) ON CONFLICT DO NOTHING',[file]);
  await db.query(`DROP SCHEMA ${temporary} CASCADE`);
 });
 console.log('Existing schema verified and recorded. No application records changed.');
}finally{await pool.end();}
