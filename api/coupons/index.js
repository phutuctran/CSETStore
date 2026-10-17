import { isPostgresConfigured, pgGetCoupons, pgCreateCoupon, pgUpdateCoupon, pgDeleteCoupon } from '../../server/postgres.js';
import { sqlGetCoupons, sqlCreateCoupon, sqlUpdateCoupon, sqlDeleteCoupon } from '../../server/database.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    try {
      const list = isPostgresConfigured() ? await pgGetCoupons() : sqlGetCoupons();
      return res.status(200).json({ success: true, data: list });
    } catch (err) {
      console.error('[API /api/coupons] GET error:', err);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body.code || !body.discountValue) {
        return res.status(400).json({ success: false, message: 'Thông tin mã giảm giá không đầy đủ' });
      }
      const created = isPostgresConfigured() ? await pgCreateCoupon(body) : sqlCreateCoupon(body);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      console.error('[API /api/coupons] POST error:', err);
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
  }
  if (req.method === 'PUT') {
    const { id } = req.query;
    try {
      const patch = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const couponId = id || patch?.id;
      if (!couponId) {
        return res.status(400).json({ success: false, message: 'Thiếu ID mã giảm giá' });
      }
      const success = isPostgresConfigured() ? await pgUpdateCoupon(couponId, patch) : sqlUpdateCoupon(couponId, patch);
      return res.status(200).json({ success });
    } catch (err) {
      console.error('[API /api/coupons] PUT error:', err);
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Thiếu ID mã giảm giá' });
    }
    try {
      const success = isPostgresConfigured() ? await pgDeleteCoupon(id) : sqlDeleteCoupon(id);
      return res.status(200).json({ success });
    } catch (err) {
      console.error('[API /api/coupons] DELETE error:', err);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
