
import { randomBytes } from 'node:crypto';
import { pool, transaction } from './db.js';
import { body, currentUser, digest, fail } from './auth.js';
import { isAllowedOrigin } from './origin.js';

const modes = ['closed', 'invitation_only', 'open'];
const types = ['apply', 'update'];
const statuses = ['new', 'in_review', 'closed'];

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const tokenPattern = /^[0-9a-f]{64}$/;


/* SCRUM-229 — Public submission rate limiting */

const REQUEST_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUEST_ATTEMPTS = 10;
const MAX_TRACKED_CLIENTS = 10000;

const submissionAttempts = new Map();

function checkSubmissionRate(req, res) {
  const now = Date.now();
  const client = req.socket.remoteAddress || 'unknown';

  // Remove expired entries.
  for (const [key, entry] of submissionAttempts) {
    if (entry.resetAt <= now) {
      submissionAttempts.delete(key);
    }
  }

  let entry = submissionAttempts.get(client);

  if (!entry) {
    if (submissionAttempts.size >= MAX_TRACKED_CLIENTS) {
      res.setHeader('Retry-After', '60');
      fail('Server busy. Please try again later.', 429);
    }

    entry = {
      count: 0,
      resetAt: now + REQUEST_WINDOW_MS
    };

    submissionAttempts.set(client, entry);
  }

  if (entry.count >= MAX_REQUEST_ATTEMPTS) {
    const retryAfter = Math.max(
      1,
      Math.ceil((entry.resetAt - now) / 1000)
    );

    res.setHeader('Retry-After', String(retryAfter));

    fail(
      'Too many submission attempts. Please try again later.',
      429
    );
  }

  entry.count += 1;
}


function text(value, label, max, required = true) {
  if (value == null && !required) return '';

  if (typeof value !== 'string') {
    fail(`${label} must be text`);
  }

  const clean = value.trim();

  if (
    (required && !clean) ||
    clean.length > max ||
    clean.includes('\u0000')
  ) {
    fail(`Enter a valid ${label} (maximum ${max} characters)`);
  }

  return clean;
}

function emailOf(value) {
  const email = text(value, 'email', 254).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail('Enter a valid email');
  }

  return email;
}

function choice(value, allowed, label) {
  if (!allowed.includes(value)) {
    fail(`Choose a valid ${label}`);
  }

  return value;
}

async function modeOf(db, lock = '') {
  const { rows } = await db.query(
    'SELECT mode FROM listing_request_settings WHERE singleton=true ' + lock
  );

  return rows[0]?.mode || 'closed';
}

