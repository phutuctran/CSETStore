<script lang="ts">
  import type { User, Product, Order, Coupon, ProductReview, Role } from './models/types';
  import { ROLE_LABELS } from './models/constants';
  import {
    LocalStorageProductRepository,
    LocalStorageOrderRepository,
    LocalStorageUserRepository,
    LocalStorageCouponRepository,
    LocalStorageReviewRepository
  } from './repositories';
  import Pagination from './components/Pagination.svelte';
  import { authService } from './services/authService';
  import { formatCurrency } from './services/pricingService';
  import { analyticsService, type SummaryMetrics } from './services/analyticsService';

  const productRepo = new LocalStorageProductRepository();
  const orderRepo = new LocalStorageOrderRepository();
  const userRepo = new LocalStorageUserRepository();
  const couponRepo = new LocalStorageCouponRepository();
  const reviewRepo = new LocalStorageReviewRepository();

  let currentAdmin = $state<User | null>(authService.getAdminSession());

  // Check role: only super_admin and sales_admin are permitted
  let isAuthorized = $derived(
    Boolean(currentAdmin && (currentAdmin.role === 'super_admin' || currentAdmin.role === 'sales_admin'))
  );

  // Authentication State
  let loginUsername = $state('');
  let loginPassword = $state('');
  let loginError = $state('');

  // Active Tab: orders | reports | coupons | reviews
  let activeTab = $state<'orders' | 'reports' | 'coupons' | 'reviews'>('orders');

  // Repositories State
  let products = $state<Product[]>(productRepo.getAll());
  let orders = $state<Order[]>(orderRepo.getAll());
  let users = $state<User[]>(userRepo.getAll());
  let coupons = $state<Coupon[]>(couponRepo.getAll());
  let reviews = $state<ProductReview[]>(reviewRepo.getAll());

  // Toast State
  let toastMsg = $state<string | null>(null);
  let isSyncing = $state(false);
  let lastSyncTime = $state<string | null>(null);

  function showToast(msg: string) {
    toastMsg = msg;
    setTimeout(() => {
      if (toastMsg === msg) toastMsg = null;
    }, 3000);
  }

  // Synchronize data from server
  async function syncAllServerData(showNotification = false): Promise<void> {
    if (typeof window === 'undefined') return;
    isSyncing = true;
    try {
      const [freshOrders, freshUsers, freshReviews] = await Promise.all([
        orderRepo.syncFromServer(),
        userRepo.syncFromServer(),
        reviewRepo.syncFromServer()
      ]);
      orders = freshOrders;
      users = freshUsers;
      reviews = freshReviews;
      products = productRepo.getAll();
      coupons = couponRepo.getAll();
      lastSyncTime = new Date().toLocaleTimeString('vi-VN');
      if (showNotification) {
        showToast(`Đã đồng bộ thành công dữ liệu mới nhất từ máy chủ (${freshOrders.length} đơn hàng)!`);
      }
    } catch (err) {
      console.warn('[SalesApp] Sync failed:', err);
    } finally {
      isSyncing = false;
    }
  }

  // Initial sync and live polling every 15s
  $effect(() => {
    if (isAuthorized) {
      if (!lastSyncTime) {
        syncAllServerData(false);
      }
      const timer = setInterval(() => {
        syncAllServerData(false);
      }, 15000);
      return () => clearInterval(timer);
    }
  });

  // Login handler
  async function handleLogin(e: Event) {
    e.preventDefault();
    loginError = '';
    const res = await authService.loginAdmin(loginUsername.trim(), loginPassword);
    if (res.success && res.user) {
      if (res.user.role !== 'super_admin' && res.user.role !== 'sales_admin') {
        loginError = 'Tài khoản của bạn không có quyền truy cập cổng này! Chỉ dành riêng cho Super Admin và Sales Admin.';
        authService.setAdminSession(null);
        currentAdmin = null;
        return;
      }
      currentAdmin = res.user;
      products = productRepo.getAll();
      orders = orderRepo.getAll();
      users = userRepo.getAll();
      coupons = couponRepo.getAll();
      reviews = reviewRepo.getAll();
      showToast(`Chào mừng quản trị viên ${res.user.fullName}!`);
      syncAllServerData(false);
    } else {
      loginError = res.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!';
    }
  }

  function handleLogout() {
    authService.setAdminSession(null);
    currentAdmin = null;
  }

  // ----------------------------------------------------
  // MODULE 1: ORDERS STATE & HANDLERS
  // ----------------------------------------------------
  let orderSearchQuery = $state('');
  let orderFilterStatus = $state<string>('all');
  let orderFilterDate = $state<string>(''); // YYYY-MM-DD
  let orderTimePeriod = $state<'all' | 'today' | 'week' | 'month'>('all');
  let orderCurrentPage = $state(1);
  const orderPageSize = 8;

  // Selected Order for Printing / Invoice Slip Modal
  let printingOrder = $state<Order | null>(null);

  let filteredOrders = $derived(
    orders.filter(o => {
      if (orderFilterStatus !== 'all' && o.status !== orderFilterStatus) return false;

      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.trim().toLowerCase();
        const matchId = o.id.toLowerCase().includes(q);
        const matchName = o.customerName.toLowerCase().includes(q);
        const matchPhone = o.phone && o.phone.toLowerCase().includes(q);
        const matchAddr = o.address && o.address.toLowerCase().includes(q);
        if (!matchId && !matchName && !matchPhone && !matchAddr) return false;
      }

      if (orderFilterDate) {
        const oDate = analyticsService.formatDateKey(analyticsService.parseOrderDate(o.createdAt));
        if (oDate !== orderFilterDate) return false;
      }

      if (orderTimePeriod !== 'all') {
        const oDate = analyticsService.parseOrderDate(o.createdAt);
        const now = new Date();
        if (orderTimePeriod === 'today') {
          if (oDate.toDateString() !== now.toDateString()) return false;
        } else if (orderTimePeriod === 'week') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
          if (oDate < oneWeekAgo) return false;
        } else if (orderTimePeriod === 'month') {
          const oneMonthAgo = new Date(now.getTime() - 30 * 86400000);
          if (oDate < oneMonthAgo) return false;
        }
      }

      return true;
    })
  );

  let paginatedOrders = $derived.by(() => {
    const start = (orderCurrentPage - 1) * orderPageSize;
    return filteredOrders.slice(start, start + orderPageSize);
  });

  function handleUpdateOrderStatus(orderId: string, status: Order['status']) {
    orderRepo.updateStatus(orderId, status);
    orders = orderRepo.getAll();
    showToast(`Đã cập nhật trạng thái đơn ${orderId} sang "${status}"!`);
  }

  // ----------------------------------------------------
  // MODULE 2: REPORTS & ANALYTICS
  // ----------------------------------------------------
  let reportTimeSpan = $state<'daily' | 'weekly' | 'monthly'>('daily');
  let summaryMetrics = $derived(analyticsService.getSummaryMetrics(orders, users));
  let dailyStats = $derived(analyticsService.getDailyReports(orders));
  let weeklyStats = $derived(analyticsService.getWeeklyReports(orders));
  let monthlyStats = $derived(analyticsService.getMonthlyReports(orders));

  let pendingOrdersCount = $derived(orders.filter(o => o.status === 'pending').length);
  let processingOrdersCount = $derived(orders.filter(o => o.status === 'processing').length);
  let completedOrdersCount = $derived(orders.filter(o => o.status === 'completed').length);
  let cancelledOrdersCount = $derived(orders.filter(o => o.status === 'cancelled').length);

  let completionRate = $derived(
    summaryMetrics.totalOrders > 0 ? (summaryMetrics.completedOrdersCount / summaryMetrics.totalOrders) * 100 : 0
  );
  let averageOrderValue = $derived(
    summaryMetrics.validOrdersCount > 0 ? Math.round(summaryMetrics.totalRevenue / summaryMetrics.validOrdersCount) : 0
  );

  let currentReportStats = $derived(
    reportTimeSpan === 'daily' ? dailyStats : (reportTimeSpan === 'weekly' ? weeklyStats : monthlyStats)
  );
  let maxReportRevenue = $derived(
    Math.max(...currentReportStats.map(s => s.revenue), 1)
  );

  function getReportPeriodLabel(item: (typeof currentReportStats)[number]): string {
    if ('date' in item) return item.date;
    if ('weekLabel' in item) return item.weekLabel;
    if ('monthLabel' in item) return item.monthLabel;
    return '';
  }
  // ----------------------------------------------------
  // MODULE 3: COUPONS MANAGEMENT
  // ----------------------------------------------------
  let newCouponCode = $state('');
  let newCouponDesc = $state('');
  let newCouponType = $state<'percentage' | 'fixed'>('percentage');
  let newCouponValue = $state<number | null>(10);
  let newCouponMinOrder = $state<number | null>(0);
  let newCouponMaxDisc = $state<number | null>(0);
  let newCouponLimit = $state<number | null>(null);

  function handleCreateCoupon(e: Event) {
    e.preventDefault();
    if (!newCouponCode.trim() || !newCouponValue || newCouponValue <= 0) {
      alert('Vui lòng nhập mã code và giá trị giảm hợp lệ!');
      return;
    }
    const exists = couponRepo.getByCode(newCouponCode.trim());
    if (exists) {
      alert(`Mã giảm giá "${newCouponCode.trim().toUpperCase()}" đã tồn tại!`);
      return;
    }
    couponRepo.create({
      code: newCouponCode.trim().toUpperCase(),
      description: newCouponDesc.trim() || `Giảm ${newCouponValue}${newCouponType === 'percentage' ? '%' : ' VNĐ'}`,
      discountType: newCouponType,
      discountValue: newCouponValue,
      minOrderValue: newCouponMinOrder || 0,
      maxDiscountAmount: newCouponType === 'percentage' ? (newCouponMaxDisc || 0) : undefined,
      usageLimit: newCouponLimit || undefined,
      isActive: true
    });
    coupons = couponRepo.getAll();
    showToast(`Đã tạo mã giảm giá "${newCouponCode.trim().toUpperCase()}" thành công!`);
    newCouponCode = '';
    newCouponDesc = '';
    newCouponValue = 10;
    newCouponMinOrder = 0;
    newCouponMaxDisc = 0;
    newCouponLimit = null;
  }

  function handleToggleCoupon(c: Coupon) {
    couponRepo.update(c.id, { isActive: !c.isActive });
    coupons = couponRepo.getAll();
    showToast(`Đã ${!c.isActive ? 'kích hoạt' : 'tạm dừng'} mã "${c.code}"!`);
  }

  function handleDeleteCoupon(id: string, code: string) {
    if (confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${code}"?`)) {
      couponRepo.delete(id);
      coupons = couponRepo.getAll();
      showToast(`Đã xóa mã giảm giá "${code}"!`);
    }
  }

  // ----------------------------------------------------
  // MODULE 4: PRODUCT REVIEWS MANAGEMENT
  // ----------------------------------------------------
  let reviewFilterRating = $state<number>(0);
  let reviewFilterVisibility = $state<'all' | 'visible' | 'hidden'>('all');
  let reviewFilterProductId = $state<number | 'all'>('all');
  let replyingReviewId = $state<string | null>(null);
  let replyText = $state('');

  let filteredReviews = $derived(
    reviews.filter(r => {
      if (reviewFilterRating > 0 && r.rating !== reviewFilterRating) return false;
      if (reviewFilterVisibility === 'visible' && r.hidden) return false;
      if (reviewFilterVisibility === 'hidden' && !r.hidden) return false;
      if (reviewFilterProductId !== 'all' && r.productId !== reviewFilterProductId) return false;
      return true;
    })
  );

  function handleToggleReviewHide(id: string) {
    reviewRepo.toggleVisibility(id);
    reviews = reviewRepo.getAll();
    showToast('Đã cập nhật trạng thái ẩn/hiện đánh giá!');
  }

  function handleDeleteReview(id: string) {
    if (confirm('Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này?')) {
      reviewRepo.delete(id);
      reviews = reviewRepo.getAll();
      showToast('Đã xóa đánh giá thành công!');
    }
  }

  function handleOpenReply(rev: ProductReview) {
    replyingReviewId = rev.id;
    replyText = rev.adminReply?.reply || '';
  }

  function handleSaveReply(id: string) {
    if (!replyText.trim()) return;
    const replierName = currentAdmin ? `${currentAdmin.fullName} (${ROLE_LABELS[currentAdmin.role]})` : 'Bộ phận CSKH';
    reviewRepo.reply(id, replyText.trim(), replierName);
    reviews = reviewRepo.getAll();
    showToast('Đã gửi phản hồi đến khách hàng!');
    replyingReviewId = null;
    replyText = '';
  }
