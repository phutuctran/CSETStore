import type { Product, ProductReview, CategoryOption, Order, User, Coupon, ThemeConfig } from '../src/models/types';

export function sqlGetProducts(): Product[];
export function sqlGetProductById(id: number): Product | null;
export function sqlCreateProduct(p: Omit<Product, 'id'> & { id?: number }): Product | null;
export function sqlUpdateProduct(id: number, patch: Partial<Product>): boolean;
export function sqlDeleteProduct(id: number): boolean;

export function sqlGetUsers(): User[];
export function sqlGetUserByUsername(username: string): (User & { password_hash?: string }) | null;
export function sqlCreateUser(u: Omit<User, 'id' | 'createdAt'> & { id?: string; password?: string }): User | null;

export function sqlGetReviews(productId?: number | string | null, includeHidden?: boolean): ProductReview[];
export function sqlCreateReview(data: Omit<ProductReview, 'id'> & { id?: string }): ProductReview;
export function sqlUpdateReview(id: string, patch: Partial<ProductReview>): boolean;
export function sqlDeleteReview(id: string): boolean;

export function sqlGetCategories(): CategoryOption[];
export function sqlGetOrders(): Order[];
export function sqlCreateOrder(order: Omit<Order, 'id'> & { id?: string }): Order;
export function sqlUpdateOrderStatus(id: string, status: Order['status']): boolean;

export function sqlGetCoupons(): Coupon[];
export function sqlGetTheme(): ThemeConfig | null;
export function sqlSaveTheme(config: ThemeConfig): ThemeConfig;

export function exportSqlDump(): string;
export function restoreSqlDump(sqlScript: string): { success: boolean; message: string };

export function hashPassword(password: string): string;
export function verifyPassword(password: string, storedHash: string): boolean;
export function encryptSensitiveData(text: string): string;
export function decryptSensitiveData(cipherText: string): string;
