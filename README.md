# CSET Store - 3D Printing Studio Web Application

Ứng dụng web thương mại điện tử và dịch vụ in 3D theo yêu cầu xây dựng bằng **Svelte 5** (Runes Architecture), **Vite**, **Tailwind CSS v4** và **TypeScript**, dựa trên nguyên bản từ file thiết kế `banweb20.txt`.

---

## 🏗️ Kiến Trúc & Design Patterns Đã Áp Dụng

Dự án được tái cấu trúc từ một file HTML thuần sang kiến trúc phần mềm chuẩn cho ứng dụng SPA hiện đại:

1. **Repository Pattern (`src/repositories/index.ts`)**:
   - `IProductRepository` & `IOrderRepository`: Tách biệt hoàn toàn tầng lưu trữ dữ liệu (LocalStorage / Memory fallback) khỏi logic giao diện. Dễ dàng chuyển đổi sang REST API hoặc Supabase/Firebase sau này.
2. **Store Pattern với Svelte 5 Runes (`src/stores/store.svelte.ts`)**:
   - Quản lý trạng thái tập trung (Single Source of Truth) sử dụng các rune phản ứng mới nhất của Svelte 5: `$state`, `$derived`, `$effect`.
   - Quản lý đồng bộ giỏ hàng, bộ lọc sản phẩm, modal popup và thông báo toast.
3. **Service Layer Pattern (`src/services/pricingService.ts`)**:
   - Tách biệt logic nghiệp vụ tính toán báo giá in 3D (khối lượng gam, mật độ infill %, thời gian in ước tính trên máy Bambu Lab A1 Combo, đơn giá chuẩn 1.500đ/gam) và format tiền tệ VNĐ.
4. **Component-Based Architecture (Atomic & Layered UI)**:
   - `Header.svelte`: Thanh điều hướng đáp ứng trên desktop & mobile, hiển thị badge số lượng giỏ hàng tức thì.
   - `ProductCard.svelte`: Thẻ hiển thị sản phẩm tái sử dụng với hiệu ứng hover và nút thêm nhanh.
   - `ProductModal.svelte`: Xem chi tiết thông số kỹ thuật in 3D và chọn số lượng.
   - `CartModal.svelte`: Quản lý giỏ hàng và form đặt hàng thông tin khách hàng.
   - `Toast.svelte`: Hệ thống thông báo toast phản hồi thao tác người dùng.

---

## 🌟 Các Phân Hệ Tính Năng

### 1. Trang Bán Hàng (Storefront)
- **Trang Chủ (`HomePage.svelte`)**:
  - Banner giới thiệu hệ thống in 3D Bambu Lab A1 Combo, độ chính xác 0.08mm, in đa màu 500mm/s.
  - Danh sách các sản phẩm in 3D nổi bật.
  - Các ưu điểm và cam kết chất lượng.
- **Cửa Hàng (`ShopPage.svelte`)**:
  - Lưới sản phẩm đầy đủ với bộ lọc theo danh mục: *Mô Hình Anime / Game*, *Đồ Trang Trí / Chậu Cây*, *Phụ Kiện Công Nghệ*.
  - Ô tìm kiếm thời gian thực theo tên sản phẩm có nút xóa nhanh.
  - Xem chi tiết từng sản phẩm và thêm vào giỏ hàng.
- **Đặt In Theo Yêu Cầu (`CustomOrderPage.svelte`)**:
  - Tải lên file 3D (`.stl`, `.3mf`, `.obj`, `.step`).
  - Phân tích và tự động tính toán khối lượng nhựa (gam) & thời gian in theo dung lượng file thực tế.
  - Lựa chọn mật độ rỗng (Infill: 15%, 20%, 40%, 100%) với đơn giá minh bạch 1.500đ / gam.
  - Thêm đơn in 3D riêng vào giỏ hàng chung.
- **Giỏ Hàng & Đặt Hàng (`CartModal.svelte`)**:
  - Xem danh sách món hàng (cả sản phẩm hoàn thiện và đơn in theo yêu cầu).
  - Tăng / giảm số lượng, xóa sản phẩm, tính tổng tiền tự động.
  - Điền form họ tên, số điện thoại, địa chỉ nhận hàng và xác nhận tạo mã đơn hàng.

### 2. Trang Quản Trị (`AdminPage.svelte`)
- **Quản lý sản phẩm**:
  - Thêm sản phẩm mới với ảnh đại diện (chọn file máy tính tải Base64), tên, giá bán, danh mục, khối lượng nhựa, thời gian in, mô tả chi tiết.
  - Xem danh sách sản phẩm hiện có và xóa sản phẩm khỏi cửa hàng.
  - Khôi phục dữ liệu mẫu ban đầu.
- **Quản lý đơn hàng**:
  - Xem danh sách tất cả các đơn khách đã đặt: Mã đơn hàng (ORD-...), ngày giờ tạo, thông tin khách hàng, chi tiết các món, tổng thanh toán.
  - Cập nhật trạng thái đơn hàng: *Chờ xác nhận*, *Đang in / Đang xử lý*, *Đã giao hoàn tất*, *Đã hủy*.

---

## 🚀 Cài Đặt & Khởi Chạy

```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy môi trường phát triển (Development)
npm run dev

# 3. Build sản phẩm tối ưu (Production)
npm run build

# 4. Chạy thử bản build (Preview)
npm run preview
```

---

## 📦 Công Nghệ Sử Dụng

- **Framework**: Svelte 5.57+ (Runes: `$state`, `$derived`, `$effect`)
- **Build Tool**: Vite 8.3+
- **Styling**: Tailwind CSS v4 (@tailwindcss/vite)
- **Icons**: FontAwesome 6.4
- **Typography**: Google Fonts (Plus Jakarta Sans)
- **Ngôn ngữ**: TypeScript 6+
