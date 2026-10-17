import type { Product, Order, User, ThemeConfig, CategoryOption, ProductReview, Coupon } from '../models/types';
import { INITIAL_PRODUCTS, INITIAL_USERS, DEFAULT_THEME_CONFIG, INITIAL_CATEGORIES, INITIAL_COUPONS } from '../models/constants';
import { INITIAL_DEMO_ORDERS, INITIAL_DEMO_REVIEWS } from '../models/demoData';

const PRODUCTS_STORAGE_KEY = 'cset_products_v5';
const ORDERS_STORAGE_KEY = 'cset_orders_v5';
const USERS_STORAGE_KEY = 'cset_users_v5';
const THEME_STORAGE_KEY = 'cset_theme_config_v5';
const CATEGORIES_STORAGE_KEY = 'cset_categories_v5';
const REVIEWS_STORAGE_KEY = 'cset_reviews_v5';
const COUPONS_STORAGE_KEY = 'cset_coupons_v5';
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
  create(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order>;
  updateStatus(id: string, status: Order['status']): boolean;
}

export interface ICouponRepository {
  getAll(): Coupon[];
  getByCode(code: string): Coupon | undefined;
  create(coupon: Omit<Coupon, 'id' | 'usedCount'>): Coupon;
  update(id: string, patch: Partial<Coupon>): boolean;
  delete(id: string): boolean;
  incrementUsage(code: string): boolean;
  resetToDefaults(): Coupon[];
}

export interface IReviewRepository {
  getAll(): ProductReview[];
  getByProductId(productId: number, includeHidden?: boolean): ProductReview[];
  hasPurchased(productId: number, userId?: string, phone?: string): boolean;
  create(review: Omit<ProductReview, 'id' | 'createdAt'>): ProductReview;
  update(id: string, patch: Partial<ProductReview>): boolean;
  delete(id: string): boolean;
  reply(id: string, replyText: string, replierName?: string): boolean;
  toggleVisibility(id: string): boolean;
}

export interface IThemeRepository {
  getTheme(): ThemeConfig;
  saveTheme(config: ThemeConfig): void;
  resetTheme(): ThemeConfig;
}

export interface ICategoryRepository {
  getAll(): CategoryOption[];
  saveAll(categories: CategoryOption[]): void;
  createCategory(cat: CategoryOption): CategoryOption;
  updateCategory(key: string, patch: Partial<CategoryOption>): boolean;
  deleteCategory(key: string): boolean;
  resetCategories(): CategoryOption[];
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cset_products_updated', { detail: list }));
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('cset_products_sync');
          bc.postMessage({ type: 'products_updated' });
          bc.close();
        } catch {}
      }
    }
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      }).catch(() => {});
    }
    return newProduct;
  }

  update(id: number, patch: Partial<Product>): boolean {
    const list = this.getAll();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) return false;
    list[index] = { ...list[index], ...patch };
    getSafeStorage().setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cset_products_updated', { detail: list }));
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('cset_products_sync');
          bc.postMessage({ type: 'products_updated' });
          bc.close();
        } catch {}
      }
    }
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      }).catch(() => {});
    }
    return true;
  }

  delete(id: number): boolean {
    const list = this.getAll();
    const next = list.filter((p) => p.id !== id);
    if (next.length === list.length) return false;
    getSafeStorage().setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(next));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cset_products_updated', { detail: next }));
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('cset_products_sync');
          bc.postMessage({ type: 'products_updated' });
          bc.close();
        } catch {}
      }
    }
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      fetch(`/api/products/${id}`, { method: 'DELETE' }).catch(() => {});
    }
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
    if (!raw) {
      storage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_ORDERS));
      return INITIAL_DEMO_ORDERS;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? (parsed as Order[]) : INITIAL_DEMO_ORDERS;
    } catch {
      return INITIAL_DEMO_ORDERS;
    }
  }
  getByCustomerId(customerId: string): Order[] {
    return this.getAll().filter((o) => o.customerId === customerId);
  }

  async create(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    const list = this.getAll();
    const newOrder: Order = {
      ...orderData,
      id: 'ORD-' + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toLocaleString('vi-VN')
    };
    list.unshift(newOrder);
    getSafeStorage().setItem(ORDERS_STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrder)
        });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          console.error('[OrderRepo] Server failed to create order:', res.status, errJson);
        } else {
          const resJson = await res.json().catch(() => null);
          if (resJson && resJson.data && resJson.data.id) {
            const idx = list.findIndex(o => o.id === newOrder.id);
            if (idx !== -1) {
              list[idx] = { ...newOrder, ...resJson.data };
              getSafeStorage().setItem(ORDERS_STORAGE_KEY, JSON.stringify(list));
            }
          }
        }
      } catch (err) {
        console.warn('[OrderRepo] Network error posting order to server:', err);
      }
    }
    return newOrder;
  }

  updateStatus(id: string, status: Order['status']): boolean {
    const list = this.getAll();
    const target = list.find((o) => o.id === id);
    if (!target) return false;
    target.status = status;
    getSafeStorage().setItem(ORDERS_STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      }).catch(() => {});
    }
    return true;
  }

  async syncFromServer(): Promise<Order[]> {
    if (typeof window === 'undefined' || typeof fetch !== 'function') return this.getAll();
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          getSafeStorage().setItem(ORDERS_STORAGE_KEY, JSON.stringify(json.data));
          return json.data;
        }
      }
    } catch {}
    return this.getAll();
  }
}

