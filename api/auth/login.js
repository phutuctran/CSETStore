import { withDb } from '../../server/routes/utils.js';
import { pgGetUserByUsername } from '../../server/postgres.js';
import { sqlGetUserByUsername, verifyPassword } from '../../server/database.js';

const loginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { username, password } = body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ tên đăng nhập và mật khẩu' });
    }

    const rateKey = `${clientIp}:${username.toLowerCase().trim()}`;
    const now = Date.now();
    const rate = loginAttempts.get(rateKey) || { count: 0, lockoutUntil: 0 };
    if (rate.lockoutUntil && now < rate.lockoutUntil) {
      const waitMinutes = Math.ceil((rate.lockoutUntil - now) / 60000);
      return res.status(429).json({
        success: false,
        message: `Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${waitMinutes} phút.`
      });
    }

    const user = await withDb(() => pgGetUserByUsername(username), () => sqlGetUserByUsername(username));
    if (!user) {
      rate.count = (rate.count || 0) + 1;
      if (rate.count >= MAX_FAILED_ATTEMPTS) {
        rate.lockoutUntil = now + LOCKOUT_MS;
        rate.count = 0;
      }
      loginAttempts.set(rateKey, rate);
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      rate.count = (rate.count || 0) + 1;
      if (rate.count >= MAX_FAILED_ATTEMPTS) {
        rate.lockoutUntil = now + LOCKOUT_MS;
        rate.count = 0;
      }
      loginAttempts.set(rateKey, rate);
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }

    loginAttempts.delete(rateKey);

    const sanitized = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      email: user.email || '',
      city: user.city || '',
      district: user.district || '',
      ward: user.ward || '',
      gender: user.gender || 'male',
      birthday: user.birthday || '',
      avatar: user.avatar || '',
      bio: user.bio || '',
      role: user.role,
      createdAt: user.createdAt
    };

    return res.status(200).json({ success: true, data: sanitized });
  } catch {
    return res.status(400).json({ success: false, message: 'Yêu cầu không hợp lệ' });
  }
}
