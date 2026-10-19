import { pool } from '../server/db.js';
import { subscriberPool } from '../server/subscriber-db.js';
import { runReminders } from '../server/reminders.js';
try {
 if(!process.argv.includes('--dry-run') && process.env.REMINDERS_ENABLED!=='true') throw new Error('Set REMINDERS_ENABLED=true before running live reminders. Use npm run reminders:preview to inspect without sending.');
 console.log(JSON.stringify(await runReminders({dryRun:process.argv.includes('--dry-run')}),null,2));
} finally {await subscriberPool.end();if(subscriberPool!==pool)await pool.end();}
