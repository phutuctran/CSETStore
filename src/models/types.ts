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

export type CategoryKey = 'all' | 'electronics' | 'fashion' | 'home' | 'beauty' | 'books';

export interface CategoryOption {
  key: CategoryKey;
  label: string;
  icon?: string;
}

export interface Product {
  id: number;
  name: string;
  category: CategoryKey | string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  brand?: string;
  rating?: number;
  stock?: number;
}

export interface CartItem {
  id: string;
  productId?: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
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

export interface SectionVisibility {
  showPromoBadge: boolean;      // Huy hiệu khuyến mãi đầu trang
  showHeroSection: boolean;     // Khối banner Hero chính
  showHeroImage: boolean;       // Khối hình ảnh banner bên phải
  showTrustBadges: boolean;     // Cam kết dịch vụ
  showFeaturedProducts: boolean;// Lưới sản phẩm nổi bật trang chủ
  showValueProps: boolean;      // Khối giá trị & lợi ích mua sắm
  showFooterContact: boolean;   // Hotline, Email, Địa chỉ ở chân trang
}

export interface TrustBadgeItem {
  id: string;
  icon: string;
  customIconImage?: string; // Uploaded icon/logo image
  title: string;
  subtitle: string;
}

export interface ValuePropItem {
  id: string;
  icon: string;
  customIconImage?: string; // Uploaded icon/logo image
  title: string;
  description: string;
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
  accentColor: string; // e.g. #2563eb
  backgroundColor: string; // e.g. #f8fafc

  // Hero Section
  badgeText: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImage: string;
  heroHighlightTitle: string;
  heroHighlightSub: string;

  // Customizable Blocks (Deep customization)
  trustBadges: TrustBadgeItem[];
  valueProps: ValuePropItem[];

  // Contact & Footer
  hotline: string;
  contactEmail: string;
  storeAddress: string;
  footerText: string;
}
