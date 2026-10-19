import { randomBytes } from 'node:crypto';
import { pool } from '../server/db.js';
import { digest } from '../server/auth.js';
const email=process.argv[2];
try {
 if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Usage: npm run admin:invite -- admin@rcbc.example');
 const token=randomBytes(32).toString('hex');
 await pool.query('INSERT INTO admin_invitations(token_hash,email) VALUES($1,$2)',[digest(token),email.toLowerCase()]);
 console.log('RCBC invitation (expires in 24 hours):');
 console.log(`${process.env.APP_BASE_URL || 'http://localhost:5173'}/admin/signup?invitation=${token}`);
} finally { await pool.end(); }
