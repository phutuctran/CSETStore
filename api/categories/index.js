import { withDb } from '../../server/routes/utils.js';
import { pgGetCategories, pgCreateCategory, pgUpdateCategory, pgDeleteCategory } from '../../server/postgres.js';
import { sqlGetCategories, sqlCreateCategory, sqlUpdateCategory, sqlDeleteCategory } from '../../server/database.js';

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
      const list = await withDb(pgGetCategories, sqlGetCategories);
      return res.status(200).json({ success: true, data: list });
    } catch (err) {
      console.error('[API /api/categories] GET error:', err);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body.key || !body.label) {
        return res.status(400).json({ success: false, message: 'Thông tin ngành hàng không đầy đủ' });
      }
      const created = await withDb(() => pgCreateCategory(body), () => sqlCreateCategory(body));
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      console.error('[API /api/categories] POST error:', err);
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
  }
  if (req.method === 'PUT') {
    const { id } = req.query;
    try {
      const patch = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const key = id || patch?.key;
      if (!key) {
        return res.status(400).json({ success: false, message: 'Thiếu key ngành hàng' });
      }
      const success = await withDb(() => pgUpdateCategory(key, patch), () => sqlUpdateCategory(key, patch));
      return res.status(200).json({ success });
    } catch (err) {
      console.error('[API /api/categories] PUT error:', err);
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Thiếu key ngành hàng' });
    }
    try {
      const success = await withDb(() => pgDeleteCategory(id), () => sqlDeleteCategory(id));
      return res.status(200).json({ success });
    } catch (err) {
      console.error('[API /api/categories] DELETE error:', err);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
