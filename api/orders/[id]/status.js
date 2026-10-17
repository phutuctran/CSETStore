import { isPostgresConfigured, pgUpdateOrderStatus } from '../../../server/postgres.js';
import { sqlUpdateOrderStatus } from '../../../server/database.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { id } = req.query;
  if (!id || req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body.status) {
      return res.status(400).json({ success: false, message: 'Thiếu trạng thái đơn hàng' });
    }
    const success = isPostgresConfigured() ? await pgUpdateOrderStatus(id, body.status) : sqlUpdateOrderStatus(id, body.status);
    return res.status(200).json({ success });
  } catch {
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
  }
}
