import type { User, Role } from '../models/types';
import { LocalStorageUserRepository } from '../repositories';

const userRepo = new LocalStorageUserRepository();
const ADMIN_SESSION_KEY = 'cset_admin_session';
const CUSTOMER_SESSION_KEY = 'cset_customer_session';


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
  // Session handling
  getAdminSession(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  getCustomerSession(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(CUSTOMER_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  setAdminSession(user: User | null): void {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  }

  setCustomerSession(user: User | null): void {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CUSTOMER_SESSION_KEY);
    }
  }

  // Authentication
  loginAdmin(username: string, pass: string): { success: boolean; user?: User; message?: string } {
    const user = userRepo.getByUsername(username);
    if (!user) {
      return { success: false, message: 'Tên đăng nhập không tồn tại!' };
    }
    if (user.password !== pass) {
      return { success: false, message: 'Mật khẩu không chính xác!' };
    }
    if (user.role === 'customer') {
      return { success: false, message: 'Tài khoản khách hàng không có quyền truy cập hệ thống quản trị!' };
    }
    this.setAdminSession(user);
    return { success: true, user };
  }

  loginCustomer(username: string, pass: string): { success: boolean; user?: User; message?: string } {
    const user = userRepo.getByUsername(username);
    if (!user) {
      return { success: false, message: 'Tên đăng nhập không tồn tại!' };
    }
    if (user.password !== pass) {
      return { success: false, message: 'Mật khẩu không chính xác!' };
    }
    this.setCustomerSession(user);
    return { success: true, user };
  }

  registerCustomer(data: {
    username: string;
    password?: string;
    fullName: string;
    phone?: string;
    address?: string;
  }): { success: boolean; user?: User; message?: string } {
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
    const newUser = userRepo.create({
      username: data.username.trim(),
      password: data.password || '123',
      fullName: data.fullName.trim(),
      phone: data.phone?.trim() || '',
      address: data.address?.trim() || '',
      role: 'customer'
    });
    this.setCustomerSession(newUser);
    return { success: true, user: newUser };
  }

  updateCustomerProfile(id: string, patch: { fullName: string; phone: string; address: string; password?: string }): User | null {
    const success = userRepo.update(id, patch);
    if (success) {
      const updated = userRepo.getById(id);
      if (updated) {
        this.setCustomerSession(updated);
        return updated;
      }
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
