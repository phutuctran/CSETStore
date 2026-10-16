# CSET Store - Siêu Thị Thương Mại Điện Tử Đa Ngành Hàng (E-Commerce Web Application)

Nền tảng thương mại điện tử hiện đại bán đa dạng các ngành hàng (Thiết bị điện tử, Thời trang, Gia dụng & đời sống, Mỹ phẩm, Sách văn phòng phẩm), xây dựng bằng **Svelte 5** (Runes Architecture: `$state`, `$derived`, `$effect`), **Vite**, **Tailwind CSS v4** và **TypeScript**. Kiến trúc đa trang (Multi-Page App) tách biệt hoàn toàn **Website Cửa Hàng Bán Lẻ** và **Website Quản Trị Hệ Thống (Admin Portal)** với phân quyền tài khoản đa cấp độ (RBAC).

---

## 🏗️ Kiến Trúc & Design Patterns Đã Áp Dụng

1. **Multi-Page Application Architecture (MPA)**:
   - **Trang Cửa Hàng Bán Lẻ**: Truy cập tại `/index.html`.
   - **Trang Quản Trị Hệ Thống (Admin Portal)**: Truy cập tại `/admin.html` với cơ chế đăng nhập và giao diện riêng biệt.
2. **Role-Based Access Control (RBAC) & Service Layer**:
   - `authService.ts`: Kiểm soát quyền truy cập chặt chẽ theo vai trò người dùng:
     - 👑 **Super Admin (`super_admin`)**: Toàn quyền hệ thống, quản lý và cấp tài khoản quản trị mới, xem/duyệt đơn, tùy chỉnh giao diện và quản lý kho hàng.
     - 🛒 **Admin Bán Hàng (`sales_admin`)**: Chỉ xem danh sách đơn hàng và cập nhật tiến độ xử lý/giao hàng.
     - 📦 **Admin Hàng Hóa (`inventory_admin`)**: Quản lý danh mục sản phẩm đa ngành hàng, thêm mới sản phẩm (giá niêm yết, giá khuyến mãi, thương hiệu, tồn kho) và sửa/xóa kho hàng.
     - 👤 **Khách Hàng (`customer`) / Khách vãng lai (`guest`)**: Đăng ký, đăng nhập theo dõi lịch sử đơn hàng hoặc mua hàng nhanh dạng guest.
3. **Repository Pattern (`src/repositories/index.ts`)**:
   - `IProductRepository`, `IOrderRepository`, `IUserRepository`, `IThemeRepository`: Trừu tượng hóa việc lưu trữ dữ liệu, an toàn khi chạy offline.
4. **Store Pattern với Svelte 5 Runes (`src/stores/store.svelte.ts` & `src/stores/themeStore.svelte.ts`)**:
   - Quản lý trạng thái bằng các primitive runes `$state`, `$derived`, `$effect`.

---

## 👥 Danh Sách Tài Khoản Mẫu Trải Nghiệm (Mật khẩu: `123`)

| Loại tài khoản | Tên đăng nhập | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `123` | Toàn quyền: Tạo/xóa tài khoản admin, duyệt đơn, CRUD sản phẩm, Tùy chỉnh Theme. |
| **Admin Bán Hàng** | `salesadmin` | `123` | Chỉ xem và cập nhật trạng thái đơn đặt hàng. |
| **Admin Hàng Hóa** | `khoadmin` | `123` | Chỉ quản lý kho hàng và đăng sản phẩm lên cửa hàng. |
| **Khách Hàng Mẫu** | `khachhang1` | `123` | Xem đơn cá nhân, lưu thông tin giao hàng khi đặt. |

---

## 🌟 Các Phân Hệ Ứng Dụng

### 1. Website Cửa Hàng (`/index.html`)
- **Trang Chủ**: Banner khuyến mãi, danh mục ngành hàng phổ biến (Điện tử, Thời trang, Gia dụng, Mỹ phẩm, Sách), sản phẩm bán chạy, cam kết dịch vụ (Chính hãng 100%, Giao 2H, Đổi trả 7 ngày).
- **Cửa Hàng**: Tìm kiếm tức thì theo tên/thương hiệu, bộ lọc theo danh mục ngành hàng.
- **Tài Khoản & Đơn Hàng Của Tôi**: Khách hàng có thể đăng ký tài khoản mới hoặc đăng nhập để theo dõi trạng thái đơn hàng.
- **Giỏ Hàng & Checkout**: Hỗ trợ đặt hàng khi đã đăng nhập hoặc đặt hàng dưới dạng **Khách vãng lai (Guest)**.

### 2. Website Quản Trị Hệ Thống (`/admin.html`)
- **Màn hình đăng nhập quản trị**: Xác thực bảo mật, chặn tài khoản khách hàng truy cập portal.
- **Quản lý đơn hàng**: Danh sách đơn khách đặt, lọc trạng thái *Chờ xác nhận, Đang xử lý, Đã giao, Đã hủy*.
- **Quản lý kho hàng & sản phẩm**: Thêm sản phẩm đa ngành (tên, giá gốc, giá khuyến mãi, thương hiệu, số lượng tồn kho, hình ảnh tải lên).
- **Quản trị phân quyền (Super Admin)**: Thêm mới tài khoản quản trị viên và phân bổ vai trò (`sales_admin`, `inventory_admin`, `super_admin`).
- **Live Theme Customizer Studio**: Tải file logo từ máy tính lên thay thế logo web, bật/tắt linh hoạt 7 vùng giao diện, đổi màu sắc và khẩu hiệu thương hiệu.

---

## 🚀 Khởi Chạy Nhanh (Offline & Online)

### Chạy Offline 1-Click trên Windows:
- Nhấp đúp chuột vào file **`start-offline.bat`**
- Truy cập Cửa hàng: `http://localhost:5174/index.html`
- Truy cập Admin: `http://localhost:5174/admin.html`

### Dòng lệnh Terminal:
```bash
# 1. Cài đặt thư viện
npm install

# 2. Build sản phẩm
npm run build

# 3. Khởi chạy máy chủ offline
npm run start:offline
```