/**
 * LocalStorageReviewRepository: Manages verified reviews and comments
 */
export class LocalStorageReviewRepository implements IReviewRepository {
  getAll(): ProductReview[] {
    const storage = getSafeStorage();
    const raw = storage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) {
      storage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_REVIEWS));
      return INITIAL_DEMO_REVIEWS;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as ProductReview[]) : INITIAL_DEMO_REVIEWS;
    } catch {
      return INITIAL_DEMO_REVIEWS;
    }
  }

  getByProductId(productId: number, includeHidden = false): ProductReview[] {
    return this.getAll().filter(r => r.productId === productId && (includeHidden || !r.hidden));
  }

  hasPurchased(productId: number, userId?: string, phone?: string): boolean {
    if (!userId && !phone) return false;
    const orders = new LocalStorageOrderRepository().getAll();
    return orders.some(o => {
      const isUserMatch = (userId && o.customerId === userId) || (phone && o.phone === phone);
      if (!isUserMatch) return false;
      const isNotCancelled = o.status !== 'cancelled';
      const hasProduct = o.items.some(item => item.productId === productId);
      return isNotCancelled && hasProduct;
    });
  }

  create(data: Omit<ProductReview, 'id' | 'createdAt'>): ProductReview {
    const list = this.getAll();
    const newReview: ProductReview = {
      ...data,
      id: 'rev-' + Date.now(),
      createdAt: new Date().toLocaleString('vi-VN')
    };
    list.unshift(newReview);
    getSafeStorage().setItem(REVIEWS_STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
      }).catch(() => {});
    }
    return newReview;
  }

  update(id: string, patch: Partial<ProductReview>): boolean {
    const list = this.getAll();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...patch };
    getSafeStorage().setItem(REVIEWS_STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      }).catch(() => {});
    }
    return true;
  }

  delete(id: string): boolean {
    const list = this.getAll();
    const next = list.filter(r => r.id !== id);
    if (next.length === list.length) return false;
    getSafeStorage().setItem(REVIEWS_STORAGE_KEY, JSON.stringify(next));
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      fetch(`/api/reviews/${id}`, { method: 'DELETE' }).catch(() => {});
    }
    return true;
  }

  async syncFromServer(): Promise<ProductReview[]> {
    if (typeof window === 'undefined' || typeof fetch !== 'function') return this.getAll();
    try {
      const res = await fetch('/api/reviews?all=1');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          getSafeStorage().setItem(REVIEWS_STORAGE_KEY, JSON.stringify(json.data));
          return json.data;
        }
      }
    } catch {}
    return this.getAll();
  }

  reply(id: string, replyText: string, replierName = 'Ban Quản Trị CSET Store'): boolean {
    return this.update(id, {
      adminReply: {
        reply: replyText.trim(),
        repliedAt: new Date().toLocaleString('vi-VN'),
        replierName
      }
    });
  }

  toggleVisibility(id: string): boolean {
    const list = this.getAll();
    const target = list.find(r => r.id === id);
    if (!target) return false;
    return this.update(id, { hidden: !target.hidden });
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingUsers = parsed as User[];
        let hasNew = false;
        for (const initU of INITIAL_USERS) {
          if (!existingUsers.some(u => u.username.toLowerCase() === initU.username.toLowerCase())) {
            existingUsers.push(initU);
            hasNew = true;
          }
        }
        if (hasNew) {
          storage.setItem(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
        }
        return existingUsers;
      }
      return INITIAL_USERS;
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
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      }).catch(() => {});
    }
    return newUser;
  }

  update(id: string, patch: Partial<User>): boolean {
    const list = this.getAll();
    const index = list.findIndex((u) => u.id === id);
    if (index === -1) return false;
    list[index] = { ...list[index], ...patch };
    getSafeStorage().setItem(USERS_STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      }).catch(() => {});
    }
    return true;
  }

  delete(id: string): boolean {
    const list = this.getAll();
    const next = list.filter((u) => u.id !== id);
    if (next.length === list.length) return false;
    getSafeStorage().setItem(USERS_STORAGE_KEY, JSON.stringify(next));
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      fetch(`/api/users/${id}`, { method: 'DELETE' }).catch(() => {});
    }
    return true;
  }

  async syncFromServer(): Promise<User[]> {
    if (typeof window === 'undefined' || typeof fetch !== 'function') return this.getAll();
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const serverUsers = json.data as User[];
          const localList = this.getAll();
          // Merge server users with local users
          const mergedMap = new Map<string, User>();
          for (const u of localList) {
            mergedMap.set(u.id, u);
          }
          for (const u of serverUsers) {
            const existing = mergedMap.get(u.id);
            mergedMap.set(u.id, existing ? { ...existing, ...u } : u);
          }
          const merged = Array.from(mergedMap.values());
          getSafeStorage().setItem(USERS_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
      }
    } catch {}
    return this.getAll();
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
          trustBadges: Array.isArray(p.trustBadges) ? p.trustBadges : DEFAULT_THEME_CONFIG.trustBadges,
          valueProps: Array.isArray(p.valueProps) ? p.valueProps : DEFAULT_THEME_CONFIG.valueProps,
          banners: Array.isArray(p.banners) ? p.banners : DEFAULT_THEME_CONFIG.banners,
          heroStyle: {
            ...DEFAULT_THEME_CONFIG.heroStyle,
            ...(p.heroStyle || {})
          },
          productGridStyle: {
            ...DEFAULT_THEME_CONFIG.productGridStyle,
            ...(p.productGridStyle || {})
          },
          categoryBlockStyle: {
            ...DEFAULT_THEME_CONFIG.categoryBlockStyle,
            ...(p.categoryBlockStyle || {})
          },
          customTabs: Array.isArray(p.customTabs) ? p.customTabs : DEFAULT_THEME_CONFIG.customTabs,
          socials: {
            ...DEFAULT_THEME_CONFIG.socials,
            ...(p.socials || {})
          }
        };
      }
      return DEFAULT_THEME_CONFIG;
    } catch {
      return DEFAULT_THEME_CONFIG;
    }
  }

  saveTheme(config: ThemeConfig): void {
    getSafeStorage().setItem(THEME_STORAGE_KEY, JSON.stringify(config));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cset_theme_updated', { detail: config }));
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('cset_theme_sync');
          bc.postMessage(config);
        } catch {}
      }
      if (typeof fetch === 'function') {
        fetch('/api/theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        }).catch(() => {});
      }
    }
  }

  resetTheme(): ThemeConfig {
    getSafeStorage().setItem(THEME_STORAGE_KEY, JSON.stringify(DEFAULT_THEME_CONFIG));
    return DEFAULT_THEME_CONFIG;
  }
}

