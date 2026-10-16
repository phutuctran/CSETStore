<script lang="ts">
  import type { User, Product, Order, Role } from './models/types';
  import { CATEGORIES, ROLE_LABELS } from './models/constants';
  import {
    LocalStorageProductRepository,
    LocalStorageOrderRepository,
    LocalStorageUserRepository
  } from './repositories';
  import { authService } from './services/authService';
  import { formatCurrency } from './services/pricingService';

  const productRepo = new LocalStorageProductRepository();
  const orderRepo = new LocalStorageOrderRepository();
  const userRepo = new LocalStorageUserRepository();

  // Session
  let currentAdmin = $state<User | null>(authService.getAdminSession());

  // Login form
  let loginUsername = $state('superadmin');
  let loginPassword = $state('123');
  let loginError = $state('');

  // Active navigation tab inside admin portal
  let activeTab = $state<'orders' | 'inventory' | 'users'>('orders');

  // Repositories state
  let products = $state<Product[]>(productRepo.getAll());
  let orders = $state<Order[]>(orderRepo.getAll());
  let users = $state<User[]>(userRepo.getAll());
  let toastMsg = $state<string | null>(null);

  // Auto pick initial tab according to role
  $effect(() => {
    if (currentAdmin) {
      if (currentAdmin.role === 'inventory_admin') {
        activeTab = 'inventory';
      } else {
        activeTab = 'orders';
      }
    }
  });

  function showToast(msg: string) {
    toastMsg = msg;
    setTimeout(() => {
      if (toastMsg === msg) toastMsg = null;
    }, 3000);
  }

  // Auth actions
  function handleLogin(e: Event) {
    e.preventDefault();
    loginError = '';
    const res = authService.loginAdmin(loginUsername.trim(), loginPassword);
    if (res.success && res.user) {
      currentAdmin = res.user;
      products = productRepo.getAll();
      orders = orderRepo.getAll();
      users = userRepo.getAll();
      showToast(`Chào mừng quản trị viên ${res.user.fullName}!`);
    } else {
      loginError = res.message || 'Đăng nhập thất bại!';
    }
  }

  function handleLogout() {
    authService.setAdminSession(null);
    currentAdmin = null;
  }

  // --- TAB: USERS MANAGEMENT (SUPER ADMIN ONLY) ---
  let newUserName = $state('');
  let newUserUsername = $state('');
  let newUserPass = $state('123');
  let newUserRole = $state<Role>('sales_admin');

  function handleCreateAdminUser(e: Event) {
    e.preventDefault();
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      alert('Chỉ Super Admin mới có quyền tạo thêm tài khoản quản trị!');
      return;
    }
    const exists = userRepo.getByUsername(newUserUsername);
    if (exists) {
      alert('Tên đăng nhập này đã tồn tại!');
      return;
    }
    userRepo.create({
      username: newUserUsername.trim(),
      password: newUserPass,
      fullName: newUserName.trim(),
      role: newUserRole
    });
    users = userRepo.getAll();
    showToast(`Đã cấp tài khoản quản trị "${newUserUsername}" thành công!`);
    newUserName = '';
    newUserUsername = '';
    newUserPass = '123';
  }

  function handleDeleteUser(id: string, name: string) {
    if (id === currentAdmin?.id) {
      alert('Không thể xóa tài khoản của chính bạn!');
      return;
    }
    if (confirm(`Bạn có chắc muốn xóa tài khoản "${name}"?`)) {
      userRepo.delete(id);
      users = userRepo.getAll();
      showToast(`Đã xóa tài khoản "${name}"`);
    }
  }

  // --- TAB: ORDERS MANAGEMENT (SUPER ADMIN & SALES ADMIN) ---
  function handleUpdateOrderStatus(orderId: string, status: Order['status']) {
    orderRepo.updateStatus(orderId, status);
    orders = orderRepo.getAll();
    showToast(`Đã đổi trạng thái đơn ${orderId} sang "${status}"`);
  }

  // --- TAB: INVENTORY MANAGEMENT (SUPER ADMIN & INVENTORY ADMIN) ---
  let pName = $state('');
  let pPrice = $state<number | null>(null);
  let pCategory = $state('anime');
  let pDesc = $state('');
  let pGrams = $state<number | null>(null);
  let pHours = $state<number | null>(null);
  let pImgBase64 = $state('');

  function handleProductImage(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        pImgBase64 = (evt.target?.result as string) || '';
      };
      reader.readAsDataURL(file);
    }
  }

  function handleCreateProduct(e: Event) {
    e.preventDefault();
    if (!pName.trim() || !pPrice) {
      alert('Vui lòng nhập tên và giá sản phẩm!');
      return;
    }
    const image = pImgBase64 || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80';
    productRepo.create({
      name: pName.trim(),
      price: pPrice,
      category: pCategory,
      image,
      description: pDesc.trim() || 'Sản phẩm in 3D chất lượng cao CSET Store.',
      grams: pGrams || undefined,
      printHours: pHours || undefined
    });
    products = productRepo.getAll();
    showToast(`Đã thêm sản phẩm "${pName}" vào danh mục hàng hóa!`);
    pName = '';
    pPrice = null;
    pDesc = '';
    pGrams = null;
    pHours = null;
    pImgBase64 = '';
  }

  function handleDeleteProduct(id: number, name: string) {
    if (confirm(`Xóa sản phẩm "${name}" khỏi kho cửa hàng?`)) {
      productRepo.delete(id);
      products = productRepo.getAll();
      showToast(`Đã xóa sản phẩm "${name}"`);
    }
  }

  function handleResetProducts() {
    if (confirm('Khôi phục danh sách sản phẩm ban đầu?')) {
      products = productRepo.resetToDefaults();
      showToast('Đã khôi phục dữ liệu hàng hóa mẫu!');
    }
  }
