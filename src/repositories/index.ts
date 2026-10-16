import type { Product, Order, User, ThemeConfig } from '../models/types';
import { INITIAL_PRODUCTS, INITIAL_USERS, DEFAULT_THEME_CONFIG } from '../models/constants';

const PRODUCTS_STORAGE_KEY = 'cset_products_v3';
const ORDERS_STORAGE_KEY = 'cset_orders_v3';
const USERS_STORAGE_KEY = 'cset_users_v3';
const THEME_STORAGE_KEY = 'cset_theme_config_v3';

export interface IStorageProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

class MemoryStorageProvider implements IStorageProvider {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

const memoryFallback = new MemoryStorageProvider();

function getSafeStorage(): IStorageProvider {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return memoryFallback;
}

export interface IProductRepository {
  getAll(): Product[];
  getById(id: number): Product | undefined;
  create(product: Omit<Product, 'id'>): Product;
  update(id: number, product: Partial<Product>): boolean;
  delete(id: number): boolean;
  resetToDefaults(): Product[];
}

export interface IOrderRepository {
  getAll(): Order[];
  getByCustomerId(customerId: string): Order[];
  create(order: Omit<Order, 'id' | 'createdAt'>): Order;
  updateStatus(id: string, status: Order['status']): boolean;
}

export interface IThemeRepository {
  getTheme(): ThemeConfig;
  saveTheme(config: ThemeConfig): void;
  resetTheme(): ThemeConfig;
}

export interface IUserRepository {
  getAll(): User[];
  getById(id: string): User | undefined;
  getByUsername(username: string): User | undefined;
  create(user: Omit<User, 'id' | 'createdAt'>): User;
  update(id: string, patch: Partial<User>): boolean;
  delete(id: string): boolean;
}
/**
 * LocalStorageProductRepository: Implements Repository Pattern for Products
 */
export class LocalStorageProductRepository implements IProductRepository {
  getAll(): Product[] {
    const storage = getSafeStorage();
    const raw = storage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      storage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? (parsed as Product[]) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  }

  getById(id: number): Product | undefined {
    return this.getAll().find((p) => p.id === id);
  }

  create(productData: Omit<Product, 'id'>): Product {
    const list = this.getAll();
    const newId = list.length > 0 ? Math.max(...list.map((p) => p.id)) + 1 : 1;
    const newProduct: Product = { ...productData, id: newId };
    list.unshift(newProduct);
    getSafeStorage().setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(list));
    return newProduct;
  }

  update(id: number, patch: Partial<Product>): boolean {
    const list = this.getAll();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) return false;
    list[index] = { ...list[index], ...patch };
    getSafeStorage().setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(list));
    return true;
  }

  delete(id: number): boolean {
    const list = this.getAll();
    const next = list.filter((p) => p.id !== id);
    if (next.length === list.length) return false;
    getSafeStorage().setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(next));
    return true;
  }

  resetToDefaults(): Product[] {
    getSafeStorage().setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
}

/**
 * LocalStorageOrderRepository: Implements Repository Pattern for Orders
 */
export class LocalStorageOrderRepository implements IOrderRepository {
  getAll(): Order[] {
    const storage = getSafeStorage();
    const raw = storage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Order[]) : [];
    } catch {
      return [];
    }
  }
  getByCustomerId(customerId: string): Order[] {
    return this.getAll().filter((o) => o.customerId === customerId);
  }

  create(orderData: Omit<Order, 'id' | 'createdAt'>): Order {
    const list = this.getAll();
    const newOrder: Order = {
      ...orderData,
      id: 'ORD-' + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toLocaleString('vi-VN')
    };
    list.unshift(newOrder);
    getSafeStorage().setItem(ORDERS_STORAGE_KEY, JSON.stringify(list));
    return newOrder;
  }

  updateStatus(id: string, status: Order['status']): boolean {
    const list = this.getAll();
    const target = list.find((o) => o.id === id);
    if (!target) return false;
    target.status = status;
    getSafeStorage().setItem(ORDERS_STORAGE_KEY, JSON.stringify(list));
    return true;
  }
}

/**
 * LocalStorageUserRepository: Implements Repository Pattern for Users
 */
export class LocalStorageUserRepository implements IUserRepository {
  getAll(): User[] {
    const storage = getSafeStorage();
    const raw = storage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      storage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? (parsed as User[]) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  }

  getById(id: string): User | undefined {
    return this.getAll().find((u) => u.id === id);
  }

  getByUsername(username: string): User | undefined {
    return this.getAll().find((u) => u.username.toLowerCase() === username.toLowerCase().trim());
  }

  create(userData: Omit<User, 'id' | 'createdAt'>): User {
    const list = this.getAll();
    const newUser: User = {
      ...userData,
      id: 'USR-' + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toLocaleString('vi-VN')
    };
    list.unshift(newUser);
    getSafeStorage().setItem(USERS_STORAGE_KEY, JSON.stringify(list));
    return newUser;
  }

  update(id: string, patch: Partial<User>): boolean {
    const list = this.getAll();
    const index = list.findIndex((u) => u.id === id);
    if (index === -1) return false;
    list[index] = { ...list[index], ...patch };
    getSafeStorage().setItem(USERS_STORAGE_KEY, JSON.stringify(list));
    return true;
  }

  delete(id: string): boolean {
    const list = this.getAll();
    const next = list.filter((u) => u.id !== id);
    if (next.length === list.length) return false;
    getSafeStorage().setItem(USERS_STORAGE_KEY, JSON.stringify(next));
    return true;
  }
}


/**
 * LocalStorageThemeRepository: Implements Repository Pattern for Web Storefront Customizer
 */
export class LocalStorageThemeRepository implements IThemeRepository {
  getTheme(): ThemeConfig {
    const storage = getSafeStorage();
    const raw = storage.getItem(THEME_STORAGE_KEY);
    if (!raw) {
      storage.setItem(THEME_STORAGE_KEY, JSON.stringify(DEFAULT_THEME_CONFIG));
      return DEFAULT_THEME_CONFIG;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const p = parsed as Partial<ThemeConfig>;
        return {
          ...DEFAULT_THEME_CONFIG,
          ...p,
          visibility: {
            ...DEFAULT_THEME_CONFIG.visibility,
            ...(p.visibility || {})
          },
          trustBadges: Array.isArray(p.trustBadges) && p.trustBadges.length > 0 ? p.trustBadges : DEFAULT_THEME_CONFIG.trustBadges,
          valueProps: Array.isArray(p.valueProps) && p.valueProps.length > 0 ? p.valueProps : DEFAULT_THEME_CONFIG.valueProps
        };
      }
      return DEFAULT_THEME_CONFIG;
    } catch {
      return DEFAULT_THEME_CONFIG;
    }
  }

  saveTheme(config: ThemeConfig): void {
    getSafeStorage().setItem(THEME_STORAGE_KEY, JSON.stringify(config));
  }

  resetTheme(): ThemeConfig {
    getSafeStorage().setItem(THEME_STORAGE_KEY, JSON.stringify(DEFAULT_THEME_CONFIG));
    return DEFAULT_THEME_CONFIG;
  }
}
