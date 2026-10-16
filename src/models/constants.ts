import type { Product, User, Role, ThemeConfig, CategoryOption } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Tai Nghe Chống Ồn Không Dây Sony WH-1000XM5",
    category: "electronics",
    price: 6890000,
    originalPrice: 7990000,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    description: "Chống ồn hàng đầu ngành, thời lượng pin 30 giờ, âm thanh Hi-Res Audio sắc nét.",
    brand: "Sony",
    rating: 4.9,
    stock: 25
  },
  {
    id: 2,
    name: "Đồng Hồ Thông Minh Apple Watch Series 9 GPS",
    category: "electronics",
    price: 9490000,
    originalPrice: 10490000,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    description: "Chip S9 SiP mạnh mẽ, màn hình sáng gấp đôi, theo dõi sức khỏe và cảm biến nhịp tim nâng cao.",
    brand: "Apple",
    rating: 4.8,
    stock: 18
  },
  {
    id: 3,
    name: "Bàn Phím Cơ Không Dây NuPhy Air75 V2",
    category: "electronics",
    price: 2450000,
    originalPrice: 2800000,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
    description: "Layout 75% siêu mỏng low-profile, kết nối 3 chế độ (Bluetooth 5.1, 2.4Ghz, Type-C).",
    brand: "NuPhy",
    rating: 4.7,
    stock: 30
  },
  {
    id: 4,
    name: "Áo Khoác Bomber Kaki Nam Phong Cách Hàn Quốc",
    category: "fashion",
    price: 489000,
    originalPrice: 650000,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    description: "Chất liệu kaki 2 lớp dày dặn, cản gió giữ ấm tốt, form dáng trẻ trung hiện đại.",
    brand: "UrbanStyle",
    rating: 4.6,
    stock: 50
  },
  {
    id: 5,
    name: "Giày Thể Thao Sneaker Classic Unisex Trắng",
    category: "fashion",
    price: 850000,
    originalPrice: 1100000,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80",
    description: "Đế cao su êm ái chống trơn trượt, da tổng hợp cao cấp dễ vệ sinh, phối đồ đa phong cách.",
    brand: "RetroFit",
    rating: 4.8,
    stock: 40
  },
  {
    id: 6,
    name: "Máy Pha Cà Phê Espresso Mini Tự Động De'Longhi",
    category: "home",
    price: 3690000,
    originalPrice: 4200000,
    image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&auto=format&fit=crop&q=80",
    description: "Áp suất 15 bar chuẩn Ý, tích hợp vòi đánh sữa tạo bọt cappuccino sánh mịn.",
    brand: "De'Longhi",
    rating: 4.9,
    stock: 12
  },
  {
    id: 7,
    name: "Đèn Bàn Chống Cận Thị Thông Minh Xiaomi Pro",
    category: "home",
    price: 790000,
    originalPrice: 950000,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",
    description: "Chỉ số hoàn màu Ra95 tiệm cận ánh sáng tự nhiên, điều chỉnh độ sáng và nhiệt độ màu qua App.",
    brand: "Xiaomi",
    rating: 4.7,
    stock: 35
  },
  {
    id: 8,
    name: "Serum Dưỡng Trắng & Mờ Thâm Vitamin C Klairs",
    category: "beauty",
    price: 345000,
    originalPrice: 420000,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
    description: "Nồng độ Vitamin C tươi 5% an toàn lành tính cho da nhạy cảm, làm đều màu da rõ rệt.",
    brand: "Klairs",
    rating: 4.8,
    stock: 60
  },
  {
    id: 9,
    name: "Bộ Sách Tâm Lý Học & Phát Triển Bản Thân (Trọn Bộ 3 Cuốn)",
    category: "books",
    price: 299000,
    originalPrice: 380000,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    description: "Gồm 'Đắc Nhân Tâm', 'Tư Duy Nhanh Và Chậm', 'Nguyên Lý 80/20'. Bản in bìa cứng cao cấp.",
    brand: "NXB Trẻ",
    rating: 5.0,
    stock: 80
  }
];