/**
 * LocalStorageCategoryRepository: Manages e-commerce categories and subcategories
 */
export class LocalStorageCategoryRepository implements ICategoryRepository {
  getAll(): CategoryOption[] {
    const storage = getSafeStorage();
    const raw = storage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) {
      storage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? (parsed as CategoryOption[]) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  }

  saveAll(categories: CategoryOption[]): void {
    getSafeStorage().setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  }

  createCategory(cat: CategoryOption): CategoryOption {
    const list = this.getAll();
    list.push(cat);
    this.saveAll(list);
    return cat;
  }

  updateCategory(key: string, patch: Partial<CategoryOption>): boolean {
    const list = this.getAll();
    const index = list.findIndex(c => c.key === key);
    if (index === -1) return false;
    list[index] = { ...list[index], ...patch };
    this.saveAll(list);
    return true;
  }

  deleteCategory(key: string): boolean {
    const list = this.getAll();
    const next = list.filter(c => c.key !== key);
    if (next.length === list.length) return false;
    this.saveAll(next);
    return true;
  }

  resetCategories(): CategoryOption[] {
    this.saveAll(INITIAL_CATEGORIES);
    return INITIAL_CATEGORIES;
  }
}

/**
 * LocalStorageCouponRepository: Manages discount codes / coupons
 */
