import type { Product, ProductReview, CategoryOption, Order, User, Coupon, ThemeConfig } from '../src/models/types';

export function sqlGetProducts(): Product[];
export function sqlGetProductById(id: number): Product | null;
export function sqlCreateProduct(p: Omit<Product, 'id'> & { id?: number }): Product | null;
export function sqlUpdateProduct(id: number, patch: Partial<Product>): boolean;
export function sqlDeleteProduct(id: number): boolean;
export function sqlAutoSelectTop5BestSellers(): Product[];

export function sqlGetUsers(): User[];
export function sqlGetUserById(id: string): (User & { password_hash?: string }) | null;
export function sqlGetUserByUsername(username: string): (User & { password_hash?: string }) | null;
export function sqlCreateUser(u: Partial<User> & { username: string }): Promise<(User & { password_hash?: string }) | null>;
export function sqlUpdateUser(id: string, patch: Partial<User>): Promise<(User & { password_hash?: string }) | null>;
export function sqlDeleteUser(id: string): boolean;
export function sqlGetReviews(productId?: number | string | null, includeHidden?: boolean): ProductReview[];
export function sqlCreateReview(data: Omit<ProductReview, 'id'> & { id?: string }): ProductReview;
export function sqlUpdateReview(id: string, patch: Partial<ProductReview>): boolean;
export function sqlDeleteReview(id: string): boolean;

export function sqlGetCategories(): CategoryOption[];
export function sqlCreateCategory(c: CategoryOption): CategoryOption;
export function sqlUpdateCategory(key: string, patch: Partial<CategoryOption>): boolean;
export function sqlDeleteCategory(key: string): boolean;
export function sqlGetOrders(): Order[];
export function sqlCreateOrder(order: Omit<Order, 'id'> & { id?: string }): Order;
export function sqlUpdateOrderStatus(id: string, status: Order['status']): boolean;

export function sqlGetCoupons(): Coupon[];
export function sqlCreateCoupon(c: Omit<Coupon, 'id' | 'usedCount'> & { id?: string; usedCount?: number }): Coupon;
export function sqlUpdateCoupon(id: string, patch: Partial<Coupon>): boolean;
export function sqlDeleteCoupon(id: string): boolean;
export function sqlGetTheme(): ThemeConfig | null;
export function sqlSaveTheme(config: ThemeConfig): ThemeConfig;

export function exportSqlDump(): string;
export function restoreSqlDump(sqlScript: string): { success: boolean; message: string };

export function hashPassword(password: string): string;
export function verifyPassword(password: string, storedHash: string): boolean;
export function encryptSensitiveData(text: string): string;
export function decryptSensitiveData(cipherText: string): string;
