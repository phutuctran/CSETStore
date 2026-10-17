import { withDb } from '../../server/routes/utils.js';
import { pgGetUsers, pgCreateUser } from '../../server/postgres.js';
import { sqlGetUsers, sqlCreateUser } from '../../server/database.js';

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
      const users = await withDb(pgGetUsers, sqlGetUsers);
      return res.status(200).json({ success: true, data: users });
    } catch {
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body.username) {
        return res.status(400).json({ success: false, message: 'Tên đăng nhập không được để trống' });
      }
      const created = await withDb(() => pgCreateUser(body), () => sqlCreateUser(body));
      const sanitized = { ...(created || {}) };
      delete sanitized.password_hash;
      return res.status(201).json({ success: true, data: sanitized });
    } catch {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
