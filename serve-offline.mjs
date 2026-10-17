import http from 'http';
import fs from 'fs';
import path from 'path';
import { handleApiRequest } from './server/apiRouter.js';
import { isPostgresConfigured } from './server/postgres.js';
import { exportSqlDump } from './server/database.js';

const PORT = 5174;
const DIST = path.join(import.meta.dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json'
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// Automated 12-Hour Periodic Database Backup
const BACKUP_DIR = path.join(import.meta.dirname, 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function runAutoBackup() {
  try {
    const dump = exportSqlDump();
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cset_store_auto_${dateStr}.sql`;
    fs.writeFileSync(path.join(BACKUP_DIR, filename), dump, 'utf-8');
    console.log(`[Backup Daemon] Auto backup generated: ${filename}`);

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => fs.statSync(path.join(BACKUP_DIR, b)).mtimeMs - fs.statSync(path.join(BACKUP_DIR, a)).mtimeMs);

    if (files.length > 5) {
      for (let i = 5; i < files.length; i++) {
        fs.unlinkSync(path.join(BACKUP_DIR, files[i]));
      }
    }
  } catch (err) {
    console.error('[Backup Daemon Error]', err);
  }
}
setInterval(runAutoBackup, 12 * 60 * 60 * 1000);

const server = http.createServer(async (req, res) => {
  const [reqPath] = (req.url || '/').split('?');

  Object.entries(SECURITY_HEADERS).forEach(([k, v]) => {
    res.setHeader(k, v);
  });

  // CORS Headers
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5174');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Database Protection
  const normalizedPath = reqPath.toLowerCase();
  if (
    normalizedPath.includes('.sqlite') ||
    normalizedPath.includes('.db') ||
    normalizedPath.includes('.sql') ||
    normalizedPath.includes('.env') ||
    normalizedPath.includes('/server/') ||
    normalizedPath.includes('/data/') ||
    normalizedPath.includes('/backups/') ||
    normalizedPath.includes('/.git')
  ) {
    res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, message: 'Truy cập bị từ chối' }));
    return;
  }

  // Delegate API requests to unified router
  if (reqPath.startsWith('/api/')) {
    const handled = await handleApiRequest(req, res);
    if (handled) return;
  }

  // Static Assets Serving
  let reqUrl = reqPath;
  if (reqUrl === '/' || reqUrl === '') {
    reqUrl = '/index.html';
  } else if (reqUrl === '/admin') {
    reqUrl = '/admin.html';
  } else if (reqUrl === '/sales' || reqUrl === '/orders') {
    reqUrl = '/sales.html';
  }
  const filePath = path.join(DIST, reqUrl);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  } else if (!path.extname(reqUrl)) {
    const fallback = path.join(DIST, 'index.html');
    if (fs.existsSync(fallback)) {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      fs.createReadStream(fallback).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const isPg = isPostgresConfigured();
  console.log(`===================================================`);
  console.log(`CSET Store Offline MPA Server running at http://localhost:${PORT}`);
  console.log(`- Web Shop: http://localhost:${PORT}/index.html`);
  console.log(`- Web Admin: http://localhost:${PORT}/admin.html`);
  console.log(`- Database Backend: ${isPg ? 'Vercel Neon PostgreSQL (Cloud Synced)' : 'Local SQLite'}`);
  console.log(`===================================================`);
});
