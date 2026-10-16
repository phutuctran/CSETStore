import type { Product, Order, User, Role, ThemeConfig } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Tượng Dragon Ball - Goku Ultra Instinct",
    category: "anime",
    price: 450000,
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
    description: "Mô hình Goku in 3D Resin độ phân giải cao sắc nét từng chi tiết. Khối lượng nhựa chuẩn: ~180g. Thời gian in: ~18 giờ.",
    grams: 180,
    printHours: 18
  },
  {
    id: 2,
    name: "Chậu Cây Hình Học Geometric",
    category: "decor",
    price: 180000,
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80",
    description: "Chậu cây trang trí bàn làm việc in nhựa PLA thân thiện với môi trường. Khối lượng nhựa chuẩn: ~75g. Thời gian in: ~6.5 giờ.",
    grams: 75,
    printHours: 6.5
  },
  {
    id: 3,
    name: "Giá Đỡ Điện Thoại Đa Năng 3D",
    category: "tech",
    price: 120000,
    image: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&auto=format&fit=crop&q=80",
    description: "Thiết kế chịu lực cao, góc nhìn tối ưu cho làm việc và giải trí. Khối lượng nhựa chuẩn: ~45g. Thời gian in: ~3.8 giờ.",
    grams: 45,
    printHours: 3.8
  },
  {
    id: 4,
    name: "Mô Hình Gundam RX-78-2 Chibi",
    category: "anime",
    price: 320000,
    image: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80",
    description: "Khớp cử động linh hoạt, in nhiều màu bằng Bambu Lab AMS. Khối lượng nhựa chuẩn: ~130g. Thời gian in: ~12 giờ.",
    grams: 130,
    printHours: 12
  },
  {
    id: 5,
    name: "Đèn Ngủ Mặt Trăng Moon Lamp 3D",
    category: "decor",
    price: 260000,
    image: "https://images.unsplash.com/photo-1532767153582-b1a0e5145009?w=600&auto=format&fit=crop&q=80",
    description: "Mô phỏng bề mặt hố thiên thạch chân thực, hiệu ứng ánh sáng xuyên thấu tuyệt đẹp. Khối lượng nhựa: ~110g. Thời gian in: ~9.5 giờ.",
    grams: 110,
    printHours: 9.5
  },
  {
    id: 6,
    name: "Hộp Đựng Bút & Dụng Cụ Cơ Khí Xoay",
    category: "tech",
    price: 150000,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
    description: "Thiết kế bánh răng truyền động cơ khí mượt mà, tiện lợi cho góc làm việc. Khối lượng nhựa: ~60g. Thời gian in: ~5 giờ.",
    grams: 60,
    printHours: 5
  }
];

export const CATEGORIES = [
  { key: 'all', label: 'Tất cả danh mục' },
  { key: 'anime', label: 'Mô Hình Anime / Game' },
  { key: 'decor', label: 'Đồ Trang Trí / Chậu Cây' },
  { key: 'tech', label: 'Phụ Kiện Công Nghệ' }
] as const;

export const PRICE_PER_GRAM = 1500; // 1.500 VNĐ / gam

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
    fullName: 'Lê Quản Lý Kho & Sản Phẩm',
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
  storeTagline: '3D Printing Studio',
  logoIcon: 'fa-cube',

  primaryColor: '#1e3a8a', // Deep Blue
  accentColor: '#2563eb',  // Royal Blue
  backgroundColor: '#f8fafc', // Slate 50

  badgeText: 'Đồng Giá In 1.500đ / gam nhựa',
  heroTitle: 'CSET Store',
  heroSubtitle: 'In 3D Thông Minh & Nhanh Chóng',
  heroDescription: 'Sử dụng hệ thống máy in cao cấp Bambu Lab A1 Combo với công nghệ đa màu sắc nét. Tải file .stl, .3mf, .obj, .step trực tiếp lên web để tính khối lượng và báo giá chuẩn xác trong 1 giây.',
  heroImage: 'https://images.unsplash.com/photo-1615655406736-b37c4fabf923?w=800&auto=format&fit=crop&q=80',
  printerModel: 'Bambu Lab A1 Combo',
  printerSpeedText: 'In 4 màu - Tốc độ 500mm/s',

  pricePerGram: 1500,
  promoNotice: 'Giảm 10% cho đơn hàng in 3D trên 500g',

  precisionText: '0.08mm - Độ chính xác cao',
  supportText: '24/7 - In liên tục giao nhanh',
  pricingNote: '1.500đ - Giá rẻ minh bạch / gam',

  hotline: '0909.123.456',
  contactEmail: 'support@csetstore.vn',
  storeAddress: 'Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh',
  footerText: '© 2026 CSET Store. Đồ án xây dựng Website In 3D sử dụng Svelte 5 và Kiến trúc Layered Component.'
};
