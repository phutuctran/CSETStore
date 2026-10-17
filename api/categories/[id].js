import { isPostgresConfigured, pgUpdateCategory, pgDeleteCategory } from '../../server/postgres.js';
import { sqlUpdateCategory, sqlDeleteCategory } from '../../server/database.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { id } = req.query;
  const key = id;
  if (!key) {
    return res.status(400).json({ success: false, message: 'Thiếu key ngành hàng' });
  }

  if (req.method === 'PUT') {
    try {
      const patch = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const success = isPostgresConfigured() ? await pgUpdateCategory(key, patch) : sqlUpdateCategory(key, patch);
      return res.status(200).json({ success });
    } catch (err) {
      console.error('[API /api/categories/:id] PUT error:', err);
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const success = isPostgresConfigured() ? await pgDeleteCategory(key) : sqlDeleteCategory(key);
      return res.status(200).json({ success });
    } catch (err) {
      console.error('[API /api/categories/:id] DELETE error:', err);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
