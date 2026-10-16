import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5174;
const DIST = path.join(import.meta.dirname, 'dist');
const DATA_DIR = path.join(import.meta.dirname, 'data');

function getProducts() {
  const filePath = path.join(DATA_DIR, 'products.json');
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error('Error reading products.json:', e);
    }
  }
  return [];
}

function getReviews() {
  const filePath = path.join(DATA_DIR, 'reviews.json');
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error('Error reading reviews.json:', e);
    }
  }
  return [];
}

function saveProducts(products) {
  const filePath = path.join(DATA_DIR, 'products.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error saving products.json:', e);
    return false;
  }
}
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

    // GET /api/products/:id
    const productMatch = reqPath.match(/^\/api\/products\/(\d+)$/);
    if (req.method === 'GET' && productMatch) {
      const prodId = parseInt(productMatch[1], 10);
      const products = getProducts();
      const product = products.find(p => p.id === prodId);
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
          const products = getProducts();
          const idx = products.findIndex(p => p.id === prodId);
          if (idx !== -1) {
            products[idx] = { ...products[idx], ...patch };
            saveProducts(products);
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: products[idx] }));
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
      let products = getProducts();
      products = products.filter(p => p.id !== prodId);
      saveProducts(products);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // POST /api/products
    if (req.method === 'POST' && (reqPath === '/api/products' || reqPath === '/api/products/')) {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const newProd = JSON.parse(body);
          const products = getProducts();
          if (!newProd.id) {
            newProd.id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
          }
          products.unshift(newProd);
          saveProducts(products);
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, data: newProd }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ' }));
        }
      });
      return;
    }

    // GET /api/products
    if (req.method === 'GET' && (reqPath === '/api/products' || reqPath === '/api/products/')) {
      const products = getProducts();
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: products }));
      return;
    }

    // GET /api/reviews?productId=:id
    if (req.method === 'GET' && reqPath === '/api/reviews') {
      const sp = new URLSearchParams(queryString || '');
      const prodId = sp.get('productId');
      let reviews = getReviews();
      if (prodId) {
        reviews = reviews.filter(r => r.productId === parseInt(prodId, 10));
      }
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: reviews }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ success: false, message: 'API route not found' }));
    return;
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
