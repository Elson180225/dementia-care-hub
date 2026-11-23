import { pool } from '../server/db.js';
import { runReviewReminder } from '../server/review-reminders.js';

try {
 console.log(await runReviewReminder({ dryRun: true }));
} finally {
 await pool.end();
}
