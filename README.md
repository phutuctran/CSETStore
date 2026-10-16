# CSET Store - 3D Printing Studio Web Application

Ứng dụng web thương mại điện tử và dịch vụ in 3D theo yêu cầu xây dựng bằng **Svelte 5** (Runes Architecture), **Vite**, **Tailwind CSS v4** và **TypeScript**, kiến trúc đa trang (Multi-Page App) tách biệt hoàn toàn **Website Cửa Hàng** và **Website Quản Trị Hệ Thống (Admin Portal)** với phân quyền tài khoản đa cấp độ.

---

## 🏗️ Kiến Trúc & Design Patterns Đã Áp Dụng

1. **Multi-Page Application Architecture (MPA)**:
   - **Trang Cửa Hàng Bán Lẻ**: Truy cập tại `/index.html`.
   - **Trang Quản Trị Hệ Thống (Admin Portal)**: Truy cập tại `/admin.html` với cơ chế đăng nhập và giao diện riêng biệt.
2. **Role-Based Access Control (RBAC) & Service Layer**:
   - `authService.ts`: Kiểm soát quyền truy cập chặt chẽ theo vai trò người dùng:
     - 👑 **Super Admin (`super_admin`)**: Toàn quyền hệ thống, quản lý và cấp tài khoản quản trị mới, xem/duyệt đơn và quản lý kho hàng.
     - 🛒 **Admin Bán Hàng (`sales_admin`)**: Chỉ xem danh sách đơn hàng và cập nhật tiến độ in/giao hàng.
     - 📦 **Admin Hàng Hóa (`inventory_admin`)**: Chỉ quản lý danh mục sản phẩm, thêm mới sản phẩm và sửa/xóa kho hàng.
     - 👤 **Khách Hàng (`customer`) / Khách vãng lai (`guest`)**: Đăng ký, đăng nhập theo dõi lịch sử đơn hàng hoặc mua hàng nhanh dạng guest.
3. **Repository Pattern (`src/repositories/index.ts`)**:
   - `IProductRepository`, `IOrderRepository`, `IUserRepository`: Trừu tượng hóa việc lưu trữ dữ liệu, an toàn khi chạy offline.
4. **Store Pattern với Svelte 5 Runes (`src/stores/store.svelte.ts`)**:
   - Quản lý trạng thái bằng các primitive runes `$state`, `$derived`, `$effect`.

---

## 👥 Danh Sách Tài Khoản Mẫu Trải Nghiệm (Mật khẩu: `123`)

| Loại tài khoản | Tên đăng nhập | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `123` | Toàn quyền: Tạo/xóa tài khoản admin, duyệt đơn, CRUD sản phẩm. |
| **Admin Bán Hàng** | `salesadmin` | `123` | Chỉ xem và cập nhật trạng thái đơn đặt hàng. |
| **Admin Hàng Hóa** | `khoadmin` | `123` | Chỉ quản lý và đăng sản phẩm lên cửa hàng. |
| **Khách Hàng Mẫu** | `khachhang1` | `123` | Xem đơn cá nhân, lưu thông tin giao hàng khi đặt. |

---

## 🌟 Các Phân Hệ Ứng Dụng

### 1. Website Cửa Hàng (`/index.html`)
- **Trang Chủ**: Khám phá dịch vụ in 3D Bambu Lab A1 Combo, sản phẩm nổi bật, báo giá 1.500đ/gam.
- **Cửa Hàng**: Tìm kiếm, lọc theo danh mục mô hình anime, decor chậu cây, phụ kiện công nghệ.
- **Đặt In Theo Yêu Cầu**: Kéo thả file `.stl`, `.3mf`, `.obj`, `.step` tính khối lượng nhựa và thời gian in tự động.
- **Tài Khoản & Đơn Hàng Của Tôi**: Khách hàng có thể đăng ký tài khoản mới hoặc đăng nhập để xem các đơn hàng in 3D của riêng mình.
- **Giỏ Hàng & Checkout**: Hỗ trợ đặt hàng khi đã đăng nhập hoặc đặt hàng dưới dạng **Khách vãng lai (Guest)**.

### 2. Website Quản Trị Hệ Thống (`/admin.html`)
- **Màn hình đăng nhập quản trị**: Xác thực bảo mật, chặn tài khoản khách hàng truy cập portal.
- **Quản lý đơn hàng**: Danh sách đơn khách đặt, lọc trạng thái *Chờ xác nhận, Đang in / Xử lý, Đã hoàn tất, Đã hủy*.
- **Quản lý kho hàng & sản phẩm**: Thêm sản phẩm kèm ảnh upload, mô tả, thông số khối lượng gram, thời gian in.
- **Quản trị phân quyền (Super Admin)**: Thêm mới tài khoản quản trị viên và phân bổ vai trò (`sales_admin`, `inventory_admin`, `super_admin`).

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
