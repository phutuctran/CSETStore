export type Role = 'super_admin' | 'sales_admin' | 'inventory_admin' | 'customer';

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  phone?: string;
  address?: string;
  role: Role;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  category: 'anime' | 'decor' | 'tech' | string;
  price: number;
  image: string;
  description: string;
  grams?: number;
  printHours?: number;
}

export interface CartItem {
  id: string; // unique id per cart item
  productId?: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  details?: {
    isCustom?: boolean;
    fileName?: string;
    grams?: number;
    hours?: string;
    infill?: number;
  };
}

export interface Order {
  id: string;
  customerId?: string; // null if Guest order
  customerName: string;
  phone: string;
  address: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
}

export type CategoryKey = 'all' | 'anime' | 'decor' | 'tech';

export interface CategoryOption {
  key: CategoryKey;
  label: string;
  icon?: string;
}
