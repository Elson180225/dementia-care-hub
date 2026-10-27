import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { body, currentUser, fail } from './auth.js';
import { isAllowedOrigin } from './origin.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_FILE = resolve(__dirname, '../shared/learn-events-content.json');

let cachedContent = null;

export async function getLearnEventsData() {
  if (cachedContent) return cachedContent;
  try {
    const raw = await readFile(CONTENT_FILE, 'utf-8');
    cachedContent = JSON.parse(raw);
    return cachedContent;
  } catch (err) {
    console.error('Failed to read learn-events-content.json:', err.message);
    return cachedContent || {};
  }
}

export async function saveLearnEventsData(data) {
  if (!data || typeof data !== 'object') {
    fail('Invalid content data structure', 400);
  }
  const jsonStr = JSON.stringify(data, null, 2);
  await writeFile(CONTENT_FILE, jsonStr, 'utf-8');
  cachedContent = data;
  return data;
}

export async function learnEventsContentHandler(req, res, url, send) {
  // Public GET endpoint:
  if (url.pathname === '/api/public/learn-events-content' && req.method === 'GET') {
    const data = await getLearnEventsData();
    return send(res, 200, data);
  }

  // Admin endpoints:
  if (url.pathname === '/api/admin/learn-events-content') {
    const user = await currentUser(req);
    if (user?.role !== 'admin') fail('Admin access required', user ? 403 : 401);

    if (req.method === 'GET') {
      const data = await getLearnEventsData();
      return send(res, 200, data);
    }

    if (req.method === 'POST') {
      if (!isAllowedOrigin(req.headers.origin)) fail('Origin not allowed', 403);
      const payload = await body(req);
      await saveLearnEventsData(payload);
      return send(res, 200, { ok: true, message: 'Learn & Events content saved successfully' });
    }

    fail('Method not allowed', 405);
  }

  fail('Not found', 404);
}
