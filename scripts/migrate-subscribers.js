import { pool } from '../server/db.js';
import { subscriberPool,subscriberTransaction } from '../server/subscriber-db.js';
import { migrateSubscriberDatabase } from '../server/subscriber-migrations.js';
try {
 await subscriberTransaction(db=>migrateSubscriberDatabase(db,{standalone:subscriberPool!==pool}));
 console.log('Subscriber database migrations applied.');
} finally {await subscriberPool.end();if(subscriberPool!==pool)await pool.end();}
