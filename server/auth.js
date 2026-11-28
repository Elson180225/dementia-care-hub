import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { generateSecret, verifyCode, otpauthUrl } from './totp.js';
import { newPasswordProblem, PASSWORD_MAX } from './password-policy.js';
import { pool, transaction } from './db.js';
import { isAllowedOrigin } from './origin.js';
import { storeCertificateEvidence } from './certificate-evidence.js';
import { createBrevo } from './brevo.js';

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

export function fail(message, status=400) {
 throw Object.assign(new Error(message),{status});
}

const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RESET_MINUTES=30;

function passwordResetMessage(user,token,env=process.env) {
 const base=String(env.APP_BASE_URL || '').replace(/\/+$/,'');

 if(!base) {
  throw new Error('Configure APP_BASE_URL before sending password reset emails');
 }

 if(!env.BREVO_SENDER_EMAIL) {
  throw new Error('Configure BREVO_SENDER_EMAIL before sending password reset emails');
 }

 const route=
  user.role==='admin'
   ? '/admin/reset-password'
   : '/trainer-portal/reset-password';

 const resetUrl=
  `${base}${route}?token=${encodeURIComponent(token)}`;

 return {
  sender:{
   name:env.BREVO_SENDER_NAME || 'RCBC Dementia Care',
   email:env.BREVO_SENDER_EMAIL
  },
  to:[
   {
    email:user.email,
    name:user.name
   }
  ],
  subject:'Reset your RCBC Dementia Care password',
  textContent:`Hello ${user.name},

A password reset was requested for your RCBC ${
 user.role==='admin'
  ? 'administrator dashboard'
  : 'trainer portal'
} account.

Reset your password using this link:
${resetUrl}

This link expires in ${PASSWORD_RESET_MINUTES} minutes and can only be used once.

If you did not request this change, you can ignore this email.

RCBC Dementia Care`
 };
}

async function requestPasswordReset(email) {
 const user=(
  await pool.query(
   'SELECT id,name,email,role FROM users WHERE lower(email)=$1 AND enabled',
   [email]
  )
 ).rows[0];

 if(!user) return;

 const token=randomBytes(32).toString('hex');
 const tokenHash=digest(token);

 await transaction(async db=>{
  await db.query(
   `DELETE FROM password_reset_tokens
    WHERE user_id=$1
    AND (used_at IS NOT NULL OR expires_at<=now())`,
   [user.id]
  );

  await db.query(
   `DELETE FROM password_reset_tokens
    WHERE user_id=$1
    AND used_at IS NULL`,
   [user.id]
  );

  await db.query(
   `INSERT INTO password_reset_tokens(
      token_hash,
      user_id,
      expires_at
    )
    VALUES(
      $1,
      $2,
      now()+($3 * interval '1 minute')
    )`,
   [tokenHash,user.id,PASSWORD_RESET_MINUTES]
  );
 });

 try {
  await createBrevo()(
   '/smtp/email',
   {
    method:'POST',
    data:passwordResetMessage(user,token)
   }
  );
 } catch(error) {
  await pool.query(
   'DELETE FROM password_reset_tokens WHERE token_hash=$1',
   [tokenHash]
  ).catch(()=>{});

  console.error(
   'Password reset email failed:',
   error.providerStatus || error.message
  );
 }
}

export async function body(req, limit=100000) {
 let value='';

 for await (const chunk of req) {
  value+=chunk;

  if(Buffer.byteLength(value)>limit) {
   fail('Request too large',413);
  }
 }

 let parsed;

 try {
  parsed=JSON.parse(value || '{}');
 } catch {
  fail('Invalid JSON');
 }

 if(
  !parsed ||
  typeof parsed!=='object' ||
  Array.isArray(parsed)
 ) {
  fail('A JSON object is required');
 }

 return parsed;
}

export async function currentUser(req) {
 const token=
  req.headers.cookie
   ?.split(';')
   .map(x=>x.trim())
   .find(x=>x.startsWith('rcbc_session='))
   ?.slice(13);

 if (!token) return null;

 return (
  await pool.query(
   `SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      s.expires_at AS "sessionExpiresAt"
    FROM sessions s
    JOIN users u
      ON u.id=s.user_id
    WHERE s.token_hash=$1
      AND s.expires_at>now()
      AND u.enabled
      AND (
       u.role='admin'
       OR EXISTS(
        SELECT 1
        FROM approved_trainer_accounts a
        WHERE a.id=u.id
       )
      )`,
   [digest(token)]
  )
 ).rows[0] || null;
}

