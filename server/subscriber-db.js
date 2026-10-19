import pg from 'pg';
import { pool, databaseTransaction } from './db.js';
export const subscriberPool=process.env.SUBSCRIBER_DATABASE_URL?.trim()
 ? new pg.Pool({connectionString:process.env.SUBSCRIBER_DATABASE_URL,connectionTimeoutMillis:10000}) : pool;
export const subscriberTransaction=(fn,actor=null)=>databaseTransaction(subscriberPool,fn,actor);
export const subscriberAuditTable=subscriberPool===pool?'audit_log':'subscriber_audit_log';
