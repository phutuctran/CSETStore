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

export interface SectionVisibility {
  showPromoBadge: boolean;      // Huy hiệu khuyến mãi đầu trang
  showHeroSection: boolean;     // Khối banner Hero chính
  showHeroPrinter: boolean;     // Khối hình ảnh máy in 3D Bambu Lab
  showTrustBadges: boolean;     // 3 thông số độ chính xác, hỗ trợ, giá in
  showFeaturedProducts: boolean;// Lưới sản phẩm nổi bật trang chủ
  showValueProps: boolean;      // 3 khối cam kết giá trị lợi ích dịch vụ
  showFooterContact: boolean;   // Hotline, Email, Địa chỉ ở chân trang
}

export interface ThemeConfig {
  // Branding
  storeName: string;
  storeTagline: string;
  logoIcon: string; // FontAwesome icon class
  logoImage?: string; // Base64 or Image URL uploaded by admin

  // Visibility Toggles
  visibility: SectionVisibility;

  // Colors
  primaryColor: string; // e.g. #1e3a8a
  accentColor: string; // e.g. #1e40af
  backgroundColor: string; // e.g. #f8fafc

  // Hero Section
  badgeText: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImage: string;
  printerModel: string;
  printerSpeedText: string;

  // Pricing & Announcement
  pricePerGram: number; // default 1500
  promoNotice: string;

  // Trust Badges
  precisionText: string;
  supportText: string;
  pricingNote: string;

  // Contact & Footer
  hotline: string;
  contactEmail: string;
  storeAddress: string;
  footerText: string;
}
