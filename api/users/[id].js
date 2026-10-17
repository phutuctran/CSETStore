import { isPostgresConfigured, pgGetUserById, pgUpdateUser, pgDeleteUser } from '../../server/postgres.js';
import { sqlGetUserById, sqlUpdateUser, sqlDeleteUser } from '../../server/database.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ success: false, message: 'Thiếu ID người dùng' });
  }

  if (req.method === 'GET') {
    try {
      const user = isPostgresConfigured() ? await pgGetUserById(id) : sqlGetUserById(id);
      if (user) {
        const sanitized = { ...user };
        delete sanitized.password_hash;
        return res.status(200).json({ success: true, data: sanitized });
      }
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    } catch {
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const patch = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (patch.avatar && typeof patch.avatar === 'string' && patch.avatar.startsWith('data:image/')) {
        const approxBytes = patch.avatar.length * 0.75;
        if (approxBytes > 3 * 1024 * 1024) {
          return res.status(400).json({ success: false, message: 'Ảnh đại diện không được vượt quá 3MB' });
        }
      }
      const updated = isPostgresConfigured() ? await pgUpdateUser(id, patch) : await sqlUpdateUser(id, patch);
      if (updated) {
        const sanitized = { ...updated };
        delete sanitized.password_hash;
        return res.status(200).json({ success: true, data: sanitized });
      }
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    } catch {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const success = isPostgresConfigured() ? await pgDeleteUser(id) : sqlDeleteUser(id);
      return res.status(200).json({ success });
    } catch {
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
