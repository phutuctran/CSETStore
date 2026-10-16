<script lang="ts">
  import type { User, Product, Order, Role, ThemeConfig } from './models/types';
  import { CATEGORIES, ROLE_LABELS, DEFAULT_THEME_CONFIG } from './models/constants';
  import {
    LocalStorageProductRepository,
    LocalStorageOrderRepository,
    LocalStorageUserRepository,
    LocalStorageThemeRepository
  } from './repositories';
  import { authService } from './services/authService';
  import { formatCurrency } from './services/pricingService';

  const productRepo = new LocalStorageProductRepository();
  const orderRepo = new LocalStorageOrderRepository();
  const userRepo = new LocalStorageUserRepository();
  const themeRepo = new LocalStorageThemeRepository();

  // Session
  let currentAdmin = $state<User | null>(authService.getAdminSession());

  // Login form
  let loginUsername = $state('superadmin');
  let loginPassword = $state('123');
  let loginError = $state('');

  // Active navigation tab inside admin portal
  let activeTab = $state<'orders' | 'inventory' | 'theme' | 'users'>('orders');

  // Theme Customizer State
  let themeDraft = $state<ThemeConfig>(themeRepo.getTheme());

  // Repositories state
  let products = $state<Product[]>(productRepo.getAll());
  let orders = $state<Order[]>(orderRepo.getAll());
  let users = $state<User[]>(userRepo.getAll());
  let toastMsg = $state<string | null>(null);

  // Pick initial tab once on login
  let initializedAdminRole = $state<string | null>(null);
  $effect(() => {
    if (currentAdmin && initializedAdminRole !== currentAdmin.role) {
      initializedAdminRole = currentAdmin.role;
      if (currentAdmin.role === 'inventory_admin') {
        activeTab = 'inventory';
      } else {
        activeTab = 'orders';
      }
      themeDraft = themeRepo.getTheme();
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
      themeDraft = themeRepo.getTheme();
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
  let userTabMode = $state<'admin' | 'customer'>('admin');
  let editingUser = $state<User | null>(null);
  let editFullName = $state('');
  let editPhone = $state('');
  let editAddress = $state('');
  let editRole = $state<Role>('sales_admin');
  let editPassword = $state('');

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
  function handleSelectEditUser(u: User) {
    editingUser = u;
    editFullName = u.fullName;
    editPhone = u.phone || '';
    editAddress = u.address || '';
    editRole = u.role;
    editPassword = u.password || '';
  }

  function handleSaveEditUser(e: Event) {
    e.preventDefault();
    if (!editingUser) return;
    userRepo.update(editingUser.id, {
      fullName: editFullName.trim(),
      phone: editPhone.trim(),
      address: editAddress.trim(),
      role: editRole,
      password: editPassword || editingUser.password
    });
    users = userRepo.getAll();
    showToast(`Đã cập nhật thông tin tài khoản "${editingUser.username}" thành công!`);
    editingUser = null;
  }

  function handleDeleteUser(id: string, name: string) {
    if (id === currentAdmin?.id) {
      alert('Không thể xóa tài khoản của chính bạn!');
      return;
    }
    if (confirm(`Bạn có chắc muốn xóa tài khoản "${name}"?`)) {
      userRepo.delete(id);
      users = userRepo.getAll();
      if (editingUser?.id === id) editingUser = null;
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
  let pOrigPrice = $state<number | null>(null);
  let pCategory = $state('electronics');
  let pBrand = $state('');
  let pStock = $state<number | null>(50);
  let pDesc = $state('');
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
    const image = pImgBase64 || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
    productRepo.create({
      name: pName.trim(),
      price: pPrice,
      originalPrice: pOrigPrice || undefined,
      category: pCategory,
      brand: pBrand.trim() || undefined,
      stock: pStock || 50,
      image,
      description: pDesc.trim() || 'Sản phẩm chính hãng chất lượng cao tại CSET Store.'
    });
    products = productRepo.getAll();
    showToast(`Đã thêm sản phẩm "${pName}" vào danh mục hàng hóa!`);
    pName = '';
    pPrice = null;
    pOrigPrice = null;
    pBrand = '';
    pStock = 50;
    pDesc = '';
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

  // --- TAB: THEME CUSTOMIZER (SUPER ADMIN ONLY) ---
  function handleLogoUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        themeDraft.logoImage = (evt.target?.result as string) || '';
      };
      reader.readAsDataURL(file);
    }
  }

  function handleHeroImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        themeDraft.heroImage = (evt.target?.result as string) || themeDraft.heroImage;
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSaveTheme(e: Event) {
    e.preventDefault();
    themeRepo.saveTheme(themeDraft);
    showToast('Đã lưu và áp dụng giao diện mới cho toàn bộ Website Cửa Hàng!');
  }

  function handleAddTrustBadge() {
    const newId = 'tb-' + Date.now();
    themeDraft.trustBadges = [
      ...themeDraft.trustBadges,
      { id: newId, icon: 'fa-circle-check', title: 'Cam Kết Mới', subtitle: 'Mô tả cam kết ngắn gọn' }
    ];
  }

  function handleRemoveTrustBadge(id: string) {
    themeDraft.trustBadges = themeDraft.trustBadges.filter(b => b.id !== id);
  }

  function handleTrustBadgeImageUpload(e: Event, badgeId: string) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const target = themeDraft.trustBadges.find(b => b.id === badgeId);
        if (target) {
          target.customIconImage = (evt.target?.result as string) || '';
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function handleAddValueProp() {
    const newId = 'vp-' + Date.now();
    themeDraft.valueProps = [
      ...themeDraft.valueProps,
      { id: newId, icon: 'fa-star', title: 'Lợi Ích Mới', description: 'Mô tả chi tiết quyền lợi khách hàng nhận được khi mua sắm tại cửa hàng.' }
    ];
  }

  function handleRemoveValueProp(id: string) {
    themeDraft.valueProps = themeDraft.valueProps.filter(v => v.id !== id);
  }

  function handleValuePropImageUpload(e: Event, propId: string) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const target = themeDraft.valueProps.find(v => v.id === propId);
        if (target) {
          target.customIconImage = (evt.target?.result as string) || '';
        }
      };
      reader.readAsDataURL(file);
    }
  }


  function handleResetTheme() {
    if (confirm('Khôi phục cấu hình giao diện mặc định ban đầu của CSET Store?')) {
      themeDraft = themeRepo.resetTheme();
      showToast('Đã khôi phục giao diện mặc định!');
    }
  }
