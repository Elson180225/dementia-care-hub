import { readFile } from 'node:fs/promises';
const quote=s=>'"'+s.replaceAll('"','""')+'"';
export async function migrateSubscriberDatabase(db,{standalone=true}={}) {
 await db.query('SELECT pg_advisory_xact_lock(718422)');
 await db.query('CREATE TABLE IF NOT EXISTS subscriber_schema_migrations(name text PRIMARY KEY,applied_at timestamptz DEFAULT now())');
 for(const name of ['001_subscribers.sql','002_reminders.sql']) {
  if((await db.query('SELECT 1 FROM subscriber_schema_migrations WHERE name=$1',[name])).rowCount) continue;
  if(name==='001_subscribers.sql') {
   const schema=(await db.query('SELECT current_schema() AS name')).rows[0].name;
   const columns=(await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name='subscribers'",[schema])).rows.map(r=>r.column_name);
   if(columns.length) {
    const table=quote(schema)+'.subscribers';await db.query(`LOCK TABLE ${table} IN ACCESS EXCLUSIVE MODE`);
    if(!['id','email','name','city','state','language','consent_at','consent_version','unsubscribed_at','unsubscribe_hash','confirmed_at','source','provider_reference'].every(c=>columns.includes(c))) {
     if(!standalone || !['full_name','city_state','preferred_language','consent_given'].every(c=>columns.includes(c)) || (await db.query(`SELECT 1 FROM ${table} LIMIT 1`)).rowCount) throw new Error('Incompatible subscriber schema: migrate existing consent and opt-out records before proceeding. No changes applied.');
     const archive=schema==='public'?'subscriber_legacy':schema+'_legacy';
     await db.query(`CREATE SCHEMA IF NOT EXISTS ${quote(archive)}`);
     await db.query(`ALTER TABLE ${table} SET SCHEMA ${quote(archive)}`);
    }
   } else if(!standalone) throw new Error('Run the website database migrations first.');
  }
  if(standalone || name!=='001_subscribers.sql') await db.query(await readFile(new URL('../database/subscribers/'+name,import.meta.url),'utf8'));
  await db.query('INSERT INTO subscriber_schema_migrations(name) VALUES($1)',[name]);
 }
}