export const CATEGORIES: CategoryOption[] = [
  { key: 'all', label: 'Tất cả sản phẩm', icon: 'fa-layer-group' },
  { key: 'electronics', label: 'Thiết Bị Điện Tử', icon: 'fa-laptop' },
  { key: 'fashion', label: 'Thời Trang & Phụ Kiện', icon: 'fa-shirt' },
  { key: 'home', label: 'Gia Dụng & Đời Sống', icon: 'fa-couch' },
  { key: 'beauty', label: 'Mỹ Phẩm & Sức Khỏe', icon: 'fa-pump-soap' },
  { key: 'books', label: 'Sách & Văn Phòng Phẩm', icon: 'fa-book' }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-SUPER',
    username: 'superadmin',
    password: '123',
    fullName: 'Trần Super Admin',
    role: 'super_admin',
    createdAt: '2026-01-01 08:00:00'
  },
  {
    id: 'USR-SALES',
    username: 'salesadmin',
    password: '123',
    fullName: 'Nguyễn Quản Lý Đơn',
    role: 'sales_admin',
    createdAt: '2026-01-02 09:00:00'
  },
  {
    id: 'USR-INVENTORY',
    username: 'khoadmin',
    password: '123',
    fullName: 'Lê Quản Lý Kho & Hàng Hóa',
    role: 'inventory_admin',
    createdAt: '2026-01-03 10:00:00'
  },
  {
    id: 'USR-CUST-1',
    username: 'khachhang1',
    password: '123',
    fullName: 'Khách Hàng Thân Thiết',
    phone: '0909123456',
    address: '456 Hai Bà Trưng, Quận 1, TP. Hồ Chí Minh',
    role: 'customer',
    createdAt: '2026-01-10 14:00:00'
  }
];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin (Toàn quyền)',
  sales_admin: 'Admin Bán Hàng (Xem & Quản lý đơn)',
  inventory_admin: 'Admin Hàng Hóa (Quản lý sản phẩm)',
  customer: 'Khách Hàng'
};

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  storeName: 'CSET STORE',
  storeTagline: 'Siêu Thị Mua Sắm Trực Tuyến Hàng Đầu',
  logoIcon: 'fa-bag-shopping',
  logoImage: '',

  visibility: {
    showPromoBadge: true,
    showHeroSection: true,
    showHeroImage: true,
    showTrustBadges: true,
    showFeaturedProducts: true,
    showValueProps: true,
    showFooterContact: true
  },

  primaryColor: '#1e3a8a', // Deep Blue
  accentColor: '#2563eb',  // Royal Blue
  backgroundColor: '#f8fafc', // Slate 50

  badgeText: 'Ưu Đãi Đặc Biệt: Miễn Phí Vận Chuyển Toàn Quốc Cho Đơn Từ 300.000đ',
  heroTitle: 'CSET Store',
  heroSubtitle: 'Mua Sắm Thông Minh - Giá Tốt Mỗi Ngày',
  heroDescription: 'Hàng ngàn sản phẩm công nghệ, thời trang, gia dụng và mỹ phẩm chính hãng 100%. Cam kết chất lượng, bảo hành chu đáo, giao hàng siêu tốc 2h.',
  heroImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80',
  heroHighlightTitle: 'Bộ Sưu Tập Mới 2026',
  heroHighlightSub: 'Giảm đến 40% cho thành viên',
  // Customizable Blocks (Deep customization)
  trustBadges: [
    {
      id: 'tb-1',
      icon: 'fa-shield-check',
      title: 'Chính Hãng 100%',
      subtitle: 'Hoàn tiền 200% nếu phát hiện hàng giả'
    },
    {
      id: 'tb-2',
      icon: 'fa-truck-fast',
      title: 'Giao Nhanh 2H',
      subtitle: 'Nhận hàng hỏa tốc trong 2 giờ nội thành'
    },
    {
      id: 'tb-3',
      icon: 'fa-rotate-left',
      title: 'Đổi Trả 7 Ngày',
      subtitle: 'Miễn phí đổi trả nếu không hài lòng'
    }
  ],

  valueProps: [
    {
      id: 'vp-1',
      icon: 'fa-tags',
      title: 'Giá Cả Cạnh Tranh & Nhiều Ưu Đãi',
      description: 'Cập nhật mã giảm giá mỗi ngày, chương trình flash sale và tích lũy điểm thưởng cho thành viên.'
    },
    {
      id: 'vp-2',
      icon: 'fa-certificate',
      title: 'Sản Phẩm Đảm Bảo 100% Chính Hãng',
      description: 'Nguồn gốc xuất xứ rõ ràng từ các thương hiệu uy tín hàng đầu, đầy đủ hóa đơn bảo hành.'
    },
    {
      id: 'vp-3',
      icon: 'fa-headset',
      title: 'Chăm Sóc Khách Hàng Tận Tâm',
      description: 'Đội ngũ chuyên viên tư vấn giàu kinh nghiệm, hỗ trợ giải đáp mọi thắc mắc 24/7.'
    }
  ],
  hotline: '1900.6868',
  contactEmail: 'hotro@csetstore.vn',
  storeAddress: 'Tòa nhà CSET Center, 123 Đại Lộ Ánh Sáng, Quận 1, TP. Hồ Chí Minh',
  footerText: '© 2026 CSET Store. Nền tảng thương mại điện tử đa ngành hàng hiện đại xây dựng trên Svelte 5.'
};