</script>

{#if !currentAdmin}
  <!-- LIGHT MINIMALIST LOGIN SCREEN -->
  <div class="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 text-slate-800">
    <div class="w-full max-w-md bg-white border border-slate-300 rounded-xl p-8 shadow-sm space-y-6">
      <div class="text-center space-y-1">
        <h1 class="text-xl font-bold text-slate-900 tracking-tight">HỆ THỐNG QUẢN TRỊ</h1>
        <p class="text-xs text-slate-500">Đăng nhập tài khoản để quản lý cửa hàng</p>
      </div>

      {#if loginError}
        <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold">
          {loginError}
        </div>
      {/if}

      <form onsubmit={handleLogin} class="space-y-4">
        <div class="space-y-1">
          <label for="adm-login-u" class="text-xs font-semibold text-slate-700">Tên đăng nhập</label>
          <input
            id="adm-login-u"
            type="text"
            bind:value={loginUsername}
            required
            class="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-800"
          />
        </div>

        <div class="space-y-1">
          <label for="adm-login-p" class="text-xs font-semibold text-slate-700">Mật khẩu</label>
          <input
            id="adm-login-p"
            type="password"
            bind:value={loginPassword}
            required
            class="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-800"
          />
        </div>

        <button
          type="submit"
          class="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer transition text-sm"
        >
          Đăng Nhập
        </button>
      </form>

      <!-- Demo Accounts Hints (Clean Light Border) -->
      <div class="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-2">
        <p class="font-semibold text-slate-700 text-[11px]">Tài khoản mẫu (Mật khẩu: 123):</p>
        <div class="space-y-1 text-[11px]">
          <button
            type="button"
            onclick={() => { loginUsername = 'superadmin'; loginPassword = '123'; }}
            class="w-full text-left p-2 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
          >
            <span><strong>superadmin</strong> - Super Admin</span>
            <span class="text-blue-600 font-semibold">Chọn</span>
          </button>
          <button
            type="button"
            onclick={() => { loginUsername = 'salesadmin'; loginPassword = '123'; }}
            class="w-full text-left p-2 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
          >
            <span><strong>salesadmin</strong> - Admin Bán Hàng</span>
            <span class="text-blue-600 font-semibold">Chọn</span>
          </button>
          <button
            type="button"
            onclick={() => { loginUsername = 'khoadmin'; loginPassword = '123'; }}
            class="w-full text-left p-2 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
          >
            <span><strong>khoadmin</strong> - Admin Hàng Hóa</span>
            <span class="text-blue-600 font-semibold">Chọn</span>
          </button>
        </div>
      </div>

      <div class="text-center pt-1">
        <a href="./index.html" class="text-xs text-slate-500 hover:text-slate-800 underline">
          &larr; Trở về Website Cửa Hàng
        </a>
      </div>
    </div>
  </div>
{:else}
  <!-- LIGHT MINIMALIST LOGGED-IN ADMIN PORTAL -->
  <div class="min-h-screen bg-slate-100 text-slate-800 flex flex-col justify-between">
    <!-- Clean Minimalist Header -->
    <header class="bg-white border-b border-slate-300 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-3">
            <span class="text-base font-bold text-slate-900 tracking-tight">CSET STORE</span>
            <span class="text-xs text-slate-400 font-mono">/</span>
            <span class="text-xs text-slate-600 font-medium">Quản trị</span>
          </div>

          <!-- Navigation Links (Clean Understated Style) -->
          <nav class="hidden md:flex space-x-1">
            {#if authService.canManageOrders(currentAdmin.role)}
              <button
                type="button"
                onclick={() => activeTab = 'orders'}
                class="px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer {activeTab === 'orders'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'}"
              >
                Đơn Hàng ({orders.length})
              </button>
            {/if}

            {#if authService.canManageInventory(currentAdmin.role)}
              <button
                type="button"
                onclick={() => activeTab = 'inventory'}
                class="px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer {activeTab === 'inventory'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'}"
              >
                Hàng Hóa ({products.length})
              </button>
            {/if}

            {#if authService.canManageUsers(currentAdmin.role)}
              <button
                type="button"
                onclick={() => activeTab = 'theme'}
                class="px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer {activeTab === 'theme'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'}"
              >
                Tùy Chỉnh Giao Diện
              </button>

              <button
                type="button"
                onclick={() => activeTab = 'users'}
                class="px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer {activeTab === 'users'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'}"
              >
                Tài Khoản ({users.length})
              </button>
            {/if}
          </nav>

          <!-- Current Admin Profile & Actions -->
          <div class="flex items-center space-x-3 text-xs">
            <div class="text-right hidden sm:block">
              <span class="font-bold text-slate-900 block">{currentAdmin.fullName}</span>
              <span class="text-[10px] text-slate-500 block uppercase font-medium">
                {ROLE_LABELS[currentAdmin.role]}
              </span>
            </div>

            <a
              href="./index.html"
              target="_blank"
              class="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition"
            >
              Xem Web Shop
            </a>

            <button
              type="button"
              onclick={handleLogout}
              class="px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 font-medium transition cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        <!-- Mobile Nav row -->
        <div class="md:hidden flex overflow-x-auto py-2 border-t border-slate-200 gap-1">
          {#if authService.canManageOrders(currentAdmin.role)}
            <button
              type="button"
              onclick={() => activeTab = 'orders'}
              class="px-3 py-1 rounded text-xs font-semibold {activeTab === 'orders' ? 'bg-slate-900 text-white' : 'text-slate-600'}"
            >
              Đơn hàng ({orders.length})
            </button>
          {/if}
          {#if authService.canManageInventory(currentAdmin.role)}
            <button
              type="button"
              onclick={() => activeTab = 'inventory'}
              class="px-3 py-1 rounded text-xs font-semibold {activeTab === 'inventory' ? 'bg-slate-900 text-white' : 'text-slate-600'}"
            >
              Hàng hóa ({products.length})
            </button>
          {/if}
          {#if authService.canManageUsers(currentAdmin.role)}
            <button
              type="button"
              onclick={() => activeTab = 'theme'}
              class="px-3 py-1 rounded text-xs font-semibold {activeTab === 'theme' ? 'bg-slate-900 text-white' : 'text-slate-600'}"
            >
              Giao diện
            </button>
            <button
              type="button"
              onclick={() => activeTab = 'users'}
              class="px-3 py-1 rounded text-xs font-semibold {activeTab === 'users' ? 'bg-slate-900 text-white' : 'text-slate-600'}"
            >
              Tài khoản ({users.length})
            </button>
          {/if}
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {#if activeTab === 'orders' && authService.canManageOrders(currentAdmin.role)}
        <!-- ORDERS MODULE (LIGHT MINIMALIST) -->
        <div class="space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-300">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Danh Sách Đơn Hàng</h2>
              <p class="text-xs text-slate-500">Xem và cập nhật trạng thái đơn hàng của khách</p>
            </div>
            <span class="text-xs text-slate-600 font-semibold">Tổng: {orders.length} đơn</span>
          </div>

          {#if orders.length === 0}
            <div class="bg-white border border-slate-300 rounded-lg p-10 text-center text-slate-500 text-sm">
              Chưa có đơn hàng nào phát sinh.
            </div>
          {:else}
            <div class="space-y-3">
              {#each orders as ord (ord.id)}
                <div class="bg-white border border-slate-300 rounded-lg p-4 space-y-3 text-sm">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-slate-900">{ord.id}</span>
                      <span class="text-xs text-slate-400">({ord.createdAt})</span>
                      {#if ord.customerId}
                        <span class="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          Khách thành viên
                        </span>
                      {:else}
                        <span class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                          Khách vãng lai (Guest)
                        </span>
                      {/if}
                    </div>

                    <div class="flex items-center gap-2 text-xs">
                      <span class="text-slate-600 font-medium">Trạng thái:</span>
                      <select
                        value={ord.status}
                        onchange={(e) => handleUpdateOrderStatus(ord.id, (e.target as HTMLSelectElement).value as any)}
                        class="text-xs font-semibold rounded border border-slate-300 bg-white px-2.5 py-1 text-slate-900 focus:outline-none"
                      >
                        <option value="pending">Chờ xác nhận</option>
                        <option value="processing">Đang xử lý / Đóng gói</option>
                        <option value="completed">Đã giao hoàn tất</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                    <div><strong>Người nhận:</strong> {ord.customerName}</div>
                    <div><strong>Số điện thoại:</strong> {ord.phone}</div>
                    <div><strong>Địa chỉ:</strong> {ord.address}</div>
                  </div>

                  <div class="space-y-1 text-xs">
                    {#each ord.items as item}
                      <div class="flex justify-between py-1 border-b border-slate-100 last:border-none">
                        <span>{item.name} <strong>x{item.quantity}</strong></span>
                        <span class="font-semibold text-slate-800">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    {/each}
                  </div>

                  <div class="flex justify-end pt-1 text-xs font-bold text-slate-900">
                    Tổng tiền: <span class="ml-2 text-sm text-blue-900">{formatCurrency(ord.totalAmount)}</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {:else if activeTab === 'inventory' && authService.canManageInventory(currentAdmin.role)}
        <!-- INVENTORY MODULE (LIGHT MINIMALIST) -->
        <div class="space-y-6">
          <div class="flex items-center justify-between pb-3 border-b border-slate-300">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Quản Lý Hàng Hóa & Kho</h2>
              <p class="text-xs text-slate-500">Thêm sản phẩm mới và quản lý kho hàng</p>
            </div>
            <button
              type="button"
              onclick={handleResetProducts}
              class="text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer"
            >
              Khôi phục dữ liệu mẫu
            </button>
          </div>

          <!-- Add Product Form Card -->
          <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
            <h3 class="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
              Thêm Sản Phẩm Mới
            </h3>

            <form onsubmit={handleCreateProduct} class="space-y-4 text-xs">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="space-y-1">
                  <label for="inv-name" class="font-semibold text-slate-700">Tên sản phẩm *</label>
                  <input
                    id="inv-name"
                    type="text"
                    bind:value={pName}
                    required
                    placeholder="Tên sản phẩm..."
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div class="space-y-1">
                  <label for="inv-cat" class="font-semibold text-slate-700">Ngành hàng *</label>
                  <select
                    id="inv-cat"
                    bind:value={pCategory}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  >
                    {#each CATEGORIES.filter(c => c.key !== 'all') as c}
                      <option value={c.key}>{c.label}</option>
                    {/each}
                  </select>
                </div>

                <div class="space-y-1">
                  <label for="inv-brand" class="font-semibold text-slate-700">Thương hiệu</label>
                  <input
                    id="inv-brand"
                    type="text"
                    bind:value={pBrand}
                    placeholder="Sony, Apple..."
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="inv-price" class="font-semibold text-slate-700">Giá bán (VNĐ) *</label>
                  <input
                    id="inv-price"
                    type="number"
                    bind:value={pPrice}
                    required
                    placeholder="450000"
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="inv-orig-price" class="font-semibold text-slate-700">Giá gốc niêm yết (VNĐ)</label>
                  <input
                    id="inv-orig-price"
                    type="number"
                    bind:value={pOrigPrice}
                    placeholder="600000"
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="inv-stock" class="font-semibold text-slate-700">Số lượng tồn kho</label>
                  <input
                    id="inv-stock"
                    type="number"
                    bind:value={pStock}
                    placeholder="50"
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1 md:col-span-3">
                  <label for="inv-img" class="font-semibold text-slate-700">Hình ảnh sản phẩm</label>
                  <input
                    id="inv-img"
                    type="file"
                    accept="image/*"
                    onchange={handleProductImage}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-600"
                  />
                </div>

                <div class="space-y-1 md:col-span-3">
                  <label for="inv-desc" class="font-semibold text-slate-700">Mô tả sản phẩm</label>
                  <textarea
                    id="inv-desc"
                    bind:value={pDesc}
                    rows={2}
                    placeholder="Mô tả thông tin sản phẩm..."
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  ></textarea>
                </div>
              </div>

              {#if pImgBase64}
                <div class="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded">
                  <img src={pImgBase64} alt="Preview" class="w-10 h-10 object-cover rounded" />
                  <span class="text-xs text-slate-600">Đã chọn ảnh</span>
                </div>
              {/if}

              <button
                type="submit"
                class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs cursor-pointer"
              >
                Lưu Sản Phẩm
              </button>
            </form>
          </div>

          <!-- Product Table Card -->
          <div class="bg-white border border-slate-300 rounded-lg p-4 space-y-3">
            <h3 class="text-sm font-bold text-slate-900">Danh Sách Sản Phẩm Trong Kho ({products.length})</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-700">
                <thead class="bg-slate-100 border-b border-slate-200 text-slate-800 font-semibold uppercase text-[11px]">
                  <tr>
                    <th class="p-2.5">Ảnh</th>
                    <th class="p-2.5">Tên Sản Phẩm</th>
                    <th class="p-2.5">Ngành Hàng</th>
                    <th class="p-2.5">Giá Bán</th>
                    <th class="p-2.5">Tồn Kho</th>
                    <th class="p-2.5 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  {#each products as p (p.id)}
                    <tr class="hover:bg-slate-50">
                      <td class="p-2.5">
                        <img src={p.image} alt={p.name} class="w-10 h-10 rounded object-cover border border-slate-200" />
                      </td>
                      <td class="p-2.5 font-semibold text-slate-900">{p.name}</td>
                      <td class="p-2.5 capitalize">{p.category}</td>
                      <td class="p-2.5 font-bold text-slate-900">{formatCurrency(p.price)}</td>
                      <td class="p-2.5">{p.stock ?? 50}</td>
                      <td class="p-2.5 text-center">
                        <button
                          type="button"
                          onclick={() => handleDeleteProduct(p.id, p.name)}
                          class="text-red-600 hover:underline cursor-pointer font-medium"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      {:else if activeTab === 'theme' && authService.canManageUsers(currentAdmin.role)}
        <!-- THEME CUSTOMIZER (LIGHT MINIMALIST & DEEP BLOCKS CONFIGURATION) -->
        <div class="space-y-6">
          <div class="flex items-center justify-between pb-3 border-b border-slate-300">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Tùy Chỉnh Giao Diện Web Bán Hàng</h2>
              <p class="text-xs text-slate-500">Quản lý nhận diện, bật/tắt và tùy chỉnh sâu nội dung các khối</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick={handleResetTheme}
                class="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded text-xs text-slate-700 font-medium cursor-pointer"
              >
                Đặt Lại Mặc Định
              </button>
              <a
                href="./index.html"
                target="_blank"
                class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold"
              >
                Xem Web Shop &rarr;
              </a>
            </div>
          </div>

          <form onsubmit={handleSaveTheme} class="space-y-6">
            <!-- 1. BRANDING & LOGO UPLOAD -->
            <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
              <h3 class="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                1. Thương Hiệu & Logo
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div class="space-y-1">
                  <label for="thm-name" class="font-semibold text-slate-700">Tên Cửa Hàng</label>
                  <input
                    id="thm-name"
                    type="text"
                    bind:value={themeDraft.storeName}
                    required
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="thm-tagline" class="font-semibold text-slate-700">Slogan</label>
                  <input
                    id="thm-tagline"
                    type="text"
                    bind:value={themeDraft.storeTagline}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="thm-color-primary" class="font-semibold text-slate-700">Màu Chủ Đạo</label>
                  <div class="flex items-center gap-2">
                    <input
                      id="thm-color-primary"
                      type="color"
                      bind:value={themeDraft.primaryColor}
                      class="w-10 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      bind:value={themeDraft.primaryColor}
                      class="flex-grow border border-slate-300 rounded px-2.5 py-1 text-xs font-mono"
                    />
                  </div>
                </div>

                <div class="space-y-1 sm:col-span-3 bg-slate-50 p-3.5 rounded border border-slate-200">
                  <label for="thm-logo-file" class="font-semibold text-slate-700 flex justify-between items-center">
                    <span>Tải Lên File Logo (PNG, SVG, JPG)</span>
                    {#if themeDraft.logoImage}
                      <button
                        type="button"
                        onclick={() => themeDraft.logoImage = ''}
                        class="text-red-600 hover:underline cursor-pointer font-normal text-[11px]"
                      >
                        Xóa file ảnh, dùng icon
                      </button>
                    {/if}
                  </label>
                  <div class="flex items-center gap-3 mt-1.5">
                    {#if themeDraft.logoImage}
                      <div class="w-12 h-12 bg-white border border-slate-300 rounded p-1 shrink-0 flex items-center justify-center">
                        <img src={themeDraft.logoImage} alt="Logo" class="w-full h-full object-contain" />
                      </div>
                    {:else}
                      <div class="w-12 h-12 bg-slate-900 text-white rounded flex items-center justify-center text-lg shrink-0">
                        <i class="fa-solid {themeDraft.logoIcon}"></i>
                      </div>
                    {/if}
                    <input
                      id="thm-logo-file"
                      type="file"
                      accept="image/*"
                      onchange={handleLogoUpload}
                      class="flex-grow border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-600 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. VISIBILITY TOGGLES -->
            <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
              <h3 class="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                2. Bật / Tắt Các Vùng Hiển Thị
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label class="flex items-center justify-between p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span class="font-semibold text-slate-900 block">Khối Banner Hero</span>
                    <span class="text-[11px] text-slate-500 block">Tiêu đề, khẩu hiệu và nút bấm lớn</span>
                  </div>
                  <input type="checkbox" bind:checked={themeDraft.visibility.showHeroSection} class="w-4 h-4 cursor-pointer" />
                </label>

                <label class="flex items-center justify-between p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span class="font-semibold text-slate-900 block">Huy Hiệu Khuyến Mãi</span>
                    <span class="text-[11px] text-slate-500 block">Thông báo ưu đãi trên đầu banner</span>
                  </div>
                  <input type="checkbox" bind:checked={themeDraft.visibility.showPromoBadge} class="w-4 h-4 cursor-pointer" />
                </label>

                <label class="flex items-center justify-between p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span class="font-semibold text-slate-900 block">Ảnh Minh Họa Hero</span>
                    <span class="text-[11px] text-slate-500 block">Ảnh sản phẩm nổi bật bên phải banner</span>
                  </div>
                  <input type="checkbox" bind:checked={themeDraft.visibility.showHeroImage} class="w-4 h-4 cursor-pointer" />
                </label>

                <label class="flex items-center justify-between p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span class="font-semibold text-slate-900 block">Cam Kết Dịch Vụ</span>
                    <span class="text-[11px] text-slate-500 block">Các khối cam kết dịch vụ dưới banner</span>
                  </div>
                  <input type="checkbox" bind:checked={themeDraft.visibility.showTrustBadges} class="w-4 h-4 cursor-pointer" />
                </label>

                <label class="flex items-center justify-between p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span class="font-semibold text-slate-900 block">Sản Phẩm Bán Chạy / Nổi Bật</span>
                    <span class="text-[11px] text-slate-500 block">Lưới sản phẩm nổi bật trang chủ</span>
                  </div>
                  <input type="checkbox" bind:checked={themeDraft.visibility.showFeaturedProducts} class="w-4 h-4 cursor-pointer" />
                </label>

                <label class="flex items-center justify-between p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span class="font-semibold text-slate-900 block">Khối Giá Trị & Lợi Ích</span>
                    <span class="text-[11px] text-slate-500 block">Các khối giới thiệu quyền lợi mua sắm</span>
                  </div>
                  <input type="checkbox" bind:checked={themeDraft.visibility.showValueProps} class="w-4 h-4 cursor-pointer" />
                </label>

                <label class="flex items-center justify-between p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer sm:col-span-2">
                  <div>
                    <span class="font-semibold text-slate-900 block">Thông Tin Liên Hệ Chân Trang (Footer)</span>
                    <span class="text-[11px] text-slate-500 block">Hotline, email và địa chỉ ở cuối trang</span>
                  </div>
                  <input type="checkbox" bind:checked={themeDraft.visibility.showFooterContact} class="w-4 h-4 cursor-pointer" />
                </label>
              </div>
            </div>

            <!-- 3. DEEP CUSTOMIZATION: CAM KẾT DỊCH VỤ (TRUST BADGES) -->
            <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
              <div class="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h3 class="text-sm font-bold text-slate-900">
                    3. Tùy Chỉnh Khối: Cam Kết Dịch Vụ
                  </h3>
                  <p class="text-xs text-slate-500">Tùy chỉnh số lượng khối, đổi icon, tiêu đề và nội dung cam kết</p>
                </div>
                <button
                  type="button"
                  onclick={handleAddTrustBadge}
                  class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-xs font-semibold cursor-pointer"
                >
                  + Thêm Khối Cam Kết
                </button>
              </div>

              {#if !themeDraft.trustBadges || themeDraft.trustBadges.length === 0}
                <p class="text-xs text-slate-400 italic">Chưa có khối cam kết nào. Bấm nút phía trên để thêm.</p>
              {:else}
                <div class="space-y-3">
                  {#each themeDraft.trustBadges as tb, idx (tb.id)}
                    <div class="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-2 text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-semibold text-slate-800">Khối #{idx + 1}</span>
                        <button
                          type="button"
                          onclick={() => handleRemoveTrustBadge(tb.id)}
                          class="text-red-600 hover:underline cursor-pointer text-[11px]"
                        >
                          Xóa khối này
                        </button>
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div>
                          <label for="tb-icon-{tb.id}" class="text-[11px] text-slate-600 block mb-0.5">Icon FontAwesome</label>
                          <input
                            id="tb-icon-{tb.id}"
                            type="text"
                            bind:value={tb.icon}
                            placeholder="fa-shield-check..."
                            class="w-full border border-slate-300 rounded px-2.5 py-1 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label for="tb-img-{tb.id}" class="text-[11px] text-slate-600 block mb-0.5">Hoặc Tải Ảnh Logo Icon</label>
                          <input
                            id="tb-img-{tb.id}"
                            type="file"
                            accept="image/*"
                            onchange={(e) => handleTrustBadgeImageUpload(e, tb.id)}
                            class="w-full border border-slate-300 rounded px-2 py-0.5 text-[10px] bg-white"
                          />
                          {#if tb.customIconImage}
                            <span class="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                              ✓ Đã có ảnh logo riêng
                              <button
                                type="button"
                                onclick={() => tb.customIconImage = ''}
                                class="text-red-600 underline ml-1 cursor-pointer font-normal"
                              >(Xóa ảnh)</button>
                            </span>
                          {/if}
                        </div>
                        <div>
                          <label for="tb-title-{tb.id}" class="text-[11px] text-slate-600 block mb-0.5">Tiêu Đề</label>
                          <input
                            id="tb-title-{tb.id}"
                            type="text"
                            bind:value={tb.title}
                            placeholder="Chính hãng 100%..."
                            class="w-full border border-slate-300 rounded px-2.5 py-1 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label for="tb-sub-{tb.id}" class="text-[11px] text-slate-600 block mb-0.5">Mô Tả Ngắn</label>
                          <input
                            id="tb-sub-{tb.id}"
                            type="text"
                            bind:value={tb.subtitle}
                            placeholder="Cam kết đền tiền..."
                            class="w-full border border-slate-300 rounded px-2.5 py-1 text-xs bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

            <!-- 4. DEEP CUSTOMIZATION: KHỐI GIÁ TRỊ & LỢI ÍCH (VALUE PROPS) -->
            <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
              <div class="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h3 class="text-sm font-bold text-slate-900">
                    4. Tùy Chỉnh Khối: Giá Trị & Lợi Ích
                  </h3>
                  <p class="text-xs text-slate-500">Tùy chỉnh số lượng khối lợi ích, đổi icon, tiêu đề và đoạn văn chi tiết</p>
                </div>
                <button
                  type="button"
                  onclick={handleAddValueProp}
                  class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-xs font-semibold cursor-pointer"
                >
                  + Thêm Khối Lợi Ích
                </button>
              </div>

              {#if !themeDraft.valueProps || themeDraft.valueProps.length === 0}
                <p class="text-xs text-slate-400 italic">Chưa có khối lợi ích nào. Bấm nút phía trên để thêm.</p>
              {:else}
                <div class="space-y-3">
                  {#each themeDraft.valueProps as vp, idx (vp.id)}
                    <div class="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-2 text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-semibold text-slate-800">Khối Lợi Ích #{idx + 1}</span>
                        <button
                          type="button"
                          onclick={() => handleRemoveValueProp(vp.id)}
                          class="text-red-600 hover:underline cursor-pointer text-[11px]"
                        >
                          Xóa khối này
                        </button>
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div>
                          <label for="vp-icon-{vp.id}" class="text-[11px] text-slate-600 block mb-0.5">Icon FontAwesome</label>
                          <input
                            id="vp-icon-{vp.id}"
                            type="text"
                            bind:value={vp.icon}
                            placeholder="fa-tags..."
                            class="w-full border border-slate-300 rounded px-2.5 py-1 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label for="vp-img-{vp.id}" class="text-[11px] text-slate-600 block mb-0.5">Hoặc Tải Ảnh Logo Icon</label>
                          <input
                            id="vp-img-{vp.id}"
                            type="file"
                            accept="image/*"
                            onchange={(e) => handleValuePropImageUpload(e, vp.id)}
                            class="w-full border border-slate-300 rounded px-2 py-0.5 text-[10px] bg-white"
                          />
                          {#if vp.customIconImage}
                            <span class="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                              ✓ Đã có ảnh logo riêng
                              <button
                                type="button"
                                onclick={() => vp.customIconImage = ''}
                                class="text-red-600 underline ml-1 cursor-pointer font-normal"
                              >(Xóa ảnh)</button>
                            </span>
                          {/if}
                        </div>
                        <div class="sm:col-span-2">
                          <label for="vp-title-{vp.id}" class="text-[11px] text-slate-600 block mb-0.5">Tiêu Đề Lợi Ích</label>
                          <input
                            id="vp-title-{vp.id}"
                            type="text"
                            bind:value={vp.title}
                            placeholder="Giá cả cạnh tranh..."
                            class="w-full border border-slate-300 rounded px-2.5 py-1 text-xs bg-white"
                          />
                        </div>
                        <div class="sm:col-span-4">
                          <label for="vp-desc-{vp.id}" class="text-[11px] text-slate-600 block mb-0.5">Mô Tả Chi Tiết</label>
                          <textarea
                            id="vp-desc-{vp.id}"
                            bind:value={vp.description}
                            rows={2}
                            placeholder="Mô tả quyền lợi..."
                            class="w-full border border-slate-300 rounded px-2.5 py-1 text-xs bg-white"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

            <!-- 5. HERO & CONTACT INFOS -->
            <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
              <h3 class="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                5. Nội Dung Hero Banner & Chân Trang
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div class="space-y-1 sm:col-span-2">
                  <label for="thm-badge" class="font-semibold text-slate-700">Huy Hiệu Khuyến Mãi</label>
                  <input
                    id="thm-badge"
                    type="text"
                    bind:value={themeDraft.badgeText}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="thm-htitle" class="font-semibold text-slate-700">Tiêu Đề Hero Dòng 1</label>
                  <input
                    id="thm-htitle"
                    type="text"
                    bind:value={themeDraft.heroTitle}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="thm-hsub" class="font-semibold text-slate-700">Tiêu Đề Hero Dòng 2</label>
                  <input
                    id="thm-hsub"
                    type="text"
                    bind:value={themeDraft.heroSubtitle}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1 sm:col-span-2">
                  <label for="thm-hdesc" class="font-semibold text-slate-700">Mô Tả Giới Thiệu Cửa Hàng</label>
                  <textarea
                    id="thm-hdesc"
                    bind:value={themeDraft.heroDescription}
                    rows={2}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  ></textarea>
                </div>

                <div class="space-y-1">
                  <label for="thm-hl-title" class="font-semibold text-slate-700">Tiêu Đề Điểm Nhấn Banner</label>
                  <input
                    id="thm-hl-title"
                    type="text"
                    bind:value={themeDraft.heroHighlightTitle}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="thm-hl-sub" class="font-semibold text-slate-700">Khẩu Hiệu Khuyến Mãi</label>
                  <input
                    id="thm-hl-sub"
                    type="text"
                    bind:value={themeDraft.heroHighlightSub}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1 sm:col-span-2">
                  <label for="thm-img-file" class="font-semibold text-slate-700">Hình Ảnh Banner Trang Chủ</label>
                  <input
                    id="thm-img-file"
                    type="file"
                    accept="image/*"
                    onchange={handleHeroImageUpload}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-600"
                  />
                </div>

                <div class="space-y-1">
                  <label for="thm-hotline" class="font-semibold text-slate-700">Hotline</label>
                  <input
                    id="thm-hotline"
                    type="text"
                    bind:value={themeDraft.hotline}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>

                <div class="space-y-1">
                  <label for="thm-email" class="font-semibold text-slate-700">Email</label>
                  <input
                    id="thm-email"
                    type="email"
                    bind:value={themeDraft.contactEmail}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>

                <div class="space-y-1 sm:col-span-2">
                  <label for="thm-addr" class="font-semibold text-slate-700">Địa Chỉ Cửa Hàng</label>
                  <input
                    id="thm-addr"
                    type="text"
                    bind:value={themeDraft.storeAddress}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>

                <div class="space-y-1 sm:col-span-2">
                  <label for="thm-footer" class="font-semibold text-slate-700">Nội Dung Chân Trang</label>
                  <input
                    id="thm-footer"
                    type="text"
                    bind:value={themeDraft.footerText}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              class="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-sm cursor-pointer shadow-sm transition"
            >
              Lưu & Áp Dụng Toàn Bộ Giao Diện
            </button>
          </form>
        </div>
      {:else if activeTab === 'users' && authService.canManageUsers(currentAdmin.role)}
        <!-- USERS MANAGEMENT MODULE: SEPARATE ADMIN AND CUSTOMER TABS -->
        <div class="space-y-6">
          <div class="flex items-center justify-between pb-3 border-b border-slate-300">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Quản Lý Tài Khoản Hệ Thống</h2>
              <p class="text-xs text-slate-500">Tách biệt tài khoản nhân viên quản trị và khách hàng mua sắm</p>
            </div>
            
            <!-- Sub-tabs: Admin vs Customer -->
            <div class="flex items-center gap-1 bg-slate-200/80 p-1 rounded-md text-xs font-semibold">
              <button
                type="button"
                onclick={() => userTabMode = 'admin'}
                class="px-3 py-1.5 rounded transition cursor-pointer {userTabMode === 'admin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
              >
                Tài Khoản Quản Trị ({users.filter(u => u.role !== 'customer').length})
              </button>
              <button
                type="button"
                onclick={() => userTabMode = 'customer'}
                class="px-3 py-1.5 rounded transition cursor-pointer {userTabMode === 'customer' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
              >
                Tài Khoản Khách Hàng ({users.filter(u => u.role === 'customer').length})
              </button>
            </div>
          </div>

          {#if userTabMode === 'admin'}
            <!-- CREATE ADMIN USER CARD -->
            <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
              <h3 class="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                Cấp Tài Khoản Quản Trị Mới
              </h3>

              <form onsubmit={handleCreateAdminUser} class="space-y-4 text-xs">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <label for="u-fullname" class="font-semibold text-slate-700">Họ và Tên *</label>
                    <input
                      id="u-fullname"
                      type="text"
                      bind:value={newUserName}
                      required
                      placeholder="Nguyễn Văn A..."
                      class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div class="space-y-1">
                    <label for="u-username" class="font-semibold text-slate-700">Tên Đăng Nhập *</label>
                    <input
                      id="u-username"
                      type="text"
                      bind:value={newUserUsername}
                      required
                      placeholder="admin_sales..."
                      class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div class="space-y-1">
                    <label for="u-pass" class="font-semibold text-slate-700">Mật Khẩu Khởi Tạo *</label>
                    <input
                      id="u-pass"
                      type="password"
                      bind:value={newUserPass}
                      required
                      class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div class="space-y-1">
                    <label for="u-role" class="font-semibold text-slate-700">Vai Trò Phân Quyền *</label>
                    <select
                      id="u-role"
                      bind:value={newUserRole}
                      class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    >
                      <option value="sales_admin">Admin Bán Hàng (Xem & Quản lý đơn hàng)</option>
                      <option value="inventory_admin">Admin Hàng Hóa (Quản lý kho hàng & sản phẩm)</option>
                      <option value="super_admin">Super Admin (Toàn quyền hệ thống)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs cursor-pointer"
                >
                  Tạo Tài Khoản Quản Trị
                </button>
              </form>
            </div>

            <!-- ADMIN USERS TABLE -->
            <div class="bg-white border border-slate-300 rounded-lg p-4 space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold text-slate-900">Danh Sách Nhân Viên Quản Trị</h3>
                <span class="text-xs text-slate-500">Bấm vào hàng hoặc nút "Sửa" để thay đổi quyền hạn</span>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-700">
                  <thead class="bg-slate-100 border-b border-slate-200 text-slate-800 font-semibold uppercase text-[11px]">
                    <tr>
                      <th class="p-2.5">Tài Khoản</th>
                      <th class="p-2.5">Họ và Tên</th>
                      <th class="p-2.5">Quyền Hạn (Role)</th>
                      <th class="p-2.5">Ngày Tạo</th>
                      <th class="p-2.5 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200">
                    {#each users.filter(u => u.role !== 'customer') as u (u.id)}
                      <tr class="hover:bg-slate-50 transition">
                        <td class="p-2.5 font-mono font-bold text-slate-900">@{u.username}</td>
                        <td class="p-2.5 font-medium">{u.fullName}</td>
                        <td class="p-2.5">
                          <span class="px-2 py-0.5 rounded text-[10px] font-semibold border {u.role === 'super_admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : (u.role === 'sales_admin' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200')}">
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                        </td>
                        <td class="p-2.5 text-slate-500">{u.createdAt}</td>
                        <td class="p-2.5 text-center space-x-2">
                          <button
                            type="button"
                            onclick={() => handleSelectEditUser(u)}
                            class="text-blue-600 hover:underline cursor-pointer font-semibold"
                          >
                            Sửa quyền / Thông tin
                          </button>
                          {#if u.id !== currentAdmin.id}
                            <button
                              type="button"
                              onclick={() => handleDeleteUser(u.id, u.fullName)}
                              class="text-red-600 hover:underline cursor-pointer font-medium ml-1"
                            >
                              Xóa
                            </button>
                          {/if}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          {:else}
            <!-- CUSTOMER USERS TABLE -->
            <div class="bg-white border border-slate-300 rounded-lg p-4 space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold text-slate-900">Danh Sách Tài Khoản Khách Hàng</h3>
                <span class="text-xs text-slate-500">Xem và sửa thông tin giao hàng của khách</span>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-700">
                  <thead class="bg-slate-100 border-b border-slate-200 text-slate-800 font-semibold uppercase text-[11px]">
                    <tr>
                      <th class="p-2.5">Tài Khoản</th>
                      <th class="p-2.5">Họ và Tên</th>
                      <th class="p-2.5">Số Điện Thoại</th>
                      <th class="p-2.5">Địa Chỉ Giao Hàng</th>
                      <th class="p-2.5">Ngày Đăng Ký</th>
                      <th class="p-2.5 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200">
                    {#if users.filter(u => u.role === 'customer').length === 0}
                      <tr>
                        <td colspan="6" class="p-6 text-center text-slate-400 italic">Chưa có tài khoản khách hàng nào đăng ký.</td>
                      </tr>
                    {:else}
                      {#each users.filter(u => u.role === 'customer') as u (u.id)}
                        <tr class="hover:bg-slate-50 transition">
                          <td class="p-2.5 font-mono font-semibold text-slate-900">@{u.username}</td>
                          <td class="p-2.5 font-medium">{u.fullName}</td>
                          <td class="p-2.5">{u.phone || 'Chưa cập nhật'}</td>
                          <td class="p-2.5 max-w-xs truncate">{u.address || 'Chưa cập nhật'}</td>
                          <td class="p-2.5 text-slate-500">{u.createdAt}</td>
                          <td class="p-2.5 text-center space-x-2">
                            <button
                              type="button"
                              onclick={() => handleSelectEditUser(u)}
                              class="text-blue-600 hover:underline cursor-pointer font-semibold"
                            >
                              Sửa thông tin
                            </button>
                            <button
                              type="button"
                              onclick={() => handleDeleteUser(u.id, u.fullName)}
                              class="text-red-600 hover:underline cursor-pointer font-medium ml-1"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      {/each}
                    {/if}
                  </tbody>
                </table>
              </div>
            </div>
          {/if}
        </div>

        <!-- EDIT USER MODAL -->
        {#if editingUser}
          <div class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div class="bg-white border border-slate-300 rounded-xl p-6 w-full max-w-lg shadow-lg space-y-4">
              <div class="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 class="text-sm font-bold text-slate-900">
                    Chỉnh Sửa Tài Khoản: @{editingUser.username}
                  </h4>
                  <p class="text-[11px] text-slate-500">Cập nhật thông tin và cấp lại vai trò quyền hạn</p>
                </div>
                <button
                  type="button"
                  onclick={() => editingUser = null}
                  class="text-slate-400 hover:text-slate-800 text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onsubmit={handleSaveEditUser} class="space-y-3.5 text-xs">
                <div class="space-y-1">
                  <label for="ed-name" class="font-semibold text-slate-700">Họ và Tên</label>
                  <input
                    id="ed-name"
                    type="text"
                    bind:value={editFullName}
                    required
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="ed-role" class="font-semibold text-slate-700">Vai Trò & Quyền Hạn</label>
                  <select
                    id="ed-role"
                    bind:value={editRole}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="sales_admin">Admin Bán Hàng (Xem & Xử lý đơn hàng)</option>
                    <option value="inventory_admin">Admin Hàng Hóa (Quản lý kho hàng & sản phẩm)</option>
                    <option value="super_admin">Super Admin (Toàn quyền hệ thống)</option>
                    <option value="customer">Khách Hàng (Tài khoản người mua)</option>
                  </select>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label for="ed-phone" class="font-semibold text-slate-700">Số Điện Thoại</label>
                    <input
                      id="ed-phone"
                      type="text"
                      bind:value={editPhone}
                      placeholder="0901234567..."
                      class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div class="space-y-1">
                    <label for="ed-pass" class="font-semibold text-slate-700">Đổi Mật Khẩu</label>
                    <input
                      id="ed-pass"
                      type="text"
                      bind:value={editPassword}
                      placeholder="Để nguyên nếu không đổi..."
                      class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div class="space-y-1">
                  <label for="ed-addr" class="font-semibold text-slate-700">Địa Chỉ Giao Hàng</label>
                  <input
                    id="ed-addr"
                    type="text"
                    bind:value={editAddress}
                    placeholder="Số nhà, đường, quận/huyện..."
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onclick={() => editingUser = null}
                    class="px-3.5 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    class="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold cursor-pointer"
                  >
                    Lưu Thay Đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        {/if}
      {/if}
    </main>

    <!-- Clean Footer -->
    <footer class="bg-white border-t border-slate-300 py-4 text-center text-xs text-slate-500">
      <p>© 2026 CSET Store - Hệ Thống Quản Trị Cửa Hàng Bán Lẻ Đa Ngành.</p>
    </footer>

    <!-- Toast Notification -->
    {#if toastMsg}
      <div class="fixed bottom-4 right-4 z-50">
        <div class="bg-slate-900 text-white px-4 py-2.5 rounded shadow text-xs font-semibold flex items-center gap-2">
          <i class="fa-solid fa-check"></i>
          <span>{toastMsg}</span>
        </div>
      </div>
    {/if}
  </div>
{/if}
