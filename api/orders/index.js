import { isPostgresConfigured, pgGetOrders, pgCreateOrder } from '../../server/postgres.js';
import { sqlGetOrders, sqlCreateOrder } from '../../server/database.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body.customerName || !body.phone || !body.address || !body.items || body.items.length === 0) {
        return res.status(400).json({ success: false, message: 'Thông tin đơn hàng không đầy đủ' });
      }
      const created = isPostgresConfigured() ? await pgCreateOrder(body) : sqlCreateOrder(body);
      return res.status(201).json({ success: true, data: created });
    } catch {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
