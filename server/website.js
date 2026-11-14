import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Serves the built React site (dist/) when the API runs on a host such as Render.
const distDir = fileURLToPath(new URL('../dist/', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

export async function serveWebsite(req, res, url) {
  let path;
  try { path = decodeURIComponent(url.pathname); } catch { path = '/'; }
  let file = join(distDir, normalize(path).replace(/^[/\\]+/, ''));
  // Never serve anything outside dist/.
  if (!file.startsWith(distDir.endsWith(sep) ? distDir : distDir + sep)) file = join(distDir, 'index.html');
  let data;
  try {
    data = await readFile(file);
  } catch {
    // Unknown paths such as /admin or /find-help are React routes: send the app shell.
    file = join(distDir, 'index.html');
    data = await readFile(file);
  }
  const hashedAsset = file.includes(`${sep}assets${sep}`);
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': hashedAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(req.method === 'HEAD' ? undefined : data);
}