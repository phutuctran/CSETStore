// server/routes/orders.js - Orders API Handler
import { sendJson, sendError, readJsonBody, checkOrderRateLimit, withDb } from './utils.js';
import { pgGetOrders, pgCreateOrder, pgUpdateOrderStatus } from '../postgres.js';
import { sqlGetOrders, sqlCreateOrder, sqlUpdateOrderStatus } from '../database.js';

export async function handleOrdersRoute(req, res, reqPath) {
  // PUT /api/orders/:id/status
  const statusMatch = reqPath.match(/^\/api\/orders\/([^/]+)\/status$/);
  if (req.method === 'PUT' && statusMatch) {
    const orderId = statusMatch[1];
    const body = await readJsonBody(req);
    if (!body.status) return sendError(res, 400, 'Thiếu trạng thái đơn hàng');
    const success = await withDb(
      () => pgUpdateOrderStatus(orderId, body.status),
      () => sqlUpdateOrderStatus(orderId, body.status)
    );
    sendJson(res, 200, { success });
    return true;
  }

  // Base /api/orders
  if (reqPath === '/api/orders' || reqPath === '/api/orders/') {
    if (req.method === 'GET') {
      const orders = await withDb(pgGetOrders, sqlGetOrders);
      sendJson(res, 200, { success: true, data: orders });
      return true;
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!body.customerName || !body.phone || !body.address || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
        return sendError(res, 400, 'Thông tin đơn hàng không đầy đủ');
      }

      const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
      const cleanPhone = String(body.phone || '').replace(/[\s+-]+/g, '');
      const rateKey = `${clientIp}:${cleanPhone || 'anonymous'}`;
      const rateCheck = checkOrderRateLimit(rateKey);
      if (!rateCheck.allowed) {
        return sendError(res, 429, rateCheck.message);
      }

      const created = await withDb(
        () => pgCreateOrder(body),
        () => sqlCreateOrder(body)
      );
      sendJson(res, 201, { success: true, data: created });
      return true;
    }
  }

  return false;
}
