import type { Product, Order, User, ThemeConfig, CategoryOption, Coupon, Role } from './types';
export const INITIAL_CATEGORIES: CategoryOption[] = [
  {
    key: 'electronics',
    label: 'Thiết Bị Điện Tử',
    icon: 'fa-laptop',
    subcategories: [
      { id: 'elec-headphone', name: 'Tai Nghe & Âm Thanh' },
      { id: 'elec-smartwatch', name: 'Đồng Hồ Thông Minh' },
      { id: 'elec-keyboard', name: 'Bàn Phím & Chuột' },
      { id: 'elec-phone', name: 'Điện Thoại & Phụ Kiện' }
    ]
  },
  {
    key: 'fashion',
    label: 'Thời Trang & Phụ Kiện',
    icon: 'fa-shirt',
    subcategories: [
      { id: 'fash-outerwear', name: 'Áo Khoác & Bomber' },
      { id: 'fash-shoes', name: 'Giày Sneaker & Thể Thao' },
      { id: 'fash-pants', name: 'Quần Jean & Kaki' },
      { id: 'fash-bag', name: 'Balo & Túi Xách' }
    ]
  },
  {
    key: 'home',
    label: 'Gia Dụng & Đời Sống',
    icon: 'fa-couch',
    subcategories: [
      { id: 'home-kitchen', name: 'Thiết Bị Bếp & Cà Phê' },
      { id: 'home-lighting', name: 'Đèn & Chiếu Sáng' },
      { id: 'home-clean', name: 'Máy Hút Bụi & Robot' }
    ]
  },
  {
    key: 'beauty',
    label: 'Mỹ Phẩm & Sức Khỏe',
    icon: 'fa-pump-soap',
    subcategories: [
      { id: 'beau-skincare', name: 'Chăm Sóc Da Mặt' },
      { id: 'beau-sunscreen', name: 'Kem Chống Nắng' },
      { id: 'beau-body', name: 'Chăm Sóc Cơ Thể' }
    ]
  },
  {
    key: 'books',
    label: 'Sách & Văn Phòng Phẩm',
    icon: 'fa-book',
    subcategories: [
      { id: 'book-selfhelp', name: 'Phát Triển Bản Thân' },
      { id: 'book-business', name: 'Kinh Doanh & Khởi Nghiệp' },
      { id: 'book-stationery', name: 'Sổ Tay & Bút Ký' }
    ]
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup-1',
    code: 'CSET10',
    description: 'Giảm 10% cho tất cả đơn hàng từ 500.000 VNĐ (tối đa 200.000 VNĐ)',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 500000,
    maxDiscountAmount: 200000,
    usageLimit: 100,
    usedCount: 12,
    isActive: true
  },
  {
    id: 'coup-2',
    code: 'GIAM50K',
    description: 'Giảm ngay 50.000 VNĐ cho đơn từ 300.000 VNĐ',
    discountType: 'fixed',
    discountValue: 50000,
    minOrderValue: 300000,
    usageLimit: 50,
    usedCount: 8,
    isActive: true
  },
  {
    id: 'coup-3',
    code: 'CSETVIP',
    description: 'Ưu đãi VIP giảm 200.000 VNĐ cho đơn từ 2.000.000 VNĐ',
    discountType: 'fixed',
    discountValue: 200000,
    minOrderValue: 2000000,
    usageLimit: 20,
    usedCount: 3,
    isActive: true
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Tai Nghe Chống Ồn Không Dây Sony WH-1000XM5",
    category: "electronics",
    subCategory: "Tai Nghe & Âm Thanh",
    price: 6890000,
    originalPrice: 7990000,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    description: "Chống ồn hàng đầu ngành với 8 micro, thời lượng pin 30 giờ, âm thanh Hi-Res Audio sắc nét.",
    brand: "Sony",
    sku: "SONY-WH1000XM5-BLK",
    origin: "Malaysia",
    warranty: "12 tháng chính hãng",
    weight: "250g",
    condition: "Mới 100% Nguyên Seal",
    specifications: [
      { name: "Thời lượng pin", value: "30 giờ (Bật chống ồn)" },
      { name: "Kết nối", value: "Bluetooth 5.2, Jack 3.5mm" },
      { name: "Trọng lượng", value: "Khoảng 250g" },
      { name: "Tính năng", value: "Chống ồn chủ động ANC, Speak-to-Chat" }
    ],
    variantGroups: [
      { name: "Màu sắc", options: ["Đen (Black)", "Bạc Ánh Kim (Silver)", "Xanh Đêm (Midnight Blue)"] },
      { name: "Bảo hành", options: ["12 Tháng Tiêu Chuẩn", "24 Tháng Mở Rộng (+300.000 VNĐ)"] }
    ],
    rating: 4.9,
    stock: 25
  },
  {
    id: 2,
    name: "Đồng Hồ Thông Minh Apple Watch Series 9 GPS 45mm",
    category: "electronics",
    subCategory: "Đồng Hồ Thông Minh",
    price: 9490000,
    originalPrice: 10490000,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    description: "Chip S9 SiP mạnh mẽ, cử chỉ chạm hai lần Double Tap kỳ diệu, màn hình sáng gấp đôi 2000 nits.",
    brand: "Apple",
    sku: "APL-W9-45-MID",
    origin: "Việt Nam / Trung Quốc",
    warranty: "12 tháng Apple Care",
    weight: "38.7g",
    condition: "Mới 100% Chưa kích hoạt",
    specifications: [
      { name: "Kích thước màn hình", value: "1.9 inch Retina OLED" },
      { name: "Vi xử lý", value: "Apple S9 SiP 64-bit" },
      { name: "Chống nước", value: "50m (WR50)" },
      { name: "Cảm biến", value: "Đo ECG, SpO2, Nhiệt độ da" }
    ],
    rating: 4.8,
    stock: 18
  },
  {
    id: 3,
    name: "Bàn Phím Cơ Không Dây NuPhy Air75 V2 Low-Profile",
    category: "electronics",
    subCategory: "Bàn Phím & Chuột",
    price: 2450000,
    originalPrice: 2800000,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
    description: "Layout 75% siêu mỏng low-profile, kết nối 3 chế độ (Bluetooth 5.1, 2.4Ghz, Type-C), hỗ trợ QMK/VIA.",
    brand: "NuPhy",
    sku: "NUPHY-AIR75-V2",
    origin: "Trung Quốc",
    warranty: "12 tháng đổi mới",
    weight: "598g",
    condition: "Mới 100% Fullbox",
    specifications: [
      { name: "Switch", value: "Gateron Low-profile Cowberry" },
      { name: "Kết nối", value: "2.4Ghz, Bluetooth 5.1, Dây USB-C" },
      { name: "Pin", value: "4000mAh (Lên đến 220 giờ)" }
    ],
    rating: 4.7,
    stock: 30
  },
  {
    id: 4,
    name: "Áo Khoác Bomber Kaki Nam Phong Cách Hàn Quốc",
    category: "fashion",
    subCategory: "Áo Khoác & Bomber",
    price: 489000,
    originalPrice: 650000,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    description: "Chất liệu kaki 2 lớp dày dặn, cản gió giữ ấm tốt, form dáng suông trẻ trung hiện đại.",
    brand: "UrbanStyle",
    sku: "BOMB-KK-2026",
    origin: "Việt Nam",
    warranty: "Đổi trả 30 ngày lỗi may",
    weight: "450g",
    condition: "Mới 100% Có Tag",
    specifications: [
      { name: "Chất liệu", value: "Kaki cotton cao cấp" },
      { name: "Size", value: "M, L, XL, XXL" },
      { name: "Màu sắc", value: "Đen, Rêu, Be sáng" }
    ],
    rating: 4.6,
    stock: 50
  },
  {
    id: 5,
    name: "Giày Thể Thao Sneaker Classic Unisex Trắng Đen",
    category: "fashion",
    subCategory: "Giày Sneaker & Thể Thao",
    price: 850000,
    originalPrice: 1100000,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80",
    description: "Đế cao su lưu hóa êm ái chống trơn trượt, da tổng hợp cao cấp dễ vệ sinh, phối đồ đa phong cách.",
    brand: "RetroFit",
    sku: "SNK-CLS-WHT",
    origin: "Việt Nam",
    warranty: "6 tháng keo chỉ",
    weight: "700g/đôi",
    condition: "Mới 100% Nguyên hộp",
    specifications: [
      { name: "Chất liệu bề mặt", value: "Da PU nhân tạo chống thấm" },
      { name: "Đế giày", value: "Cao su đúc nguyên khối" }
    ],
    rating: 4.8,
    stock: 40
  },
  {
    id: 6,
    name: "Máy Pha Cà Phê Espresso Mini Tự Động De'Longhi Dedica",
    category: "home",
    subCategory: "Thiết Bị Bếp & Cà Phê",
    price: 3690000,
    originalPrice: 4200000,
    image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&auto=format&fit=crop&q=80",
    description: "Áp suất 15 bar chuẩn Ý, hệ thống Thermoblock gia nhiệt nhanh 40s, vòi đánh sữa tạo bọt kem béo ngậy.",
    brand: "De'Longhi",
    sku: "DLG-EC685-M",
    origin: "Ý / Trung Quốc",
    warranty: "24 tháng chính hãng",
    weight: "4.2kg",
    condition: "Mới 100% Nguyên thùng",
    specifications: [
      { name: "Áp suất bơm", value: "15 Bar" },
      { name: "Dung tích bình nước", value: "1.1 Lít" },
      { name: "Công suất", value: "1300W" }
    ],
    rating: 4.9,
    stock: 12
  },
  {
    id: 7,
    name: "Đèn Bàn Chống Cận Thị Thông Minh Xiaomi Mi LED Desk Lamp Pro",
    category: "home",
    subCategory: "Đèn & Chiếu Sáng",
    price: 790000,
    originalPrice: 950000,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",
    description: "Chỉ số hoàn màu Ra95 tiệm cận ánh sáng mặt trời, chứng nhận TÜV Rheinland không ánh sáng xanh hại mắt.",
    brand: "Xiaomi",
    sku: "XMI-LAMP-PRO",
    origin: "Trung Quốc",
    warranty: "12 tháng chính hãng",
    weight: "1.5kg",
    condition: "Mới 100% Nguyên seal",
    specifications: [
      { name: "Độ rọi tối đa", value: "700 lumens" },
      { name: "Nhiệt độ màu", value: "2500K - 4800K" },
      { name: "Kết nối", value: "Wi-Fi 2.4GHz, Apple HomeKit" }
    ],
    rating: 4.7,
    stock: 35
  },
  {
    id: 8,
    name: "Serum Dưỡng Trắng & Mờ Thâm Vitamin C Klairs Freshly Juiced",
    category: "beauty",
    subCategory: "Chăm Sóc Da Mặt",
    price: 345000,
    originalPrice: 420000,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
    description: "Nồng độ Vitamin C tươi 5% an toàn lành tính cho cả làn da nhạy cảm, mờ vết thâm mụn chỉ sau 2 tuần.",
    brand: "Klairs",
    sku: "KLAIRS-VITC-35ML",
    origin: "Hàn Quốc",
    warranty: "Cam kết chính hãng",
    weight: "35ml",
    condition: "Mới 100% Hạn dùng 2028",
    specifications: [
      { name: "Dung tích", value: "35ml" },
      { name: "Thành phần chính", value: "5% L-Ascorbic Acid, Chiết xuất rau má" }
    ],
    rating: 4.8,
    stock: 60
  },
  {
    id: 9,
    name: "Bộ Sách Tâm Lý Học & Phát Triển Bản Thân (Trọn Bộ 3 Cuốn)",
    category: "books",
    subCategory: "Phát Triển Bản Thân",
    price: 299000,
    originalPrice: 380000,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    description: "Gồm 'Đắc Nhân Tâm', 'Tư Duy Nhanh Và Chậm', 'Nguyên Lý 80/20'. Bản dịch mới nhất bìa cứng cao cấp.",
    brand: "NXB Trẻ",
    sku: "BOOK-SET-3IN1",
    origin: "Việt Nam",
    warranty: "Đổi mới nếu lỗi in ấn",
    weight: "1.2kg",
    condition: "Mới 100% Nguyên màng co",
    specifications: [
      { name: "Số trang", value: "1150 trang (Tổng 3 cuốn)" },
      { name: "Nhà xuất bản", value: "NXB Trẻ & First News" }
    ],
    rating: 5.0,
    stock: 80
  },
  {
    id: 10,
    name: "Máy Lọc Không Khí Kháng Khuẩn Xiaomi Smart Air Purifier 4 Pro",
    category: "home",
    subCategory: "Thiết Bị Bếp & Cà Phê",
    price: 4990000,
    originalPrice: 5990000,
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80"
    ],
    description: "Lọc sạch bụi mịn PM2.5, khử mùi formol hiệu quả 99.97%, phủ sóng phòng 35-60m2, cảm biến laser thông minh.",
    brand: "Xiaomi",
    sku: "XMI-AP4-PRO",
    origin: "Trung Quốc",
    warranty: "12 tháng chính hãng DGW",
    weight: "6.8kg",
    condition: "Mới 100% Nguyên seal",
    specifications: [
      { name: "Công suất lọc CADR", value: "500 m3/h" },
      { name: "Độ ồn", value: "33.7 dB(A)" },
      { name: "Màn hình", value: "OLED cảm ứng màu" }
    ],
    rating: 4.9,
    stock: 20
  },
  {
    id: 11,
    name: "Loa Bluetooth Di Động Marshall Emberton II Chính Hãng",
    category: "electronics",
    subCategory: "Tai Nghe & Âm Thanh",
    price: 3890000,
    originalPrice: 4490000,
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80"
    ],
    description: "Âm thanh đa hướng 360 độ True Stereophonic đặc trưng Marshall, chuẩn kháng nước bụi IP67, pin trên 30 giờ.",
    brand: "Marshall",
    sku: "MARSH-EMBER-2",
    origin: "Thụy Điển / Trung Quốc",
    warranty: "12 tháng ASH phân phối",
    weight: "700g",
    condition: "Mới 100% Fullbox",
    specifications: [
      { name: "Thời lượng pin", value: "30+ giờ" },
      { name: "Chống nước", value: "IP67" },
      { name: "Kết nối", value: "Bluetooth 5.1" }
    ],
    rating: 4.8,
    stock: 15
  },
  {
    id: 12,
    name: "Kem Chống Nắng Kiềm Dầu La Roche-Posay Anthelios 50ml",
    category: "beauty",
    subCategory: "Kem Chống Nắng",
    price: 395000,
    originalPrice: 495000,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80"
    ],
    description: "Bảo vệ quang phổ rộng SPF50+ chống tia UVA/UVB/tia hồng ngoại, kiểm soát bóng nhờn tới 12 giờ, không nhờn rít.",
    brand: "La Roche-Posay",
    sku: "LRP-ANT-50ML",
    origin: "Pháp",
    warranty: "Cam kết chính hãng",
    weight: "50ml",
    condition: "Mới 100% HSD 2028",
    specifications: [
      { name: "Chỉ số chống nắng", value: "SPF50+ / PA++++" },
      { name: "Loại da phù hợp", value: "Da dầu, hỗn hợp thiên dầu, da mụn" }
    ],
    rating: 4.9,
    stock: 75
  },
  {
    id: 13,
    name: "Quần Jean Nam Slimfit Co Giãn Cao Cấp Vải Denim",
    category: "fashion",
    subCategory: "Quần Jean & Kaki",
    price: 390000,
    originalPrice: 520000,
    image: "https://images.unsplash.com/photo-1542272604-780c96856592?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1542272604-780c96856592?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80"
    ],
    description: "Form dáng Slimfit ôm vừa vặn, vải denim dệt thoi mềm mại, co giãn thoải mái khi vận động và không phai màu.",
    brand: "UrbanStyle",
    sku: "JEAN-SLIM-BLU",
    origin: "Việt Nam",
    warranty: "Đổi size miễn phí 7 ngày",
    weight: "500g",
    condition: "Mới 100% Có tem mác",
    specifications: [
      { name: "Chất liệu", value: "98% Cotton, 2% Spandex" },
      { name: "Size", value: "29, 30, 31, 32, 34" }
    ],
    rating: 4.7,
    stock: 45
  },
  {
    id: 14,
    name: "Chuột Gaming Không Dây Siêu Nhẹ Logitech G Pro X Superlight",
    category: "electronics",
    subCategory: "Bàn Phím & Chuột",
    price: 2690000,
    originalPrice: 3290000,
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80"
    ],
    description: "Trọng lượng chỉ dưới 63g, cảm biến HERO 25K độc quyền độ chính xác từng micromet, kết nối Lightspeed không độ trễ.",
    brand: "Logitech G",
    sku: "LOGI-GPX-WHT",
    origin: "Thụy Sĩ / Trung Quốc",
    warranty: "24 tháng chính hãng",
    weight: "63g",
    condition: "Mới 100% Nguyên seal",
    specifications: [
      { name: "Cảm biến", value: "HERO 25,600 DPI" },
      { name: "Pin", value: "Lên đến 70 giờ chơi liên tục" }
    ],
    rating: 4.9,
    stock: 22
  },
  {
    id: 15,
    name: "Bình Giữ Nhiệt Lưỡng Tính Inox 316 Lock&Lock 800ml",
    category: "home",
    subCategory: "Thiết Bị Bếp & Cà Phê",
    price: 389000,
    originalPrice: 510000,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&auto=format&fit=crop&q=80"
    ],
    description: "Lòng bình bằng thép không gỉ SUS316 y tế cao cấp, giữ nóng 8 giờ và giữ lạnh đến 24 giờ, có quai xách tiện lợi.",
    brand: "Lock&Lock",
    sku: "LNL-THERM-800",
    origin: "Hàn Quốc / Trung Quốc",
    warranty: "Bảo hành giữ nhiệt 12 tháng",
    weight: "420g",
    condition: "Mới 100% Fullbox",
    specifications: [
      { name: "Dung tích", value: "800ml" },
      { name: "Chất liệu", value: "Inox 316 cao cấp, nắp nhựa PP không chứa BPA" }
    ],
    rating: 4.8,
    stock: 55
  },
  {
    id: 16,
    name: "Balo Laptop Chống Nước Chống Rạch Đa Năng Mark Ryden",
    category: "fashion",
    subCategory: "Balo & Túi Xách",
    price: 650000,
    originalPrice: 850000,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80"
    ],
    description: "Vải Oxford trượt nước chống trầy, ngăn chống sốc laptop 15.6 inch, cổng sạc USB tích hợp, khóa số TSA an toàn.",
    brand: "Mark Ryden",
    sku: "MR-BP-9032",
    origin: "Anh Quốc / Trung Quốc",
    warranty: "12 tháng khóa kéo may",
    weight: "950g",
    condition: "Mới 100% Chính hãng",
    specifications: [
      { name: "Kích thước", value: "45 x 30 x 18 cm" },
      { name: "Sức chứa", value: "Laptop 15.6 - 17 inch" }
    ],
    rating: 4.8,
    stock: 32
  },
  {
    id: 17,
    name: "Nước Tẩy Trang Làm Sạch Sâu Bioderma Sébium H2O 500ml",
    category: "beauty",
    subCategory: "Chăm Sóc Da Mặt",
    price: 420000,
    originalPrice: 530000,
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80"
    ],
    description: "Công nghệ Micellar Water độc quyền làm sạch 99% lớp trang điểm và bụi mịn, điều tiết bã nhờn dịu nhẹ không khô da.",
    brand: "Bioderma",
    sku: "BIO-SEB-500",
    origin: "Pháp",
    warranty: "Cam kết chính hãng",
    weight: "500ml",
    condition: "Mới 100% Nắp xanh",
    specifications: [
      { name: "Dung tích", value: "500ml" },
      { name: "Loại da", value: "Da dầu mụn, da hỗn hợp" }
    ],
    rating: 4.9,
    stock: 65
  },
  {
    id: 18,
    name: "Sách Kinh Tế: Từ Tốt Đến Vĩ Đại (Good to Great) - Jim Collins",
    category: "books",
    subCategory: "Kinh Doanh & Khởi Nghiệp",
    price: 155000,
    originalPrice: 190000,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"
    ],
    description: "Công trình nghiên cứu 5 năm về cách các công ty bình thường bứt phá trở thành vĩ đại và bền bỉ qua thời gian.",
    brand: "NXB Trẻ",
    sku: "BOOK-G2G-2026",
    origin: "Việt Nam",
    warranty: "Đổi mới nếu rách trang",
    weight: "450g",
    condition: "Mới 100% Bìa mềm",
    specifications: [
      { name: "Số trang", value: "480 trang" },
      { name: "Tác giả", value: "Jim Collins" }
    ],
    rating: 4.9,
    stock: 90
  },
  {
    id: 19,
    name: "Robot Hút Bụi Lau Nhà Tự Động Ecovacs Deebot T20 Omni",
    category: "home",
    subCategory: "Máy Hút Bụi & Robot",
    price: 13990000,
    originalPrice: 16990000,
    image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80"
    ],
    description: "Trạm sạc đa năng tự giặt giẻ nước nóng 55°C, tự sấy khô khí nóng, tự hút rác, lực hút siêu khủng 6000Pa.",
    brand: "Ecovacs",
    sku: "ECO-T20-OMNI",
    origin: "Trung Quốc",
    warranty: "24 tháng chính hãng",
    weight: "14kg",
    condition: "Mới 100% Nguyên thùng",
    specifications: [
      { name: "Lực hút", value: "6000 Pa" },
      { name: "Dung lượng pin", value: "5200 mAh" },
      { name: "Công nghệ lau", value: "Lau xoay OZMO Turbo 2.0" }
    ],
    rating: 5.0,
    stock: 10
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-SUPER',
    username: 'superadmin',
    password: '$argon2id$v=19$m=19456,t=2,p=1$DCI4TloMIjhOWgwiOE5aDA$IoyXDXDJUIr5PYp+0BwAH3tMduQpH5VwQHQq0MLOGrY',
    fullName: 'Trần Super Admin',
    role: 'super_admin',
    createdAt: '2026-01-01 08:00:00'
  },
  {
    id: 'USR-SALES',
    username: 'salesadmin',
    password: '$argon2id$v=19$m=19456,t=2,p=1$DCI4TloMIjhOWgwiOE5aDA$IoyXDXDJUIr5PYp+0BwAH3tMduQpH5VwQHQq0MLOGrY',
    fullName: 'Nguyễn Quản Lý Đơn',
    role: 'sales_admin',
    createdAt: '2026-01-02 09:00:00'
  },
  {
    id: 'USR-INVENTORY',
    username: 'khoadmin',
    password: '$argon2id$v=19$m=19456,t=2,p=1$DCI4TloMIjhOWgwiOE5aDA$IoyXDXDJUIr5PYp+0BwAH3tMduQpH5VwQHQq0MLOGrY',
    fullName: 'Lê Quản Lý Kho & Hàng Hóa',
    role: 'inventory_admin',
    createdAt: '2026-01-03 10:00:00'
  },
  {
    id: 'USR-CUST-1',
    username: 'khachhang1',
    password: '$argon2id$v=19$m=19456,t=2,p=1$DCI4TloMIjhOWgwiOE5aDA$IoyXDXDJUIr5PYp+0BwAH3tMduQpH5VwQHQq0MLOGrY',
    fullName: 'Khách Hàng Thân Thiết',
    phone: '0909123456',
    address: '456 Hai Bà Trưng, Quận 1, TP. Hồ Chí Minh',
    role: 'customer',
    createdAt: '2026-01-10 14:00:00'
  },
  {
    id: 'USR-CUST-2',
    username: 'khachhang2',
    password: '$argon2id$v=19$m=19456,t=2,p=1$DCI4TloMIjhOWgwiOE5aDA$IoyXDXDJUIr5PYp+0BwAH3tMduQpH5VwQHQq0MLOGrY',
    fullName: 'Hoàng Minh Tuấn',
    phone: '0918234567',
    address: '120 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    role: 'customer',
    createdAt: '2026-01-15 10:30:00'
  },
  {
    id: 'USR-CUST-3',
    username: 'khachhang3',
    password: '$argon2id$v=19$m=19456,t=2,p=1$DCI4TloMIjhOWgwiOE5aDA$IoyXDXDJUIr5PYp+0BwAH3tMduQpH5VwQHQq0MLOGrY',
    fullName: 'Phạm Thùy Linh',
    phone: '0987654321',
    address: '25 Hàng Bài, Phường Tràng Tiền, Quận Hoàn Kiếm, Hà Nội',
    role: 'customer',
    createdAt: '2026-01-20 15:45:00'
  },
  {
    id: 'USR-CUST-4',
    username: 'khachhang4',
    password: '$argon2id$v=19$m=19456,t=2,p=1$DCI4TloMIjhOWgwiOE5aDA$IoyXDXDJUIr5PYp+0BwAH3tMduQpH5VwQHQq0MLOGrY',
    fullName: 'Võ Quốc Huy',
    phone: '0933112233',
    address: '88 Trần Phú, Phường Hải Châu 1, Quận Hải Châu, Đà Nẵng',
    role: 'customer',
    createdAt: '2026-02-01 09:15:00'
  },
  {
    id: 'USR-CUST-5',
    username: 'khachhang5',
    password: '$argon2id$v=19$m=19456,t=2,p=1$DCI4TloMIjhOWgwiOE5aDA$IoyXDXDJUIr5PYp+0BwAH3tMduQpH5VwQHQq0MLOGrY',
    fullName: 'Đặng Thu Thảo',
    phone: '0977889900',
    address: '34 Lê Lợi, Phường Phú Nhuận, TP. Huế, Thừa Thiên Huế',
    role: 'customer',
    createdAt: '2026-02-10 16:20:00'
  },
  {
    id: 'USR-CUST-6',
    username: 'khachhang6',
    password: '$argon2id$v=19$m=19456,t=2,p=1$DCI4TloMIjhOWgwiOE5aDA$IoyXDXDJUIr5PYp+0BwAH3tMduQpH5VwQHQq0MLOGrY',
    fullName: 'Bùi Anh Dũng',
    phone: '0908123789',
    address: '56 Đường 30/4, Phường An Phú, Quận Ninh Kiều, Cần Thơ',
    role: 'customer',
    createdAt: '2026-02-18 11:00:00'
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
  logoWidth: 40,
  browserTitle: 'CSET Store - Siêu Thị Mua Sắm Trực Tuyến Đa Ngành Hàng',
  faviconImage: '',
  visibility: {
    showPromoBadge: true,
    showHeroSection: true,
    showHeroImage: true,
    showTrustBadges: true,
    showFeaturedProducts: true,
    showValueProps: true,
    showFooterContact: true,
    showTopAdBanner: true,
    showSideAdBanners: true,
    showCustomOrderTab: true
  },

  primaryColor: '#1e3a8a', // Deep Blue
  accentColor: '#2563eb',  // Royal Blue
  backgroundColor: '#f8fafc', // Slate 50
  fontFamily: 'Plus Jakarta Sans',
  badgeText: 'Ưu Đãi Đặc Biệt: Miễn Phí Vận Chuyển Toàn Quốc Cho Đơn Từ 300.000đ',
  heroBadgeLogo: '',
  heroBadgeIcon: 'fa-gift',
  heroBadgeEnabled: true,
  heroTitle: 'CSET Store',
  heroSubtitle: 'Mua Sắm Thông Minh - Giá Tốt Mỗi Ngày',
  heroDescription: 'Hàng ngàn sản phẩm công nghệ, thời trang, gia dụng và mỹ phẩm chính hãng 100%. Cam kết chất lượng, bảo hành chu đáo, giao hàng siêu tốc 2h.',
  heroImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80',
  heroHighlightTitle: 'Bộ Sưu Tập Mới 2026',
  heroHighlightSub: 'Giảm đến 40% cho thành viên',
  heroPosters: [
    {
      id: 'poster-1',
      imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80',
      highlightTitle: 'Bộ Sưu Tập Thời Trang 2026',
      highlightSub: 'Ưu đãi đến 40% cho thành viên',
      badgeText: 'Trending'
    },
    {
      id: 'poster-2',
      imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80',
      highlightTitle: 'Đại Tiệc Thiết Bị Công Nghệ',
      highlightSub: 'Chính hãng 100% - Trả góp 0%',
      badgeText: 'Tech Fest'
    },
    {
      id: 'poster-3',
      imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
      highlightTitle: 'Không Gian Sống Hiện Đại',
      highlightSub: 'Nâng tầm phong cách gia đình',
      badgeText: 'Home Decor'
    }
  ],
  heroStyle: {
    textAlign: 'left',
    primaryBtnText: 'Mua Sắm Ngay',
    primaryBtnBg: '#1e3a8a',
    primaryBtnTextColor: '#ffffff',
    secondaryBtnText: 'Sản Phẩm Bán Chạy',
    showSecondaryBtn: true,
    highlightBadgeText: 'Hot Deal'
  },
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

  // Product Grid & Category Blocks
  productGridStyle: {
    sectionTitle: 'Sản Phẩm Bán Chạy & Nổi Bật',
    sectionSubtitle: 'Các sản phẩm chính hãng được người mua đánh giá cao nhất',
    cardBorderRadius: 'rounded-2xl',
    showDiscountBadge: true,
    showBrandTag: true,
    showStockStatus: true,
    showRating: true,
    buyButtonText: 'Thêm'
  },

  categoryBlockStyle: {
    sectionTitle: 'Danh Mục Mua Sắm Phổ Biến',
    iconBgColor: '#eff6ff',
    cardHoverEffect: true
  },
  // Advertising Banners (Customizable List & Positions)
  banners: [
    {
      id: 'ad-top-1',
      position: 'top',
      type: 'text',
      enabled: true,
      title: '🎉 SIÊU HỘI MUA SẮM 2026: Nhập mã CSETVIP giảm ngay 15% cho mọi đơn hàng hôm nay!',
      subtitle: 'Áp dụng cho thành viên',
      linkText: 'Nhận Mã Ngay',
      linkUrl: '#',
      bgColor: '#1e3a8a',
      textColor: '#ffffff',
      createdAt: '2026-01-01'
    },
    {
      id: 'ad-side-left-1',
      position: 'side-left',
      type: 'image',
      enabled: true,
      title: 'Xả Kho Công Nghệ Giảm Đến 50%',
      subtitle: 'Chính Hãng 100%',
      imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&auto=format&fit=crop&q=80',
      linkUrl: '#',
      bgColor: '#f1f5f9',
      textColor: '#0f172a',
      createdAt: '2026-01-01'
    },
    {
      id: 'ad-side-right-1',
      position: 'side-right',
      type: 'image',
      enabled: true,
      title: 'Thời Trang Hè Mới Giảm 30%',
      subtitle: 'Bộ Sưu Tập Xu Hướng',
      imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&auto=format&fit=crop&q=80',
      linkUrl: '#',
      bgColor: '#f1f5f9',
      textColor: '#0f172a',
      createdAt: '2026-01-01'
    }
  ],

  // Custom Dynamic Navigation Tabs
  customTabs: [
    {
      id: 'tab-hot-deal',
      name: 'Siêu Sale Đang Hot',
      icon: 'fa-fire',
      enabled: true,
      bannerType: 'text',
      bannerTitle: '🔥 TUẦN LỄ XẢ KHO SIÊU SALE - GIẢM ĐẾN 50%',
      bannerSubtitle: 'Số lượng có hạn, áp dụng cho các sản phẩm công nghệ và thời trang tuyển chọn',
      bannerBg: '#b91c1c',
      bannerTextColor: '#ffffff',
      productIds: [1, 2, 4, 8]
    }
  ],

  hotline: '1900.6868',
  contactEmail: 'hotro@csetstore.vn',
  storeAddress: 'Tòa nhà CSET Center, 123 Đại Lộ Ánh Sáng, Quận 1, TP. Hồ Chí Minh',
  footerText: '© 2026 CSET Store. Nền tảng thương mại điện tử đa ngành hàng hiện đại xây dựng trên Svelte 5.',
  socials: {
    facebook: 'https://facebook.com',
    zalo: 'https://zalo.me/0909123456',
    tiktok: 'https://tiktok.com',
    youtube: 'https://youtube.com',
    workingHours: '08:00 - 21:30 (Thứ 2 - Chủ Nhật)',
    socialText: 'Kết nối cùng CSET Store qua Facebook & Zalo:',
    messengerPageId: 'https://m.me'
  }
};
