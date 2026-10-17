export type Role = 'super_admin' | 'sales_admin' | 'inventory_admin' | 'customer';

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  avatar?: string;
  bio?: string;
  role: Role;
  createdAt: string;
}

export type CategoryKey = string;

export interface SubCategory {
  id: string;
  name: string;
}

export interface CategoryOption {
  key: string;
  label: string;
  icon?: string;
  customIconImage?: string; // Uploaded category logo/icon image
  subcategories: SubCategory[];
}

export interface ProductSpecification {
  name: string;
  value: string;
}

export interface ProductVariantGroup {
  name: string; // e.g. "Màu sắc", "Kích thước", "Dung lượng"
  options: string[]; // e.g. ["Đen", "Trắng", "Xanh"] hoặc ["S", "M", "L", "XL"]
}

export interface Product {
  id: number;
  name: string;
  category: string;       // Ngành hàng (key)
  subCategory?: string;   // Loại danh mục chi tiết
  price: number;
  originalPrice?: number;
  discountPercent?: number;       // Mức giảm giá theo % (0-100)
  discountStartDate?: string;     // Ngày bắt đầu áp dụng giảm giá (datetime-local)
  discountEndDate?: string;       // Ngày kết thúc giảm giá (datetime-local)
  image: string;                  // Ảnh đại diện chính
  images?: string[];              // Nhiều ảnh sản phẩm chi tiết
  description: string;
  brand?: string;
  sku?: string;                   // Mã sản phẩm
  stock?: number;
  origin?: string;                // Xuất xứ
  warranty?: string;              // Bảo hành (vd: 12 tháng, 24 tháng)
  weight?: string;                // Khối lượng / Kích thước
  condition?: string;             // Tình trạng (Mới 100%, Nguyên seal...)
  specifications?: ProductSpecification[]; // Danh sách thông số kỹ thuật chi tiết
  variantGroups?: ProductVariantGroup[];   // Các nhóm biến thể (Màu sắc, Size, ...)
  rating?: number;
  soldCount?: number;     // Số lượng đã bán (lượt bán)
  showOnHome?: boolean;   // Thẻ chọn sản phẩm hiển thị tại trang chủ
  maxPurchaseLimit?: number; // Giới hạn số lượng mua tối đa cho sản phẩm này trong 1 đơn (0 hoặc undefined = theo giới hạn chung)
}

export interface CartItem {
  id: string;
  productId?: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  selectedVariants?: Record<string, string>; // e.g. { "Màu sắc": "Đen", "Kích thước": "L" }
  details?: { isCustom?: boolean; [key: string]: unknown };
}

export interface Coupon {
  id: string;
  code: string;               // Mã giảm giá viết hoa (VD: SALE50K, GIAM10, CSETVIP)
  description: string;        // Mô tả chi tiết ưu đãi
  discountType: 'percentage' | 'fixed'; // Giảm theo % hoặc số tiền cố định (VNĐ)
  discountValue: number;      // Giá trị giảm (% hoặc số tiền)
  minOrderValue?: number;     // Giá trị đơn hàng tối thiểu để áp dụng
  maxDiscountAmount?: number; // Mức giảm tối đa (khi giảm theo %)
  usageLimit?: number;        // Giới hạn lượt sử dụng
  usedCount: number;          // Số lượt đã sử dụng
  startDate?: string;         // Ngày bắt đầu
  endDate?: string;           // Ngày hết hạn
  isActive: boolean;          // Đang bật hay tắt
}

