// Minimal static server for local preview (mirrors Vercel cleanUrls): `npm run dev`
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = 'public';
const PORT = Number(process.env.PORT || 4180);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

async function resolve(urlPath) {
  const safe = normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, '').replace(/\.\.[/\\]?/g, '');
  const candidates = [safe, join(safe, 'index.html'), `${safe}.html`];
  for (const c of candidates) {
    const full = join(ROOT, c);
    try { if ((await stat(full)).isFile()) return full; } catch {}
  }
  return null;
}

createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const file = await resolve(path);
  if (!file) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404'); }
  const body = await readFile(file);
  const type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;
  if (range && type === 'video/mp4') {
    const [s, e] = range.replace('bytes=', '').split('-');
    const start = Number(s), end = e ? Number(e) : body.length - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${body.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    return res.end(body.subarray(start, end + 1));
  }
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache', 'Accept-Ranges': 'bytes' });
  res.end(body);
}).listen(PORT, '127.0.0.1', () => console.log(`Barcenaria em http://127.0.0.1:${PORT}`));
