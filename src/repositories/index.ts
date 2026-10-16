import type { Product, Order } from '../models/types';
import { INITIAL_PRODUCTS } from '../models/constants';

const PRODUCTS_STORAGE_KEY = 'cset_products_v2';
const ORDERS_STORAGE_KEY = 'cset_orders_v2';

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
  create(order: Omit<Order, 'id' | 'createdAt'>): Order;
  updateStatus(id: string, status: Order['status']): boolean;
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