</script>

<!-- TOAST NOTIFICATION -->
{#if toastMsg}
  <div class="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
    <div class="bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-700 text-xs font-semibold">
      <i class="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
      <span>{toastMsg}</span>
    </div>
  </div>
{/if}

<!-- LOGIN VIEW IF NOT LOGGED IN OR UNAUTHORIZED -->
{#if !currentAdmin}
  <div class="min-h-screen flex items-center justify-center p-4 bg-slate-900">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 space-y-6 animate-in zoom-in-95 duration-200">
      <div class="text-center space-y-2">
        <div class="w-16 h-16 rounded-2xl bg-blue-900 text-white flex items-center justify-center mx-auto text-2xl shadow-md">
          <i class="fa-solid fa-chart-line"></i>
        </div>
        <h1 class="text-xl font-black text-slate-900">Cổng Vận Hành & Bán Hàng</h1>
        <p class="text-xs text-slate-500">CSET Store • Quản lý Đơn hàng, Doanh thu, Khuyến mãi & Đánh giá</p>
        <span class="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200 mt-1">
          Dành riêng cho Super Admin & Sales Admin
        </span>
      </div>

      {#if loginError}
        <div class="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
          <i class="fa-solid fa-circle-exclamation shrink-0 text-red-600"></i>
          <span>{loginError}</span>
        </div>
      {/if}

      <form onsubmit={handleLogin} class="space-y-4 text-xs">
        <div class="space-y-1">
          <label for="sales-u" class="font-bold text-slate-700 block">Tên Đăng Nhập</label>
          <div class="relative">
            <i class="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              id="sales-u"
              type="text"
              bind:value={loginUsername}
              required
              placeholder="superadmin hoặc sale_manager..."
              class="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label for="sales-p" class="font-bold text-slate-700 block">Mật Khẩu</label>
          <div class="relative">
            <i class="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              id="sales-p"
              type="password"
              bind:value={loginPassword}
              required
              placeholder="Nhập mật khẩu..."
              class="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
        </div>

        <button
          type="submit"
          class="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 text-xs"
        >
          <i class="fa-solid fa-right-to-bracket"></i>
          <span>Đăng Nhập Cổng Bán Hàng</span>
        </button>
      </form>

      <div class="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <a href="./index.html" class="hover:text-blue-900 font-medium">← Quay lại cửa hàng</a>
        <a href="./admin.html" class="hover:text-blue-900 font-medium">Trang Admin Tổng →</a>
      </div>
    </div>
  </div>

{:else if !isAuthorized}
  <!-- ACCESS DENIED FOR UNAUTHORIZED ROLES -->
  <div class="min-h-screen flex items-center justify-center p-4 bg-slate-900">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-red-200 p-8 space-y-4 text-center">
      <div class="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-2xl">
        <i class="fa-solid fa-shield-xmark"></i>
      </div>
      <h2 class="text-lg font-black text-slate-900">Quyền Truy Cập Bị Từ Chối</h2>
      <p class="text-xs text-slate-600 leading-relaxed">
        Tài khoản <strong>{currentAdmin.fullName}</strong> (Vai trò: <span class="uppercase font-bold text-red-600">{currentAdmin.role}</span>) không có quyền truy cập cổng Quản lý Bán hàng này.
      </p>
      <p class="text-[11px] text-slate-400">
        Chỉ tài khoản vai trò <strong>Super Admin</strong> hoặc <strong>Sales Admin</strong> mới được cấp quyền thao tác.
      </p>
      <div class="flex justify-center gap-3 pt-3">
        <button
          type="button"
          onclick={handleLogout}
          class="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
        >
          Đăng Xuất
        </button>
        <a
          href="./admin.html"
          class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
        >
          Sang Admin Tổng
        </a>
      </div>
    </div>
  </div>

{:else}
  <!-- MAIN SALES PORTAL APP -->
  <div class="min-h-screen bg-slate-100 flex flex-col">
    <!-- TOP HEADER -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-3 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center text-base font-bold shadow-xs shrink-0">
              <i class="fa-solid fa-chart-line"></i>
            </div>
            <div class="min-w-0">
              <h1 class="text-sm font-black text-blue-950 truncate">CSET Store • Quản Lý Bán Hàng & Doanh Thu</h1>
              <p class="text-[10px] text-slate-400">Hệ thống chuyên dụng: Đơn hàng, Thống kê, Voucher, Đánh giá</p>
            </div>
          </div>

          <!-- User Info & Action Controls -->
          <div class="flex items-center gap-3">
            <!-- Sync Button -->
            <button
              type="button"
              onclick={() => syncAllServerData(true)}
              disabled={isSyncing}
              class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Đồng bộ dữ liệu tức thời từ máy chủ PostgreSQL"
            >
              <i class="fa-solid fa-rotate {isSyncing ? 'fa-spin' : ''} text-blue-900"></i>
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ máy chủ'}</span>
            </button>

            <!-- User Badge -->
            <div class="hidden md:flex flex-col text-right">
              <span class="text-xs font-bold text-slate-900 truncate max-w-40">{currentAdmin.fullName}</span>
              <span class="text-[10px] font-bold text-blue-900 uppercase">
                {ROLE_LABELS[currentAdmin.role] || currentAdmin.role}
              </span>
            </div>

            <!-- Storefront Link -->
            <a
              href="./index.html"
              target="_blank"
              class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-900 hover:bg-slate-50 border border-slate-200 transition flex items-center gap-1"
              title="Xem trang bán hàng (Storefront)"
            >
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
              <span class="hidden lg:inline">Cửa Hàng</span>
            </a>

            <!-- Admin Link -->
            <a
              href="./admin.html"
              class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-900 hover:bg-slate-50 border border-slate-200 transition flex items-center gap-1"
              title="Chuyển sang trang Quản trị toàn diện"
            >
              <i class="fa-solid fa-screwdriver-wrench text-[10px]"></i>
              <span class="hidden lg:inline">Admin Tổng</span>
            </a>

            <!-- Logout Button -->
            <button
              type="button"
              onclick={handleLogout}
              class="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition cursor-pointer"
              title="Đăng xuất khỏi hệ thống"
            >
              <i class="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- NAVIGATION TABS BAR -->
      <div class="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div class="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2">
          <button
            type="button"
            onclick={() => activeTab = 'orders'}
            class="px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 {activeTab === 'orders'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}"
          >
            <i class="fa-solid fa-boxes-packing"></i>
            <span>Đơn Hàng</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] {activeTab === 'orders' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'}">
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onclick={() => activeTab = 'reports'}
            class="px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 {activeTab === 'reports'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}"
          >
            <i class="fa-solid fa-chart-pie"></i>
            <span>Báo Cáo & Doanh Thu</span>
          </button>

          <button
            type="button"
            onclick={() => activeTab = 'coupons'}
            class="px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 {activeTab === 'coupons'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}"
          >
            <i class="fa-solid fa-ticket"></i>
            <span>Mã Giảm Giá</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] {activeTab === 'coupons' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'}">
              {coupons.length}
            </span>
          </button>

          <button
            type="button"
            onclick={() => activeTab = 'reviews'}
            class="px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 {activeTab === 'reviews'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}"
          >
            <i class="fa-solid fa-comments"></i>
            <span>Đánh Giá Khách Hàng</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] {activeTab === 'reviews' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'}">
              {reviews.length}
            </span>
          </button>

          {#if lastSyncTime}
            <span class="ml-auto text-[11px] text-slate-400 font-medium shrink-0">
              Đồng bộ lúc: {lastSyncTime}
            </span>
          {/if}
        </div>
      </div>
    </header>

    <!-- CONTENT AREA -->
    <main class="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-grow">
      <!-- 1. ORDERS MODULE -->
      {#if activeTab === 'orders'}
        <div class="space-y-5">
          <!-- Summary Status Counter Pills -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onclick={() => orderFilterStatus = 'pending'}
              class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-left cursor-pointer transition hover:border-amber-300 {orderFilterStatus === 'pending' ? 'ring-2 ring-amber-500' : ''}"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-500 uppercase">Chờ Xác Nhận</span>
                <i class="fa-solid fa-clock text-amber-500"></i>
              </div>
              <p class="text-2xl font-black text-amber-600 mt-1">{pendingOrdersCount}</p>
            </button>

            <button
              type="button"
              onclick={() => orderFilterStatus = 'processing'}
              class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-left cursor-pointer transition hover:border-blue-300 {orderFilterStatus === 'processing' ? 'ring-2 ring-blue-500' : ''}"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-500 uppercase">Đang Đóng Gói</span>
                <i class="fa-solid fa-boxes-packing text-blue-600"></i>
              </div>
              <p class="text-2xl font-black text-blue-700 mt-1">{processingOrdersCount}</p>
            </button>

            <button
              type="button"
              onclick={() => orderFilterStatus = 'completed'}
              class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-left cursor-pointer transition hover:border-emerald-300 {orderFilterStatus === 'completed' ? 'ring-2 ring-emerald-500' : ''}"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-500 uppercase">Đã Giao Xong</span>
                <i class="fa-solid fa-circle-check text-emerald-600"></i>
              </div>
              <p class="text-2xl font-black text-emerald-700 mt-1">{completedOrdersCount}</p>
            </button>

            <button
              type="button"
              onclick={() => orderFilterStatus = 'cancelled'}
              class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-left cursor-pointer transition hover:border-red-300 {orderFilterStatus === 'cancelled' ? 'ring-2 ring-red-500' : ''}"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-500 uppercase">Đã Hủy</span>
                <i class="fa-solid fa-circle-xmark text-red-500"></i>
              </div>
              <p class="text-2xl font-black text-red-600 mt-1">{cancelledOrdersCount}</p>
            </button>
          </div>

          <!-- Filter & Search Tool Bar -->
          <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 text-xs shadow-xs">
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div class="space-y-1">
                <label for="ord-sq" class="font-bold text-slate-700 block">Tìm kiếm</label>
                <div class="relative">
                  <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input
                    id="ord-sq"
                    type="text"
                    bind:value={orderSearchQuery}
                    placeholder="Mã đơn, tên, SĐT, địa chỉ..."
                    class="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div class="space-y-1">
                <label for="ord-period" class="font-bold text-slate-700 block">Duyệt theo chu kỳ</label>
                <select
                  id="ord-period"
                  bind:value={orderTimePeriod}
                  class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 bg-white"
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="today">Đơn hàng hôm nay</option>
                  <option value="week">Đơn 7 ngày qua</option>
                  <option value="month">Đơn 30 ngày qua</option>
                </select>
              </div>

              <div class="space-y-1">
                <label for="ord-date" class="font-bold text-slate-700 block">Lọc chính xác ngày</label>
                <input
                  id="ord-date"
                  type="date"
                  bind:value={orderFilterDate}
                  class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 bg-white"
                />
              </div>

              <div class="space-y-1">
                <label for="ord-status" class="font-bold text-slate-700 block">Trạng thái đơn</label>
                <div class="flex gap-2">
                  <select
                    id="ord-status"
                    bind:value={orderFilterStatus}
                    class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 bg-white"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ xác nhận</option>
                    <option value="processing">Đang đóng gói / Vận chuyển</option>
                    <option value="completed">Đã giao thành công</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                  {#if orderSearchQuery || orderFilterStatus !== 'all' || orderFilterDate || orderTimePeriod !== 'all'}
                    <button
                      type="button"
                      onclick={() => { orderSearchQuery = ''; orderFilterStatus = 'all'; orderFilterDate = ''; orderTimePeriod = 'all'; }}
                      class="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 shrink-0 cursor-pointer"
                      title="Đặt lại bộ lọc"
                    >
                      <i class="fa-solid fa-rotate-left"></i>
                    </button>
                  {/if}
                </div>
              </div>
            </div>
          </div>

          <!-- Orders List -->
          {#if filteredOrders.length === 0}
            <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <i class="fa-solid fa-box-open text-3xl"></i>
              <p class="font-bold text-slate-600 text-sm">Không tìm thấy đơn hàng nào phù hợp</p>
            </div>
          {:else}
            <div class="space-y-3">
              {#each paginatedOrders as ord (ord.id)}
                <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div class="flex items-center gap-3 flex-wrap">
                      <span class="font-mono font-black text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg text-xs">
                        {ord.id}
                      </span>
                      <span class="text-xs text-slate-400">
                        <i class="fa-solid fa-clock mr-1"></i>{ord.createdAt}
                      </span>
                      {#if ord.customerId}
                        <span class="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          Khách Thành Viên
                        </span>
                      {:else}
                        <span class="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                          Khách Vãng Lai
                        </span>
                      {/if}
                    </div>

                    <div class="flex items-center gap-3">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-slate-600">Trạng thái:</span>
                        <select
                          value={ord.status}
                          onchange={(e) => handleUpdateOrderStatus(ord.id, (e.target as HTMLSelectElement).value as any)}
                          class="text-xs font-bold rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                        >
                          <option value="pending">Chờ xác nhận</option>
                          <option value="processing">Đang đóng gói / Giao hàng</option>
                          <option value="completed">Đã giao thành công</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onclick={() => printingOrder = ord}
                        class="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                        title="In phiếu giao hàng / Hóa đơn"
                      >
                        <i class="fa-solid fa-print"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Customer Info Card -->
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                    <div>
                      <span class="text-slate-400 block text-[10px] font-bold uppercase">Người nhận</span>
                      <strong class="text-blue-950 font-bold text-xs">{ord.customerName}</strong>
                    </div>
                    <div>
                      <span class="text-slate-400 block text-[10px] font-bold uppercase">Số điện thoại</span>
                      <strong class="text-blue-950 font-bold text-xs">{ord.phone}</strong>
                    </div>
                    <div>
                      <span class="text-slate-400 block text-[10px] font-bold uppercase">Địa chỉ giao hàng</span>
                      <span class="text-slate-800">{ord.address}</span>
                    </div>
                  </div>

                  <!-- Items Table -->
                  <div class="space-y-2">
                    {#each ord.items as item}
                      <div class="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-none">
                        <div class="flex items-center space-x-3">
                          {#if item.image}
                            <img src={item.image} alt={item.name} class="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0" />
                          {/if}
                          <div>
                            <p class="font-bold text-blue-950">{item.name}</p>
                            <div class="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                              <span>Số lượng: x{item.quantity}</span>
                              {#if item.selectedVariants && Object.keys(item.selectedVariants).length > 0}
                                <span>•</span>
                                <span class="text-blue-900 font-semibold">
                                  {Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                </span>
                              {/if}
                            </div>
                          </div>
                        </div>
                        <span class="font-bold text-slate-800">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    {/each}
                  </div>

                  <!-- Summary & Total -->
                  <div class="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div class="flex items-center gap-3 text-slate-500">
                      {#if ord.couponCode}
                        <span class="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">
                          Mã: {ord.couponCode} (-{formatCurrency(ord.discountAmount || 0)})
                        </span>
                      {/if}
                    </div>
                    <div class="text-right">
                      <span class="text-slate-500">Tổng thanh toán: </span>
                      <span class="text-lg font-black text-blue-900 ml-1">{formatCurrency(ord.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              {/each}

              <Pagination
                currentPage={orderCurrentPage}
                totalItems={filteredOrders.length}
                pageSize={orderPageSize}
                onPageChange={(p) => orderCurrentPage = p}
              />
            </div>
          {/if}
        </div>

      <!-- 2. REPORTS & ANALYTICS MODULE -->
      {:else if activeTab === 'reports'}
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-bold text-slate-900">Báo Cáo Doanh Thu & Hiệu Quả Bán Hàng</h2>
              <p class="text-xs text-slate-500">Phân tích chu kỳ đơn hàng, doanh số và tỷ lệ chuyển đổi</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick={() => analyticsService.exportToExcelCSV(orders, summaryMetrics)}
                class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs flex items-center gap-1.5"
              >
                <i class="fa-solid fa-file-excel"></i>
                <span>Xuất File Excel / CSV</span>
              </button>
            </div>
          </div>

          <!-- KPI Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
              <span class="text-xs font-bold text-slate-500 uppercase">Tổng Doanh Thu</span>
              <p class="text-2xl font-black text-blue-950">{formatCurrency(summaryMetrics.totalRevenue)}</p>
              <p class="text-[11px] text-slate-400">Dựa trên các đơn hàng đã đặt</p>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
              <span class="text-xs font-bold text-slate-500 uppercase">Tổng Số Đơn Hàng</span>
              <p class="text-2xl font-black text-blue-900">{summaryMetrics.totalOrders}</p>
              <p class="text-[11px] text-emerald-600 font-semibold">Tỷ lệ hoàn tất: {completionRate.toFixed(1)}%</p>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
              <span class="text-xs font-bold text-slate-500 uppercase">Giá Trị Đơn Trung Bình (AOV)</span>
              <p class="text-2xl font-black text-slate-800">{formatCurrency(averageOrderValue)}</p>
              <p class="text-[11px] text-slate-400">Doanh thu / Đơn hàng</p>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
              <span class="text-xs font-bold text-slate-500 uppercase">Khách Hàng Đăng Ký</span>
              <p class="text-2xl font-black text-purple-900">{users.filter(u => u.role === 'customer').length}</p>
              <p class="text-[11px] text-slate-400">Thành viên hệ thống</p>
            </div>
          </div>

          <!-- Time Span Toggle & Bar Chart Representation -->
          <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="font-bold text-sm text-slate-900">Phân Phối Doanh Thu Theo Chu Kỳ</h3>
              <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onclick={() => reportTimeSpan = 'daily'}
                  class="px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer {reportTimeSpan === 'daily' ? 'bg-white shadow-xs text-blue-900' : 'text-slate-600'}"
                >
                  Theo Ngày
                </button>
                <button
                  type="button"
                  onclick={() => reportTimeSpan = 'weekly'}
                  class="px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer {reportTimeSpan === 'weekly' ? 'bg-white shadow-xs text-blue-900' : 'text-slate-600'}"
                >
                  Theo Tuần
                </button>
                <button
                  type="button"
                  onclick={() => reportTimeSpan = 'monthly'}
                  class="px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer {reportTimeSpan === 'monthly' ? 'bg-white shadow-xs text-blue-900' : 'text-slate-600'}"
                >
                  Theo Tháng
                </button>
              </div>
            </div>

            <!-- List of time stats -->
            {#if currentReportStats.length === 0}
              <p class="text-xs text-slate-400 text-center py-6">Chưa có dữ liệu thống kê cho giai đoạn này.</p>
            {:else}
              <div class="space-y-3">
                {#each currentReportStats.slice(0, 10) as item}
                  {@const barWidth = Math.min(100, Math.round((item.revenue / maxReportRevenue) * 100))}
                  <div class="space-y-1 text-xs">
                    <div class="flex justify-between items-center font-semibold">
                      <span class="text-slate-700">{getReportPeriodLabel(item)}</span>
                      <span class="text-blue-900 font-bold">{formatCurrency(item.revenue)} ({item.orderCount} đơn)</span>
                    </div>
                    <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div class="bg-blue-900 h-full rounded-full transition-all duration-500" style="width: {barWidth}%"></div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>

      <!-- 3. COUPONS MODULE -->
      {:else if activeTab === 'coupons'}
        <div class="space-y-6">
          <!-- Add Coupon Form Card -->
          <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <i class="fa-solid fa-plus text-blue-900"></i>
              Tạo Mã Giảm Giá Mới
            </h3>

            <form onsubmit={handleCreateCoupon} class="space-y-4 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="space-y-1">
                  <label for="cp-code" class="font-bold text-slate-700 block">Mã Voucher (Code) *</label>
                  <input
                    id="cp-code"
                    type="text"
                    bind:value={newCouponCode}
                    required
                    placeholder="VD: CSETVIP2026..."
                    class="w-full uppercase font-bold border border-slate-300 rounded-xl px-3 py-2 text-xs text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div class="space-y-1">
                  <label for="cp-type" class="font-bold text-slate-700 block">Loại giảm giá</label>
                  <select
                    id="cp-type"
                    bind:value={newCouponType}
                    class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 bg-white"
                  >
                    <option value="percentage">Giảm theo %</option>
                    <option value="fixed">Giảm số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                <div class="space-y-1">
                  <label for="cp-val" class="font-bold text-slate-700 block">Giá trị giảm *</label>
                  <input
                    id="cp-val"
                    type="number"
                    min="1"
                    bind:value={newCouponValue}
                    required
                    placeholder={newCouponType === 'percentage' ? '10 (%)' : '50000 (VNĐ)'}
                    class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="space-y-1">
                  <label for="cp-min" class="font-bold text-slate-700 block">Đơn hàng tối thiểu (VNĐ)</label>
                  <input
                    id="cp-min"
                    type="number"
                    min="0"
                    step="10000"
                    bind:value={newCouponMinOrder}
                    placeholder="0"
                    class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>

                <div class="space-y-1">
                  <label for="cp-max" class="font-bold text-slate-700 block">Giảm tối đa (áp dụng cho %)</label>
                  <input
                    id="cp-max"
                    type="number"
                    min="0"
                    step="10000"
                    bind:value={newCouponMaxDisc}
                    placeholder="0 = Không giới hạn"
                    class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>

                <div class="space-y-1">
                  <label for="cp-lim" class="font-bold text-slate-700 block">Giới hạn lượt dùng</label>
                  <input
                    id="cp-lim"
                    type="number"
                    min="1"
                    bind:value={newCouponLimit}
                    placeholder="Bỏ trống nếu không giới hạn"
                    class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div class="space-y-1">
                <label for="cp-desc" class="font-bold text-slate-700 block">Mô tả hiển thị cho khách hàng</label>
                <input
                  id="cp-desc"
                  type="text"
                  bind:value={newCouponDesc}
                  placeholder="Giảm 10% tối đa 200k cho đơn từ 500k..."
                  class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <button
                type="submit"
                class="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <i class="fa-solid fa-plus"></i>
                <span>Lưu Mã Giảm Giá</span>
              </button>
            </form>
          </div>

          <!-- Coupons List Table -->
          <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs divide-y divide-slate-200">
                <thead class="bg-slate-50 text-slate-700 font-bold">
                  <tr>
                    <th class="p-3">Mã Code</th>
                    <th class="p-3">Mô Tả & Loại Giảm</th>
                    <th class="p-3">Đơn Tối Thiểu</th>
                    <th class="p-3 text-center">Đã Dùng / Giới Hạn</th>
                    <th class="p-3 text-center">Trạng Thái</th>
                    <th class="p-3 text-center w-28">Thao Tác</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  {#each coupons as cp (cp.id)}
                    <tr class="hover:bg-slate-50">
                      <td class="p-3">
                        <span class="font-mono font-black text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                          {cp.code}
                        </span>
                      </td>
                      <td class="p-3">
                        <p class="font-semibold text-slate-900">{cp.description}</p>
                        <span class="text-[11px] text-slate-400">
                          {cp.discountType === 'percentage' ? `Giảm ${cp.discountValue}%` : `Giảm ${formatCurrency(cp.discountValue)}`}
                        </span>
                      </td>
                      <td class="p-3">
                        {cp.minOrderValue ? formatCurrency(cp.minOrderValue) : '0 VNĐ'}
                      </td>
                      <td class="p-3 text-center">
                        <span class="font-bold text-slate-800">{cp.usedCount || 0}</span>
                        <span class="text-slate-400">/ {cp.usageLimit || '∞'}</span>
                      </td>
                      <td class="p-3 text-center">
                        <button
                          type="button"
                          onclick={() => handleToggleCoupon(cp)}
                          class="px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition {cp.isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'}"
                        >
                          {cp.isActive ? 'Đang Bật' : 'Đã Tắt'}
                        </button>
                      </td>
                      <td class="p-3 text-center">
                        <button
                          type="button"
                          onclick={() => handleDeleteCoupon(cp.id, cp.code)}
                          class="text-red-500 hover:text-red-700 p-1.5 cursor-pointer transition font-bold"
                          title="Xóa mã voucher này"
                        >
                          <i class="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      <!-- 4. REVIEWS MODULE -->
      {:else if activeTab === 'reviews'}
        <div class="space-y-6">
          <!-- Reviews Filter Bar -->
          <div class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
            <div class="flex items-center gap-3 flex-wrap">
              <select
                bind:value={reviewFilterRating}
                class="border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 bg-white"
              >
                <option value={0}>Tất cả số sao ({reviews.length})</option>
                <option value={5}>⭐⭐⭐⭐⭐ (5 sao)</option>
                <option value={4}>⭐⭐⭐⭐ (4 sao)</option>
                <option value={3}>⭐⭐⭐ (3 sao)</option>
                <option value={2}>⭐⭐ (2 sao)</option>
                <option value={1}>⭐ (1 sao)</option>
              </select>

              <select
                bind:value={reviewFilterVisibility}
                class="border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 bg-white"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="visible">Đang hiển thị</option>
                <option value="hidden">Đã bị ẩn</option>
              </select>

              <select
                bind:value={reviewFilterProductId}
                class="border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 bg-white max-w-xs truncate"
              >
                <option value="all">Tất cả sản phẩm</option>
                {#each products as p}
                  <option value={p.id}>{p.name}</option>
                {/each}
              </select>
            </div>

            <span class="text-xs font-bold text-slate-500">
              Tổng cộng: {filteredReviews.length} đánh giá
            </span>
          </div>

          <!-- Reviews Cards List -->
          {#if filteredReviews.length === 0}
            <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <i class="fa-solid fa-comments text-3xl"></i>
              <p class="font-bold text-slate-600 text-sm">Không tìm thấy đánh giá nào</p>
            </div>
          {:else}
            <div class="space-y-3">
              {#each filteredReviews as rev (rev.id)}
                {@const prod = products.find(p => p.id === rev.productId)}
                <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
                  <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div class="flex items-center gap-2">
                      <strong class="font-bold text-slate-900 text-xs">{rev.userName}</strong>
                      <span class="text-amber-400 text-xs">
                        {#each Array(rev.rating) as _}★{/each}
                      </span>
                      {#if rev.verifiedPurchase}
                        <span class="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.2 rounded-full font-bold">
                          Đã mua hàng
                        </span>
                      {/if}
                    </div>

                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        onclick={() => handleToggleReviewHide(rev.id)}
                        class="px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition {rev.hidden
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}"
                        title={rev.hidden ? 'Bấm để hiển thị lại trên trang sản phẩm' : 'Bấm để ẩn khỏi trang sản phẩm'}
                      >
                        <i class="fa-solid {rev.hidden ? 'fa-eye-slash' : 'fa-eye'} mr-1"></i>
                        <span>{rev.hidden ? 'Đã Ẩn' : 'Hiển Thị'}</span>
                      </button>

                      <button
                        type="button"
                        onclick={() => handleDeleteReview(rev.id)}
                        class="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        title="Xóa đánh giá này"
                      >
                        <i class="fa-solid fa-trash text-xs"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Product Reference -->
                  {#if prod}
                    <div class="flex items-center gap-2 text-[11px] text-slate-500">
                      <img src={prod.image} alt={prod.name} class="w-6 h-6 rounded object-cover border border-slate-200" />
                      <span class="font-semibold text-slate-800">{prod.name}</span>
                    </div>
                  {/if}

                  <!-- Comment Text -->
                  <p class="text-slate-700 text-xs leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{rev.comment}"
                  </p>

                  <!-- Attached Images -->
                  {#if rev.images && rev.images.length > 0}
                    <div class="flex gap-2 flex-wrap pt-1">
                      {#each rev.images as img}
                        <img src={img} alt="Review thumb" class="w-14 h-14 rounded-lg object-cover border border-slate-200" />
                      {/each}
                    </div>
                  {/if}

                  <!-- Shop Reply -->
                  {#if rev.adminReply}
                    <div class="p-3 bg-blue-50/80 border-l-4 border-blue-900 rounded-r-xl text-xs text-blue-950 space-y-0.5">
                      <div class="flex items-center justify-between text-[11px] text-blue-900 font-bold">
                        <span>Phản hồi từ {rev.adminReply.replierName || 'Shop'}:</span>
                        <span class="text-slate-400 font-normal">{rev.adminReply.repliedAt}</span>
                      </div>
                      <p>{rev.adminReply.reply}</p>
                    </div>
                  {/if}

                  <!-- Reply Action -->
                  <div class="pt-1 flex justify-end">
                    <button
                      type="button"
                      onclick={() => handleOpenReply(rev)}
                      class="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <i class="fa-solid fa-reply"></i>
                      <span>{rev.adminReply ? 'Chỉnh sửa phản hồi' : 'Gửi phản hồi từ shop'}</span>
                    </button>
                  </div>

                  <!-- Inline Reply Box -->
                  {#if replyingReviewId === rev.id}
                    <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs animate-in fade-in duration-150">
                      <label for="rep-txt-{rev.id}" class="font-bold text-slate-700 block">Nội dung phản hồi:</label>
                      <textarea
                        id="rep-txt-{rev.id}"
                        bind:value={replyText}
                        rows="2"
                        placeholder="Nhập lời cảm ơn hoặc giải đáp thắc mắc của khách hàng..."
                        class="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                      ></textarea>
                      <div class="flex justify-end gap-2">
                        <button
                          type="button"
                          onclick={() => replyingReviewId = null}
                          class="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onclick={() => handleSaveReply(rev.id)}
                          class="px-4 py-1.5 rounded-lg bg-blue-900 text-white font-bold hover:bg-blue-800 shadow-xs cursor-pointer"
                        >
                          Lưu Phản Hồi
                        </button>
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </main>
  </div>
{/if}

<!-- PRINT PACKING SLIP / INVOICE MODAL -->
{#if printingOrder}
  <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl border border-slate-300 p-6 sm:p-8 w-full max-w-xl space-y-5 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 class="font-black text-blue-950 text-base">PHIẾU ĐÓNG GÓI & GIAO HÀNG</h3>
          <p class="text-[11px] text-slate-500 font-mono">Mã đơn: #{printingOrder.id}</p>
        </div>
        <button
          type="button"
          onclick={() => printingOrder = null}
          class="text-slate-400 hover:text-slate-700 text-lg cursor-pointer p-1"
        >
          ✕
        </button>
      </div>

      <div class="space-y-4 text-xs">
        <div class="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <span class="text-slate-400 text-[10px] uppercase font-bold block">Thông tin người nhận</span>
            <strong class="text-slate-900 block font-bold text-sm mt-0.5">{printingOrder.customerName}</strong>
            <p class="text-slate-700 mt-0.5">{printingOrder.phone}</p>
            <p class="text-slate-600 mt-0.5 leading-relaxed">{printingOrder.address}</p>
          </div>
          <div>
            <span class="text-slate-400 text-[10px] uppercase font-bold block">Đơn vị vận chuyển</span>
            <strong class="text-slate-900 block font-bold text-xs mt-0.5">CSET Express</strong>
            <p class="text-slate-500 mt-1">Ngày đặt: {printingOrder.createdAt}</p>
            <p class="text-slate-500 mt-0.5">Trạng thái: <strong class="uppercase text-blue-900">{printingOrder.status}</strong></p>
          </div>
        </div>

        <table class="w-full text-left border-collapse border border-slate-200 rounded-lg">
          <thead class="bg-slate-100 text-slate-700 font-bold">
            <tr>
              <th class="p-2 border-b border-slate-200">Sản phẩm</th>
              <th class="p-2 border-b border-slate-200 text-center w-14">SL</th>
              <th class="p-2 border-b border-slate-200 text-right w-28">Thành tiền</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each printingOrder.items as item}
              <tr>
                <td class="p-2">
                  <span class="font-bold text-slate-900">{item.name}</span>
                  {#if item.selectedVariants && Object.keys(item.selectedVariants).length > 0}
                    <span class="block text-[10px] text-blue-900">
                      {Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    </span>
                  {/if}
                </td>
                <td class="p-2 text-center font-bold">{item.quantity}</td>
                <td class="p-2 text-right font-bold">{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            {/each}
          </tbody>
          <tfoot class="border-t-2 border-slate-200 font-bold bg-slate-50">
            <tr>
              <td colspan="2" class="p-2 text-right">Tổng thanh toán COD:</td>
              <td class="p-2 text-right text-sm text-blue-900 font-black">{formatCurrency(printingOrder.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="flex justify-end gap-2 pt-2 border-t border-slate-200">
        <button
          type="button"
          onclick={() => printingOrder = null}
          class="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
        >
          Đóng
        </button>
        <button
          type="button"
          onclick={() => window.print()}
          class="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <i class="fa-solid fa-print"></i>
          <span>In Phiếu Ngay</span>
        </button>
      </div>
    </div>
  </div>
{/if}
