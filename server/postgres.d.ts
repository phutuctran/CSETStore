import type { Product, ProductReview, CategoryOption, Order, User, Coupon, ThemeConfig } from '../src/models/types';

export function isPostgresConfigured(): boolean;
export function pgGetProducts(): Promise<Product[]>;
export function pgGetProductById(id: number): Promise<Product | null>;
export function pgCreateProduct(p: Omit<Product, 'id'> & { id?: number }): Promise<Product | null>;
export function pgUpdateProduct(id: number, patch: Partial<Product>): Promise<boolean>;
export function pgDeleteProduct(id: number): Promise<boolean>;
export function pgAutoSelectTop5BestSellers(): Promise<Product[]>;

export function pgGetUsers(): Promise<User[]>;
export function pgGetUserById(id: string): Promise<(User & { password_hash?: string }) | null>;
export function pgGetUserByUsername(username: string): Promise<(User & { password_hash?: string }) | null>;
export function pgCreateUser(u: Partial<User> & { username: string }): Promise<(User & { password_hash?: string }) | null>;
export function pgUpdateUser(id: string, patch: Partial<User>): Promise<(User & { password_hash?: string }) | null>;
export function pgDeleteUser(id: string): Promise<boolean>;

export function pgGetOrders(): Promise<Order[]>;
export function pgCreateOrder(order: Omit<Order, 'id'> & { id?: string }): Promise<Order>;
export function pgUpdateOrderStatus(id: string, status: Order['status']): Promise<boolean>;

export function pgGetReviews(productId?: number | string | null, includeHidden?: boolean): Promise<ProductReview[]>;
export function pgCreateReview(data: Omit<ProductReview, 'id'> & { id?: string }): Promise<ProductReview>;
export function pgUpdateReview(id: string, patch: Partial<ProductReview>): Promise<boolean>;
export function pgDeleteReview(id: string): Promise<boolean>;

export function pgGetCategories(): Promise<CategoryOption[]>;
export function pgCreateCategory(c: CategoryOption): Promise<CategoryOption>;
export function pgUpdateCategory(key: string, patch: Partial<CategoryOption>): Promise<boolean>;
export function pgDeleteCategory(key: string): Promise<boolean>;
export function pgGetCoupons(): Promise<Coupon[]>;
export function pgCreateCoupon(c: Omit<Coupon, 'id' | 'usedCount'> & { id?: string; usedCount?: number }): Promise<Coupon>;
export function pgUpdateCoupon(id: string, patch: Partial<Coupon>): Promise<boolean>;
export function pgDeleteCoupon(id: string): Promise<boolean>;
export function pgGetTheme(): Promise<ThemeConfig | null>;
export function pgSaveTheme(config: ThemeConfig): Promise<ThemeConfig>;
