import type { Product, Order } from './types';

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
