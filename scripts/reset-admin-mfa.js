import { pool } from '../server/db.js';

// Lost MFA device (RCBC Admin Portal Draft 02, 4.4): after verifying the person's
// identity, a System Administrator clears their authenticator so they set it up
// again at their next sign-in. Their sessions are signed out too.
const email = process.argv[2];
try {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Usage: npm run admin:reset-mfa -- admin@rcbc.example');
  }
  const result = await pool.query(
    `UPDATE users
        SET mfa_secret=NULL, mfa_pending_secret=NULL, mfa_enabled_at=NULL, mfa_last_step=NULL
      WHERE lower(email)=lower($1) AND role='admin'
      RETURNING id`,
    [email]
  );
  if (!result.rowCount) throw new Error('No admin account found for that email.');
  await pool.query('DELETE FROM sessions WHERE user_id=$1', [result.rows[0].id]);
  console.log('Authenticator reset. The admin will set up a new one at their next sign-in.');
} finally {
  await pool.end();
}
