import type { Order, ProductReview } from './types';

export const INITIAL_DEMO_ORDERS: Order[] = [
  {
    id: 'ORD-DEMO-01',
    customerId: 'USR-CUST-1',
    customerName: 'Khách Hàng Thân Thiết',
    phone: '0909123456',
    address: '456 Hai Bà Trưng, Quận 1, TP. Hồ Chí Minh',
    items: [
      { id: 'it-1', productId: 1, name: 'Tai Nghe Chống Ồn Không Dây Sony WH-1000XM5', price: 6890000, quantity: 1, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80' }
    ],
    totalAmount: 6890000,
    status: 'completed',
    createdAt: '2026-02-15 09:30:00'
  },
  {
    id: 'ORD-DEMO-02',
    customerId: 'USR-CUST-1',
    customerName: 'Khách Hàng Thân Thiết',
    phone: '0909123456',
    address: '456 Hai Bà Trưng, Quận 1, TP. Hồ Chí Minh',
    items: [
      { id: 'it-2', productId: 8, name: 'Serum Dưỡng Trắng & Mờ Thâm Vitamin C Klairs', price: 345000, quantity: 2, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80' }
    ],
    totalAmount: 690000,
    status: 'completed',
    createdAt: '2026-02-20 14:15:00'
  },
  {
    id: 'ORD-DEMO-03',
    customerName: 'Nguyễn Văn Minh (Khách Guest)',
    phone: '0912888999',
    address: '78 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. HCM',
    items: [
      { id: 'it-3', productId: 2, name: 'Đồng Hồ Thông Minh Apple Watch Series 9 GPS', price: 9490000, quantity: 1, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80' }
    ],
    totalAmount: 9490000,
    status: 'processing',
    createdAt: '2026-03-01 10:00:00'
  },
  {
    id: 'ORD-DEMO-04',
    customerName: 'Trần Thị Thu Hà',
    phone: '0987111222',
    address: '15 Hoàng Hoa Thám, Ba Đình, Hà Nội',
    items: [
      { id: 'it-4', productId: 4, name: 'Áo Khoác Bomber Kaki Nam Phong Cách Hàn Quốc', price: 489000, quantity: 1, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80' },
      { id: 'it-5', productId: 5, name: 'Giày Thể Thao Sneaker Classic Unisex Trắng Đen', price: 850000, quantity: 1, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80' }
    ],
    totalAmount: 1339000,
    status: 'processing',
    createdAt: '2026-03-05 16:20:00'
  },
  {
    id: 'ORD-DEMO-05',
    customerName: 'Lê Hoàng Nam',
    phone: '0933444555',
    address: '25 Nguyễn Tri Phương, Quận 10, TP. HCM',
    items: [
      { id: 'it-6', productId: 6, name: 'Máy Pha Cà Phê Espresso Mini De\'Longhi Dedica', price: 3690000, quantity: 1, image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&auto=format&fit=crop&q=80' }
    ],
    totalAmount: 3690000,
    status: 'pending',
    createdAt: '2026-03-10 11:45:00'
  },
  {
    id: 'ORD-DEMO-06',
    customerName: 'Phạm Quỳnh Nga',
    phone: '0903777888',
    address: '120 Trần Phú, Ngô Quyền, Hải Phòng',
    items: [
      { id: 'it-7', productId: 7, name: 'Đèn Bàn Chống Cận Thị Xiaomi Mi LED Desk Lamp Pro', price: 790000, quantity: 2, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80' }
    ],
    totalAmount: 1580000,
    status: 'pending',
    createdAt: '2026-03-12 08:30:00'
  },
  {
    id: 'ORD-DEMO-07',
    customerName: 'Đặng Quốc Huy',
    phone: '0945666777',
    address: '92 Nguyễn Văn Linh, Đà Nẵng',
    items: [
      { id: 'it-8', productId: 3, name: 'Bàn Phím Cơ Không Dây NuPhy Air75 V2', price: 2450000, quantity: 1, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80' },
      { id: 'it-9', productId: 14, name: 'Chuột Gaming Không Dây Logitech G Pro X Superlight', price: 2690000, quantity: 1, image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80' }
    ],
    totalAmount: 5140000,
    status: 'completed',
    createdAt: '2026-03-15 15:10:00'
  },
  {
    id: 'ORD-DEMO-08',
    customerName: 'Vũ Thùy Linh',
    phone: '0978333222',
    address: '34 Lê Thánh Tông, TP. Buôn Ma Thuột, Đắk Lắk',
    items: [
      { id: 'it-10', productId: 9, name: 'Bộ Sách Tâm Lý Học & Phát Triển Bản Thân', price: 299000, quantity: 1, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80' },
      { id: 'it-11', productId: 18, name: 'Sách Kinh Tế: Từ Tốt Đến Vĩ Đại (Good to Great)', price: 155000, quantity: 1, image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80' }
    ],
    totalAmount: 454000,
    status: 'completed',
    createdAt: '2026-03-18 19:40:00'
  },
  {
    id: 'ORD-DEMO-09',
    customerName: 'Bùi Đức Anh',
    phone: '0966999888',
    address: '88 Quang Trung, TP. Vinh, Nghệ An',
    items: [
      { id: 'it-12', productId: 11, name: 'Loa Bluetooth Di Động Marshall Emberton II', price: 3890000, quantity: 1, image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80' }
    ],
    totalAmount: 3890000,
    status: 'cancelled',
    createdAt: '2026-03-20 13:00:00'
  },
  {
    id: 'ORD-DEMO-10',
    customerName: 'Ngô Thanh Vân',
    phone: '0922111333',
    address: '56 Phan Châu Trinh, TP. Cần Thơ',
    items: [
      { id: 'it-13', productId: 12, name: 'Kem Chống Nắng Kiềm Dầu La Roche-Posay Anthelios 50ml', price: 395000, quantity: 2, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80' },
      { id: 'it-14', productId: 17, name: 'Nước Tẩy Trang Làm Sạch Sâu Bioderma Sébium H2O 500ml', price: 420000, quantity: 1, image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80' }
    ],
    totalAmount: 1210000,
    status: 'processing',
    createdAt: '2026-03-22 17:50:00'
  }
];

export const INITIAL_DEMO_REVIEWS: ProductReview[] = [
  {
    id: 'rev-1',
    productId: 1,
    userId: 'USR-CUST-1',
    userName: 'Khách Hàng Thân Thiết',
    rating: 5,
    comment: 'Tai nghe Sony WH-1000XM5 quá đỉnh! Chống ồn vượt trội so với đời XM4, đeo lâu không bị cấn tai, âm bass sâu ấm.',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'],
    verifiedPurchase: true,
    createdAt: '2026-02-18 10:15:00'
  },
  {
    id: 'rev-2',
    productId: 8,
    userId: 'USR-CUST-1',
    userName: 'Khách Hàng Thân Thiết',
    rating: 5,
    comment: 'Serum Vitamin C Klairs lành tính, dùng 2 tuần da sáng mịn và vết thâm mụn mờ rõ rệt. Đóng gói rất cẩn thận!',
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80'],
    verifiedPurchase: true,
    createdAt: '2026-02-25 15:30:00'
  }
];
