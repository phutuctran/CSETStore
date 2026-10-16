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
  createdAt: string;
  customerName: string;
  phone: string;
  address: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
}

export type CategoryKey = 'all' | 'anime' | 'decor' | 'tech';

export interface CategoryOption {
  key: CategoryKey;
  label: string;
  icon?: string;
}