export async function listingRequestsHandler(req, res, url, send) {
  const admin = url.pathname.startsWith('/api/admin/');
  const action = url.pathname.split('/').pop();

  // ADMIN AUTHENTICATION

  if (admin) {
    const user = await currentUser(req);

    if (user?.role !== 'admin') {
      fail('Admin access required', user ? 403 : 401);
    }
  }

  if (!['GET', 'POST'].includes(req.method)) {
    fail('Method not allowed', 405);
  }

  if (
    req.method === 'POST' &&
    !isAllowedOrigin(req.headers.origin)
  ) {
    fail('Origin not allowed', 403);
  }

  // LISTING REQUEST SETTINGS

  if (action === 'listing-request-settings') {
    if (req.method === 'GET') {
      return send(res, 200, {
        mode: await modeOf(pool)
      });
    }

    if (!admin) {
      fail('Method not allowed', 405);
    }

    const data = await body(req, 20000);

    const mode = choice(
      data.mode,
      modes,
      'submission mode'
    );

    await pool.query(
      `UPDATE listing_request_settings
       SET mode=$1, updated_at=now()
       WHERE singleton=true`,
      [mode]
    );

    return send(res, 200, { mode });
  }

  // ADMIN INVITATION MANAGEMENT

  if (admin && action === 'listing-request-invitations') {
    if (req.method === 'GET') {
      const { rows } = await pool.query(
        `SELECT id, email, request_type, created_at,
                expires_at, used_at, revoked_at
         FROM listing_request_invitations
         ORDER BY created_at DESC
         LIMIT 200`
      );

      return send(res, 200, rows);
    }

    const data = await body(req, 20000);

    // Revoke an existing invitation

    if (data.revoke === true) {
      if (!uuid.test(data.id || '')) {
        fail('Invalid invitation reference');
      }

      const result = await pool.query(
        `UPDATE listing_request_invitations
         SET revoked_at=now()
         WHERE id=$1
         AND used_at IS NULL
         AND revoked_at IS NULL`,
        [data.id]
      );

      if (!result.rowCount) {
        fail('Invitation unavailable', 409);
      }

      return send(res, 200, { ok: true });
    }

    // Create a secure invitation

    const email = emailOf(data.email);

    const type = choice(
      data.request_type,
      types,
      'request type'
    );

    const token = randomBytes(32).toString('hex');

    const { rows } = await pool.query(
      `INSERT INTO listing_request_invitations
       (token_hash, email, request_type)
       VALUES ($1, $2, $3)
       RETURNING id, expires_at`,
      [digest(token), email, type]
    );

    return send(res, 201, {
      ...rows[0],
      token
    });
  }

  if (action !== 'listing-requests') {
    fail('Not found', 404);
  }

  // ADMIN REQUEST REVIEW QUEUE

  if (admin) {
    if (req.method === 'GET') {
      const { rows } = await pool.query(
        `SELECT *
         FROM listing_requests
         ORDER BY submitted_at DESC
         LIMIT 200`
      );

      return send(res, 200, rows);
    }

    const data = await body(req, 20000);

    if (!uuid.test(data.id || '')) {
      fail('Invalid request reference');
    }

    const status = choice(
      data.status,
      statuses,
      'request status'
    );

    const note = text(
      data.admin_note,
      'admin note',
      5000,
      status !== 'new'
    );

    const result = await pool.query(
      `UPDATE listing_requests
       SET status=$2,
           admin_note=$3,
           updated_at=now()
       WHERE id=$1`,
      [data.id, status, note]
    );

    if (!result.rowCount) {
      fail('Request not found', 404);
    }

    return send(res, 200, { ok: true });
  }

  // PUBLIC LISTING REQUEST SUBMISSION

if (req.method !== 'POST') {
  fail('Method not allowed', 405);
}

checkSubmissionRate(req, res);

const data = await body(req, 20000);


  const type = choice(
    data.request_type,
    types,
    'request type'
  );

  const organisation = text(
    data.organisation_name,
    'organisation name',
    200
  );

  const contact = text(
    data.contact_name,
    'contact name',
    200
  );

  const email = emailOf(data.email);

  const phone = text(
    data.phone,
    'phone',
    80,
    false
  );

  const details = text(
    data.details,
    'request details',
    5000
  );

  if (data.consent !== true) {
    fail('Consent is required');
  }

  const listingId =
    type === 'update'
      ? text(
          data.listing_id,
          'listing reference',
          36,
          false
        ) || null
      : null;

  if (listingId && !uuid.test(listingId)) {
    fail('Invalid listing reference');
  }

  const token = text(
    data.invitation,
    'invitation code',
    64,
    false
  );

  // DATABASE TRANSACTION

  const id = await transaction(async db => {
    const mode = await modeOf(db, 'FOR SHARE');

    // Closed mode

    if (mode === 'closed') {
      fail('Listing requests are currently closed', 403);
    }

    let invitationId = null;

    // Invitation-only mode

    if (mode === 'invitation_only') {
      if (!tokenPattern.test(token)) {
        fail('A valid invitation is required', 403);
      }

      const { rows } = await db.query(
        `UPDATE listing_request_invitations
         SET used_at=now()
         WHERE token_hash=$1
         AND email=$2
         AND request_type=$3
         AND used_at IS NULL
         AND revoked_at IS NULL
         AND expires_at>now()
         RETURNING id`,
        [digest(token), email, type]
      );

      if (!rows.length) {
        fail(
          'Invitation is invalid or no longer available',
          403
        );
      }

      invitationId = rows[0].id;
    }

    // Validate an existing published listing

    if (listingId) {
      const result = await db.query(
        `SELECT 1
         FROM published_directory
         WHERE id=$1`,
        [listingId]
      );

      if (!result.rowCount) {
        fail('Published listing not found', 400);
      }
    }

    // Save request to private admin review queue

    const { rows } = await db.query(
      `INSERT INTO listing_requests (
        request_type,
        listing_id,
        organisation_name,
        contact_name,
        email,
        phone,
        details,
        consent_at,
        invitation_id
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, now(), $8
      )
      RETURNING id`,
      [
        type,
        listingId,
        organisation,
        contact,
        email,
        phone || null,
        details,
        invitationId
      ]
    );

    return rows[0].id;
  });

  return send(res, 201, {
    ok: true,
    id
  });
}
