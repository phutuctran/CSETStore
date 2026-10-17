import { isPostgresConfigured, pgGetOrders, pgCreateOrder, pgUpdateOrderStatus } from '../../server/postgres.js';
import { sqlGetOrders, sqlCreateOrder, sqlUpdateOrderStatus } from '../../server/database.js';

// In-memory Order Rate Limiting (chống auto-clicker và spam đặt hàng)
const orderRateLimits = new Map();
const MIN_ORDER_INTERVAL_MS = 2500; // Tối thiểu 2.5 giây giữa 2 lần đặt
const MAX_ORDERS_PER_MINUTE = 4;    // Tối đa 4 đơn / phút cho cùng IP / SĐT
const RATE_WINDOW_MS = 60000;

function checkOrderRateLimit(key) {
  const now = Date.now();
  const entry = orderRateLimits.get(key) || { timestamps: [] };
  entry.timestamps = entry.timestamps.filter(t => now - t < RATE_WINDOW_MS);

  const lastTime = entry.timestamps[entry.timestamps.length - 1] || 0;
  if (now - lastTime < MIN_ORDER_INTERVAL_MS) {
    return { allowed: false, message: 'Thao tác đặt hàng quá nhanh. Vui lòng chờ 3 giây trước khi thử lại.' };
  }
  if (entry.timestamps.length >= MAX_ORDERS_PER_MINUTE) {
    return { allowed: false, message: 'Tần suất gửi đơn hàng quá cao. Vui lòng thử lại sau 1 phút.' };
  }

  entry.timestamps.push(now);
  orderRateLimits.set(key, entry);
  if (orderRateLimits.size > 1000) {
    for (const [k, v] of orderRateLimits.entries()) {
      if (v.timestamps.length === 0 || now - v.timestamps[v.timestamps.length - 1] > RATE_WINDOW_MS) {
        orderRateLimits.delete(k);
      }
    }
  }
  return { allowed: true };
}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    try {
      const orders = isPostgresConfigured() ? await pgGetOrders() : sqlGetOrders();
      return res.status(200).json({ success: true, data: orders });
    } catch {
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (Buffer.isBuffer(body)) {
        body = JSON.parse(body.toString('utf-8'));
      } else if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      if (!body || !body.customerName || !body.phone || !body.address || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
        return res.status(400).json({ success: false, message: 'Thông tin đơn hàng không đầy đủ' });
      }

      const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
      const cleanPhone = String(body.phone).replace(/[\s+-]+/g, '');
      const rateKey = `${clientIp}:${cleanPhone || 'anonymous'}`;
      const rateCheck = checkOrderRateLimit(rateKey);
      if (!rateCheck.allowed) {
        return res.status(429).json({ success: false, message: rateCheck.message });
      }

      const created = isPostgresConfigured() ? await pgCreateOrder(body) : sqlCreateOrder(body);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      console.error('[API /api/orders] Error processing POST:', err);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tạo đơn hàng' });
    }
  }
  if (req.method === 'PUT') {
    const { id } = req.query;
    try {
      let body = req.body;
      if (Buffer.isBuffer(body)) {
        body = JSON.parse(body.toString('utf-8'));
      } else if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      const orderId = id || body?.id;
      if (!orderId || !body?.status) {
        return res.status(400).json({ success: false, message: 'Thiếu ID hoặc trạng thái đơn hàng' });
      }
      const success = isPostgresConfigured() ? await pgUpdateOrderStatus(orderId, body.status) : sqlUpdateOrderStatus(orderId, body.status);
      return res.status(200).json({ success });
    } catch (err) {
      console.error('[API /api/orders] PUT error:', err);
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
