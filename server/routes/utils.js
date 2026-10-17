// server/routes/utils.js - Shared HTTP and Rate Limiting Utilities
import { isPostgresConfigured } from '../postgres.js';

export async function withDb(pgFn, sqlFn) {
  if (isPostgresConfigured()) {
    try {
      return await pgFn();
    } catch (err) {
      console.warn('[Database Backend Warning - Falling back to local SQL]:', err?.message || err);
      return await sqlFn();
    }
  }
  return await sqlFn();
}
export function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export function sendError(res, status, message) {
  sendJson(res, status, { success: false, message });
}

export function readJsonBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

// Order Rate Limiting
const orderRateLimits = new Map();
const MIN_ORDER_INTERVAL_MS = 2500;
const MAX_ORDERS_PER_MINUTE = 4;
const RATE_WINDOW_MS = 60000;

export function checkOrderRateLimit(key) {
  const now = Date.now();
  const entry = orderRateLimits.get(key) || { timestamps: [] };
  entry.timestamps = entry.timestamps.filter(t => now - t < RATE_WINDOW_MS);

  const lastTime = entry.timestamps[entry.timestamps.length - 1] || 0;
  if (now - lastTime < MIN_ORDER_INTERVAL_MS) {
    return { allowed: false, message: 'Thao tác đặt hàng quá nhanh. Vui lòng chờ 3 giây trước khi thử lại.' };
  }
  if (entry.timestamps.length >= MAX_ORDERS_PER_MINUTE) {
    return { allowed: false, message: 'Tần suất gửi đơn hàng quá cao. Vui lòng thử lại sau 1 phút.' };
  }

  entry.timestamps.push(now);
  orderRateLimits.set(key, entry);
  return { allowed: true };
}

// Login Rate Limiting
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export function checkLoginRateLimit(key) {
  const now = Date.now();
  const rate = loginAttempts.get(key) || { count: 0, lockoutUntil: 0 };
  if (rate.lockoutUntil && now < rate.lockoutUntil) {
    const waitMinutes = Math.ceil((rate.lockoutUntil - now) / 60000);
    return {
      locked: true,
      message: `Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${waitMinutes} phút.`
    };
  }
  return { locked: false, rate };
}

export function recordFailedLogin(key) {
  const now = Date.now();
  const rate = loginAttempts.get(key) || { count: 0, lockoutUntil: 0 };
  rate.count = (rate.count || 0) + 1;
  if (rate.count >= MAX_LOGIN_ATTEMPTS) {
    rate.lockoutUntil = now + LOCKOUT_MS;
    rate.count = 0;
  }
  loginAttempts.set(key, rate);
}

export function clearLoginRateLimit(key) {
  loginAttempts.delete(key);
}
