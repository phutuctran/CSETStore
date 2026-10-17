// server/routes/products.js - Products API Handler
import { sendJson, sendError, readJsonBody, withDb } from './utils.js';
import {
  pgGetProducts,
  pgGetProductById,
  pgCreateProduct,
  pgUpdateProduct,
  pgDeleteProduct,
  pgAutoSelectTop5BestSellers
} from '../postgres.js';
import {
  sqlGetProducts,
  sqlGetProductById,
  sqlCreateProduct,
  sqlUpdateProduct,
  sqlDeleteProduct,
  sqlAutoSelectTop5BestSellers
} from '../database.js';

export async function handleProductsRoute(req, res, reqPath) {
  // POST /api/products/auto-top5
  if (req.method === 'POST' && (reqPath === '/api/products/auto-top5' || reqPath === '/api/products/auto-top5/')) {
    const data = await withDb(pgAutoSelectTop5BestSellers, sqlAutoSelectTop5BestSellers);
    sendJson(res, 200, { success: true, data });
    return true;
  }

  // Routes for /api/products/:id
  const match = reqPath.match(/^\/api\/products\/(\d+)$/);
  if (match) {
    const id = parseInt(match[1], 10);
    if (req.method === 'GET') {
      const product = await withDb(() => pgGetProductById(id), () => sqlGetProductById(id));
      if (!product) return sendError(res, 404, 'Không tìm thấy sản phẩm');
      sendJson(res, 200, { success: true, data: product });
      return true;
    }
    if (req.method === 'PUT') {
      const patch = await readJsonBody(req);
      const success = await withDb(() => pgUpdateProduct(id, patch), () => sqlUpdateProduct(id, patch));
      const data = await withDb(() => pgGetProductById(id), () => sqlGetProductById(id));
      sendJson(res, 200, { success, data });
      return true;
    }
    if (req.method === 'DELETE') {
      const success = await withDb(() => pgDeleteProduct(id), () => sqlDeleteProduct(id));
      sendJson(res, 200, { success });
      return true;
    }
  }

  // Base /api/products
  if (reqPath === '/api/products' || reqPath === '/api/products/') {
    if (req.method === 'GET') {
      const list = await withDb(pgGetProducts, sqlGetProducts);
      sendJson(res, 200, { success: true, data: list });
      return true;
    }
    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      const created = await withDb(() => pgCreateProduct(body), () => sqlCreateProduct(body));
      sendJson(res, 201, { success: true, data: created });
      return true;
    }
  }

  return false;
}
