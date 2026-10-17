// server/routes/users.js - Users API Handler
import { sendJson, sendError, readJsonBody, withDb } from './utils.js';
import { pgGetUsers, pgGetUserById, pgCreateUser, pgUpdateUser, pgDeleteUser } from '../postgres.js';
import { sqlGetUsers, sqlGetUserById, sqlCreateUser, sqlUpdateUser, sqlDeleteUser } from '../database.js';

function sanitize(user) {
  if (!user) return null;
  const s = { ...user };
  delete s.password_hash;
  delete s.password;
  return s;
}

export async function handleUsersRoute(req, res, reqPath) {
  const match = reqPath.match(/^\/api\/users\/([^/]+)$/);
  if (match) {
    const userId = match[1];
    if (req.method === 'GET') {
      const user = await withDb(
        () => pgGetUserById(userId),
        () => sqlGetUserById(userId)
      );
      if (!user) return sendError(res, 404, 'Không tìm thấy người dùng');
      sendJson(res, 200, { success: true, data: sanitize(user) });
      return true;
    }
    if (req.method === 'PUT') {
      const patch = await readJsonBody(req);
      if (patch.avatar && typeof patch.avatar === 'string' && patch.avatar.startsWith('data:image/')) {
        const approxBytes = patch.avatar.length * 0.75;
        if (approxBytes > 3 * 1024 * 1024) {
          return sendError(res, 400, 'Dung lượng ảnh đại diện vượt quá 3MB');
        }
      }
      const updated = await withDb(
        () => pgUpdateUser(userId, patch),
        () => sqlUpdateUser(userId, patch)
      );
      if (!updated) return sendError(res, 404, 'Không tìm thấy người dùng');
      sendJson(res, 200, { success: true, data: sanitize(updated) });
      return true;
    }
    if (req.method === 'DELETE') {
      const success = await withDb(
        () => pgDeleteUser(userId),
        () => sqlDeleteUser(userId)
      );
      sendJson(res, 200, { success });
      return true;
    }
  }

  if (reqPath === '/api/users' || reqPath === '/api/users/') {
    if (req.method === 'GET') {
      const users = await withDb(pgGetUsers, sqlGetUsers);
      sendJson(res, 200, { success: true, data: users.map(sanitize) });
      return true;
    }
    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!body.username) return sendError(res, 400, 'Tên đăng nhập không được để trống');
      const created = await withDb(
        () => pgCreateUser(body),
        () => sqlCreateUser(body)
      );
      sendJson(res, 201, { success: true, data: sanitize(created) });
      return true;
    }
  }

  return false;
}
