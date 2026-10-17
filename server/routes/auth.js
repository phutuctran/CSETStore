// server/routes/auth.js - Auth Login API Handler
import crypto from 'crypto';
import { sendJson, sendError, readJsonBody, checkLoginRateLimit, recordFailedLogin, clearLoginRateLimit, withDb } from './utils.js';
import { pgGetUserByUsername } from '../postgres.js';
import { sqlGetUserByUsername, verifyPassword } from '../database.js';

export async function handleAuthRoute(req, res, reqPath) {
  if (req.method === 'POST' && reqPath === '/api/auth/login') {
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const { username, password } = await readJsonBody(req);
    if (!username || !password) {
      return sendError(res, 400, 'Vui lòng cung cấp đầy đủ tên đăng nhập và mật khẩu');
    }

    const rateKey = `${clientIp}:${username.toLowerCase().trim()}`;
    const rateCheck = checkLoginRateLimit(rateKey);
    if (rateCheck.locked) {
      return sendError(res, 429, rateCheck.message);
    }

    const user = await withDb(
      () => pgGetUserByUsername(username),
      () => sqlGetUserByUsername(username)
    );
    if (!user) {
      recordFailedLogin(rateKey);
      return sendError(res, 401, 'Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    const isValid = await verifyPassword(password, user.password_hash || '');
    if (!isValid) {
      recordFailedLogin(rateKey);
      return sendError(res, 401, 'Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    clearLoginRateLimit(rateKey);
    const sessionToken = crypto.randomBytes(32).toString('hex');
    res.setHeader('Set-Cookie', `cset_session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`);

    const sanitized = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt
    };
    sendJson(res, 200, { success: true, data: sanitized });
    return true;
  }

  return false;
}
