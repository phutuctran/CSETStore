import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const PORT = 5174;
const DIST = path.join(import.meta.dirname, 'dist');
import {
  sqlGetProducts,
  sqlGetProductById,
  sqlCreateProduct,
  sqlUpdateProduct,
  sqlDeleteProduct,
  sqlGetReviews,
  sqlCreateReview,
  sqlUpdateReview,
  sqlDeleteReview,
  sqlGetCategories,
  sqlGetOrders,
  sqlCreateOrder,
  sqlUpdateOrderStatus,
  sqlGetUsers,
  exportSqlDump,
  restoreSqlDump,
  sqlAutoSelectTop5BestSellers,
  sqlGetTheme,
  sqlSaveTheme,
  verifyPassword,
  sqlGetUserByUsername,
  sqlGetUserById,
  sqlUpdateUser,
  sqlDeleteUser
} from './server/database.js';
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
// In-memory Login Rate Limiting (5 failed attempts per 15 min per IP/username)
const loginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

// In-memory Order Rate Limiting (Anti-spam / Anti-auto-click)
const offlineOrderRateLimits = new Map();
const MIN_ORDER_INTERVAL_MS = 2500;
const MAX_ORDERS_PER_MINUTE = 4;
const RATE_WINDOW_MS = 60000;
// Automated 12-Hour Periodic Database Backup
const BACKUP_DIR = path.join(import.meta.dirname, 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function runAutoBackup() {
  try {
    const dump = exportSqlDump();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cset_store_auto_backup_${timestamp}.sql`;
    const fullPath = path.join(BACKUP_DIR, filename);
    fs.writeFileSync(fullPath, dump, 'utf-8');

    // Rotate backups: keep 10 most recent snapshots
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('cset_store_auto_backup_'));
    if (files.length > 10) {
      files.sort();
      for (let i = 0; i < files.length - 10; i++) {
        try { fs.unlinkSync(path.join(BACKUP_DIR, files[i])); } catch {}
      }
    }
  } catch {}
}

// Run initial auto-backup on server launch and schedule every 12 hours
runAutoBackup();
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
setInterval(runAutoBackup, TWELVE_HOURS_MS);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://cdnjs.cloudflare.com https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: blob: https:; font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com; connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*;"
};

const server = http.createServer((req, res) => {
  const [reqPath] = (req.url || '/').split('?');

  // Apply security headers to every response
  Object.entries(SECURITY_HEADERS).forEach(([k, v]) => {
    res.setHeader(k, v);
  });

  // Strict CORS: Only allow main trusted origins
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

  // Database Protection: Block direct access to database, backups, server files, .env
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

  // API Endpoints
  if (reqPath.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // GET /api/backup/download (Exports real SQL database backup)
    if (req.method === 'GET' && (reqPath === '/api/backup/download' || reqPath === '/api/backup/sql')) {
      const sqlDump = exportSqlDump();
      const dateStr = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'application/sql; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="cset_store_backup_${dateStr}.sql"`);
      res.writeHead(200);
      res.end(sqlDump);
      return;
    }

    // POST /api/backup/restore (Restores SQL database from SQL backup script)
    if (req.method === 'POST' && reqPath === '/api/backup/restore') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const result = restoreSqlDump(body);
          res.writeHead(200);
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: err.message }));
        }
      });
      return;
    }

    // GET /api/products/:id
    const productMatch = reqPath.match(/^\/api\/products\/(\d+)$/);
    if (req.method === 'GET' && productMatch) {
      const prodId = parseInt(productMatch[1], 10);
      const product = sqlGetProductById(prodId);
      if (product) {
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: product }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, message: 'Không tìm thấy sản phẩm' }));
      }
      return;
    }

    // PUT /api/products/:id
    if (req.method === 'PUT' && productMatch) {
      const prodId = parseInt(productMatch[1], 10);
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const patch = JSON.parse(body);
          const success = sqlUpdateProduct(prodId, patch);
          if (success) {
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: sqlGetProductById(prodId) }));
          } else {
            res.writeHead(404);
            res.end(JSON.stringify({ success: false, message: 'Không tìm thấy sản phẩm' }));
          }
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ' }));
        }
      });
      return;
    }

    // DELETE /api/products/:id
    if (req.method === 'DELETE' && productMatch) {
      const prodId = parseInt(productMatch[1], 10);
      const success = sqlDeleteProduct(prodId);
      res.writeHead(200);
      res.end(JSON.stringify({ success }));
      return;
    }

    // POST /api/products/auto-top5
    if (req.method === 'POST' && reqPath === '/api/products/auto-top5') {
      const updatedProds = sqlAutoSelectTop5BestSellers();
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: updatedProds }));
      return;
    }

    // POST /api/products
    if (req.method === 'POST' && (reqPath === '/api/products' || reqPath === '/api/products/')) {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const newProd = JSON.parse(body);
          const created = sqlCreateProduct(newProd);
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, data: created }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ' }));
        }
      });
      return;
    }

    // GET /api/products
    if (req.method === 'GET' && (reqPath === '/api/products' || reqPath === '/api/products/')) {
      const products = sqlGetProducts();
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: products }));
      return;
    }

    // GET /api/reviews?productId=:id&all=1
    if (req.method === 'GET' && reqPath === '/api/reviews') {
      const sp = new URLSearchParams(queryString || '');
      const prodId = sp.get('productId');
      const includeHidden = sp.get('all') === '1';
      const reviews = sqlGetReviews(prodId, includeHidden);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: reviews }));
      return;
    }

    // POST /api/reviews
    if (req.method === 'POST' && reqPath === '/api/reviews') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (!data.productId || !data.comment) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, message: 'Thông tin đánh giá không hợp lệ' }));
            return;
          }
          if (data.rating < 1 || data.rating > 5) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, message: 'Số sao đánh giá phải từ 1 đến 5' }));
            return;
          }
          // Giới hạn loại file hình ảnh khách hàng được up, giới hạn dung lượng file không quá 3MB
          if (Array.isArray(data.images)) {
            for (const img of data.images) {
              if (typeof img === 'string') {
                if (!img.startsWith('data:image/')) {
                  res.writeHead(400);
                  res.end(JSON.stringify({ success: false, message: 'Chỉ chấp nhận file định dạng hình ảnh!' }));
                  return;
                }
                const approxBytes = img.length * 0.75;
                if (approxBytes > 3 * 1024 * 1024) {
                  res.writeHead(400);
                  res.end(JSON.stringify({ success: false, message: 'Dung lượng ảnh vượt quá giới hạn tối đa 3MB!' }));
                  return;
                }
              }
            }
          }
          const created = sqlCreateReview(data);
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, data: created }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ' }));
        }
      });
      return;
    }

    // PUT /api/reviews/:id
    const reviewMatch = reqPath.match(/^\/api\/reviews\/([^/]+)$/);
    if (req.method === 'PUT' && reviewMatch) {
      const revId = reviewMatch[1];
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const patch = JSON.parse(body);
          const success = sqlUpdateReview(revId, patch);
          res.writeHead(200);
          res.end(JSON.stringify({ success }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ' }));
        }
      });
      return;
    }

    // DELETE /api/reviews/:id
    if (req.method === 'DELETE' && reviewMatch) {
      const revId = reviewMatch[1];
      const success = sqlDeleteReview(revId);
      res.writeHead(200);
      res.end(JSON.stringify({ success }));
      return;
    }

    // GET /api/categories
    if (req.method === 'GET' && (reqPath === '/api/categories' || reqPath === '/api/categories/')) {
      const categories = sqlGetCategories();
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: categories }));
      return;
    }

    // GET /api/orders
    if (req.method === 'GET' && (reqPath === '/api/orders' || reqPath === '/api/orders/')) {
      const orders = sqlGetOrders();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: orders }));
      return;
    }

    // POST /api/orders
    if (req.method === 'POST' && (reqPath === '/api/orders' || reqPath === '/api/orders/')) {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const newOrder = JSON.parse(body);
          if (!newOrder.customerName || !newOrder.phone || !newOrder.address || !newOrder.items || !Array.isArray(newOrder.items) || newOrder.items.length === 0) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, message: 'Thông tin đơn hàng không đầy đủ' }));
            return;
          }

          const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
          const cleanPhone = String(newOrder.phone || '').replace(/[\s+-]+/g, '');
          const rateKey = `${clientIp}:${cleanPhone || 'anonymous'}`;
          const now = Date.now();
          const entry = offlineOrderRateLimits.get(rateKey) || { timestamps: [] };
          entry.timestamps = entry.timestamps.filter(t => now - t < RATE_WINDOW_MS);

          const lastTime = entry.timestamps[entry.timestamps.length - 1] || 0;
          if (now - lastTime < MIN_ORDER_INTERVAL_MS) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.writeHead(429);
            res.end(JSON.stringify({ success: false, message: 'Thao tác đặt hàng quá nhanh. Vui lòng chờ 3 giây trước khi thử lại.' }));
            return;
          }
          if (entry.timestamps.length >= MAX_ORDERS_PER_MINUTE) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.writeHead(429);
            res.end(JSON.stringify({ success: false, message: 'Tần suất gửi đơn hàng quá cao. Vui lòng thử lại sau 1 phút.' }));
            return;
          }

          entry.timestamps.push(now);
          offlineOrderRateLimits.set(rateKey, entry);

          const created = sqlCreateOrder(newOrder);
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, data: created }));
        } catch (err) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ' }));
        }
      });
      return;
    }

    // GET /api/users
    if (req.method === 'GET' && (reqPath === '/api/users' || reqPath === '/api/users/')) {
      const users = sqlGetUsers();
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: users }));
      return;
    }

    // User endpoints: /api/users/:id
    const userMatch = reqPath.match(/^\/api\/users\/([^/]+)$/);
    if (req.method === 'GET' && userMatch) {
      const user = sqlGetUserById(userMatch[1]);
      if (user) {
        const sanitized = { ...user };
        delete sanitized.password_hash;
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: sanitized }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, message: 'Không tìm thấy người dùng' }));
      }
      return;
    }

    // POST /api/users
    if (req.method === 'POST' && (reqPath === '/api/users' || reqPath === '/api/users/')) {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const userData = JSON.parse(body);
          if (!userData.username) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, message: 'Tên đăng nhập không được để trống' }));
            return;
          }
          const created = await sqlCreateUser(userData);
          const sanitized = { ...created };
          delete sanitized.password_hash;
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, data: sanitized }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ' }));
        }
      });
      return;
    }

    // PUT /api/users/:id
    if (req.method === 'PUT' && userMatch) {
      const userId = userMatch[1];
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const patch = JSON.parse(body);
          if (patch.avatar && typeof patch.avatar === 'string' && patch.avatar.startsWith('data:image/')) {
            const approxBytes = patch.avatar.length * 0.75;
            if (approxBytes > 3 * 1024 * 1024) {
              res.writeHead(400);
              res.end(JSON.stringify({ success: false, message: 'Dung lượng ảnh đại diện vượt quá 3MB' }));
              return;
            }
          }
          const updated = await sqlUpdateUser(userId, patch);
          if (updated) {
            const sanitized = { ...updated };
            delete sanitized.password_hash;
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: sanitized }));
          } else {
            res.writeHead(404);
            res.end(JSON.stringify({ success: false, message: 'Không tìm thấy người dùng' }));
          }
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ' }));
        }
      });
      return;
    }

    // DELETE /api/users/:id
    if (req.method === 'DELETE' && userMatch) {
      const userId = userMatch[1];
      const success = sqlDeleteUser(userId);
      res.writeHead(200);
      res.end(JSON.stringify({ success }));
      return;
    }

    // PUT /api/orders/:id/status
    const orderStatusMatch = reqPath.match(/^\/api\/orders\/([^/]+)\/status$/);
    if (req.method === 'PUT' && orderStatusMatch) {
      const orderId = orderStatusMatch[1];
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { status } = JSON.parse(body);
          const success = sqlUpdateOrderStatus(orderId, status);
          res.writeHead(200);
          res.end(JSON.stringify({ success }));
        } catch {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ' }));
        }
      });
      return;
    }

    // GET /api/theme
    if (req.method === 'GET' && reqPath === '/api/theme') {
      const theme = sqlGetTheme();
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: theme }));
      return;
    }

    // POST /api/theme
    if (req.method === 'POST' && reqPath === '/api/theme') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const theme = JSON.parse(body);
          const saved = sqlSaveTheme(theme);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, data: saved }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ' }));
        }
      });
      return;
    }

    // POST /api/auth/login (Secure rate-limited authentication with Argon2id)
    if (req.method === 'POST' && reqPath === '/api/auth/login') {
      const clientIp = req.socket.remoteAddress || '127.0.0.1';
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { username, password } = JSON.parse(body);
          if (!username || !password) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, message: 'Vui lòng cung cấp đầy đủ tên đăng nhập và mật khẩu' }));
            return;
          }

          const rateKey = `${clientIp}:${username.toLowerCase().trim()}`;
          const now = Date.now();
          const rate = loginAttempts.get(rateKey) || { count: 0, lockoutUntil: 0 };
          if (rate.lockoutUntil && now < rate.lockoutUntil) {
            const waitMinutes = Math.ceil((rate.lockoutUntil - now) / 60000);
            res.writeHead(429);
            res.end(JSON.stringify({
              success: false,
              message: `Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${waitMinutes} phút.`
            }));
            return;
          }

          const user = sqlGetUserByUsername(username);
          if (!user) {
            rate.count = (rate.count || 0) + 1;
            if (rate.count >= MAX_FAILED_ATTEMPTS) {
              rate.lockoutUntil = now + LOCKOUT_MS;
              rate.count = 0;
            }
            loginAttempts.set(rateKey, rate);
            res.writeHead(401);
            res.end(JSON.stringify({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' }));
            return;
          }

          const isValid = await verifyPassword(password, user.password_hash);
          if (!isValid) {
            rate.count = (rate.count || 0) + 1;
            if (rate.count >= MAX_FAILED_ATTEMPTS) {
              rate.lockoutUntil = now + LOCKOUT_MS;
              rate.count = 0;
            }
            loginAttempts.set(rateKey, rate);
            res.writeHead(401);
            res.end(JSON.stringify({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' }));
            return;
          }

          loginAttempts.delete(rateKey);

          const sessionToken = crypto.randomBytes(32).toString('hex');
          res.setHeader('Set-Cookie', `cset_session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`);

          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            data: {
              id: user.id,
              username: user.username,
              fullName: user.fullName,
              phone: user.phone,
              address: user.address,
              role: user.role,
              createdAt: user.createdAt
            }
          }));
        } catch {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: 'Yêu cầu không hợp lệ' }));
        }
      });
      return;
    }
  }

  let reqUrl = reqPath;
  if (reqUrl === '/' || reqUrl === '') {
    reqUrl = '/index.html';
  } else if (reqUrl === '/admin') {
    reqUrl = '/admin.html';
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
  console.log(`CSET Store Offline MPA Server running at http://localhost:${PORT}`);
  console.log(`- Web Shop: http://localhost:${PORT}/index.html`);
  console.log(`- Web Admin: http://localhost:${PORT}/admin.html`);
});
