import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5174;
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
  restoreSqlDump
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

const server = http.createServer((req, res) => {
  const [reqPath, queryString] = (req.url || '/').split('?');

  // API Endpoints
  if (reqPath.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

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
          const created = sqlCreateOrder(newOrder);
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, data: created }));
        } catch (err) {
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