const attempts = new Map();

// Required in production unless ADMIN_MFA=off; elsewhere only when ADMIN_MFA=on.
export function adminMfaRequired(env=process.env) {
 return env.ADMIN_MFA==='on' || (env.NODE_ENV==='production' && env.ADMIN_MFA!=='off');
}

export async function authHandler(req,res,path,send) {
 if(
  req.method==='GET' &&
  path==='/api/auth/me'
 ) {
  return send(
   res,
   200,
   {user:await currentUser(req)}
  );
 }

 if(req.method!=='POST') {
  return send(
   res,
   405,
   {error:'Method not allowed'}
  );
 }

 if(!isAllowedOrigin(req.headers.origin)) {
  fail('Origin not allowed',403);
 }

 if(path==='/api/auth/activity') {
  if(!await currentUser(req)) {
   fail(
    'Your session expired. Please sign in again.',
    401
   );
  }

  const {idleMs=0}=await body(req);

  if(
   !Number.isFinite(idleMs) ||
   idleMs<0 ||
   idleMs>=300000
  ) {
   fail('Invalid activity timestamp');
  }

  const token=
   req.headers.cookie
    .split(';')
    .map(x=>x.trim())
    .find(x=>x.startsWith('rcbc_session='))
    .slice(13);

  const updated=await pool.query(
   `UPDATE sessions
    SET
     last_activity_at=
      greatest(
       last_activity_at,
       clock_timestamp()-($2 * interval '1 millisecond')
      ),
     expires_at=
      greatest(
       expires_at,
       clock_timestamp()
        + interval '5 minutes'
        - ($2 * interval '1 millisecond')
      )
    WHERE token_hash=$1
      AND expires_at>clock_timestamp()
    RETURNING expires_at`,
   [digest(token),idleMs]
  );

  if(!updated.rowCount) {
   fail(
    'Your session expired. Please sign in again.',
    401
   );
  }

  return send(
   res,
   200,
   {expiresAt:updated.rows[0].expires_at}
  );
 }

 if(path==='/api/auth/logout') {
  const token=
   req.headers.cookie
    ?.split(';')
    .map(x=>x.trim())
    .find(x=>x.startsWith('rcbc_session='))
    ?.slice(13);

  if(token) {
   await pool.query(
    'DELETE FROM sessions WHERE token_hash=$1',
    [digest(token)]
   );
  }

  res.setHeader(
   'Set-Cookie',
   'rcbc_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'
  );

  return send(
   res,
   200,
   {ok:true}
  );
 }

 const key=req.socket.remoteAddress;
 const now=Date.now();

 for(const [ip,value] of attempts) {
  if(value.until<now) {
   attempts.delete(ip);
  }
 }

 const attempt=
  attempts.get(key) ||
  {
   count:0,
   until:now+900000
  };

 attempts.set(key,attempt);

 if(++attempt.count>30) {
  fail(
   'Too many attempts. Try again in 15 minutes.',
   429
  );
 }

 const data=await body(
  req,
  ['/api/auth/register','/api/auth/resubmit'].includes(path)
   ? 12*1024*1024
   : 100000
 );

 if(path==='/api/auth/forgot-password') {
  const email=
   String(data.email || '')
    .trim()
    .toLowerCase();

  if(!emailPattern.test(email)) {
   fail('Enter a valid email address');
  }

  await requestPasswordReset(email);

  return send(
   res,
   200,
   {
    ok:true,
    message:
     'If an eligible account exists for that email, a password reset link has been sent.'
   }
  );
 }

 if(path==='/api/auth/reset-password') {
  const token=
   String(data.token || '').trim();

  const password=data.password;

  if(token.length<32) {
   fail('Use a valid reset link');
  }

  const resetProblem=await newPasswordProblem(password);
  if(resetProblem) fail(resetProblem);

  await transaction(async db=>{
   const row=(
    await db.query(
     `SELECT
        r.token_hash,
        r.user_id
      FROM password_reset_tokens r
      JOIN users u
        ON u.id=r.user_id
      WHERE r.token_hash=$1
        AND r.used_at IS NULL
        AND r.expires_at>now()
        AND u.enabled
      FOR UPDATE`,
     [digest(token)]
    )
   ).rows[0];

   if(!row) {
    fail(
     'This password reset link is invalid or has expired',
     400
    );
   }

   await db.query(
    `UPDATE users
     SET password_hash=$2
     WHERE id=$1`,
    [
     row.user_id,
     hashPassword(password)
    ]
   );

   await db.query(
    `UPDATE password_reset_tokens
     SET used_at=now()
     WHERE token_hash=$1`,
    [row.token_hash]
   );

   await db.query(
    `DELETE FROM password_reset_tokens
     WHERE user_id=$1
       AND token_hash<>$2`,
    [
     row.user_id,
     row.token_hash
    ]
   );

   await db.query(
    'DELETE FROM sessions WHERE user_id=$1',
    [row.user_id]
   );
  });

  return send(
   res,
   200,
   {
    ok:true,
    message:
     'Your password has been updated. You can now sign in with your new password.'
   }
  );
 }

 const email=
  String(data.email || '')
   .trim()
   .toLowerCase();

 const password=data.password;

 if(
  !emailPattern.test(email) ||
  typeof password!=='string' ||
  password.length>PASSWORD_MAX
 ) {
  fail('Enter a valid email and password');
 }

 if(
  path==='/api/auth/register' ||
  path==='/api/auth/admin-register'
 ) {
  if(!String(data.name||'').trim()) {
   fail('Enter your name');
  }

  const signupProblem=await newPasswordProblem(password,{email,name:data.name});
  if(signupProblem) fail(signupProblem);

  const admin=
   path.endsWith('admin-register');

  if(
   !admin &&
   (
    !String(data.city||'').trim() ||
    !String(data.certificateRef||'').trim()
   )
  ) {
   fail(
    'Your city and certificate reference are required for RCBC verification'
   );
  }

  await transaction(async db=>{
   if(admin) {
    const invite=await db.query(
     `SELECT *
      FROM admin_invitations
      WHERE token_hash=$1
        AND lower(email)=$2
        AND used_at IS NULL
        AND expires_at>now()
      FOR UPDATE`,
     [
      digest(String(data.invitation||'')),
      email
     ]
    );

    if(!invite.rowCount) {
     fail(
      'A valid RCBC invitation for this email is required',
      403
     );
    }

    await db.query(
     `UPDATE admin_invitations
      SET used_at=now()
      WHERE token_hash=$1`,
     [digest(data.invitation)]
    );
   }

   const user=(
    await db.query(
     `INSERT INTO users(
        email,
        name,
        password_hash,
        role
      )
      VALUES($1,$2,$3,$4)
      RETURNING id`,
     [
      email,
      data.name.trim(),
      hashPassword(password),
      admin?'admin':'trainer'
     ]
    )
   ).rows[0];

   await db.query(
    "SELECT set_config('app.actor_id',$1,true)",
    [user.id]
   );

   if(admin) await db.query('SELECT seed_historical_webinars()');
   if(!admin) {
    await db.query(
     `INSERT INTO trainer_profiles(
        id,
        city
      )
      VALUES($1,$2)`,
     [
      user.id,
      data.city.trim()
     ]
    );

    const fileId=
     await storeCertificateEvidence(
      db,
      user.id,
      data.certificateEvidence
     );

    await db.query(
     `INSERT INTO trainer_access_requests(
        user_id,
        name,
        email,
        city,
        claimed_certificate_ref,
        certificate_file_id
      )
      VALUES($1,$2,$3,$4,$5,$6)`,
     [
      user.id,
      data.name.trim(),
      email,
      data.city.trim(),
      data.certificateRef.trim(),
      fileId
     ]
    );
   }
  });

  return send(
   res,
   201,
   {
    ok:true,
    message:
     admin
      ? 'Account created. Please sign in.'
      : 'Application submitted. RCBC must approve access before you can sign in.'
   }
  );
 }

 if(
  ![
   '/api/auth/login',
   '/api/auth/application',
   '/api/auth/resubmit'
  ].includes(path)
 ) {
  return send(
   res,
   404,
   {error:'Not found'}
  );
 }

 const user=(
  await pool.query(
   `SELECT *
    FROM users
    WHERE lower(email)=$1
      AND enabled`,
   [email]
  )
 ).rows[0];

 // Always derive a key, even for unknown accounts.
 const valid=
  checkPassword(
   password,
   user?.password_hash ||
    '00000000000000000000000000000000:'+
    '00'.repeat(64)
  );

 if(
  !user ||
  !valid ||
  (
   data.role &&
   data.role!==user.role
  )
 ) {
  fail(
   'Email or password is incorrect',
   401
  );
 }

 if(
  path==='/api/auth/application' ||
  path==='/api/auth/resubmit'
 ) {
  if(user.role!=='trainer') {
   fail(
    'Trainer application required',
    403
   );
  }

  if(path.endsWith('resubmit')) {
   await transaction(
    async db=>{
     const old=(
      await db.query(
       `SELECT *
        FROM trainer_access_requests
        WHERE user_id=$1
        FOR UPDATE`,
       [user.id]
      )
     ).rows[0];

     if(
      !old ||
      !['returned','submitted'].includes(old.status)
     ) {
      fail(
       'Only returned or pending applications can be updated',
       409
      );
     }

     if(
      !data.city?.trim() ||
      !data.certificateRef?.trim()
     ) {
      fail(
       'City and certificate reference are required'
      );
     }

     if(data.certificateEvidence) {
      const fileId=
       await storeCertificateEvidence(
        db,
        user.id,
        data.certificateEvidence
       );

      await db.query(
       `UPDATE trainer_access_requests
        SET certificate_file_id=$2
        WHERE user_id=$1`,
       [
        user.id,
        fileId
       ]
      );
     }

     await db.query(
      `UPDATE trainer_access_requests
       SET
        city=$2,
        claimed_certificate_ref=$3,
        status='submitted',
        admin_comment='',
        reviewed_by=NULL,
        reviewed_at=NULL,
        updated_at=now()
       WHERE user_id=$1`,
      [
       user.id,
       data.city.trim(),
       data.certificateRef.trim()
      ]
     );
    },
    user.id
   );
  }

  const application=(
   await pool.query(
    `SELECT
      id,
      name,
      email,
      city,
      claimed_certificate_ref,
      status,
      admin_comment,
      submitted_at,
      certificate_file_id IS NOT NULL AS has_certificate_evidence
     FROM trainer_access_requests
     WHERE user_id=$1`,
    [user.id]
   )
  ).rows[0];

  return send(
   res,
   200,
   {application}
  );
 }

 if(
  user.role==='trainer' &&
  !(
   await pool.query(
    `SELECT 1
     FROM approved_trainer_accounts
     WHERE id=$1`,
    [user.id]
   )
  ).rowCount
 ) {
  fail(
   'RCBC has not approved your trainer access. Use Check application to see the status and feedback.',
   403
  );
 }

 // Administrators confirm sign-in with a 6-digit code from an authenticator app
 // (RCBC Admin Portal Draft 02). First sign-in sets the app up; later ones ask for a code.
 if(user.role==='admin' && adminMfaRequired()) {
  const code=String(data.mfaCode || '').trim();
  const secret=user.mfa_enabled_at ? user.mfa_secret : (user.mfa_pending_secret || generateSecret());

  if(!user.mfa_enabled_at && !user.mfa_pending_secret) {
   await pool.query('UPDATE users SET mfa_pending_secret=$2 WHERE id=$1',[user.id,secret]);
  }

  if(!code) {
   return send(
    res,
    200,
    user.mfa_enabled_at
     ? {mfaRequired:true}
     : {mfaSetup:true,secret,otpauthUrl:otpauthUrl(secret,user.email)}
   );
  }

  const step=verifyCode(secret,code,{lastStep:user.mfa_last_step});
  if(step===null) {
   fail('That code is not correct or has expired. Enter the current 6-digit code from your authenticator app.',401);
  }

  await pool.query(
   user.mfa_enabled_at
    ? 'UPDATE users SET mfa_last_step=$2 WHERE id=$1'
    : 'UPDATE users SET mfa_secret=mfa_pending_secret,mfa_pending_secret=NULL,mfa_enabled_at=now(),mfa_last_step=$2 WHERE id=$1',
   [user.id,step]
  );
 }

 const token=
  randomBytes(32).toString('hex');

 await pool.query(
  `INSERT INTO sessions(
    token_hash,
    user_id
   )
   VALUES($1,$2)`,
  [
   digest(token),
   user.id
  ]
 );

 res.setHeader(
  'Set-Cookie',
  `rcbc_session=${token}; HttpOnly; SameSite=Strict; Path=/${
   process.env.NODE_ENV==='production'
    ? '; Secure'
    : ''
  }`
 );

 return send(
  res,
  200,
  {
   user:{
    id:user.id,
    name:user.name,
    email:user.email,
    role:user.role
   }
  }
 );
}
