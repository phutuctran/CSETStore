import type { User, Role } from '../models/types';
import { LocalStorageUserRepository } from '../repositories';

const userRepo = new LocalStorageUserRepository();
const ADMIN_SESSION_KEY = 'cset_admin_session';
const CUSTOMER_SESSION_KEY = 'cset_customer_session';

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
      return { success: false, message: 'Tên đăng nhập đã được sử dụng!' };
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
}

export const authService = new AuthService();
