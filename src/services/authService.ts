import type { User, Role } from '../models/types';
import { LocalStorageUserRepository } from '../repositories';
import { hashPasswordArgon2, verifyPasswordArgon2, sanitizeUser } from './cryptoService';

const userRepo = new LocalStorageUserRepository();
const ADMIN_SESSION_KEY = 'cset_admin_session';
const CUSTOMER_SESSION_KEY = 'cset_customer_session';
const RATE_LIMIT_KEY = 'cset_login_rate_limits';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const CUSTOMER_SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SessionEnvelope {
  user: User;
  expiresAt: number;
}

interface RateLimitMap {
  [key: string]: {
    attempts: number;
    lockoutUntil: number;
  };
}

function getRateLimits(): RateLimitMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function checkRateLimit(key: string): { locked: boolean; waitMinutes?: number } {
  const map = getRateLimits();
  const entry = map[key.toLowerCase()];
  if (!entry) return { locked: false };
  if (entry.lockoutUntil && Date.now() < entry.lockoutUntil) {
    const remainingMs = entry.lockoutUntil - Date.now();
    return { locked: true, waitMinutes: Math.ceil(remainingMs / 60000) };
  }
  return { locked: false };
}

function recordFailedAttempt(key: string): void {
  if (typeof window === 'undefined') return;
  const map = getRateLimits();
  const k = key.toLowerCase();
  const entry = map[k] || { attempts: 0, lockoutUntil: 0 };
  entry.attempts = (entry.attempts || 0) + 1;
  if (entry.attempts >= MAX_LOGIN_ATTEMPTS) {
    entry.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
    entry.attempts = 0;
  }
  map[k] = entry;
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(map));
  } catch {}
}

function clearRateLimit(key: string): void {
  if (typeof window === 'undefined') return;
  const map = getRateLimits();
  delete map[key.toLowerCase()];
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(map));
  } catch {}
}


export interface PasswordStrengthResult {
  score: number; // 0 (empty) to 5
  level: 'very_weak' | 'weak' | 'medium' | 'strong' | 'very_strong';
  label: string;
  colorClass: string;
  barWidth: string;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  suggestions: string[];
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      level: 'very_weak',
      label: 'Chưa nhập',
      colorClass: 'bg-slate-200 text-slate-500',
      barWidth: '0%',
      hasMinLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecial: false,
      suggestions: ['Nhập mật khẩu từ 8 ký tự trở lên']
    };
  }

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (password.length >= 6) score += 1;
  if (hasMinLength) score += 1;
  if (hasUppercase && hasLowercase) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  const suggestions: string[] = [];
  if (!hasMinLength) suggestions.push('Tối thiểu 8 ký tự');
  if (!hasUppercase) suggestions.push('Ít nhất 1 chữ in hoa (A-Z)');
  if (!hasNumber) suggestions.push('Ít nhất 1 chữ số (0-9)');
  if (!hasSpecial) suggestions.push('Ít nhất 1 ký tự đặc biệt (!@#$...)');

  if (score <= 1) {
    return { score: 1, level: 'very_weak', label: 'Rất yếu', colorClass: 'bg-rose-500 text-rose-600', barWidth: '20%', hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial, suggestions };
  } else if (score === 2) {
    return { score: 2, level: 'weak', label: 'Yếu', colorClass: 'bg-amber-500 text-amber-600', barWidth: '40%', hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial, suggestions };
  } else if (score === 3) {
    return { score: 3, level: 'medium', label: 'Trung bình', colorClass: 'bg-yellow-500 text-yellow-600', barWidth: '60%', hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial, suggestions };
  } else if (score === 4) {
    return { score: 4, level: 'strong', label: 'Mạnh', colorClass: 'bg-blue-600 text-blue-600', barWidth: '80%', hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial, suggestions };
  }
  return { score: 5, level: 'very_strong', label: 'Rất mạnh', colorClass: 'bg-emerald-500 text-emerald-600', barWidth: '100%', hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial, suggestions };
}
export class AuthService {
  // Session handling with expiration (TTL)
  getAdminSession(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    try {
      const envelope: SessionEnvelope = JSON.parse(raw);
      if (envelope.expiresAt && Date.now() > envelope.expiresAt) {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        return null;
      }
      return envelope.user || (envelope as unknown as User);
    } catch {
      return null;
    }
  }

  getCustomerSession(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(CUSTOMER_SESSION_KEY);
    if (!raw) return null;
    try {
      const envelope: SessionEnvelope = JSON.parse(raw);
      if (envelope.expiresAt && Date.now() > envelope.expiresAt) {
        localStorage.removeItem(CUSTOMER_SESSION_KEY);
        return null;
      }
      return envelope.user || (envelope as unknown as User);
    } catch {
      return null;
    }
  }

  setAdminSession(user: User | null): void {
    if (typeof window === 'undefined') return;
    if (user) {
      const envelope: SessionEnvelope = {
        user: sanitizeUser(user) as User,
        expiresAt: Date.now() + ADMIN_SESSION_TTL_MS
      };
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(envelope));
    } else {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  }

