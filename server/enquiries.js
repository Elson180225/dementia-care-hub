import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { validateEnquiry } from '../shared/enquiry.js';

export function enquiryHandler({ inbox = process.env.ENQUIRY_INBOX_DIR, origin = process.env.PUBLIC_ORIGIN } = {}) {
  const rates = new Map();
  let queue = Promise.resolve();
  return async (req, res) => {
    const reply = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
    if (req.url !== '/api/enquiries') return reply(404, { error: 'Not found' });
    if (req.method !== 'POST') return reply(405, { error: 'POST required' });
    if (req.headers.origin && req.headers.origin !== (origin || `http://${req.headers.host}`)) return reply(403, { error: 'Origin rejected' });
    if (!inbox) return reply(503, { error: 'Enquiry workflow is not configured' });
    if (!req.headers['content-type']?.startsWith('application/json')) return reply(415, { error: 'JSON required' });
    const now = Date.now();
    for (const [key, entry] of rates) if (now - entry.start > 600000) rates.delete(key);
    const ip = req.socket.remoteAddress;
    const rate = rates.get(ip) || { start: now, count: 0 };
    if (rate.count >= 10) return reply(429, { error: 'Please try again later' });
    rate.count++; rates.set(ip, rate);
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk.toString();
        if (Buffer.byteLength(body) > 24000) return reply(413, { error: 'Message too large' });
      }
      let data;
      try { data = JSON.parse(body); } catch { return reply(400, { error: 'Invalid JSON' }); }
      if (!data || typeof data !== 'object' || Array.isArray(data)) return reply(400, { error: 'Invalid enquiry' });
      const errors = validateEnquiry(data);
      if (Object.keys(errors).length) return reply(422, { errors });
      if (data.website !== '' || !Number.isFinite(data.startedAt) || now - data.startedAt < 2000 || now - data.startedAt > 86400000) return reply(400, { error: 'Please try again' });
      if (typeof data.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(data.id)) return reply(400, { error: 'Invalid submission identifier' });
      const enquiry = { name: data.name.trim(), email: data.email.trim(), type: data.type, message: data.message.trim() };
      // Serialize writes so simultaneous retries cannot create multiple inbox records.
      const save = async () => {
        const directory = resolve(inbox);
        await mkdir(directory, { recursive: true, mode: 0o700 });
        const fingerprint = createHash('sha256').update(JSON.stringify(enquiry)).digest('hex');
        const file = join(directory, `${fingerprint}.json`);
        try {
          const existing = JSON.parse(await readFile(file, 'utf8'));
          if (existing.id === data.id || now - Date.parse(existing.receivedAt) < 86400000) return;
        } catch (error) { if (error.code !== 'ENOENT') throw error; }
        await writeFile(file, JSON.stringify({ id: data.id, receivedAt: new Date(now).toISOString(), ...enquiry }, null, 2), { mode: 0o600 });
      };
      const operation = queue.then(save);
      queue = operation.catch(() => {});
      await operation;
      return reply(200, { ok: true });
    } catch {
      return reply(503, { error: 'Unable to save enquiry. Please retry.' });
    }
  };
}