export class LocalStorageCouponRepository implements ICouponRepository {
  getAll(): Coupon[] {
    const raw = getSafeStorage().getItem(COUPONS_STORAGE_KEY);
    if (!raw) {
      getSafeStorage().setItem(COUPONS_STORAGE_KEY, JSON.stringify(INITIAL_COUPONS));
      return INITIAL_COUPONS;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Coupon[]) : INITIAL_COUPONS;
    } catch {
      return INITIAL_COUPONS;
    }
  }

  getByCode(code: string): Coupon | undefined {
    const list = this.getAll();
    return list.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
  }

  create(couponData: Omit<Coupon, 'id' | 'usedCount'>): Coupon {
    const list = this.getAll();
    const newCoupon: Coupon = {
      ...couponData,
      id: 'coup-' + Date.now().toString(36),
      code: couponData.code.trim().toUpperCase(),
      usedCount: 0
    };
    list.unshift(newCoupon);
    getSafeStorage().setItem(COUPONS_STORAGE_KEY, JSON.stringify(list));
    return newCoupon;
  }

  update(id: string, patch: Partial<Coupon>): boolean {
    const list = this.getAll();
    const index = list.findIndex(c => c.id === id);
    if (index === -1) return false;
    if (patch.code) {
      patch.code = patch.code.trim().toUpperCase();
    }
    list[index] = { ...list[index], ...patch };
    getSafeStorage().setItem(COUPONS_STORAGE_KEY, JSON.stringify(list));
    return true;
  }

  delete(id: string): boolean {
    const list = this.getAll();
    const next = list.filter(c => c.id !== id);
    if (next.length === list.length) return false;
    getSafeStorage().setItem(COUPONS_STORAGE_KEY, JSON.stringify(next));
    return true;
  }

  incrementUsage(code: string): boolean {
    const list = this.getAll();
    const target = list.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
    if (!target) return false;
    target.usedCount = (target.usedCount || 0) + 1;
    getSafeStorage().setItem(COUPONS_STORAGE_KEY, JSON.stringify(list));
    return true;
  }

  resetToDefaults(): Coupon[] {
    getSafeStorage().setItem(COUPONS_STORAGE_KEY, JSON.stringify(INITIAL_COUPONS));
    return INITIAL_COUPONS;
  }
}
