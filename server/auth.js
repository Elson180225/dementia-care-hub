import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { pool, transaction } from './db.js';
import { isAllowedOrigin } from './origin.js';
export const digest = value => createHash('sha256').update(value).digest('hex');
export function hashPassword(password) {
 const salt = randomBytes(16).toString('hex');
 return `${salt}:${scryptSync(password,salt,64).toString('hex')}`;
}
export function checkPassword(password, hash) {
 const [salt,key] = hash.split(':');
 const actual = scryptSync(password,salt,64);
 const expected = Buffer.from(key,'hex');
 return actual.length === expected.length && timingSafeEqual(actual,expected);
}
export function fail(message, status=400) { throw Object.assign(new Error(message),{status}); }
export async function body(req) {
 let value='';
 for await (const chunk of req) { value+=chunk; if(Buffer.byteLength(value)>100000) fail('Request too large',413); }
 let parsed;try { parsed=JSON.parse(value || '{}'); } catch { fail('Invalid JSON'); }
 if(!parsed || typeof parsed!=='object' || Array.isArray(parsed)) fail('A JSON object is required');
 return parsed;
}
export async function currentUser(req) {
 const token = req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('rcbc_session='))?.slice(13);
 if (!token) return null;
 return (await pool.query("SELECT u.id,u.name,u.email,u.role,s.expires_at AS \"sessionExpiresAt\" FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.enabled AND (u.role='admin' OR EXISTS(SELECT 1 FROM approved_trainer_accounts a WHERE a.id=u.id))",[digest(token)])).rows[0] || null;
}
const attempts = new Map();
export async function authHandler(req,res,path,send) {
 if(req.method==='GET' && path==='/api/auth/me') return send(res,200,{user:await currentUser(req)});
 if(req.method!=='POST') return send(res,405,{error:'Method not allowed'});
 if(!isAllowedOrigin(req.headers.origin)) fail('Origin not allowed',403);
 if(path==='/api/auth/activity') {
  if(!await currentUser(req)) fail('Your session expired. Please sign in again.',401);
  const {idleMs=0}=await body(req);
  if(!Number.isFinite(idleMs) || idleMs<0 || idleMs>=300000) fail('Invalid activity timestamp');
  const token=req.headers.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('rcbc_session=')).slice(13);
  const updated=await pool.query("UPDATE sessions SET last_activity_at=greatest(last_activity_at,clock_timestamp()-($2 * interval '1 millisecond')),expires_at=greatest(expires_at,clock_timestamp()+interval '5 minutes'-($2 * interval '1 millisecond')) WHERE token_hash=$1 AND expires_at>clock_timestamp() RETURNING expires_at",[digest(token),idleMs]);
  if(!updated.rowCount) fail('Your session expired. Please sign in again.',401);
  return send(res,200,{expiresAt:updated.rows[0].expires_at});
 }
 if(path==='/api/auth/logout') {
  const token=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('rcbc_session='))?.slice(13);
  if(token) await pool.query('DELETE FROM sessions WHERE token_hash=$1',[digest(token)]);
  res.setHeader('Set-Cookie','rcbc_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  return send(res,200,{ok:true});
 }
 const key=req.socket.remoteAddress;
 const now=Date.now();
 for(const [ip,value] of attempts) if(value.until<now) attempts.delete(ip);
 const attempt=attempts.get(key) || {count:0,until:now+900000};
 attempts.set(key,attempt); if(++attempt.count>30) fail('Too many attempts. Try again in 15 minutes.',429);
 const data=await body(req);
 const email=String(data.email || '').trim().toLowerCase();
 const password=data.password;
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password!=='string' || password.length>256) fail('Enter a valid email and password');
 if(path==='/api/auth/register' || path==='/api/auth/admin-register') {
  if(password.length<12 || !String(data.name||'').trim()) fail('Enter your name and a password of at least 12 characters');
  const admin=path.endsWith('admin-register');
  if(!admin && (!String(data.city||'').trim() || !String(data.certificateRef||'').trim())) fail('Your city and certificate reference are required for RCBC verification');
  await transaction(async db=>{
   if(admin) {
    const invite=await db.query('SELECT * FROM admin_invitations WHERE token_hash=$1 AND lower(email)=$2 AND used_at IS NULL AND expires_at>now() FOR UPDATE',[digest(String(data.invitation||'')),email]);
    if(!invite.rowCount) fail('A valid RCBC invitation for this email is required',403);
    await db.query('UPDATE admin_invitations SET used_at=now() WHERE token_hash=$1',[digest(data.invitation)]);
   }
   const user=(await db.query('INSERT INTO users(email,name,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id',[email,data.name.trim(),hashPassword(password),admin?'admin':'trainer'])).rows[0];
   await db.query("SELECT set_config('app.actor_id',$1,true)",[user.id]);
   if(!admin) {
    await db.query('INSERT INTO trainer_profiles(id,city) VALUES($1,$2)',[user.id,data.city.trim()]);
    await db.query('INSERT INTO trainer_access_requests(user_id,name,email,city,claimed_certificate_ref) VALUES($1,$2,$3,$4,$5)',[user.id,data.name.trim(),email,data.city.trim(),data.certificateRef.trim()]);
   }
  });
  return send(res,201,{ok:true,message:admin?'Account created. Please sign in.':'Application submitted. RCBC must approve access before you can sign in.'});
 }
 if(!['/api/auth/login','/api/auth/application','/api/auth/resubmit'].includes(path)) return send(res,404,{error:'Not found'});
 const user=(await pool.query('SELECT * FROM users WHERE lower(email)=$1 AND enabled',[email])).rows[0];
 // Always derive a key, even for unknown accounts.
 const valid=checkPassword(password,user?.password_hash || '00000000000000000000000000000000:'+ '00'.repeat(64));
 if(!user || !valid || (data.role && data.role!==user.role)) fail('Email or password is incorrect',401);
 if(path==='/api/auth/application' || path==='/api/auth/resubmit') {
  if(user.role!=='trainer') fail('Trainer application required',403);
  if(path.endsWith('resubmit')) await transaction(async db=>{
   const old=(await db.query('SELECT * FROM trainer_access_requests WHERE user_id=$1 FOR UPDATE',[user.id])).rows[0];
   if(!old || !['returned','submitted'].includes(old.status)) fail('Only returned or pending applications can be updated',409);
   if(!data.city?.trim() || !data.certificateRef?.trim()) fail('City and certificate reference are required');
   await db.query("UPDATE trainer_access_requests SET city=$2,claimed_certificate_ref=$3,status='submitted',admin_comment='',reviewed_by=NULL,reviewed_at=NULL,updated_at=now() WHERE user_id=$1",[user.id,data.city.trim(),data.certificateRef.trim()]);
  },user.id);
  const application=(await pool.query('SELECT id,name,email,city,claimed_certificate_ref,status,admin_comment,submitted_at FROM trainer_access_requests WHERE user_id=$1',[user.id])).rows[0];
  return send(res,200,{application});
 }
 if(user.role==='trainer' && !(await pool.query('SELECT 1 FROM approved_trainer_accounts WHERE id=$1',[user.id])).rowCount) fail('RCBC has not approved your trainer access. Use Check application to see the status and feedback.',403);
 const token=randomBytes(32).toString('hex');
 await pool.query('INSERT INTO sessions(token_hash,user_id) VALUES($1,$2)',[digest(token),user.id]);
 res.setHeader('Set-Cookie',`rcbc_session=${token}; HttpOnly; SameSite=Strict; Path=/${process.env.NODE_ENV==='production'?'; Secure':''}`);
 return send(res,200,{user:{id:user.id,name:user.name,email:user.email,role:user.role}});
}