export interface Order {
  id: string;
  customerId?: string; // null if Guest order
  customerName: string;
  phone: string;
  address: string;
  items: CartItem[];
  subtotalAmount?: number;     // Tiền hàng trước giảm giá
  couponCode?: string;         // Mã giảm giá đã áp dụng
  discountAmount?: number;     // Số tiền được giảm
  totalAmount: number;         // Tổng tiền thực tế cần thanh toán
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface HeroPoster {
  id: string;
  imageUrl: string;
  highlightTitle?: string;
  highlightSub?: string;
  badgeText?: string;
  linkUrl?: string;
}

export interface AdminReviewReply {
  reply: string;
  repliedAt: string;
  replierName?: string;
}

export interface ProductReview {
  id: string;
  productId: number;
  userId: string;
  userName: string;
  rating: number; // 1 to 5 stars
  comment: string;
  images?: string[]; // Review photos uploaded by user
  verifiedPurchase: boolean; // Must be true (only customers who purchased can review)
  createdAt: string;
  hidden?: boolean;              // Ẩn / Hiện đánh giá
  adminReply?: AdminReviewReply; // Phản hồi từ quản trị viên
}

export interface SectionVisibility {
  showPromoBadge: boolean;      // Huy hiệu khuyến mãi đầu trang
  showHeroSection: boolean;     // Khối banner Hero chính
  showHeroImage: boolean;       // Khối hình ảnh banner bên phải
  showTrustBadges: boolean;     // Cam kết dịch vụ
  showFeaturedProducts: boolean;// Lưới sản phẩm nổi bật trang chủ
  showValueProps: boolean;      // Khối giá trị & lợi ích mua sắm
  showFooterContact: boolean;   // Hotline, Email, Địa chỉ ở chân trang
  showTopAdBanner: boolean;     // Bật/tắt khu vực banner phía trên
  showSideAdBanners: boolean;   // Bật/tắt khu vực banner 2 bên sườn
  showCustomOrderTab?: boolean; // Bật/tắt tab Đặt Hàng Theo Yêu Cầu trên thanh điều hướng
}

export interface AdItem {
  id: string;
  position: 'top' | 'side-left' | 'side-right';
  type: 'image' | 'text';
  enabled: boolean;
  title: string;
  subtitle?: string;
  linkText?: string;
  linkUrl?: string;
  imageUrl?: string;
  bgColor?: string;
  textColor?: string;
  // Scheduling
  startDate?: string; // ISO or YYYY-MM-DDTHH:mm
  endDate?: string;   // ISO or YYYY-MM-DDTHH:mm
  createdAt?: string;
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
export interface HeroBlockStyle {
  textAlign: 'left' | 'center' | 'right';
  primaryBtnText: string;
  primaryBtnBg?: string;
  primaryBtnTextColor?: string;
  secondaryBtnText: string;
  showSecondaryBtn: boolean;
  highlightBadgeText: string;
}

export interface ProductGridStyle {
  sectionTitle: string;
  sectionSubtitle: string;
  cardBorderRadius: 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl';
  showDiscountBadge: boolean;
  showBrandTag: boolean;
  showStockStatus: boolean;
  showRating: boolean;
  buyButtonText: string;
  homeDisplayMode?: 'auto_top5' | 'manual'; // Tự động top 5 bán chạy nhất hoặc tùy chọn thủ công
}

export interface CategoryBlockStyle {
  sectionTitle: string;
  iconBgColor?: string;
  cardHoverEffect: boolean;
}

export interface FooterSocials {
  facebook?: string;
  zalo?: string;
  tiktok?: string;
  youtube?: string;
  workingHours?: string;
  socialText?: string;
  messengerPageId?: string;
}

export interface CustomNavTab {
  id: string;
  name: string;           // Tên hiển thị (Siêu sale, Đang hot...)
  icon?: string;          // FontAwesome icon class
  enabled: boolean;
  // Tab Header Banner
  bannerType: 'image' | 'text';
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerImage?: string;
  bannerBg?: string;
  bannerTextColor?: string;
  // Associated featured products
  productIds: number[];
}

export interface ThemeConfig {
  // Branding & Browser Tab
  storeName: string;
  storeTagline: string;
  logoIcon: string; // FontAwesome icon class
  logoImage?: string; // Base64 or Image URL uploaded by admin
  logoWidth?: number; // In px, default 40
  browserTitle?: string; // Tiêu đề hiển thị trên tab trình duyệt
  faviconImage?: string; // Icon / Favicon hiển thị trên tab trình duyệt (Base64 hoặc URL)

  // Visibility Toggles
  visibility: SectionVisibility;

  // Colors & Typography
  primaryColor: string; // e.g. #1e3a8a
  accentColor: string; // e.g. #2563eb
  backgroundColor: string; // e.g. #f8fafc
  fontFamily: string; // e.g. 'Plus Jakarta Sans', system-ui, etc.

  // Hero Section
  badgeText: string;
  heroBadgeLogo?: string;
  heroBadgeIcon?: string;
  heroBadgeEnabled?: boolean;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImage: string;
  heroHighlightTitle: string;
  heroHighlightSub: string;
  heroPosters: HeroPoster[];
  heroStyle: HeroBlockStyle;
  // Customizable Blocks (Deep customization)
  trustBadges: TrustBadgeItem[];
  valueProps: ValuePropItem[];

  // Product Grid & Category Blocks
  productGridStyle: ProductGridStyle;
  categoryBlockStyle: CategoryBlockStyle;

  // Advertising Banners (Customizable Count & List)
  banners: AdItem[];

  // Custom Dynamic Navigation Tabs (Siêu sale, Đang hot...)
  customTabs: CustomNavTab[];

  // Contact, Footer & Socials
  hotline: string;
  contactEmail: string;
  storeAddress: string;
  footerText: string;
  socials: FooterSocials;
  defaultMaxPurchaseLimit?: number; // Giới hạn số lượng mua chung mặc định cho tất cả sản phẩm (0 hoặc undefined = không giới hạn)
}