  setCustomerSession(user: User | null): void {
    if (typeof window === 'undefined') return;
    if (user) {
      const envelope: SessionEnvelope = {
        user: sanitizeUser(user) as User,
        expiresAt: Date.now() + CUSTOMER_SESSION_TTL_MS
      };
      localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(envelope));
    } else {
      localStorage.removeItem(CUSTOMER_SESSION_KEY);
    }
  }

  // Authentication with Argon2id and Rate Limiting
  async loginAdmin(username: string, pass: string): Promise<{ success: boolean; user?: User; message?: string }> {
    const rate = checkRateLimit(username);
    if (rate.locked) {
      return {
        success: false,
        message: `Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${rate.waitMinutes} phút.`
      };
    }
    // Try server API first for cross-device authentication
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      try {
        const sRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password: pass })
        });
        if (sRes.ok) {
          const sJson = await sRes.json();
          if (sJson.success && sJson.data) {
            if (sJson.data.role === 'customer') {
              return { success: false, message: 'Tài khoản khách hàng không có quyền truy cập hệ thống quản trị!' };
            }
            clearRateLimit(username);
            this.setAdminSession(sJson.data);
            return { success: true, user: sJson.data };
          }
        } else if (sRes.status === 401 || sRes.status === 429) {
          const errJson = await sRes.json().catch(() => ({}));
          if (sRes.status === 429) {
            return { success: false, message: errJson.message || 'Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần.' };
          }
          recordFailedAttempt(username);
          return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' };
        }
      } catch {}
    }

    let user = userRepo.getByUsername(username);
    if (!user && username.toLowerCase().trim() === 'admin') {
      user = userRepo.getByUsername('superadmin');
    }
    if (!user) {
      recordFailedAttempt(username);
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' };
    }

    const isValidPass = await verifyPasswordArgon2(pass, user.password);
    if (!isValidPass) {
      recordFailedAttempt(username);
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' };
    }

    if (user.role === 'customer') {
      return { success: false, message: 'Tài khoản khách hàng không có quyền truy cập hệ thống quản trị!' };
    }

    clearRateLimit(username);
    this.setAdminSession(user);
    return { success: true, user: sanitizeUser(user) as User };
  }

  async loginCustomer(username: string, pass: string): Promise<{ success: boolean; user?: User; message?: string }> {
    const rate = checkRateLimit(username);
    if (rate.locked) {
      return {
        success: false,
        message: `Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${rate.waitMinutes} phút.`
      };
    }
    // Try server API first for cross-device authentication
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      try {
        const sRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password: pass })
        });
        if (sRes.ok) {
          const sJson = await sRes.json();
          if (sJson.success && sJson.data) {
            clearRateLimit(username);
            this.setCustomerSession(sJson.data);
            return { success: true, user: sJson.data };
          }
        } else if (sRes.status === 401 || sRes.status === 429) {
          const errJson = await sRes.json().catch(() => ({}));
          if (sRes.status === 429) {
            return { success: false, message: errJson.message || 'Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần.' };
          }
          recordFailedAttempt(username);
          return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' };
        }
      } catch {}
    }

    let user = userRepo.getByUsername(username);
    if (!user && username.toLowerCase().trim() === 'admin') {
      user = userRepo.getByUsername('superadmin');
    }
    if (!user) {
      recordFailedAttempt(username);
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' };
    }

    const isValidPass = await verifyPasswordArgon2(pass, user.password);
    if (!isValidPass) {
      recordFailedAttempt(username);
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' };
    }

    clearRateLimit(username);
    this.setCustomerSession(user);
    return { success: true, user: sanitizeUser(user) as User };
  }

  async registerCustomer(data: {
    username: string;
    password?: string;
    fullName: string;
    phone?: string;
    address?: string;
  }): Promise<{ success: boolean; user?: User; message?: string }> {
    const exists = userRepo.getByUsername(data.username);
    if (exists) {
      return { success: false, message: 'Tên đăng nhập này đã được sử dụng, vui lòng chọn tên khác!' };
    }

    if (data.phone && data.phone.trim()) {
      const cleanPhone = data.phone.trim();
      const phoneExists = userRepo.getAll().some(u => u.phone && u.phone.trim() === cleanPhone);
      if (phoneExists) {
        return { success: false, message: 'Số điện thoại này đã được đăng ký cho tài khoản khác!' };
      }
    }

    if (data.password) {
      const strength = evaluatePasswordStrength(data.password);
      if (strength.score < 2) {
        return { success: false, message: 'Mật khẩu quá yếu! Vui lòng chọn mật khẩu từ 8 ký tự, kết hợp chữ, số hoặc ký tự đặc biệt.' };
      }
    }

    const passHash = await hashPasswordArgon2(data.password || '123');
    const newUser = userRepo.create({
      username: data.username.trim(),
      password: passHash,
      fullName: data.fullName.trim(),
      phone: data.phone?.trim() || '',
      address: data.address?.trim() || '',
      role: 'customer'
    });
    this.setCustomerSession(newUser);
    return { success: true, user: sanitizeUser(newUser) as User };
  }

  async updateCustomerProfile(id: string, patch: Partial<User>): Promise<User | null> {
    if (patch.password) {
      patch.password = await hashPasswordArgon2(patch.password);
    }
    userRepo.update(id, patch);

    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      try {
        const res = await fetch(`/api/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch)
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            this.setCustomerSession(json.data);
            return json.data;
          }
        }
      } catch {}
    }

    const updated = userRepo.getById(id);
    if (updated) {
      this.setCustomerSession(updated);
      return sanitizeUser(updated) as User;
    }
    return null;
  }

  // Role permissions check
  canManageUsers(role?: Role): boolean {
    return role === 'super_admin';
  }

  canManageOrders(role?: Role): boolean {
    return role === 'super_admin' || role === 'sales_admin';
  }

  canManageInventory(role?: Role): boolean {
    return role === 'super_admin' || role === 'inventory_admin';
  }

  canViewReports(role?: Role): boolean {
    // Admin sale and super admin are allowed to view reports
    return role === 'super_admin' || role === 'sales_admin';
  }

  canManageBackups(role?: Role): boolean {
    // Only super admin is allowed to backup & restore entire database
    return role === 'super_admin';
  }
}

export const authService = new AuthService();