</script>

{#if !currentAdmin}
  <!-- LOGIN SCREEN -->
  <div class="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
    <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
      <div class="text-center space-y-2">
        <div class="w-14 h-14 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner">
          <i class="fa-solid fa-shield-halved"></i>
        </div>
        <h1 class="text-2xl font-black text-white tracking-wide">CSET STORE ADMIN</h1>
        <p class="text-xs text-slate-400">Hệ thống quản trị phân cấp & vận hành cửa hàng</p>
      </div>

      {#if loginError}
        <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
          <i class="fa-solid fa-triangle-exclamation shrink-0"></i>
          <span>{loginError}</span>
        </div>
      {/if}

      <form onsubmit={handleLogin} class="space-y-4">
        <div class="space-y-1.5">
          <label for="adm-login-u" class="text-xs font-bold text-slate-300 uppercase">Tài Khoản Quản Trị</label>
          <input
            id="adm-login-u"
            type="text"
            bind:value={loginUsername}
            required
            class="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div class="space-y-1.5">
          <label for="adm-login-p" class="text-xs font-bold text-slate-300 uppercase">Mật Khẩu</label>
          <input
            id="adm-login-p"
            type="password"
            bind:value={loginPassword}
            required
            class="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <button
          type="submit"
          class="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer transition shadow-lg text-sm mt-2"
        >
          Đăng Nhập Quản Trị
        </button>
      </form>

      <!-- Demo Accounts Hints -->
      <div class="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
        <p class="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Tài khoản mẫu thử nghiệm (Mật khẩu: 123):</p>
        <div class="grid grid-cols-1 gap-1.5 text-[11px]">
          <button
            type="button"
            onclick={() => { loginUsername = 'superadmin'; loginPassword = '123'; }}
            class="text-left p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 flex items-center justify-between cursor-pointer"
          >
            <span>👑 <strong>superadmin</strong> (Super Admin - Toàn quyền)</span>
            <span class="text-amber-400 font-bold">Chọn</span>
          </button>
          <button
            type="button"
            onclick={() => { loginUsername = 'salesadmin'; loginPassword = '123'; }}
            class="text-left p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 flex items-center justify-between cursor-pointer"
          >
            <span>🛒 <strong>salesadmin</strong> (Admin Bán Hàng - Quản lý đơn)</span>
            <span class="text-blue-400 font-bold">Chọn</span>
          </button>
          <button
            type="button"
            onclick={() => { loginUsername = 'khoadmin'; loginPassword = '123'; }}
            class="text-left p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 flex items-center justify-between cursor-pointer"
          >
            <span>📦 <strong>khoadmin</strong> (Admin Hàng Hóa - CRUD sản phẩm)</span>
            <span class="text-emerald-400 font-bold">Chọn</span>
          </button>
        </div>
      </div>

      <div class="text-center pt-2">
        <a href="./index.html" class="text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5">
          <i class="fa-solid fa-arrow-left"></i>
          <span>Trở về Website Cửa Hàng Bán Lẻ</span>
        </a>
      </div>
    </div>
  </div>
{:else}
  <!-- LOGGED-IN ADMIN PORTAL -->
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
    <!-- Topbar -->
    <header class="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <i class="fa-solid fa-cube text-white text-xl"></i>
            </div>
            <div>
              <span class="text-lg font-black tracking-wider text-white block">CSET STORE</span>
              <span class="block text-[10px] text-amber-500 font-bold tracking-widest uppercase">Admin Control Panel</span>
            </div>
          </div>

          <!-- Role-based navigation buttons -->
          <nav class="hidden md:flex space-x-1 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
            {#if authService.canManageOrders(currentAdmin.role)}
              <button
                type="button"
                onclick={() => activeTab = 'orders'}
                class="px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center {activeTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'}"
              >
                <i class="fa-solid fa-receipt mr-2"></i>
                Đơn Hàng ({orders.length})
              </button>
            {/if}

            {#if authService.canManageInventory(currentAdmin.role)}
              <button
                type="button"
                onclick={() => activeTab = 'inventory'}
                class="px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center {activeTab === 'inventory'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'}"
              >
                <i class="fa-solid fa-boxes-stacked mr-2"></i>
                Hàng Hóa / Sản Phẩm ({products.length})
              </button>
            {/if}

            {#if authService.canManageUsers(currentAdmin.role)}
              <button
                type="button"
                onclick={() => activeTab = 'users'}
                class="px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center {activeTab === 'users'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'}"
              >
                <i class="fa-solid fa-users-gear mr-2"></i>
                Quản Lý Tài Khoản ({users.length})
              </button>
            {/if}
          </nav>

          <!-- Current Admin Profile & Actions -->
          <div class="flex items-center space-x-4">
            <div class="text-right hidden sm:block">
              <span class="text-xs font-bold text-white block">{currentAdmin.fullName}</span>
              <span class="text-[10px] text-amber-400 font-semibold block uppercase">
                {ROLE_LABELS[currentAdmin.role]}
              </span>
            </div>

            <a
              href="./index.html"
              target="_blank"
              class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700 flex items-center gap-1.5"
              title="Xem cửa hàng khách hàng"
            >
              <i class="fa-solid fa-store"></i>
              <span class="hidden sm:inline">Xem Web Shop</span>
            </a>

            <button
              type="button"
              onclick={handleLogout}
              class="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition cursor-pointer"
              title="Đăng xuất"
            >
              <i class="fa-solid fa-arrow-right-from-bracket"></i>
            </button>
          </div>
        </div>

        <!-- Mobile Navigation bar -->
        <div class="md:hidden flex overflow-x-auto py-2 border-t border-slate-800 gap-2">
          {#if authService.canManageOrders(currentAdmin.role)}
            <button
              type="button"
              onclick={() => activeTab = 'orders'}
              class="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold {activeTab === 'orders' ? 'bg-blue-600 text-white' : 'text-slate-400'}"
            >
              Đơn hàng ({orders.length})
            </button>
          {/if}
          {#if authService.canManageInventory(currentAdmin.role)}
            <button
              type="button"
              onclick={() => activeTab = 'inventory'}
              class="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold {activeTab === 'inventory' ? 'bg-emerald-600 text-white' : 'text-slate-400'}"
            >
              Hàng hóa ({products.length})
            </button>
          {/if}
          {#if authService.canManageUsers(currentAdmin.role)}
            <button
              type="button"
              onclick={() => activeTab = 'users'}
              class="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold {activeTab === 'users' ? 'bg-amber-600 text-white' : 'text-slate-400'}"
            >
              Tài khoản ({users.length})
            </button>
          {/if}
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {#if activeTab === 'orders' && authService.canManageOrders(currentAdmin.role)}
        <!-- ORDERS MODULE (SUPER ADMIN & SALES ADMIN) -->
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h2 class="text-2xl font-black text-white flex items-center gap-2">
                <i class="fa-solid fa-receipt text-blue-400"></i>
                Quản Lý Đơn Đặt Hàng
              </h2>
              <p class="text-xs text-slate-400 mt-1">
                Quyền hạn: Admin Bán Hàng & Super Admin (Xem, xử lý và cập nhật tiến độ đơn in 3D).
              </p>
            </div>
            <span class="text-xs px-3 py-1.5 rounded-full bg-slate-800 text-blue-400 font-bold border border-slate-700">
              Tổng số đơn: {orders.length}
            </span>
          </div>

          {#if orders.length === 0}
            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <i class="fa-solid fa-file-invoice text-4xl text-slate-600"></i>
              <p class="text-slate-400 font-semibold">Chưa có đơn hàng nào từ khách hàng.</p>
            </div>
          {:else}
            <div class="space-y-4">
              {#each orders as ord (ord.id)}
                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div class="flex items-center gap-3">
                      <span class="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                        {ord.id}
                      </span>
                      <span class="text-xs text-slate-400">{ord.createdAt}</span>
                      {#if ord.customerId}
                        <span class="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                          Khách có tài khoản
                        </span>
                      {:else}
                        <span class="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 font-semibold">
                          Khách vãng lai (Guest)
                        </span>
                      {/if}
                    </div>

                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-slate-400">Trạng thái:</span>
                      <select
                        value={ord.status}
                        onchange={(e) => handleUpdateOrderStatus(ord.id, (e.target as HTMLSelectElement).value as any)}
                        class="text-xs font-bold rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="pending">Chờ xác nhận</option>
                        <option value="processing">Đang in / Xử lý</option>
                        <option value="completed">Đã giao hoàn tất</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </div>
                  </div>

                  <!-- Customer info -->
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                    <div>
                      <span class="text-slate-400 block font-semibold">Khách nhận:</span>
                      <strong class="text-white text-sm">{ord.customerName}</strong>
                    </div>
                    <div>
                      <span class="text-slate-400 block font-semibold">Số điện thoại:</span>
                      <strong class="text-white text-sm">{ord.phone}</strong>
                    </div>
                    <div>
                      <span class="text-slate-400 block font-semibold">Địa chỉ giao:</span>
                      <span class="text-slate-200">{ord.address}</span>
                    </div>
                  </div>

                  <!-- Items list -->
                  <div class="space-y-1.5">
                    {#each ord.items as item}
                      <div class="flex justify-between items-center text-xs bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                        <span class="text-slate-300">
                          {item.name} <strong class="text-white">x{item.quantity}</strong>
                        </span>
                        <span class="font-bold text-blue-400">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    {/each}
                  </div>

                  <div class="flex justify-end pt-2 text-sm font-black text-white border-t border-slate-800/80">
                    Tổng thanh toán: <span class="ml-2 text-blue-400 text-base">{formatCurrency(ord.totalAmount)}</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {:else if activeTab === 'inventory' && authService.canManageInventory(currentAdmin.role)}
        <!-- INVENTORY MODULE (SUPER ADMIN & INVENTORY ADMIN) -->
        <div class="space-y-8">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h2 class="text-2xl font-black text-white flex items-center gap-2">
                <i class="fa-solid fa-boxes-stacked text-emerald-400"></i>
                Quản Lý Kho Hàng & Sản Phẩm
              </h2>
              <p class="text-xs text-slate-400 mt-1">
                Quyền hạn: Admin Hàng Hóa & Super Admin (Thêm sản phẩm mới, xóa hoặc sửa kho hàng in 3D).
              </p>
            </div>
            <button
              type="button"
              onclick={handleResetProducts}
              class="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Khôi phục kho mẫu ban đầu
            </button>
          </div>

          <!-- Add Product Form -->
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            <h3 class="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <i class="fa-solid fa-plus-circle text-emerald-400"></i>
              Thêm Sản Phẩm Mới Vào Cửa Hàng
            </h3>

            <form onsubmit={handleCreateProduct} class="space-y-5">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="space-y-1.5">
                  <label for="inv-name" class="text-xs font-bold text-slate-300 uppercase">Tên Sản Phẩm *</label>
                  <input
                    id="inv-name"
                    type="text"
                    bind:value={pName}
                    required
                    placeholder="Mô hình Gundam, Chậu cây..."
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div class="space-y-1.5">
                  <label for="inv-price" class="text-xs font-bold text-slate-300 uppercase">Giá Bán (VNĐ) *</label>
                  <input
                    id="inv-price"
                    type="number"
                    bind:value={pPrice}
                    required
                    placeholder="250000"
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div class="space-y-1.5">
                  <label for="inv-cat" class="text-xs font-bold text-slate-300 uppercase">Danh Mục *</label>
                  <select
                    id="inv-cat"
                    bind:value={pCategory}
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {#each CATEGORIES.filter(c => c.key !== 'all') as c}
                      <option value={c.key}>{c.label}</option>
                    {/each}
                  </select>
                </div>

                <div class="space-y-1.5">
                  <label for="inv-img" class="text-xs font-bold text-slate-300 uppercase">Hình Ảnh (Tải lên)</label>
                  <input
                    id="inv-img"
                    type="file"
                    accept="image/*"
                    onchange={handleProductImage}
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-1.5 text-xs text-slate-300"
                  />
                </div>

                <div class="space-y-1.5">
                  <label for="inv-g" class="text-xs font-bold text-slate-300 uppercase">Khối Lượng Nhựa (gam)</label>
                  <input
                    id="inv-g"
                    type="number"
                    bind:value={pGrams}
                    placeholder="150"
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>

                <div class="space-y-1.5">
                  <label for="inv-h" class="text-xs font-bold text-slate-300 uppercase">Thời Gian In (giờ)</label>
                  <input
                    id="inv-h"
                    type="number"
                    step="0.1"
                    bind:value={pHours}
                    placeholder="12.5"
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div class="space-y-1.5">
                <label for="inv-desc" class="text-xs font-bold text-slate-300 uppercase">Mô Tả Sản Phẩm</label>
                <textarea
                  id="inv-desc"
                  bind:value={pDesc}
                  rows={2}
                  placeholder="Đặc tính sản phẩm..."
                  class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                ></textarea>
              </div>

              {#if pImgBase64}
                <div class="flex items-center gap-3 p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <img src={pImgBase64} alt="Preview" class="w-14 h-14 rounded-lg object-cover" />
                  <span class="text-xs text-emerald-400 font-semibold">Ảnh đã sẵn sàng tải lên</span>
                </div>
              {/if}

              <button
                type="submit"
                class="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition text-sm shadow-md"
              >
                Đăng Sản Phẩm Lên Cửa Hàng
              </button>
            </form>
          </div>

          <!-- Product Table -->
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
            <h3 class="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Danh Sách Hàng Hóa Trong Kho ({products.length})
            </h3>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-800 text-slate-200 uppercase text-[11px]">
                  <tr>
                    <th class="p-3 rounded-l-xl">Ảnh</th>
                    <th class="p-3">Tên Sản Phẩm</th>
                    <th class="p-3">Danh Mục</th>
                    <th class="p-3">Giá Bán</th>
                    <th class="p-3 rounded-r-xl text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/80">
                  {#each products as p (p.id)}
                    <tr class="hover:bg-slate-800/40">
                      <td class="p-3">
                        <img src={p.image} alt={p.name} class="w-10 h-10 rounded-lg object-cover border border-slate-700" />
                      </td>
                      <td class="p-3 font-bold text-white">{p.name}</td>
                      <td class="p-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                          {p.category}
                        </span>
                      </td>
                      <td class="p-3 font-bold text-emerald-400">{formatCurrency(p.price)}</td>
                      <td class="p-3 text-center">
                        <button
                          type="button"
                          onclick={() => handleDeleteProduct(p.id, p.name)}
                          class="px-2.5 py-1 text-red-400 hover:bg-red-500/10 rounded-lg font-semibold transition cursor-pointer"
                        >
                          <i class="fa-solid fa-trash mr-1"></i> Xóa
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      {:else if activeTab === 'users' && authService.canManageUsers(currentAdmin.role)}
        <!-- USERS MANAGEMENT MODULE (SUPER ADMIN ONLY) -->
        <div class="space-y-8">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h2 class="text-2xl font-black text-white flex items-center gap-2">
                <i class="fa-solid fa-users-gear text-amber-400"></i>
                Quản Lý Tài Khoản & Phân Quyền Hệ Thống
              </h2>
              <p class="text-xs text-slate-400 mt-1">
                Quyền hạn: <strong>Chỉ Super Admin</strong> (Tạo mới tài khoản quản trị, phân cấp vai trò và xóa tài khoản).
              </p>
            </div>
            <span class="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
              Tổng số tài khoản: {users.length}
            </span>
          </div>

          <!-- Create Admin Form -->
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            <h3 class="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <i class="fa-solid fa-user-plus text-amber-400"></i>
              Cấp Tài Khoản Quản Trị Viên Mới
            </h3>

            <form onsubmit={handleCreateAdminUser} class="space-y-5">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="space-y-1.5">
                  <label for="u-fullname" class="text-xs font-bold text-slate-300 uppercase">Họ và Tên Quản Trị Viên *</label>
                  <input
                    id="u-fullname"
                    type="text"
                    bind:value={newUserName}
                    required
                    placeholder="Ví dụ: Nguyễn Văn Quản Trị..."
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div class="space-y-1.5">
                  <label for="u-username" class="text-xs font-bold text-slate-300 uppercase">Tên Đăng Nhập (Username) *</label>
                  <input
                    id="u-username"
                    type="text"
                    bind:value={newUserUsername}
                    required
                    placeholder="admin_sales_01..."
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div class="space-y-1.5">
                  <label for="u-pass" class="text-xs font-bold text-slate-300 uppercase">Mật Khẩu Khởi Tạo *</label>
                  <input
                    id="u-pass"
                    type="password"
                    bind:value={newUserPass}
                    required
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div class="space-y-1.5">
                  <label for="u-role" class="text-xs font-bold text-slate-300 uppercase">Phân Quyền Vai Trò (Role) *</label>
                  <select
                    id="u-role"
                    bind:value={newUserRole}
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="sales_admin">🛒 Admin Bán Hàng (Chỉ xem & quản lý đơn hàng)</option>
                    <option value="inventory_admin">📦 Admin Hàng Hóa (Chỉ quản lý thêm/xóa sản phẩm)</option>
                    <option value="super_admin">👑 Super Admin (Toàn quyền hệ thống & quản lý tài khoản)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                class="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer transition text-sm shadow-md"
              >
                Tạo Tài Khoản Quản Trị
              </button>
            </form>
          </div>

          <!-- Users Table -->
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
            <h3 class="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Danh Sách Tài Khoản Trong Hệ Thống ({users.length})
            </h3>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-800 text-slate-200 uppercase text-[11px]">
                  <tr>
                    <th class="p-3 rounded-l-xl">Tên Đăng Nhập</th>
                    <th class="p-3">Họ và Tên</th>
                    <th class="p-3">Vai Trò (Role)</th>
                    <th class="p-3">Ngày Tạo</th>
                    <th class="p-3 rounded-r-xl text-center">Hành Động</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/80">
                  {#each users as u (u.id)}
                    <tr class="hover:bg-slate-800/40">
                      <td class="p-3 font-mono font-bold text-white">@{u.username}</td>
                      <td class="p-3 text-slate-200 font-semibold">{u.fullName}</td>
                      <td class="p-3">
                        {#if u.role === 'super_admin'}
                          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Super Admin
                          </span>
                        {:else if u.role === 'sales_admin'}
                          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Admin Bán Hàng
                          </span>
                        {:else if u.role === 'inventory_admin'}
                          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Admin Hàng Hóa
                          </span>
                        {:else}
                          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Khách Hàng
                          </span>
                        {/if}
                      </td>
                      <td class="p-3 text-slate-400">{u.createdAt}</td>
                      <td class="p-3 text-center">
                        {#if u.id !== currentAdmin.id}
                          <button
                            type="button"
                            onclick={() => handleDeleteUser(u.id, u.fullName)}
                            class="px-2.5 py-1 text-red-400 hover:bg-red-500/10 rounded-lg font-semibold transition cursor-pointer"
                          >
                            <i class="fa-solid fa-trash mr-1"></i> Xóa
                          </button>
                        {:else}
                          <span class="text-[10px] text-slate-500 italic">Đang đăng nhập</span>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      {/if}
    </main>

    <!-- Footer -->
    <footer class="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
      <p>© 2026 CSET Store - Hệ Thống Quản Trị Cửa Hàng In 3D (Đã phân cấp quyền hạn).</p>
    </footer>

    <!-- Toast Notification -->
    {#if toastMsg}
      <div class="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div class="bg-amber-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-amber-500 font-semibold text-xs">
          <i class="fa-solid fa-circle-check"></i>
          <span>{toastMsg}</span>
        </div>
      </div>
    {/if}
  </div>
{/if}
