<script lang="ts">
  import type { User, Product, Order, Role, ThemeConfig, CategoryOption, SubCategory, ProductSpecification, ProductVariantGroup, Coupon, AdItem, CustomNavTab, HeroPoster, ProductReview } from './models/types';
  import { ROLE_LABELS, DEFAULT_THEME_CONFIG } from './models/constants';
  import {
    LocalStorageProductRepository,
    LocalStorageOrderRepository,
    LocalStorageUserRepository,
    LocalStorageThemeRepository,
    LocalStorageCategoryRepository,
    LocalStorageCouponRepository,
    LocalStorageReviewRepository
  } from './repositories';
  import Pagination from './components/Pagination.svelte';
  import { authService } from './services/authService';
  import { formatCurrency } from './services/pricingService';
  import { analyticsService, type SummaryMetrics } from './services/analyticsService';
  import { backupService } from './services/backupService';
  const productRepo = new LocalStorageProductRepository();
  const orderRepo = new LocalStorageOrderRepository();
  const userRepo = new LocalStorageUserRepository();
  const themeRepo = new LocalStorageThemeRepository();
  const categoryRepo = new LocalStorageCategoryRepository();
  const couponRepo = new LocalStorageCouponRepository();
  const reviewRepo = new LocalStorageReviewRepository();
  let currentAdmin = $state<User | null>(authService.getAdminSession());

  // Login form (Clean for Live Stage)
  let loginUsername = $state('');
  let loginPassword = $state('');
  let loginError = $state('');
  // Active navigation tab inside admin portal: Orders, Categories, Inventory, Coupons, CustomTabs, Banners, Theme, Reports, Users, Backup
  let activeTab = $state<'orders' | 'categories' | 'inventory' | 'coupons' | 'reviews' | 'customTabs' | 'banners' | 'theme' | 'reports' | 'users' | 'backup'>('orders');
  let themeDraft = $state<ThemeConfig>(themeRepo.getTheme());
  let customizerSubTab = $state<'brand' | 'browser' | 'hero' | 'trust' | 'value' | 'products' | 'footer'>('brand');
  let categories = $state<CategoryOption[]>(categoryRepo.getAll());
  let products = $state<Product[]>(productRepo.getAll());
  let orders = $state<Order[]>(orderRepo.getAll());
  let users = $state<User[]>(userRepo.getAll());
  let coupons = $state<Coupon[]>(couponRepo.getAll());
  let reviews = $state<ProductReview[]>(reviewRepo.getAll());
  let toastMsg = $state<string | null>(null);
  let isSyncingOrders = $state(false);
  let lastOrderSyncTime = $state<string | null>(null);

  async function syncOrdersFromServer(showNotification = false): Promise<void> {
    if (typeof window === 'undefined') return;
    isSyncingOrders = true;
    try {
      const serverOrders = await orderRepo.syncFromServer();
      orders = serverOrders;
      lastOrderSyncTime = new Date().toLocaleTimeString('vi-VN');
      if (showNotification) {
        showToast(`Đã đồng bộ ${serverOrders.length} đơn hàng từ máy chủ!`);
      }
    } catch (err) {
      console.warn('[AdminApp] Sync orders error:', err);
    } finally {
      isSyncingOrders = false;
    }
  }

  async function syncAllServerData(): Promise<void> {
    if (typeof window === 'undefined') return;
    await syncOrdersFromServer(false);
    userRepo.syncFromServer().then((u) => { users = u; }).catch(() => {});
    reviewRepo.syncFromServer().then((r) => { reviews = r; }).catch(() => {});
  }

  // Pick initial tab once on login
  let initializedAdminRole = $state<string | null>(null);
  $effect(() => {
    if (currentAdmin) {
      if (initializedAdminRole !== currentAdmin.role) {
        initializedAdminRole = currentAdmin.role;
        if (currentAdmin.role === 'inventory_admin') {
          activeTab = 'inventory';
        } else {
          activeTab = 'orders';
        }
        themeDraft = themeRepo.getTheme();
      }
      if (!lastOrderSyncTime) {
        syncAllServerData();
      }
    }
  });

  // Periodic live refresh every 15s for new orders from customers
  $effect(() => {
    if (!currentAdmin) return;
    const interval = setInterval(() => {
      if (activeTab === 'orders') {
        syncOrdersFromServer(false);
      }
    }, 15000);
    return () => clearInterval(interval);
  });

  function showToast(msg: string) {
    toastMsg = msg;
    setTimeout(() => {
      if (toastMsg === msg) toastMsg = null;
    }, 3000);
  }

  // Auth actions
  async function handleLogin(e: Event) {
    e.preventDefault();
    loginError = '';
    const res = await authService.loginAdmin(loginUsername.trim(), loginPassword);
    if (res.success && res.user) {
      currentAdmin = res.user;
      products = productRepo.getAll();
      orders = orderRepo.getAll();
      users = userRepo.getAll();
      themeDraft = themeRepo.getTheme();
      showToast(`Chào mừng quản trị viên ${res.user.fullName}!`);
      syncAllServerData();
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
  let orderSearchQuery = $state('');
  let orderFilterStatus = $state<string>('all');
  let orderFilterDate = $state<string>(''); // YYYY-MM-DD
  let orderTimePeriod = $state<'all' | 'today' | 'week' | 'month'>('all');
  let orderCurrentPage = $state(1);
  const orderPageSize = 8;
  let filteredOrders = $derived(
    orders.filter(o => {
      // Status filter
      if (orderFilterStatus !== 'all' && o.status !== orderFilterStatus) return false;

      // Search query (code, customer name, phone, address)
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.trim().toLowerCase();
        const matchId = o.id.toLowerCase().includes(q);
        const matchName = o.customerName.toLowerCase().includes(q);
        const matchPhone = o.phone.toLowerCase().includes(q);
        if (!matchId && !matchName && !matchPhone) return false;
      }

      // Specific date filter
      if (orderFilterDate) {
        const oDate = analyticsService.formatDateKey(analyticsService.parseOrderDate(o.createdAt));
        if (oDate !== orderFilterDate) return false;
      }

      // Time period filter
      if (orderTimePeriod !== 'all') {
        const oDate = analyticsService.parseOrderDate(o.createdAt);
        const now = new Date();
        if (orderTimePeriod === 'today') {
          const isToday = oDate.toDateString() === now.toDateString();
          if (!isToday) return false;
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
    showToast(`Đã đổi trạng thái đơn ${orderId} sang "${status}"`);
  }

  // Inventory Pagination State
  let invCurrentPage = $state(1);
  const invPageSize = 8;

  let paginatedInventoryProducts = $derived.by(() => {
    const start = (invCurrentPage - 1) * invPageSize;
    return filteredInventoryProducts.slice(start, start + invPageSize);
  });
  // --- TAB: REPORTS & ANALYTICS ---
  let reportTimeSpan = $state<'daily' | 'weekly' | 'monthly'>('daily');
  let summaryMetrics = $derived(analyticsService.getSummaryMetrics(orders, users));
  let dailyStats = $derived(analyticsService.getDailyReports(orders));
  let weeklyStats = $derived(analyticsService.getWeeklyReports(orders));
  let monthlyStats = $derived(analyticsService.getMonthlyReports(orders));


  // --- TAB: COUPONS MANAGEMENT (ALL 3 ADMIN ROLES) ---
  let couponSearchQuery = $state('');
  let newCouponCode = $state('');
  let newCouponDesc = $state('');
  let newCouponType = $state<'percentage' | 'fixed'>('percentage');
  let newCouponValue = $state<number>(10);
  let newCouponMinOrder = $state<number>(0);
  let newCouponMaxDiscount = $state<number>(0);
  let newCouponLimit = $state<number>(100);
  let editingCoupon = $state<Coupon | null>(null);

  let filteredCoupons = $derived(
    coupons.filter(c => {
      if (!couponSearchQuery.trim()) return true;
      const q = couponSearchQuery.trim().toLowerCase();
      return c.code.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    })
  );

  function handleCreateCoupon(e: Event) {
    e.preventDefault();
    if (!newCouponCode.trim()) {
      showToast('Vui lòng nhập mã giảm giá!');
      return;
    }
    const existing = couponRepo.getByCode(newCouponCode.trim());
    if (existing) {
      showToast(`Mã "${newCouponCode.trim().toUpperCase()}" đã tồn tại!`);
      return;
    }
    couponRepo.create({
      code: newCouponCode.trim().toUpperCase(),
      description: newCouponDesc.trim() || `Giảm ${newCouponValue}${newCouponType === 'percentage' ? '%' : ' VNĐ'}`,
      discountType: newCouponType,
      discountValue: newCouponValue,
      minOrderValue: newCouponMinOrder > 0 ? newCouponMinOrder : undefined,
      maxDiscountAmount: newCouponType === 'percentage' && newCouponMaxDiscount > 0 ? newCouponMaxDiscount : undefined,
      usageLimit: newCouponLimit > 0 ? newCouponLimit : undefined,
      isActive: true
    });
    coupons = couponRepo.getAll();
    newCouponCode = '';
    newCouponDesc = '';
    newCouponValue = 10;
    newCouponMinOrder = 0;
    newCouponMaxDiscount = 0;
    showToast('Đã tạo mã giảm giá mới thành công!');
  }

  function handleToggleCoupon(c: Coupon) {
    couponRepo.update(c.id, { isActive: !c.isActive });
    coupons = couponRepo.getAll();
    showToast(`Đã ${!c.isActive ? 'kích hoạt' : 'tạm dừng'} mã "${c.code}"`);
  }

  function handleDeleteCoupon(c: Coupon) {
    if (confirm(`Bạn có chắc muốn xóa mã giảm giá "${c.code}"?`)) {
      couponRepo.delete(c.id);
      coupons = couponRepo.getAll();
      showToast(`Đã xóa mã "${c.code}"!`);
    }
  }

  function handleOpenEditCoupon(c: Coupon) {
    editingCoupon = { ...c };
  }

  function handleSaveEditCoupon(e: Event) {
    e.preventDefault();
    if (!editingCoupon) return;
    couponRepo.update(editingCoupon.id, {
      code: editingCoupon.code,
      description: editingCoupon.description,
      discountType: editingCoupon.discountType,
      discountValue: editingCoupon.discountValue,
      minOrderValue: editingCoupon.minOrderValue,
      maxDiscountAmount: editingCoupon.maxDiscountAmount,
      usageLimit: editingCoupon.usageLimit,
      isActive: editingCoupon.isActive
    });
    coupons = couponRepo.getAll();
    editingCoupon = null;
    showToast('Đã lưu thông tin mã giảm giá!');
  }

  // --- TAB: REVIEWS MANAGEMENT (Cho cả 3 vai trò Admin) ---
  let reviewSearchQuery = $state('');
  let reviewFilterRating = $state<number | 'all'>('all');
  let reviewFilterStatus = $state<'all' | 'visible' | 'hidden' | 'replied' | 'unreplied'>('all');
  let replyingReviewId = $state<string | null>(null);
  let replyInputText = $state('');

  let filteredAdminReviews = $derived(
    reviews.filter(r => {
      if (reviewFilterRating !== 'all' && r.rating !== reviewFilterRating) return false;
      if (reviewFilterStatus === 'hidden' && !r.hidden) return false;
      if (reviewFilterStatus === 'visible' && r.hidden) return false;
      if (reviewFilterStatus === 'replied' && !r.adminReply) return false;
      if (reviewFilterStatus === 'unreplied' && r.adminReply) return false;
      if (reviewSearchQuery.trim()) {
        const q = reviewSearchQuery.trim().toLowerCase();
        const matchUser = r.userName.toLowerCase().includes(q);
        const matchComment = r.comment.toLowerCase().includes(q);
        const prod = products.find(p => p.id === r.productId);
        const matchProd = prod ? prod.name.toLowerCase().includes(q) : false;
        if (!matchUser && !matchComment && !matchProd) return false;
      }
      return true;
    })
  );

  function handleToggleHideReview(r: ProductReview) {
    reviewRepo.toggleVisibility(r.id);
    reviews = reviewRepo.getAll();
    showToast(`Đã ${!r.hidden ? 'ẩn' : 'hiển thị'} đánh giá của "${r.userName}"`);
  }

  function handleStartReplyReview(r: ProductReview) {
    replyingReviewId = r.id;
    replyInputText = r.adminReply ? r.adminReply.reply : '';
  }

  function handleSaveReplyReview(r: ProductReview) {
    if (!replyInputText.trim()) {
      showToast('Vui lòng nhập nội dung phản hồi!');
      return;
    }
    const adminName = currentAdmin ? `${currentAdmin.fullName} (${ROLE_LABELS[currentAdmin.role]})` : 'Ban Quản Trị CSET Store';
    reviewRepo.reply(r.id, replyInputText.trim(), adminName);
    reviews = reviewRepo.getAll();
    replyingReviewId = null;
    replyInputText = '';
    showToast(`Đã gửi phản hồi đánh giá của "${r.userName}" thành công!`);
  }

  function handleDeleteReview(r: ProductReview) {
    if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá của "${r.userName}"?`)) {
      reviewRepo.delete(r.id);
      reviews = reviewRepo.getAll();
      showToast(`Đã xóa đánh giá của "${r.userName}"!`);
    }
  }
  // --- TAB: BACKUP & RESTORE ---
  let backupJsonInput = $state('');
  let restoreStatusMessage = $state('');

  async function handleDownloadBackup() {
    await backupService.downloadDatabaseBackupFile(currentAdmin?.fullName || 'Super Admin');
    showToast('Đã xuất file sao lưu cơ sở dữ liệu SQL (.sql) về máy tính!');
  }

  function handleUploadBackupFile(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = (evt.target?.result as string) || '';
        backupJsonInput = text;
      };
      reader.readAsText(file);
    }
  }

  async function handleExecuteRestore() {
    if (!backupJsonInput.trim()) {
      alert('Vui lòng chọn file backup database (.sql / .sqlite / .json) hoặc dán nội dung vào ô!');
      return;
    }
    if (confirm('CẢNH BÁO: Quá trình khôi phục sẽ ghi đè toàn bộ sản phẩm, danh mục, đơn hàng, tài khoản và giao diện hiện tại bằng dữ liệu backup. Bạn có chắc chắn muốn khôi phục?')) {
      const res = await backupService.restoreDatabaseFile(backupJsonInput);
      restoreStatusMessage = res.message;
      if (res.success) {
        products = productRepo.getAll();
        categories = categoryRepo.getAll();
        orders = orderRepo.getAll();
        users = userRepo.getAll();
        coupons = couponRepo.getAll();
        reviews = reviewRepo.getAll();
        themeDraft = themeRepo.getTheme();
        showToast('Khôi phục cơ sở dữ liệu SQL thành công!');
      } else {
        alert(res.message);
      }
    }
  }

  // --- TAB: INVENTORY MANAGEMENT (SUPER ADMIN & INVENTORY ADMIN) ---
  let filterInvCategory = $state<string>('all');
  let filterInvSubCategory = $state<string>('');

  let pName = $state('');
  let pPrice = $state<number | null>(null);
  let pOrigPrice = $state<number | null>(null);
  let pDiscountPercent = $state<number | null>(null);
  let pDiscountStartDate = $state('');
  let pDiscountEndDate = $state('');
  let pCategory = $state('electronics');
  let pSubCategory = $state('');
  let pBrand = $state('');
  let pSku = $state('');
  let pStock = $state<number | null>(50);
  let pOrigin = $state('');
  let pWarranty = $state('12 tháng chính hãng');
  let pWeight = $state('');
  let pCondition = $state('Mới 100%');
  let pDesc = $state('');
  let pImgBase64 = $state('');
  let pImagesList = $state<string[]>([]);
  let pSpecs = $state<ProductSpecification[]>([
    { name: '', value: '' }
  ]);
  let pSoldCount = $state<number>(0);
  let pShowOnHome = $state<boolean>(false);
  let pMaxPurchaseLimit = $state<number | null>(null);
  let edPSoldCount = $state<number>(0);
  let edPShowOnHome = $state<boolean>(false);
  let edPMaxPurchaseLimit = $state<number | null>(null);
  interface VariantGroupDraft {
    name: string;
    optionsStr: string;
  }
  let pVariantGroups = $state<VariantGroupDraft[]>([]);
  let edPVariantGroups = $state<VariantGroupDraft[]>([]);

  function addVariantGroup() {
    pVariantGroups = [...pVariantGroups, { name: '', optionsStr: '' }];
  }
  function removeVariantGroup(index: number) {
    pVariantGroups = pVariantGroups.filter((_, i) => i !== index);
  }
  function addPresetVariant(name: string, defaultOptions: string) {
    if (pVariantGroups.some(vg => vg.name.toLowerCase() === name.toLowerCase())) {
      showToast(`Nhóm phân loại "${name}" đã có trong danh sách!`);
      return;
    }
    pVariantGroups = [...pVariantGroups, { name, optionsStr: defaultOptions }];
  }

  function addEditVariantGroup() {
    edPVariantGroups = [...edPVariantGroups, { name: '', optionsStr: '' }];
  }
  function removeEditVariantGroup(index: number) {
    edPVariantGroups = edPVariantGroups.filter((_, i) => i !== index);
  }
  function addEditPresetVariant(name: string, defaultOptions: string) {
    if (edPVariantGroups.some(vg => vg.name.toLowerCase() === name.toLowerCase())) {
      showToast(`Nhóm phân loại "${name}" đã có trong danh sách!`);
      return;
    }
    edPVariantGroups = [...edPVariantGroups, { name, optionsStr: defaultOptions }];
  }
  // Product Edit Modal State
  let editingProduct = $state<Product | null>(null);
  let edPName = $state('');
  let edPPrice = $state<number | null>(null);
  let edPOrigPrice = $state<number | null>(null);
  let edPDiscountPercent = $state<number | null>(null);
  let edPDiscountStartDate = $state('');
  let edPDiscountEndDate = $state('');
  let edPCategory = $state('electronics');
  let edPSubCategory = $state('');
  let edPBrand = $state('');
  let edPSku = $state('');
  let edPStock = $state<number | null>(50);
  let edPOrigin = $state('');
  let edPWarranty = $state('');
  let edPWeight = $state('');
  let edPCondition = $state('');
  let edPDesc = $state('');
  let edPImgBase64 = $state('');
  let edPImagesList = $state<string[]>([]);
  let edPSpecs = $state<ProductSpecification[]>([]);

  let filteredInventoryProducts = $derived(
    products.filter(p => {
      if (filterInvCategory !== 'all' && p.category !== filterInvCategory) return false;
      if (filterInvSubCategory && p.subCategory !== filterInvSubCategory) return false;
      return true;
    })
  );
  // Derived subcategories for current selected pCategory
  let currentSubCategories = $derived(
    categories.find(c => c.key === pCategory)?.subcategories || []
  );


  function handleToggleShowOnHome(p: Product) {
    const nextVal = !p.showOnHome;
    productRepo.update(p.id, { showOnHome: nextVal });
    products = productRepo.getAll();
    showToast(nextVal ? `Đã ghim "${p.name}" hiển thị tại trang chủ!` : `Đã bỏ ghim "${p.name}" khỏi trang chủ!`);
  }

  function handleAutoSelectTop5() {
    const sorted = [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    const top5Ids = new Set(sorted.slice(0, 5).map(p => p.id));
    for (const p of products) {
      const shouldShow = top5Ids.has(p.id);
      if (p.showOnHome !== shouldShow) {
        p.showOnHome = shouldShow;
        productRepo.update(p.id, { showOnHome: shouldShow });
      }
    }
    products = productRepo.getAll();
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      fetch('/api/products/auto-top5', { method: 'POST' }).catch(() => {});
    }
    showToast('Đã tự động chọn 5 sản phẩm có lượt bán cao nhất hiển thị tại trang chủ!');
  }
  function addSpecField() {
    pSpecs = [...pSpecs, { name: '', value: '' }];
  }

  function removeSpecField(index: number) {
    pSpecs = pSpecs.filter((_, i) => i !== index);
  }

  function handleProductMultipleImages(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const b64 = (evt.target?.result as string) || '';
          if (b64) {
            pImagesList = [...pImagesList, b64];
            if (!pImgBase64) pImgBase64 = b64;
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function handleCreateProduct(e: Event) {
    e.preventDefault();
    if (!pName.trim() || !pPrice) {
      alert('Vui lòng nhập tên và giá sản phẩm!');
      return;
    }
    const image = pImgBase64 || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
    const validSpecs = pSpecs.filter(s => s.name.trim() && s.value.trim());
    const validVariantGroups: ProductVariantGroup[] = pVariantGroups
      .filter(vg => vg.name.trim() && vg.optionsStr.trim())
      .map(vg => ({
        name: vg.name.trim(),
        options: vg.optionsStr.split(',').map(o => o.trim()).filter(Boolean)
      }))
      .filter(vg => vg.options.length > 0);

    productRepo.create({
      name: pName.trim(),
      price: pPrice,
      originalPrice: pOrigPrice || undefined,
      discountPercent: pDiscountPercent || undefined,
      discountStartDate: pDiscountStartDate || undefined,
      discountEndDate: pDiscountEndDate || undefined,
      category: pCategory,
      subCategory: pSubCategory.trim() || undefined,
      brand: pBrand.trim() || undefined,
      sku: pSku.trim() || undefined,
      origin: pOrigin.trim() || undefined,
      warranty: pWarranty.trim() || undefined,
      weight: pWeight.trim() || undefined,
      condition: pCondition.trim() || undefined,
      stock: pStock || 50,
      specifications: validSpecs.length > 0 ? validSpecs : undefined,
      variantGroups: validVariantGroups.length > 0 ? validVariantGroups : undefined,
      soldCount: pSoldCount || 0,
      showOnHome: pShowOnHome,
      maxPurchaseLimit: (pMaxPurchaseLimit && pMaxPurchaseLimit > 0) ? pMaxPurchaseLimit : undefined,
      image,
      images: pImagesList.length > 0 ? pImagesList : [image],
      description: pDesc.trim() || 'Sản phẩm chính hãng chất lượng cao tại CSET Store.'
    });
    products = productRepo.getAll();
    showToast(`Đã thêm sản phẩm "${pName}" vào danh mục hàng hóa!`);
    pName = '';
    pPrice = null;
    pOrigPrice = null;
    pDiscountPercent = null;
    pDiscountStartDate = '';
    pDiscountEndDate = '';
    pBrand = '';
    pSku = '';
    pOrigin = '';
    pWarranty = '12 tháng chính hãng';
    pWeight = '';
    pCondition = 'Mới 100%';
    pStock = 50;
    pDesc = '';
    pImgBase64 = '';
    pImagesList = [];
    pSpecs = [{ name: '', value: '' }];
    pVariantGroups = [];
    pSoldCount = 0;
    pShowOnHome = false;
    pMaxPurchaseLimit = null;
  }

  function handleOpenEditProduct(p: Product) {
    editingProduct = p;
    edPName = p.name;
    edPPrice = p.price;
    edPOrigPrice = p.originalPrice || null;
    edPDiscountPercent = p.discountPercent || null;
    edPDiscountStartDate = p.discountStartDate || '';
    edPDiscountEndDate = p.discountEndDate || '';
    edPCategory = p.category;
    edPSubCategory = p.subCategory || '';
    edPBrand = p.brand || '';
    edPSku = p.sku || '';
    edPStock = p.stock || 50;
    edPOrigin = p.origin || '';
    edPWarranty = p.warranty || '';
    edPWeight = p.weight || '';
    edPCondition = p.condition || '';
    edPDesc = p.description || '';
    edPImgBase64 = p.image || '';
    edPImagesList = p.images && p.images.length > 0 ? [...p.images] : [p.image];
    edPSpecs = p.specifications && p.specifications.length > 0 ? [...p.specifications] : [{ name: '', value: '' }];
    edPVariantGroups = p.variantGroups && p.variantGroups.length > 0
      ? p.variantGroups.map(vg => ({ name: vg.name, optionsStr: vg.options.join(', ') }))
      : [];
    edPSoldCount = p.soldCount || 0;
    edPShowOnHome = Boolean(p.showOnHome);
    edPMaxPurchaseLimit = p.maxPurchaseLimit || null;
  }
  function handleEditProductMultipleImages(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const b64 = (evt.target?.result as string) || '';
          if (b64) {
            edPImagesList = [...edPImagesList, b64];
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function handleSaveEditProduct(e: Event) {
    e.preventDefault();
    if (!editingProduct) return;
    const validSpecs = edPSpecs.filter(s => s.name.trim() && s.value.trim());
    const validEdVariantGroups: ProductVariantGroup[] = edPVariantGroups
      .filter(vg => vg.name.trim() && vg.optionsStr.trim())
      .map(vg => ({
        name: vg.name.trim(),
        options: vg.optionsStr.split(',').map(o => o.trim()).filter(Boolean)
      }))
      .filter(vg => vg.options.length > 0);

    productRepo.update(editingProduct.id, {
      name: edPName.trim(),
      price: edPPrice || editingProduct.price,
      originalPrice: edPOrigPrice || undefined,
      discountPercent: edPDiscountPercent || undefined,
      discountStartDate: edPDiscountStartDate || undefined,
      discountEndDate: edPDiscountEndDate || undefined,
      category: edPCategory,
      subCategory: edPSubCategory.trim() || undefined,
      brand: edPBrand.trim() || undefined,
      sku: edPSku.trim() || undefined,
      origin: edPOrigin.trim() || undefined,
      warranty: edPWarranty.trim() || undefined,
      weight: edPWeight.trim() || undefined,
      condition: edPCondition.trim() || undefined,
      stock: edPStock || 50,
      image: edPImgBase64 || editingProduct.image,
      images: edPImagesList.length > 0 ? edPImagesList : [editingProduct.image],
      specifications: validSpecs.length > 0 ? validSpecs : undefined,
      variantGroups: validEdVariantGroups.length > 0 ? validEdVariantGroups : undefined,
      soldCount: edPSoldCount || 0,
      showOnHome: edPShowOnHome,
      maxPurchaseLimit: (edPMaxPurchaseLimit && edPMaxPurchaseLimit > 0) ? edPMaxPurchaseLimit : undefined,
    });
    products = productRepo.getAll();
    showToast(`Đã lưu thay đổi cho sản phẩm "${edPName}"!`);
    editingProduct = null;
  }

  // --- TAB: CATEGORIES MANAGEMENT ---
  let newCatKey = $state('');
  let newCatLabel = $state('');
  let newCatIcon = $state('fa-tag');
  let activeCatKeyForSub = $state<string>('');
  let newSubCatName = $state('');

  function handleCreateCategory(e: Event) {
    e.preventDefault();
    if (!newCatKey.trim() || !newCatLabel.trim()) {
      alert('Vui lòng nhập mã ngành hàng và tên hiển thị!');
      return;
    }
    const cleanKey = newCatKey.trim().toLowerCase().replace(/\s+/g, '-');
    if (categories.some(c => c.key === cleanKey)) {
      alert('Mã ngành hàng này đã tồn tại!');
      return;
    }
    const isImage = newCatIcon.startsWith('data:image');
    const created = categoryRepo.createCategory({
      key: cleanKey,
      label: newCatLabel.trim(),
      customIconImage: isImage ? newCatIcon : undefined,
      icon: !isImage && newCatIcon ? newCatIcon : 'fa-tag',
      subcategories: []
    });
    categories = categoryRepo.getAll();
    showToast(`Đã thêm ngành hàng "${created.label}"!`);
    newCatKey = '';
    newCatLabel = '';
    newCatIcon = '';
  }

  function handleDeleteCategory(key: string, label: string) {
    if (confirm(`Xóa ngành hàng "${label}"? Các sản phẩm thuộc ngành hàng này có thể bị ảnh hưởng.`)) {
      categoryRepo.deleteCategory(key);
      categories = categoryRepo.getAll();
      showToast(`Đã xóa ngành hàng "${label}"`);
    }
  }

  function handleAddSubCategory(catKey: string) {
    if (!newSubCatName.trim()) {
      alert('Vui lòng nhập tên loại danh mục!');
      return;
    }
    const cat = categories.find(c => c.key === catKey);
    if (!cat) return;
    const newSub: SubCategory = {
      id: 'sub-' + Date.now(),
      name: newSubCatName.trim()
    };
    cat.subcategories.push(newSub);
    categoryRepo.updateCategory(catKey, { subcategories: cat.subcategories });
    categories = categoryRepo.getAll();
    showToast(`Đã thêm loại danh mục "${newSub.name}" vào ${cat.label}!`);
    newSubCatName = '';
  }

  function handleDeleteSubCategory(catKey: string, subId: string, subName: string) {
    const cat = categories.find(c => c.key === catKey);
    if (!cat) return;
    cat.subcategories = cat.subcategories.filter(s => s.id !== subId);
    categoryRepo.updateCategory(catKey, { subcategories: cat.subcategories });
    categories = categoryRepo.getAll();
    showToast(`Đã xóa loại danh mục "${subName}"`);
  }

  function handleResetCategories() {
    if (confirm('Khôi phục danh sách ngành hàng & danh mục chuẩn ban đầu?')) {
      categories = categoryRepo.resetCategories();
      showToast('Đã khôi phục các ngành hàng mặc định!');
    }
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
  // --- TAB: AD BANNERS MANAGEMENT ---
  let newBannerPos = $state<'top' | 'side-left' | 'side-right'>('top');
  let newBannerType = $state<'image' | 'text'>('text');
  let newBannerTitle = $state('');
  let newBannerSubtitle = $state('');
  let newBannerLinkText = $state('Xem Ngay');
  let newBannerLinkUrl = $state('#');
  let newBannerBgColor = $state('#1e3a8a');
  let newBannerTextColor = $state('#ffffff');
  let newBannerStartDate = $state('');
  let newBannerEndDate = $state('');
  let newBannerImgBase64 = $state('');
  function handleBannerImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        newBannerImgBase64 = (evt.target?.result as string) || '';
      };
      reader.readAsDataURL(file);
    }
  }

  function handleCreateBanner(e: Event) {
    e.preventDefault();
    if (!newBannerTitle.trim() && newBannerType === 'text') {
      alert('Vui lòng nhập tiêu đề banner!');
      return;
    }
    const newAd: AdItem = {
      id: 'ad-' + Date.now(),
      position: newBannerPos,
      type: newBannerType,
      enabled: true,
      title: newBannerTitle.trim() || 'Banner Khuyến Mãi',
      subtitle: newBannerSubtitle.trim() || undefined,
      linkText: newBannerLinkText.trim() || undefined,
      linkUrl: newBannerLinkUrl.trim() || '#',
      imageUrl: newBannerType === 'image' ? (newBannerImgBase64 || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&auto=format&fit=crop&q=80') : undefined,
      bgColor: newBannerBgColor,
      textColor: newBannerTextColor,
      createdAt: new Date().toISOString().split('T')[0]
    };

    themeDraft.banners = [...(themeDraft.banners || []), newAd];
    themeRepo.saveTheme(themeDraft);
    showToast('Đã thêm banner quảng cáo mới thành công!');

    // reset form
    newBannerTitle = '';
    newBannerSubtitle = '';
    newBannerImgBase64 = '';
  }

  function handleToggleBanner(id: string) {
    const b = themeDraft.banners.find(item => item.id === id);
    if (b) {
      b.enabled = !b.enabled;
      themeRepo.saveTheme(themeDraft);
      showToast(`Đã ${b.enabled ? 'bật' : 'tắt'} banner "${b.title}"`);
    }
  }
  // Edit Banner Modal State
  let editingBanner = $state<AdItem | null>(null);
  let editBannerPos = $state<'top' | 'side-left' | 'side-right'>('top');
  let editBannerType = $state<'image' | 'text'>('text');
  let editBannerTitle = $state('');
  let editBannerSubtitle = $state('');
  let editBannerLinkText = $state('');
  let editBannerLinkUrl = $state('');
  let editBannerBgColor = $state('#1e3a8a');
  let editBannerTextColor = $state('#ffffff');
  let editBannerStartDate = $state('');
  let editBannerEndDate = $state('');
  let editBannerImgBase64 = $state('');
  function handleSelectEditBanner(ad: AdItem) {
    editingBanner = ad;
    editBannerPos = ad.position;
    editBannerType = ad.type;
    editBannerTitle = ad.title;
    editBannerSubtitle = ad.subtitle || '';
    editBannerLinkText = ad.linkText || 'Xem Ngay';
    editBannerLinkUrl = ad.linkUrl || '#';
    editBannerBgColor = ad.bgColor || '#1e3a8a';
    editBannerTextColor = ad.textColor || '#ffffff';
    editBannerStartDate = ad.startDate || '';
    editBannerEndDate = ad.endDate || '';
    editBannerImgBase64 = ad.imageUrl || '';
  }

  function handleEditBannerImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        editBannerImgBase64 = (evt.target?.result as string) || '';
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSaveEditBanner(e: Event) {
    e.preventDefault();
    if (!editingBanner) return;
    const target = themeDraft.banners.find(b => b.id === editingBanner?.id);
    if (target) {
      target.position = editBannerPos;
      target.type = editBannerType;
      target.title = editBannerTitle.trim();
      target.subtitle = editBannerSubtitle.trim() || undefined;
      target.linkText = editBannerLinkText.trim() || undefined;
      target.linkUrl = editBannerLinkUrl.trim() || '#';
      target.bgColor = editBannerBgColor;
      target.textColor = editBannerTextColor;
      target.startDate = editBannerStartDate || undefined;
      target.endDate = editBannerEndDate || undefined;
      if (editBannerType === 'image') {
        target.imageUrl = editBannerImgBase64 || target.imageUrl;
      }
      themeRepo.saveTheme(themeDraft);
      showToast('Đã cập nhật banner quảng cáo thành công!');
      editingBanner = null;
    }
  }
  // --- TAB: CUSTOM DYNAMIC TABS MANAGEMENT ---
  let newTabName = $state('');
  let newTabIcon = $state('fa-fire');
  let newTabBannerType = $state<'image' | 'text'>('text');
  let newTabBannerTitle = $state('');
  let newTabBannerSub = $state('');
  let newTabBannerBg = $state('#b91c1c');
  let newTabBannerTextColor = $state('#ffffff');
  let newTabBannerImage = $state('');
  let newTabProductIds = $state<number[]>([]);

  function handleCustomTabBannerUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        newTabBannerImage = (evt.target?.result as string) || '';
      };
      reader.readAsDataURL(file);
    }
  }

  function handleCreateCustomTab(e: Event) {
    e.preventDefault();
    if (!newTabName.trim()) {
      alert('Vui lòng nhập tên tab mới!');
      return;
    }
    const newCustomTab: CustomNavTab = {
      id: 'tab-' + Date.now(),
      name: newTabName.trim(),
      icon: newTabIcon.trim() || 'fa-fire',
      enabled: true,
      bannerType: newTabBannerType,
      bannerTitle: newTabBannerTitle.trim() || newTabName.trim(),
      bannerSubtitle: newTabBannerSub.trim() || undefined,
      bannerBg: newTabBannerBg,
      bannerTextColor: newTabBannerTextColor,
      bannerImage: newTabBannerImage || undefined,
      productIds: [...newTabProductIds]
    };

    themeDraft.customTabs = [...(themeDraft.customTabs || []), newCustomTab];
    themeRepo.saveTheme(themeDraft);
    showToast(`Đã tạo tab tùy biến "${newCustomTab.name}" thành công!`);

    newTabName = '';
    newTabBannerTitle = '';
    newTabBannerSub = '';
    newTabBannerImage = '';
    newTabProductIds = [];
  }

  function handleToggleCustomTab(id: string) {
    const t = themeDraft.customTabs?.find(tab => tab.id === id);
    if (t) {
      t.enabled = !t.enabled;
      themeRepo.saveTheme(themeDraft);
      showToast(`Đã ${t.enabled ? 'bật' : 'tắt'} tab "${t.name}"`);
    }
  }

  function handleDeleteCustomTab(id: string) {
    if (confirm('Xóa tab tùy biến này khỏi thanh điều hướng cửa hàng?')) {
      themeDraft.customTabs = themeDraft.customTabs?.filter(tab => tab.id !== id) || [];
      themeRepo.saveTheme(themeDraft);
      showToast('Đã xóa tab tùy biến!');
    }
  }
  // Edit Custom Tab Modal State
  let editingCustomTab = $state<CustomNavTab | null>(null);
  let edTabName = $state('');
  let edTabIcon = $state('fa-fire');
  let edTabBannerType = $state<'image' | 'text'>('text');
  let edTabBannerTitle = $state('');
  let edTabBannerSub = $state('');
  let edTabBannerBg = $state('#b91c1c');
  let edTabBannerTextColor = $state('#ffffff');
  let edTabBannerImage = $state('');
  let edTabProductIds = $state<number[]>([]);

  function handleOpenEditCustomTab(tab: CustomNavTab) {
    editingCustomTab = tab;
    edTabName = tab.name;
    edTabIcon = tab.icon || 'fa-fire';
    edTabBannerType = tab.bannerType || 'text';
    edTabBannerTitle = tab.bannerTitle || tab.name;
    edTabBannerSub = tab.bannerSubtitle || '';
    edTabBannerBg = tab.bannerBg || '#b91c1c';
    edTabBannerTextColor = tab.bannerTextColor || '#ffffff';
    edTabBannerImage = tab.bannerImage || '';
    edTabProductIds = tab.productIds ? [...tab.productIds] : [];
  }

  function handleEditCustomTabBannerUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        edTabBannerImage = (evt.target?.result as string) || '';
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSaveEditCustomTab(e: Event) {
    e.preventDefault();
    if (!editingCustomTab) return;
    const target = themeDraft.customTabs?.find(t => t.id === editingCustomTab?.id);
    if (target) {
      target.name = edTabName.trim() || target.name;
      target.icon = edTabIcon.trim() || 'fa-fire';
      target.bannerType = edTabBannerType;
      target.bannerTitle = edTabBannerTitle.trim() || target.name;
      target.bannerSubtitle = edTabBannerSub.trim() || undefined;
      target.bannerBg = edTabBannerBg;
      target.bannerTextColor = edTabBannerTextColor;
      target.bannerImage = edTabBannerType === 'image' ? (edTabBannerImage || target.bannerImage) : undefined;
      target.productIds = [...edTabProductIds];
      themeRepo.saveTheme(themeDraft);
      showToast(`Đã lưu thay đổi cho tab "${target.name}"!`);
      editingCustomTab = null;
    }
  }

  function handleToggleProductInTab(tabId: string, prodId: number) {
    const t = themeDraft.customTabs?.find(tab => tab.id === tabId);
    if (t) {
      if (t.productIds.includes(prodId)) {
        t.productIds = t.productIds.filter(id => id !== prodId);
      } else {
        t.productIds = [...t.productIds, prodId];
      }
      themeRepo.saveTheme(themeDraft);
    }
  }
  function handleDeleteBanner(id: string) {
    if (confirm('Bạn có chắc muốn xóa banner này?')) {
      themeDraft.banners = themeDraft.banners.filter(item => item.id !== id);
      themeRepo.saveTheme(themeDraft);
      if (editingBanner?.id === id) editingBanner = null;
      showToast('Đã xóa banner quảng cáo!');
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

      <!-- Clean Live Stage Footer -->
      <div class="text-center pt-3 border-t border-slate-200">
        <a href="./index.html" class="text-xs text-slate-500 hover:text-slate-800 underline">
          &larr; Trở về Website Cửa Hàng
        </a>
      </div>
    </div>
  </div>
{:else}
  <!-- LIGHT MINIMALIST LOGGED-IN ADMIN PORTAL -->
  <!-- LIGHT MINIMALIST LOGGED-IN ADMIN PORTAL WITH LEFT VERTICAL SIDEBAR -->
  <div class="min-h-screen bg-slate-100 text-slate-800 flex flex-col md:flex-row">
    <!-- LEFT VERTICAL SIDEBAR -->
    <aside class="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-300 flex flex-col justify-between shrink-0 sticky top-0 md:h-screen z-40">
      <div>
        <!-- Sidebar Brand -->
        <div class="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span class="text-base font-black tracking-tight text-slate-900 block leading-tight">CSET STORE</span>
            <span class="text-[11px] text-slate-500 font-medium block">Hệ Thống Quản Trị</span>
          </div>
          <a
            href="./index.html"
            target="_blank"
            class="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold text-slate-700 transition"
            title="Xem Web Shop"
          >
            Web Shop ↗
          </a>
        </div>

        <!-- Current Admin Info -->
        <div class="p-4 bg-slate-50 border-b border-slate-200">
          <span class="text-xs font-bold text-slate-900 block">{currentAdmin.fullName}</span>
          <span class="text-[10px] text-slate-500 block uppercase font-semibold mt-0.5">
            {ROLE_LABELS[currentAdmin.role] || currentAdmin.role}
          </span>
        </div>

        <!-- Left Vertical Navigation Menu (Re-ordered exactly: Đơn hàng, Ngành hàng, Hàng hóa, Mã giảm giá, Tab tùy biến, Banner quảng cáo, Tùy chỉnh giao diện, Báo cáo thống kê, Quản lý tài khoản, Sao lưu) -->
        <nav class="p-3 space-y-1">
          <!-- 1. ĐƠN HÀNG (Super Admin, Sales Admin) -->
          {#if authService.canManageOrders(currentAdmin.role)}
            <button
              type="button"
              onclick={() => { activeTab = 'orders'; syncOrdersFromServer(false); }}
              class="w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between {activeTab === 'orders'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'}"
            >
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-receipt w-4 text-center"></i>
                <span>Đơn Hàng</span>
              </span>
              <span class="text-[11px] px-2 py-0.5 rounded-full {activeTab === 'orders' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}">
                {orders.length}
              </span>
            </button>
          {/if}

          <!-- 2. NGÀNH HÀNG (Super Admin, Kho Admin) -->
          {#if authService.canManageInventory(currentAdmin.role)}
            <button
              type="button"
              onclick={() => activeTab = 'categories'}
              class="w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between {activeTab === 'categories'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'}"
            >
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-layer-group w-4 text-center"></i>
                <span>Ngành Hàng & Loại</span>
              </span>
              <span class="text-[11px] px-2 py-0.5 rounded-full {activeTab === 'categories' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}">
                {categories.length}
              </span>
            </button>
          {/if}

          <!-- 3. HÀNG HÓA (Super Admin, Kho Admin) -->
          {#if authService.canManageInventory(currentAdmin.role)}
            <button
              type="button"
              onclick={() => activeTab = 'inventory'}
              class="w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between {activeTab === 'inventory'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'}"
            >
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-boxes-stacked w-4 text-center"></i>
                <span>Hàng Hóa / Kho</span>
              </span>
              <span class="text-[11px] px-2 py-0.5 rounded-full {activeTab === 'inventory' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}">
                {products.length}
              </span>
            </button>
          {/if}

          <!-- 4. MÃ GIẢM GIÁ (Cả 3 Admin đều được xem và quản lý) -->
          <button
            type="button"
            onclick={() => activeTab = 'coupons'}
            class="w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between {activeTab === 'coupons'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'}"
          >
            <span class="flex items-center gap-2.5">
              <i class="fa-solid fa-ticket text-amber-500 w-4 text-center"></i>
              <span>Mã Giảm Giá</span>
            </span>
            <span class="text-[11px] px-2 py-0.5 rounded-full {activeTab === 'coupons' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}">
              {coupons.length}
            </span>
          </button>

          <!-- ĐÁNH GIÁ KHÁCH HÀNG (Cả 3 Admin đều được xem và quản lý) -->
          <button
            type="button"
            onclick={() => activeTab = 'reviews'}
            class="w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between {activeTab === 'reviews'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'}"
          >
            <span class="flex items-center gap-2.5">
              <i class="fa-solid fa-comments text-blue-500 w-4 text-center"></i>
              <span>Đánh Giá Khách Hàng</span>
            </span>
            <span class="text-[11px] px-2 py-0.5 rounded-full {activeTab === 'reviews' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}">
              {reviews.length}
            </span>
          </button>

          <!-- 5. TAB TÙY BIẾN (Super Admin, Kho Admin) -->
          {#if authService.canManageInventory(currentAdmin.role)}
            <button
              type="button"
              onclick={() => activeTab = 'customTabs'}
              class="w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between {activeTab === 'customTabs'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'}"
            >
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-fire text-amber-500 w-4 text-center"></i>
                <span>Tab Tùy Biến (Hot/Sale)</span>
              </span>
              <span class="text-[11px] px-2 py-0.5 rounded-full {activeTab === 'customTabs' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}">
                {themeDraft.customTabs?.length || 0}
              </span>
            </button>
          {/if}

          <!-- 6. BANNER QUẢNG CÁO (Super Admin) -->
          {#if authService.canManageUsers(currentAdmin.role)}
            <button
              type="button"
              onclick={() => activeTab = 'banners'}
              class="w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between {activeTab === 'banners'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'}"
            >
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-bullhorn w-4 text-center"></i>
                <span>Banner Quảng Cáo</span>
              </span>
              <span class="text-[11px] px-2 py-0.5 rounded-full {activeTab === 'banners' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}">
                {themeDraft.banners?.length || 0}
              </span>
            </button>
          {/if}

          <!-- 7. TÙY CHỈNH GIAO DIỆN (Super Admin) -->
          {#if authService.canManageUsers(currentAdmin.role)}
            <button
              type="button"
              onclick={() => activeTab = 'theme'}
              class="w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between {activeTab === 'theme'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'}"
            >
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-palette w-4 text-center"></i>
                <span>Tùy Chỉnh Giao Diện</span>
              </span>
            </button>
          {/if}

          <!-- 8. BÁO CÁO THỐNG KÊ (Sales Admin, Super Admin) -->
          {#if authService.canViewReports(currentAdmin.role)}
            <button
              type="button"
              onclick={() => activeTab = 'reports'}
              class="w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between {activeTab === 'reports'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'}"
            >
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-chart-line text-blue-700 w-4 text-center"></i>
                <span>Báo Cáo & Thống Kê</span>
              </span>
            </button>
          {/if}

          <!-- 9. QUẢN LÝ TÀI KHOẢN (Super Admin) -->
          {#if authService.canManageUsers(currentAdmin.role)}
            <button
              type="button"
              onclick={() => activeTab = 'users'}
              class="w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between {activeTab === 'users'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'}"
            >
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-users w-4 text-center"></i>
                <span>Quản Lý Tài Khoản</span>
              </span>
              <span class="text-[11px] px-2 py-0.5 rounded-full {activeTab === 'users' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}">
                {users.length}
              </span>
            </button>
          {/if}

          <!-- 10. SAO LƯU & PHỤC HỒI (Super Admin) -->
          {#if authService.canManageBackups(currentAdmin.role)}
            <button
              type="button"
              onclick={() => activeTab = 'backup'}
              class="w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between {activeTab === 'backup'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'}"
            >
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-cloud-arrow-down text-emerald-700 w-4 text-center"></i>
                <span>Sao Lưu & Phục Hồi</span>
              </span>
            </button>
          {/if}
        </nav>
      </div>

      <!-- Sidebar Logout Button -->
      <div class="p-4 border-t border-slate-200 bg-white">
        <button
          type="button"
          onclick={handleLogout}
          class="w-full py-2 px-3 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
        >
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
          <span>Đăng Xuất</span>
        </button>
      </div>
    </aside>

    <!-- RIGHT MAIN CONTENT WRAPPER -->
    <div class="flex-grow flex flex-col justify-between overflow-x-hidden min-h-screen">
      <main class="p-4 sm:p-6 lg:p-8 flex-grow">
      {#if activeTab === 'orders' && authService.canManageOrders(currentAdmin.role)}
        <!-- ORDERS MODULE (LIGHT MINIMALIST) -->
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-300">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Quản Lý & Theo Dõi Đơn Hàng</h2>
              <p class="text-xs text-slate-500">Xem tiến độ, thông tin khách nhận và cập nhật trạng thái đơn</p>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs text-slate-600 font-semibold bg-slate-200/80 px-2.5 py-1 rounded">
                Tổng: {orders.length} đơn
              </span>
              <button
                type="button"
                onclick={() => syncOrdersFromServer(true)}
                disabled={isSyncingOrders}
                class="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded shadow-xs cursor-pointer transition"
                title="Tải lại tất cả đơn hàng mới nhất từ máy chủ"
              >
                <i class="fa-solid fa-rotate {isSyncingOrders ? 'fa-spin' : ''}"></i>
                <span>{isSyncingOrders ? 'Đang đồng bộ...' : 'Đồng bộ từ máy chủ'}</span>
              </button>
              {#if lastOrderSyncTime}
                <span class="text-[11px] text-slate-500">
                  (Đã đồng bộ: {lastOrderSyncTime})
                </span>
              {/if}
            </div>
          </div>
          <!-- ORDER FILTER CONTROLS BAR -->
          <div class="bg-white border border-slate-300 rounded-lg p-3.5 space-y-3 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div class="space-y-1">
                <label for="ord-q" class="font-semibold text-slate-700 block">Tìm mã đơn, tên, SĐT</label>
                <input
                  id="ord-q"
                  type="text"
                  bind:value={orderSearchQuery}
                  placeholder="Mã đơn, Nguyễn Văn A, SĐT..."
                  class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div class="space-y-1">
                <label for="ord-period" class="font-semibold text-slate-700 block">Duyệt theo chu kỳ</label>
                <select
                  id="ord-period"
                  bind:value={orderTimePeriod}
                  class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 bg-white"
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="today">Đơn hàng hôm nay</option>
                  <option value="week">Đơn trong tuần này (7 ngày)</option>
                  <option value="month">Đơn trong tháng này (30 ngày)</option>
                </select>
              </div>

              <div class="space-y-1">
                <label for="ord-date" class="font-semibold text-slate-700 block">Lọc chính xác ngày đặt</label>
                <input
                  id="ord-date"
                  type="date"
                  bind:value={orderFilterDate}
                  class="w-full border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 bg-white"
                />
              </div>

              <div class="space-y-1">
                <label for="ord-status-filter" class="font-semibold text-slate-700 block">Trạng thái đơn</label>
                <select
                  id="ord-status-filter"
                  bind:value={orderFilterStatus}
                  class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 bg-white"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ xác nhận</option>
                  <option value="processing">Đang xử lý / Đóng gói</option>
                  <option value="completed">Đã giao hoàn tất</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
            </div>

            {#if orderSearchQuery || orderFilterStatus !== 'all' || orderFilterDate || orderTimePeriod !== 'all'}
              <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                <span class="text-slate-500">Tìm thấy <strong>{filteredOrders.length}</strong> đơn phù hợp</span>
                <button
                  type="button"
                  onclick={() => { orderSearchQuery = ''; orderFilterStatus = 'all'; orderFilterDate = ''; orderTimePeriod = 'all'; }}
                  class="text-blue-700 hover:underline cursor-pointer font-semibold"
                >
                  ✕ Đặt lại bộ lọc
                </button>
              </div>
            {/if}
          </div>

          {#if filteredOrders.length === 0}
            <div class="bg-white border border-slate-300 rounded-lg p-10 text-center text-slate-500 text-sm">
              Không tìm thấy đơn hàng nào phù hợp với bộ lọc tìm kiếm.
            </div>
          {:else}
            <div class="space-y-3">
              {#each filteredOrders as ord (ord.id)}
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
                      <div class="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-none">
                        <div class="flex items-center gap-2">
                          {#if item.image}
                            <img src={item.image} alt="Thumb" class="w-7 h-7 rounded object-cover border border-slate-200 shrink-0" />
                          {/if}
                          <div>
                            {#if item.productId}
                              <a
                                href="./index.html#/product/{item.productId}"
                                target="_blank"
                                class="text-blue-900 font-semibold hover:underline inline-flex items-center gap-1"
                                title="Xem trang chi tiết sản phẩm này trên web shop (mở tab mới)"
                              >
                                <span>{item.name}</span>
                                <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-slate-400"></i>
                              </a>
                            {:else}
                              <span class="font-medium text-slate-800">{item.name}</span>
                            {/if}
                            <strong class="text-slate-600 ml-1">x{item.quantity}</strong>
                            {#if item.selectedVariants && Object.keys(item.selectedVariants).length > 0}
                              <div class="text-[10px] text-slate-500">
                                {Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(', ')}
                              </div>
                            {/if}
                          </div>
                        </div>
                        <span class="font-semibold text-slate-800 shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    {/each}
                  </div>

                  <div class="flex justify-end pt-1 text-xs font-bold text-slate-900">
                    Tổng tiền: <span class="ml-2 text-sm text-blue-900">{formatCurrency(ord.totalAmount)}</span>
                  </div>
                </div>
              {/each}

              <!-- Orders Pagination -->
              <Pagination
                currentPage={orderCurrentPage}
                totalItems={filteredOrders.length}
                pageSize={orderPageSize}
                onPageChange={(p) => orderCurrentPage = p}
              />
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
                    {#each categories as c}
                      <option value={c.key}>{c.label}</option>
                    {/each}
                  </select>
                </div>

                <div class="space-y-1">
                  <label for="inv-subcat" class="font-semibold text-slate-700">Loại danh mục</label>
                  <div class="flex gap-1.5">
                    <select
                      id="inv-subcat"
                      bind:value={pSubCategory}
                      class="flex-grow border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    >
                      <option value="">-- Chọn loại danh mục --</option>
                      {#each currentSubCategories as sub}
                        <option value={sub.name}>{sub.name}</option>
                      {/each}
                    </select>
                    <button
                      type="button"
                      onclick={() => activeTab = 'categories'}
                      class="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-[11px] text-slate-700 shrink-0 font-medium cursor-pointer"
                      title="Tạo thêm loại danh mục mới"
                    >
                      + Thêm loại
                    </button>
                  </div>
                </div>

                <div class="space-y-1">
                  <label for="inv-brand" class="font-semibold text-slate-700">Thương hiệu</label>
                  <input
                    id="inv-brand"
                    type="text"
                    bind:value={pBrand}
                    placeholder="Sony, Apple, De'Longhi..."
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="inv-sku" class="font-semibold text-slate-700">Mã SKU / Model</label>
                  <input
                    id="inv-sku"
                    type="text"
                    bind:value={pSku}
                    placeholder="SP-2026-001..."
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="inv-price" class="font-semibold text-slate-700">Giá bán khuyến mãi (VNĐ) *</label>
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
                  <label for="inv-disc-pct" class="font-semibold text-slate-700">Mức giảm giá (% từ 1 - 99)</label>
                  <input
                    id="inv-disc-pct"
                    type="number"
                    min="0"
                    max="99"
                    bind:value={pDiscountPercent}
                    placeholder="Ví dụ: 20 (Giảm 20%)"
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="inv-disc-start" class="font-semibold text-slate-700">Bắt đầu giảm giá (Lịch hẹn)</label>
                  <input
                    id="inv-disc-start"
                    type="datetime-local"
                    bind:value={pDiscountStartDate}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 bg-white"
                  />
                </div>

                <div class="space-y-1">
                  <label for="inv-disc-end" class="font-semibold text-slate-700">Kết thúc giảm giá (Lịch hẹn)</label>
                  <input
                    id="inv-disc-end"
                    type="datetime-local"
                    bind:value={pDiscountEndDate}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 bg-white"
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
                <div class="space-y-1">
                  <label for="inv-sold" class="font-semibold text-slate-700">Lượt bán đã đạt (Số lượng)</label>
                  <input
                    id="inv-sold"
                    type="number"
                    min="0"
                    bind:value={pSoldCount}
                    placeholder="Ví dụ: 350"
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="inv-limit" class="font-semibold text-slate-700 flex justify-between items-center">
                    <span>Giới hạn mua / đơn</span>
                    <span class="text-[10px] text-slate-400 font-normal">0 = theo chung</span>
                  </label>
                  <input
                    id="inv-limit"
                    type="number"
                    min="0"
                    bind:value={pMaxPurchaseLimit}
                    placeholder="0 (áp dụng giới hạn chung)"
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    title="Số lượng mua tối đa cho mỗi đơn hàng (0 hoặc để trống = theo giới hạn chung)"
                  />
                </div>
                <div class="space-y-1">
                  <span class="font-semibold text-slate-700 block text-xs">Hiển Thị Nổi Bật Trang Chủ</span>
                  <label class="flex items-center gap-2 p-1.5 rounded border border-slate-300 bg-white cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" bind:checked={pShowOnHome} class="w-4 h-4 accent-amber-500 cursor-pointer" />
                    <span class="text-xs font-semibold text-slate-800">Ghim vào khối nổi bật trang chủ</span>
                  </label>
                </div>
                <div class="space-y-1">
                  <label for="inv-origin" class="font-semibold text-slate-700">Xuất xứ sản phẩm</label>
                  <input
                    id="inv-origin"
                    type="text"
                    bind:value={pOrigin}
                    placeholder="Việt Nam, Nhật Bản, Hàn Quốc..."
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="inv-warranty" class="font-semibold text-slate-700">Chính sách bảo hành</label>
                  <input
                    id="inv-warranty"
                    type="text"
                    bind:value={pWarranty}
                    placeholder="12 tháng chính hãng..."
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="inv-weight" class="font-semibold text-slate-700">Khối lượng / Kích thước</label>
                  <input
                    id="inv-weight"
                    type="text"
                    bind:value={pWeight}
                    placeholder="350g, 45 x 30 x 15 cm..."
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="inv-cond" class="font-semibold text-slate-700">Tình trạng sản phẩm</label>
                  <input
                    id="inv-cond"
                    type="text"
                    bind:value={pCondition}
                    placeholder="Mới 100% Nguyên Seal..."
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1 md:col-span-3 bg-slate-50 p-3.5 rounded border border-slate-200">
                  <label for="inv-imgs" class="font-semibold text-slate-700 flex justify-between items-center">
                    <span>Thêm Nhiều Hình Ảnh Sản Phẩm (Chọn cùng lúc nhiều file ảnh)</span>
                    {#if pImagesList.length > 0}
                      <button type="button" onclick={() => { pImagesList = []; pImgBase64 = ''; }} class="text-red-600 hover:underline cursor-pointer text-[11px]">
                        ✕ Xóa tất cả ảnh đã chọn
                      </button>
                    {/if}
                  </label>
                  <input
                    id="inv-imgs"
                    type="file"
                    multiple
                    accept="image/*"
                    onchange={handleProductMultipleImages}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-600 bg-white"
                  />
                  {#if pImagesList.length > 0}
                    <div class="flex flex-wrap gap-2 pt-2">
                      {#each pImagesList as img, imgIdx}
                        <div class="w-14 h-14 rounded border border-slate-300 overflow-hidden relative group">
                          <img src={img} alt="Thumbnail {imgIdx}" class="w-full h-full object-cover" />
                          <button
                            type="button"
                            onclick={() => pImagesList = pImagesList.filter((_, i) => i !== imgIdx)}
                            class="absolute top-0 right-0 bg-red-600 text-white w-4 h-4 text-[10px] flex items-center justify-center cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
                <!-- Dynamic Technical Specifications List -->
                <div class="space-y-2 md:col-span-3 bg-slate-50 p-3.5 rounded border border-slate-200">
                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-slate-800 text-xs">Thông số kỹ thuật chi tiết (Tùy chọn)</span>
                    <button
                      type="button"
                      onclick={addSpecField}
                      class="text-[11px] text-blue-700 hover:underline font-semibold cursor-pointer"
                    >
                      + Thêm thông số
                    </button>
                  </div>

                  {#each pSpecs as spec, idx}
                    <div class="flex items-center gap-2">
                      <input
                        type="text"
                        bind:value={spec.name}
                        placeholder="Tên thông số (Vd: Dung lượng pin, Chất liệu...)"
                        class="flex-1 border border-slate-300 rounded px-2.5 py-1 text-xs bg-white"
                      />
                      <input
                        type="text"
                        bind:value={spec.value}
                        placeholder="Giá trị (Vd: 5000mAh, Da PU...)"
                        class="flex-1 border border-slate-300 rounded px-2.5 py-1 text-xs bg-white"
                      />
                      {#if pSpecs.length > 1}
                        <button
                          type="button"
                          onclick={() => removeSpecField(idx)}
                          class="text-red-500 hover:text-red-700 text-xs px-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      {/if}
                    </div>
                  {/each}
                </div>

                <!-- Dynamic Product Variant Groups (Phân loại: Màu sắc, Kích thước, Dung lượng...) -->
                <div class="space-y-3 md:col-span-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <span class="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <i class="fa-solid fa-layer-group text-blue-900"></i>
                        Phân Loại & Biến Thể Sản Phẩm (Tùy chọn)
                      </span>
                      <p class="text-[11px] text-slate-500">Thêm các nhóm lựa chọn như Màu sắc, Size, Dung lượng... để khách hàng lựa chọn khi mua</p>
                    </div>
                    <button
                      type="button"
                      onclick={addVariantGroup}
                      class="text-[11px] bg-white border border-slate-300 hover:bg-slate-100 text-blue-900 px-2.5 py-1 rounded font-semibold cursor-pointer shrink-0"
                    >
                      + Thêm nhóm phân loại
                    </button>
                  </div>

                  <!-- Presets for quick adding -->
                  <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span class="text-slate-500 font-medium">Gợi ý nhanh:</span>
                    <button
                      type="button"
                      onclick={() => addPresetVariant('Màu sắc', 'Đen, Trắng, Xanh, Xám')}
                      class="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 cursor-pointer"
                    >
                      + Màu sắc
                    </button>
                    <button
                      type="button"
                      onclick={() => addPresetVariant('Kích thước', 'S, M, L, XL, 2XL')}
                      class="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 cursor-pointer"
                    >
                      + Kích thước
                    </button>
                    <button
                      type="button"
                      onclick={() => addPresetVariant('Dung lượng', '128GB, 256GB, 512GB, 1TB')}
                      class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                    >
                      + Dung lượng
                    </button>
                    <button
                      type="button"
                      onclick={() => addPresetVariant('Phiên bản', 'Bản Tiêu Chuẩn, Bản Nâng Cao')}
                      class="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                    >
                      + Phiên bản
                    </button>
                  </div>

                  {#if pVariantGroups.length === 0}
                    <p class="text-[11px] text-slate-400 italic py-1">
                      Chưa có phân loại nào. Sản phẩm này sẽ là phiên bản đơn nhất. Bạn có thể nhấn các gợi ý nhanh phía trên hoặc bấm nút "Thêm nhóm phân loại" để tạo biến thể.
                    </p>
                  {:else}
                    <div class="space-y-3 pt-1">
                      {#each pVariantGroups as vg, idx}
                        <div class="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-2xs">
                          <div class="flex items-center justify-between gap-2">
                            <span class="font-bold text-[11px] text-blue-950 uppercase">Nhóm phân loại #{idx + 1}</span>
                            <button
                              type="button"
                              onclick={() => removeVariantGroup(idx)}
                              class="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                              title="Xóa nhóm này"
                            >
                              ✕ Xóa nhóm
                            </button>
                          </div>
                          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <span class="text-[10px] font-bold text-slate-600 block mb-0.5">Tên nhóm (Vd: Màu sắc) *</span>
                              <input
                                type="text"
                                bind:value={vg.name}
                                placeholder="Màu sắc, Size, Dung lượng..."
                                class="w-full border border-slate-300 rounded px-2.5 py-1 text-xs bg-slate-50 focus:bg-white"
                              />
                            </div>
                            <div class="sm:col-span-2">
                              <span class="text-[10px] font-bold text-slate-600 block mb-0.5">Các tùy chọn (cách nhau bởi dấu phẩy) *</span>
                              <input
                                type="text"
                                bind:value={vg.optionsStr}
                                placeholder="Vd: Đen, Trắng, Xanh Ngọc, Đỏ San Hô"
                                class="w-full border border-slate-300 rounded px-2.5 py-1 text-xs bg-slate-50 focus:bg-white"
                              />
                            </div>
                          </div>
                          {#if vg.optionsStr.trim()}
                            <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
                              <span class="text-[10px] text-slate-400">Xem trước tùy chọn:</span>
                              {#each vg.optionsStr.split(',').map(s => s.trim()).filter(Boolean) as opt}
                                <span class="px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 rounded text-[10px] font-semibold">
                                  {opt}
                                </span>
                              {/each}
                            </div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {/if}
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

          <!-- Product Table Card with Category Filter -->
          <div class="bg-white border border-slate-300 rounded-lg p-4 space-y-3.5">
            <!-- Home Featured Products Configuration Bar -->
            <div class="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div class="space-y-0.5">
                <span class="font-bold text-slate-900 flex items-center gap-1.5">
                  <i class="fa-solid fa-sparkles text-amber-500"></i>
                  Cấu Hình Khối Sản Phẩm Bán Chạy & Nổi Bật Trang Chủ
                </span>
                <p class="text-[11px] text-slate-500">
                  Tự động chọn ra 5 sản phẩm có lượt bán cao nhất hoặc tự chọn các sản phẩm ghim hiển thị tại trang chủ
                </p>
              </div>

              <div class="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onclick={handleAutoSelectTop5}
                  class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer shadow-xs transition flex items-center gap-1.5"
                  title="Tự động quét và chọn 5 sản phẩm có lượt bán cao nhất"
                >
                  <i class="fa-solid fa-bolt"></i>
                  <span>Auto Chọn 5 Bán Chạy</span>
                </button>

                <span class="px-2.5 py-1 rounded bg-white border border-amber-200 text-slate-700 font-bold text-[11px]">
                  Đang ghim trang chủ: <strong class="text-blue-900">{products.filter(p => p.showOnHome).length}</strong> SP
                </span>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 class="text-sm font-bold text-slate-900">Danh Sách Sản Phẩm ({filteredInventoryProducts.length} / {products.length})</h3>
                <span class="text-xs text-slate-500">Lọc theo ngành hàng hoặc loại danh mục chi tiết</span>
              </div>
              <!-- Filters -->
              <div class="flex items-center gap-2">
                <select
                  bind:value={filterInvCategory}
                  onchange={() => filterInvSubCategory = ''}
                  class="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-800"
                >
                  <option value="all">Tất cả ngành hàng</option>
                  {#each categories as c}
                    <option value={c.key}>{c.label}</option>
                  {/each}
                </select>

                {#if filterInvCategory !== 'all'}
                  {@const currentCatSubs = categories.find(c => c.key === filterInvCategory)?.subcategories || []}
                  {#if currentCatSubs.length > 0}
                    <select
                      bind:value={filterInvSubCategory}
                      class="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-800"
                    >
                      <option value="">Tất cả loại danh mục</option>
                      {#each currentCatSubs as sub}
                        <option value={sub.name}>{sub.name}</option>
                      {/each}
                    </select>
                  {/if}
                {/if}
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-700">
                <thead class="bg-slate-100 border-b border-slate-200 text-slate-800 font-semibold uppercase text-[11px]">
                  <tr>
                    <th class="p-2.5">Ảnh</th>
                    <th class="p-2.5">Tên Sản Phẩm</th>
                    <th class="p-2.5 text-center">Ghim Trang Chủ</th>
                    <th class="p-2.5 text-center">Lượt Bán</th>
                    <th class="p-2.5">Link Sản Phẩm & Share</th>
                    <th class="p-2.5">Ngành & Loại</th>
                    <th class="p-2.5">Giá Bán</th>
                    <th class="p-2.5">Tồn Kho</th>
                    <th class="p-2.5 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  {#if filteredInventoryProducts.length === 0}
                    <tr>
                      <td colspan="6" class="p-6 text-center text-slate-400 italic">Không có sản phẩm nào phù hợp bộ lọc.</td>
                    </tr>
                  {:else}
                    {#each paginatedInventoryProducts as p (p.id)}
                      {@const prodUrl = `${typeof window !== 'undefined' ? window.location.origin + window.location.pathname.replace('admin.html', 'index.html') : ''}#/product/${p.id}`}
                      <tr class="hover:bg-slate-50">
                        <td class="p-2.5">
                          <div class="w-10 h-10 rounded overflow-hidden border border-slate-200 relative">
                            <img src={p.image} alt={p.name} class="w-full h-full object-cover" />
                            {#if p.images && p.images.length > 1}
                              <span class="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] px-1 font-bold">
                                +{p.images.length - 1}
                              </span>
                            {/if}
                          </div>
                        </td>
                        <td class="p-2.5">
                          <span class="font-semibold text-slate-900 block">{p.name}</span>
                          {#if p.sku}
                            <span class="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</span>
                          {/if}
                        </td>
                        <td class="p-2.5 text-center">
                          <button
                            type="button"
                            onclick={() => handleToggleShowOnHome(p)}
                            class="px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition inline-flex items-center gap-1 {p.showOnHome
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs hover:bg-amber-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}"
                            title={p.showOnHome ? 'Bấm để bỏ ghim khỏi trang chủ' : 'Bấm để ghim sản phẩm này lên khối nổi bật trang chủ'}
                          >
                            <i class="fa-solid {p.showOnHome ? 'fa-star text-amber-500' : 'fa-plus text-slate-400'}"></i>
                            <span>{p.showOnHome ? 'Đang Ghim' : 'Chưa Ghim'}</span>
                          </button>
                        </td>
                        <td class="p-2.5 text-center">
                          <span class="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {p.soldCount || 0}
                          </span>
                        </td>
                        <td class="p-2.5">
                          <div class="flex items-center gap-1.5 max-w-xs">
                            <span class="text-[11px] font-mono text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 truncate select-all" title={prodUrl}>
                              #/product/{p.id}
                            </span>
                            <button
                              type="button"
                              onclick={() => {
                                if (navigator.clipboard) {
                                  navigator.clipboard.writeText(prodUrl);
                                }
                                showToast(`Đã copy link sản phẩm #${p.id} vào clipboard!`);
                              }}
                              class="p-1 px-2 text-[10px] font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded text-slate-700 cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                              title="Copy link sản phẩm"
                            >
                              <i class="fa-solid fa-copy text-blue-900"></i>
                              <span>Copy</span>
                            </button>
                            <a
                              href={prodUrl}
                              target="_blank"
                              rel="noreferrer"
                              class="p-1 text-[10px] text-slate-400 hover:text-blue-900"
                              title="Mở xem trang sản phẩm"
                            >
                              <i class="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </div>
                        </td>
                        <td class="p-2.5">
                          <span class="text-slate-800 font-medium capitalize block">{p.category}</span>
                          {#if p.subCategory}
                            <span class="text-[10px] text-purple-700 block font-semibold">Loại: {p.subCategory}</span>
                          {/if}
                        </td>
                        <td class="p-2.5">
                          <span class="font-bold text-slate-900 block">{formatCurrency(p.price)}</span>
                          {#if p.discountPercent && p.discountPercent > 0}
                            <span class="text-[10px] text-rose-600 font-bold block">
                              Giảm {p.discountPercent}%
                              {#if p.discountStartDate || p.discountEndDate}
                                <span class="text-[9px] text-slate-400 block font-normal">Hẹn giờ</span>
                              {/if}
                            </span>
                          {/if}
                        </td>
                        <td class="p-2.5">
                          <span class="font-semibold">{p.stock ?? 50}</span>
                          {#if p.maxPurchaseLimit && p.maxPurchaseLimit > 0}
                            <span class="block text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded font-semibold w-max mt-0.5" title="Giới hạn số lượng mua trong 1 đơn">
                              Tối đa: {p.maxPurchaseLimit}
                            </span>
                          {/if}
                        </td>
                        <td class="p-2.5 text-center space-x-2">
                          <button
                            type="button"
                            onclick={() => handleOpenEditProduct(p)}
                            class="text-blue-600 hover:underline cursor-pointer font-semibold"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onclick={() => handleDeleteProduct(p.id, p.name)}
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

            <!-- Inventory Pagination Controls -->
            <Pagination
              currentPage={invCurrentPage}
              totalItems={filteredInventoryProducts.length}
              pageSize={invPageSize}
              onPageChange={(p) => invCurrentPage = p}
            />
          </div>
          <!-- EDIT PRODUCT MODAL -->
          {#if editingProduct}
            <div class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div class="bg-white border border-slate-300 rounded-xl p-6 w-full max-w-2xl shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 class="text-sm font-bold text-slate-900">
                      Chỉnh Sửa Sản Phẩm: {editingProduct.name}
                    </h4>
                    <p class="text-[11px] text-slate-500">ID sản phẩm: #{editingProduct.id}</p>
                  </div>
                  <button
                    type="button"
                    onclick={() => editingProduct = null}
                    class="text-slate-400 hover:text-slate-800 text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onsubmit={handleSaveEditProduct} class="space-y-4 text-xs">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div class="space-y-1 sm:col-span-2">
                      <label for="ed-pr-name" class="font-semibold text-slate-700">Tên Sản Phẩm *</label>
                      <input id="ed-pr-name" type="text" bind:value={edPName} required class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none" />
                    </div>

                    <div class="space-y-1">
                      <label for="ed-pr-brand" class="font-semibold text-slate-700">Thương hiệu</label>
                      <input id="ed-pr-brand" type="text" bind:value={edPBrand} class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none" />
                    </div>

                    <div class="space-y-1">
                      <label for="ed-pr-cat" class="font-semibold text-slate-700">Ngành hàng</label>
                      <select id="ed-pr-cat" bind:value={edPCategory} class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 bg-white">
                        {#each categories as c}
                          <option value={c.key}>{c.label}</option>
                        {/each}
                      </select>
                    </div>

                    <div class="space-y-1">
                      <label for="ed-pr-sub" class="font-semibold text-slate-700">Loại danh mục</label>
                      <select id="ed-pr-sub" bind:value={edPSubCategory} class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 bg-white">
                        <option value="">-- Chọn loại danh mục --</option>
                        {#each (categories.find(c => c.key === edPCategory)?.subcategories || []) as sub}
                          <option value={sub.name}>{sub.name}</option>
                        {/each}
                      </select>
                    </div>

                    <div class="space-y-1">
                      <label for="ed-pr-sku" class="font-semibold text-slate-700">Mã SKU</label>
                      <input id="ed-pr-sku" type="text" bind:value={edPSku} class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none" />
                    </div>

                    <div class="space-y-1">
                      <label for="ed-pr-price" class="font-semibold text-slate-700">Giá bán (VNĐ) *</label>
                      <input id="ed-pr-price" type="number" bind:value={edPPrice} required class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none" />
                    </div>

                    <div class="space-y-1">
                      <label for="ed-pr-orig" class="font-semibold text-slate-700">Giá gốc niêm yết</label>
                      <input id="ed-pr-orig" type="number" bind:value={edPOrigPrice} class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none" />
                    </div>

                    <div class="space-y-1">
                      <label for="ed-pr-stock" class="font-semibold text-slate-700">Số lượng tồn kho</label>
                      <input id="ed-pr-stock" type="number" bind:value={edPStock} class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none" />
                    </div>

                    <div class="space-y-1">
                      <label for="ed-pr-sold" class="font-semibold text-slate-700">Lượt bán đã đạt</label>
                      <input id="ed-pr-sold" type="number" min="0" bind:value={edPSoldCount} class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none" />
                    </div>

                    <div class="space-y-1">
                      <label for="ed-pr-limit" class="font-semibold text-slate-700 flex justify-between items-center">
                        <span>Giới hạn mua / đơn</span>
                        <span class="text-[10px] text-slate-400 font-normal">0 = theo chung</span>
                      </label>
                      <input
                        id="ed-pr-limit"
                        type="number"
                        min="0"
                        bind:value={edPMaxPurchaseLimit}
                        placeholder="0 (áp dụng giới hạn chung)"
                        class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                        title="Số lượng mua tối đa cho mỗi đơn hàng (0 hoặc để trống = theo giới hạn chung)"
                      />
                    </div>
                    <div class="space-y-1">
                      <span class="font-semibold text-slate-700 block text-xs">Ghim Khối Nổi Bật Trang Chủ</span>
                      <label class="flex items-center gap-2 p-1.5 rounded border border-slate-300 bg-white cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" bind:checked={edPShowOnHome} class="w-4 h-4 accent-amber-500 cursor-pointer" />
                        <span class="text-xs font-semibold text-slate-800">Hiển thị ở trang chủ</span>
                      </label>
                    </div>

                    <!-- Timed Discount Configuration in Edit Modal -->
                    <div class="space-y-1">
                      <label for="ed-pr-pct" class="font-semibold text-slate-700">Giảm giá (% từ 1 - 99)</label>
                      <input id="ed-pr-pct" type="number" min="0" max="99" bind:value={edPDiscountPercent} placeholder="Vd: 20" class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none" />
                    </div>

                    <div class="space-y-1">
                      <label for="ed-pr-dstart" class="font-semibold text-slate-700">Bắt đầu giảm giá</label>
                      <input id="ed-pr-dstart" type="datetime-local" bind:value={edPDiscountStartDate} class="w-full border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 bg-white" />
                    </div>

                    <div class="space-y-1">
                      <label for="ed-pr-dend" class="font-semibold text-slate-700">Kết thúc giảm giá</label>
                      <input id="ed-pr-dend" type="datetime-local" bind:value={edPDiscountEndDate} class="w-full border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 bg-white" />
                    </div>

                    <div class="space-y-1">
                      <label for="ed-pr-origin" class="font-semibold text-slate-700">Xuất xứ</label>
                      <input id="ed-pr-origin" type="text" bind:value={edPOrigin} class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none" />
                    </div>

                    <div class="space-y-1">
                      <label for="ed-pr-warr" class="font-semibold text-slate-700">Bảo hành</label>
                      <input id="ed-pr-warr" type="text" bind:value={edPWarranty} class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none" />
                    </div>

                    <div class="space-y-1">
                      <label for="ed-pr-cond" class="font-semibold text-slate-700">Tình trạng</label>
                      <input id="ed-pr-cond" type="text" bind:value={edPCondition} class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none" />
                    </div>
                  </div>

                  <!-- Edit Multiple Images -->
                  <div class="space-y-1.5 bg-slate-50 p-3 rounded border border-slate-200">
                    <label for="ed-pr-imgs" class="font-semibold text-slate-700 flex justify-between items-center">
                      <span>Thư Viện Hình Ảnh Sản Phẩm ({edPImagesList.length} ảnh)</span>
                    </label>
                    <input id="ed-pr-imgs" type="file" multiple accept="image/*" onchange={handleEditProductMultipleImages} class="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-600" />
                    <div class="flex flex-wrap gap-2 pt-1.5">
                      {#each edPImagesList as img, i}
                        <div class="w-14 h-14 rounded border border-slate-300 overflow-hidden relative">
                          <img src={img} alt="Thumb {i}" class="w-full h-full object-cover" />
                          <button
                            type="button"
                            onclick={() => edPImagesList = edPImagesList.filter((_, idx) => idx !== i)}
                            class="absolute top-0 right-0 bg-red-600 text-white w-4 h-4 text-[10px] flex items-center justify-center cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      {/each}
                    </div>
                  </div>

                  <!-- Edit Product Variant Groups -->
                  <div class="space-y-3 bg-slate-50 p-3 rounded border border-slate-200">
                    <div class="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <div>
                        <span class="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <i class="fa-solid fa-layer-group text-blue-900"></i>
                          Phân Loại / Biến Thể Sản Phẩm
                        </span>
                      </div>
                      <button
                        type="button"
                        onclick={addEditVariantGroup}
                        class="text-[11px] bg-white border border-slate-300 hover:bg-slate-100 text-blue-900 px-2 py-0.5 rounded font-semibold cursor-pointer"
                      >
                        + Thêm nhóm
                      </button>
                    </div>

                    <div class="flex flex-wrap items-center gap-1 text-[11px]">
                      <span class="text-slate-500 font-medium text-[10px]">Gợi ý:</span>
                      <button type="button" onclick={() => addEditPresetVariant('Màu sắc', 'Đen, Trắng, Xanh')} class="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] cursor-pointer">+ Màu sắc</button>
                      <button type="button" onclick={() => addEditPresetVariant('Kích thước', 'S, M, L, XL')} class="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 text-[10px] cursor-pointer">+ Kích thước</button>
                      <button type="button" onclick={() => addEditPresetVariant('Dung lượng', '128GB, 256GB, 512GB')} class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] cursor-pointer">+ Dung lượng</button>
                    </div>

                    {#if edPVariantGroups.length === 0}
                      <p class="text-[11px] text-slate-400 italic">Sản phẩm hiện không có phân loại biến thể.</p>
                    {:else}
                      <div class="space-y-2">
                        {#each edPVariantGroups as vg, idx}
                          <div class="bg-white border border-slate-200 rounded p-2.5 space-y-1.5">
                            <div class="flex items-center justify-between">
                              <span class="font-bold text-[10px] text-blue-900 uppercase">Nhóm #{idx + 1}</span>
                              <button type="button" onclick={() => removeEditVariantGroup(idx)} class="text-red-500 hover:text-red-700 text-xs cursor-pointer font-bold">✕ Xóa</button>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input type="text" bind:value={vg.name} placeholder="Tên nhóm (Vd: Màu sắc)" class="border border-slate-300 rounded px-2 py-1 text-xs bg-slate-50" />
                              <input type="text" bind:value={vg.optionsStr} placeholder="Tùy chọn cách nhau dấu phẩy (Vd: Đen, Trắng)" class="sm:col-span-2 border border-slate-300 rounded px-2 py-1 text-xs bg-slate-50" />
                            </div>
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </div>

                  <div class="space-y-1">
                    <label for="ed-pr-desc" class="font-semibold text-slate-700">Mô tả sản phẩm</label>
                    <textarea id="ed-pr-desc" bind:value={edPDesc} rows={2} class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"></textarea>
                  </div>

                  <div class="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button type="button" onclick={() => editingProduct = null} class="px-3.5 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer font-medium">Hủy Bỏ</button>
                    <button type="submit" class="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold cursor-pointer">Lưu Thay Đổi</button>
                  </div>
                </form>
              </div>
            </div>
          {/if}
        </div>
      {:else if activeTab === 'coupons'}
        <!-- COUPONS MANAGEMENT MODULE (AVAILABLE TO ALL 3 ADMIN ROLES) -->
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-300">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Quản Lý Mã Giảm Giá & Voucher</h2>
              <p class="text-xs text-slate-500">Tạo mới, chỉnh sửa, bật/tắt và quản lý lượt sử dụng mã khuyến mãi</p>
            </div>
            <span class="text-xs text-slate-600 font-semibold bg-slate-200/80 px-2.5 py-1 rounded">
              Tổng: {coupons.length} mã giảm giá
            </span>
          </div>

          <!-- Add Coupon Form Card -->
          <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
            <h3 class="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
              <i class="fa-solid fa-plus-circle text-blue-900"></i>
              Tạo Mã Giảm Giá Mới
            </h3>

            <form onsubmit={handleCreateCoupon} class="space-y-4 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div class="space-y-1">
                  <label for="coup-code" class="font-semibold text-slate-700">Mã Khuyến Mãi *</label>
                  <input
                    id="coup-code"
                    type="text"
                    bind:value={newCouponCode}
                    required
                    placeholder="VD: CSET10, SALE100K..."
                    class="w-full uppercase font-mono font-bold border border-slate-300 rounded px-3 py-1.5 text-xs text-blue-950 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div class="space-y-1">
                  <label for="coup-type" class="font-semibold text-slate-700">Loại Giảm Giá *</label>
                  <select
                    id="coup-type"
                    bind:value={newCouponType}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 bg-white focus:outline-none"
                  >
                    <option value="percentage">Giảm theo phần trăm (%)</option>
                    <option value="fixed">Giảm số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                <div class="space-y-1">
                  <label for="coup-val" class="font-semibold text-slate-700">
                    Giá Trị Giảm {newCouponType === 'percentage' ? '(%)' : '(VNĐ)'} *
                  </label>
                  <input
                    id="coup-val"
                    type="number"
                    min="1"
                    bind:value={newCouponValue}
                    required
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="coup-min" class="font-semibold text-slate-700">Đơn Tối Thiểu (VNĐ)</label>
                  <input
                    id="coup-min"
                    type="number"
                    min="0"
                    step="10000"
                    bind:value={newCouponMinOrder}
                    placeholder="0 = Không giới hạn"
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="space-y-1 sm:col-span-2">
                  <label for="coup-desc" class="font-semibold text-slate-700">Mô Tả Ưu Đãi</label>
                  <input
                    id="coup-desc"
                    type="text"
                    bind:value={newCouponDesc}
                    placeholder="Mô tả quyền lợi hiển thị cho khách hàng..."
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="coup-limit" class="font-semibold text-slate-700">Lượt Dùng Tối Đa</label>
                  <input
                    id="coup-limit"
                    type="number"
                    min="1"
                    bind:value={newCouponLimit}
                    class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div class="flex justify-end pt-1">
                <button
                  type="submit"
                  class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded text-xs transition cursor-pointer"
                >
                  + Lưu & Kích Hoạt Mã Giảm Giá
                </button>
              </div>
            </form>
          </div>

          <!-- Coupon List Table -->
          <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 class="text-sm font-bold text-slate-900">Danh Sách Mã Giảm Giá</h3>
              <div class="w-full sm:w-64">
                <input
                  type="text"
                  bind:value={couponSearchQuery}
                  placeholder="Tìm theo mã hoặc mô tả..."
                  class="w-full border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-700">
                <thead class="bg-slate-100 border-b border-slate-200 text-slate-800 font-semibold uppercase text-[11px]">
                  <tr>
                    <th class="p-2.5">Mã Coupon</th>
                    <th class="p-2.5">Mô Tả</th>
                    <th class="p-2.5">Mức Giảm</th>
                    <th class="p-2.5">Đơn Tối Thiểu</th>
                    <th class="p-2.5 text-center">Đã Dùng / Hạn Mức</th>
                    <th class="p-2.5 text-center">Trạng Thái</th>
                    <th class="p-2.5 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  {#if filteredCoupons.length === 0}
                    <tr>
                      <td colspan="7" class="p-6 text-center text-slate-400 italic">Không có mã giảm giá nào.</td>
                    </tr>
                  {:else}
                    {#each filteredCoupons as c (c.id)}
                      <tr class="hover:bg-slate-50">
                        <td class="p-2.5">
                          <span class="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 select-all">
                            {c.code}
                          </span>
                        </td>
                        <td class="p-2.5">
                          <span class="font-medium text-slate-800 block">{c.description}</span>
                        </td>
                        <td class="p-2.5 font-bold text-emerald-700">
                          {c.discountType === 'percentage' ? `${c.discountValue}%` : formatCurrency(c.discountValue)}
                          {#if c.maxDiscountAmount}
                            <span class="text-[10px] text-slate-400 font-normal block">(Tối đa {formatCurrency(c.maxDiscountAmount)})</span>
                          {/if}
                        </td>
                        <td class="p-2.5 text-slate-600">
                          {c.minOrderValue ? formatCurrency(c.minOrderValue) : 'Không giới hạn'}
                        </td>
                        <td class="p-2.5 text-center font-medium">
                          <span class="text-blue-900 font-bold">{c.usedCount || 0}</span> / {c.usageLimit || '∞'}
                        </td>
                        <td class="p-2.5 text-center">
                          <button
                            type="button"
                            onclick={() => handleToggleCoupon(c)}
                            class="px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition {c.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}"
                          >
                            {c.isActive ? 'Đang Bật' : 'Tạm Dừng'}
                          </button>
                        </td>
                        <td class="p-2.5 text-center space-x-2">
                          <button
                            type="button"
                            onclick={() => handleOpenEditCoupon(c)}
                            class="text-blue-600 hover:underline cursor-pointer font-semibold"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onclick={() => handleDeleteCoupon(c)}
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

          <!-- EDIT COUPON MODAL -->
          {#if editingCoupon}
            <div class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div class="bg-white border border-slate-300 rounded-xl p-6 w-full max-w-lg shadow-xl space-y-4">
                <div class="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h4 class="text-sm font-bold text-slate-900">
                    Chỉnh Sửa Mã Giảm Giá: {editingCoupon.code}
                  </h4>
                  <button
                    type="button"
                    onclick={() => editingCoupon = null}
                    class="text-slate-400 hover:text-slate-800 text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onsubmit={handleSaveEditCoupon} class="space-y-3 text-xs">
                  <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1">
                      <label for="ed-c-code" class="font-semibold text-slate-700">Mã Coupon *</label>
                      <input
                        id="ed-c-code"
                        type="text"
                        bind:value={editingCoupon.code}
                        required
                        class="w-full font-mono uppercase font-bold border border-slate-300 rounded px-2.5 py-1.5 text-xs text-blue-950 focus:outline-none"
                      />
                    </div>

                    <div class="space-y-1">
                      <label for="ed-c-type" class="font-semibold text-slate-700">Loại Giảm Giá</label>
                      <select
                        id="ed-c-type"
                        bind:value={editingCoupon.discountType}
                        class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 bg-white focus:outline-none"
                      >
                        <option value="percentage">Phần trăm (%)</option>
                        <option value="fixed">Số tiền (VNĐ)</option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1">
                      <label for="ed-c-val" class="font-semibold text-slate-700">
                        Giá Trị {editingCoupon.discountType === 'percentage' ? '(%)' : '(VNĐ)'}
                      </label>
                      <input
                        id="ed-c-val"
                        type="number"
                        min="1"
                        bind:value={editingCoupon.discountValue}
                        required
                        class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div class="space-y-1">
                      <label for="ed-c-min" class="font-semibold text-slate-700">Đơn Tối Thiểu (VNĐ)</label>
                      <input
                        id="ed-c-min"
                        type="number"
                        min="0"
                        bind:value={editingCoupon.minOrderValue}
                        class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div class="space-y-1">
                    <label for="ed-c-desc" class="font-semibold text-slate-700">Mô Tả</label>
                    <input
                      id="ed-c-desc"
                      type="text"
                      bind:value={editingCoupon.description}
                      required
                      class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div class="flex items-center gap-2 pt-1">
                    <input
                      id="ed-c-act"
                      type="checkbox"
                      bind:checked={editingCoupon.isActive}
                      class="rounded text-blue-900"
                    />
                    <label for="ed-c-act" class="font-semibold text-slate-700 cursor-pointer">
                      Kích hoạt sử dụng mã này
                    </label>
                  </div>

                  <div class="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onclick={() => editingCoupon = null}
                      class="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                    >
                      Hủy
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
        </div>

      {:else if activeTab === 'reviews'}
        <!-- CUSTOMER REVIEWS MANAGEMENT MODULE (AVAILABLE TO ALL 3 ADMIN ROLES) -->
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-300">
            <div>
              <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                <i class="fa-solid fa-comments text-blue-900"></i>
                Quản Lý Đánh Giá & Nhận Xét Khách Hàng
              </h2>
              <p class="text-xs text-slate-500">Xem nhận xét, kiểm duyệt ẩn/hiện và gửi câu trả lời phản hồi chính thức cho khách hàng</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold px-2.5 py-1 bg-slate-200 text-slate-700 rounded">
                Tổng cộng: <strong>{reviews.length}</strong> đánh giá
              </span>
            </div>
          </div>

          <!-- Top Review Metrics -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3.5 bg-white border border-slate-300 rounded-lg">
              <span class="text-[11px] font-bold text-slate-500 uppercase block">Tổng Số Đánh Giá</span>
              <span class="text-2xl font-black text-slate-900">{reviews.length}</span>
            </div>
            <div class="p-3.5 bg-white border border-slate-300 rounded-lg">
              <span class="text-[11px] font-bold text-amber-600 uppercase block">Đánh Giá 5 Sao</span>
              <span class="text-2xl font-black text-amber-500">{reviews.filter(r => r.rating === 5).length}</span>
            </div>
            <div class="p-3.5 bg-white border border-slate-300 rounded-lg">
              <span class="text-[11px] font-bold text-rose-600 uppercase block">Đang Ẩn Khỏi Web</span>
              <span class="text-2xl font-black text-rose-600">{reviews.filter(r => r.hidden).length}</span>
            </div>
            <div class="p-3.5 bg-white border border-slate-300 rounded-lg">
              <span class="text-[11px] font-bold text-blue-600 uppercase block">Đã Phản Hồi</span>
              <span class="text-2xl font-black text-blue-900">{reviews.filter(r => r.adminReply).length}</span>
            </div>
          </div>

          <!-- Search & Filter Bar -->
          <div class="p-4 bg-white border border-slate-300 rounded-lg flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div class="relative w-full sm:w-72">
              <input
                type="text"
                bind:value={reviewSearchQuery}
                placeholder="Tìm khách hàng, nội dung, sản phẩm..."
                class="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900 bg-white"
              />
              <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-slate-400 text-xs"></i>
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <!-- Rating filter -->
              <select
                bind:value={reviewFilterRating}
                class="border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 bg-white"
              >
                <option value="all">-- Tất cả số sao --</option>
                <option value={5}>5 sao ★★★★★</option>
                <option value={4}>4 sao ★★★★☆</option>
                <option value={3}>3 sao ★★★☆☆</option>
                <option value={2}>2 sao ★★☆☆☆</option>
                <option value={1}>1 sao ★☆☆☆☆</option>
              </select>

              <!-- Status filter -->
              <select
                bind:value={reviewFilterStatus}
                class="border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 bg-white"
              >
                <option value="all">-- Tất cả trạng thái --</option>
                <option value="visible">Đang hiển thị công khai</option>
                <option value="hidden">Đang bị ẩn</option>
                <option value="replied">Đã có phản hồi</option>
                <option value="unreplied">Chưa có phản hồi</option>
              </select>
            </div>
          </div>

          <!-- Reviews List -->
          {#if filteredAdminReviews.length === 0}
            <div class="p-12 text-center bg-white border border-slate-300 rounded-lg text-slate-400 text-xs italic">
              Không tìm thấy đánh giá nào phù hợp với bộ lọc tìm kiếm.
            </div>
          {:else}
            <div class="space-y-4">
              {#each filteredAdminReviews as r (r.id)}
                {@const prod = products.find(p => p.id === r.productId)}
                <div class="bg-white border rounded-xl p-5 space-y-3.5 shadow-2xs transition {r.hidden ? 'border-amber-300 bg-amber-50/20' : 'border-slate-300'}">
                  <!-- Header: Customer info & Status badges -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div class="flex items-center space-x-3">
                      <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-black text-xs flex items-center justify-center">
                        {r.userName.charAt(0)}
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="font-bold text-slate-900 text-xs">{r.userName}</span>
                          {#if r.verifiedPurchase}
                            <span class="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                              <i class="fa-solid fa-badge-check"></i> Đã mua hàng
                            </span>
                          {/if}
                        </div>
                        <div class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{r.createdAt}</span>
                          <span>•</span>
                          <span class="text-amber-400">
                            {#each Array(r.rating) as _}★{/each}
                            {#each Array(5 - r.rating) as _}<span class="text-slate-200">★</span>{/each}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Product Tag & Visibility Chip -->
                    <div class="flex items-center gap-2">
                      {#if prod}
                        <a
                          href="./index.html#/product/{prod.id}"
                          target="_blank"
                          class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-900 text-[11px] max-w-xs truncate transition group"
                          title="Xem trang chi tiết sản phẩm này trên web shop (mở tab mới)"
                        >
                          <img src={prod.image} alt="Prod" class="w-4 h-4 rounded object-cover shrink-0" />
                          <span class="font-medium truncate group-hover:underline">{prod.name}</span>
                          <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-slate-400 group-hover:text-blue-900 shrink-0"></i>
                        </a>
                      {/if}

                      {#if r.hidden}
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <i class="fa-solid fa-eye-slash mr-1"></i>Đang ẩn
                        </span>
                      {:else}
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <i class="fa-solid fa-eye mr-1"></i>Hiển thị
                        </span>
                      {/if}
                    </div>
                  </div>

                  <!-- Comment Body -->
                  <div class="space-y-2">
                    <p class="text-xs text-slate-800 leading-relaxed font-normal">
                      {r.comment}
                    </p>

                    {#if r.images && r.images.length > 0}
                      <div class="flex gap-2 flex-wrap pt-1">
                        {#each r.images as img}
                          <img src={img} alt="Review attachment" class="w-16 h-16 rounded-lg object-cover border border-slate-300 shadow-2xs" />
                        {/each}
                      </div>
                    {/if}
                  </div>

                  <!-- Existing Admin Reply (if any) -->
                  {#if r.adminReply}
                    <div class="p-3.5 bg-blue-50/70 border-l-4 border-blue-900 rounded-r-xl space-y-1">
                      <div class="flex items-center justify-between text-[11px]">
                        <span class="font-bold text-blue-950 flex items-center gap-1.5">
                          <i class="fa-solid fa-reply text-blue-900"></i>
                          {r.adminReply.replierName || 'Phản hồi từ CSET Store'}
                          <span class="text-[9px] bg-blue-200 text-blue-950 font-bold px-1.5 py-0.2 rounded">QTV</span>
                        </span>
                        <span class="text-slate-400 text-[10px]">{r.adminReply.repliedAt}</span>
                      </div>
                      <p class="text-xs text-slate-700 leading-relaxed">
                        {r.adminReply.reply}
                      </p>
                    </div>
                  {/if}

                  <!-- Inline Reply Form (When Admin Clicks Trả Lời) -->
                  {#if replyingReviewId === r.id}
                    <div class="p-3.5 bg-slate-50 border border-slate-300 rounded-xl space-y-2">
                      <span class="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 block">
                        <i class="fa-solid fa-pen-to-square text-blue-900"></i>
                        <span>Nội dung phản hồi chính thức từ Quản trị viên:</span>
                      </span>
                      <textarea
                        bind:value={replyInputText}
                        rows={3}
                        placeholder="Nhập câu trả lời giải đáp thắc mắc hoặc cảm ơn khách hàng..."
                        class="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
                      ></textarea>
                      <div class="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onclick={() => replyingReviewId = null}
                          class="px-3 py-1 border border-slate-300 rounded text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onclick={() => handleSaveReplyReview(r)}
                          class="px-4 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-bold cursor-pointer"
                        >
                          Gửi Phản Hồi
                        </button>
                      </div>
                    </div>
                  {/if}

                  <!-- Actions Bar -->
                  <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        onclick={() => handleToggleHideReview(r)}
                        class="px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 {r.hidden
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'}"
                        title={r.hidden ? 'Bỏ ẩn đánh giá này' : 'Ẩn đánh giá này khỏi web shop'}
                      >
                        <i class="fa-solid {r.hidden ? 'fa-eye' : 'fa-eye-slash'}"></i>
                        <span>{r.hidden ? 'Hiện đánh giá' : 'Ẩn đánh giá'}</span>
                      </button>

                      <button
                        type="button"
                        onclick={() => handleStartReplyReview(r)}
                        class="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-300 hover:bg-blue-100 font-semibold cursor-pointer flex items-center gap-1.5"
                      >
                        <i class="fa-solid fa-reply"></i>
                        <span>{r.adminReply ? 'Chỉnh sửa phản hồi' : 'Trả lời đánh giá'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onclick={() => handleDeleteReview(r)}
                      class="text-red-500 hover:text-red-700 text-xs px-2 py-1 font-semibold cursor-pointer"
                      title="Xóa đánh giá vĩnh viễn"
                    >
                      <i class="fa-solid fa-trash mr-1"></i> Xóa
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {:else if activeTab === 'categories' && authService.canManageInventory(currentAdmin.role)}
        <!-- CATEGORIES & SUBCATEGORIES MANAGEMENT MODULE -->
        <div class="space-y-6">
          <div class="flex items-center justify-between pb-3 border-b border-slate-300">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Quản Lý Ngành Hàng & Loại Danh Mục</h2>
              <p class="text-xs text-slate-500">Thêm mới ngành hàng, chỉnh sửa các loại danh mục con chi tiết</p>
            </div>
            <button
              type="button"
              onclick={handleResetCategories}
              class="text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer"
            >
              Khôi phục danh mục mẫu
            </button>
          </div>

          <!-- Add Category Form Card -->
          <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
            <h3 class="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
              Tạo Ngành Hàng Mới
            </h3>

            <form onsubmit={handleCreateCategory} class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-end">
              <div class="space-y-1">
                <label for="cat-key" class="font-semibold text-slate-700">Mã Ngành Hàng (Slug) *</label>
                <input
                  id="cat-key"
                  type="text"
                  bind:value={newCatKey}
                  required
                  placeholder="electronics, fashion, shoes..."
                  class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div class="space-y-1 sm:col-span-2">
                <label for="cat-label" class="font-semibold text-slate-700">Tên Hiển Thị Ngành Hàng *</label>
                <input
                  id="cat-label"
                  type="text"
                  bind:value={newCatLabel}
                  required
                  placeholder="Thiết Bị Điện Tử, Phụ Kiện Xe Hơi..."
                  class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div class="space-y-1">
                <label for="cat-icon-file" class="font-semibold text-slate-700">Ảnh Logo Ngành Hàng (Tải lên)</label>
                <input
                  id="cat-icon-file"
                  type="file"
                  accept="image/*"
                  onchange={(e) => {
                    const input = e.target as HTMLInputElement;
                    if (input.files && input.files[0]) {
                      const file = input.files[0];
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        newCatIcon = (evt.target?.result as string) || '';
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  class="w-full border border-slate-300 rounded px-2 py-0.5 text-[10px] text-slate-600 bg-white"
                />
              </div>
              <div class="sm:col-span-4 flex justify-end">
                <button
                  type="submit"
                  class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs cursor-pointer"
                >
                  + Lưu Ngành Hàng
                </button>
              </div>
            </form>
          </div>

          <!-- Categories List & Subcategory Management -->
          <div class="space-y-4">
            {#each categories as cat (cat.key)}
              <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-3.5">
                <div class="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded border border-slate-300 p-0.5 bg-slate-50 flex items-center justify-center text-slate-700 shrink-0">
                      {#if cat.customIconImage}
                        <img src={cat.customIconImage} alt={cat.label} class="w-full h-full object-contain" />
                      {:else}
                        <i class="fa-solid {cat.icon || 'fa-tag'}"></i>
                      {/if}
                    </div>
                    <div>
                      <h4 class="text-sm font-bold text-slate-900">{cat.label}</h4>
                      <span class="text-[11px] font-mono text-slate-400">Mã: {cat.key}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onclick={() => handleDeleteCategory(cat.key, cat.label)}
                    class="text-xs text-red-600 hover:underline cursor-pointer font-medium"
                  >
                    Xóa ngành hàng
                  </button>
                </div>

                <!-- Subcategories chips & add form -->
                <div class="space-y-2 text-xs">
                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-slate-700 text-xs">
                      Các loại danh mục con ({cat.subcategories?.length || 0}):
                    </span>
                  </div>

                  <div class="flex flex-wrap gap-2 items-center">
                    {#if !cat.subcategories || cat.subcategories.length === 0}
                      <span class="text-[11px] text-slate-400 italic">Chưa có loại danh mục con nào.</span>
                    {:else}
                      {#each cat.subcategories as sub (sub.id)}
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 text-xs">
                          <span>{sub.name}</span>
                          <button
                            type="button"
                            onclick={() => handleDeleteSubCategory(cat.key, sub.id, sub.name)}
                            class="text-slate-400 hover:text-red-600 cursor-pointer ml-1 text-xs"
                            title="Xóa loại danh mục"
                          >
                            ✕
                          </button>
                        </span>
                      {/each}
                    {/if}
                  </div>

                  <!-- Quick Add Subcategory Input -->
                  <div class="flex items-center gap-2 pt-2 max-w-md">
                    <input
                      type="text"
                      placeholder="Nhập tên loại danh mục mới..."
                      bind:value={newSubCatName}
                      class="flex-grow border border-slate-300 rounded px-2.5 py-1 text-xs bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onclick={() => handleAddSubCategory(cat.key)}
                      class="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-xs font-semibold shrink-0 cursor-pointer text-slate-800"
                    >
                      + Thêm Loại
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else if activeTab === 'customTabs' && authService.canManageInventory(currentAdmin.role)}
        <!-- DEDICATED CUSTOM NAVIGATION TABS MODULE (Siêu sale, Đang hot...) -->
        <div class="space-y-6">
          <div class="flex items-center justify-between pb-3 border-b border-slate-300">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Quản Lý Tab Tùy Biến (Hot / Sale)</h2>
              <p class="text-xs text-slate-500">Tạo tab đặc trưng mới xuất hiện trên thanh điều hướng, gắn sản phẩm và cấu hình banner phía trên</p>
            </div>
            <span class="text-xs text-slate-600 font-semibold">Tổng: {themeDraft.customTabs?.length || 0} tab</span>
          </div>

          <!-- Create Custom Tab Form Card -->
          <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
            <h3 class="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
              Tạo Tab Tùy Biến Mới
            </h3>

            <form onsubmit={handleCreateCustomTab} class="space-y-4 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="space-y-1">
                  <label for="ctab-name" class="font-semibold text-slate-700">Tên Tab Trên Thanh Menu *</label>
                  <input
                    id="ctab-name"
                    type="text"
                    bind:value={newTabName}
                    required
                    placeholder="Ví dụ: Siêu Sale, Đang Hot, Xả Kho..."
                    class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="ctab-icon" class="font-semibold text-slate-700">Icon FontAwesome</label>
                  <input
                    id="ctab-icon"
                    type="text"
                    bind:value={newTabIcon}
                    placeholder="fa-fire, fa-bolt, fa-gift..."
                    class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="ctab-btype" class="font-semibold text-slate-700">Định dạng banner đầu tab</label>
                  <select
                    id="ctab-btype"
                    bind:value={newTabBannerType}
                    class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 bg-white"
                  >
                    <option value="text">Dạng Văn Bản (Chữ & Màu nền)</option>
                    <option value="image">Dạng Hình Ảnh (Poster tải lên)</option>
                  </select>
                </div>

                {#if newTabBannerType === 'text'}
                  <div class="space-y-1 sm:col-span-2">
                    <label for="ctab-btitle" class="font-semibold text-slate-700">Tiêu đề lớn trên banner</label>
                    <input
                      id="ctab-btitle"
                      type="text"
                      bind:value={newTabBannerTitle}
                      placeholder="TUẦN LỄ XẢ KHO SIÊU SALE..."
                      class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>

                  <div class="space-y-1">
                    <label for="ctab-bg" class="font-semibold text-slate-700">Màu nền banner</label>
                    <div class="flex items-center gap-1.5">
                      <input id="ctab-bg" type="color" bind:value={newTabBannerBg} class="w-8 h-7 rounded border border-slate-300 p-0.5 cursor-pointer" />
                      <input type="text" bind:value={newTabBannerBg} class="flex-grow border border-slate-300 rounded px-2 py-1 text-xs font-mono" />
                    </div>
                  </div>

                  <div class="space-y-1 sm:col-span-3">
                    <label for="ctab-bsub" class="font-semibold text-slate-700">Phụ đề mô tả ưu đãi</label>
                    <input
                      id="ctab-bsub"
                      type="text"
                      bind:value={newTabBannerSub}
                      placeholder="Mô tả tóm tắt chương trình..."
                      class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                {:else}
                  <div class="space-y-1 sm:col-span-3">
                    <label for="ctab-img" class="font-semibold text-slate-700">Tải ảnh banner đầu tab</label>
                    <input
                      id="ctab-img"
                      type="file"
                      accept="image/*"
                      onchange={handleCustomTabBannerUpload}
                      class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-600"
                    />
                  </div>
                {/if}

                <!-- Pick Featured Products Grouped By Categories -->
                <div class="space-y-3 sm:col-span-3 bg-slate-50 p-4 rounded border border-slate-200">
                  <div class="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span class="font-bold text-slate-800 text-xs">
                      Chọn các sản phẩm đặc trưng đưa lên tab này ({newTabProductIds.length} đã chọn):
                    </span>
                    <span class="text-[11px] text-slate-500">Liệt kê theo từng ngành hàng</span>
                  </div>

                  <div class="space-y-3 max-h-60 overflow-y-auto p-1">
                    {#each categories as cat}
                      {@const catProds = products.filter(p => p.category === cat.key)}
                      {#if catProds.length > 0}
                        <div class="bg-white p-2.5 rounded border border-slate-200 space-y-1.5">
                          <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <i class="fa-solid {cat.icon || 'fa-tag'} text-slate-500"></i>
                            {cat.label} ({catProds.length})
                          </span>
                          <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                            {#each catProds as p (p.id)}
                              <label class="flex items-center gap-2 p-1 rounded bg-slate-50 border border-slate-200 text-[11px] cursor-pointer hover:bg-slate-100">
                                <input
                                  type="checkbox"
                                  checked={newTabProductIds.includes(p.id)}
                                  onchange={() => {
                                    if (newTabProductIds.includes(p.id)) {
                                      newTabProductIds = newTabProductIds.filter(id => id !== p.id);
                                    } else {
                                      newTabProductIds = [...newTabProductIds, p.id];
                                    }
                                  }}
                                  class="w-3.5 h-3.5"
                                />
                                <span class="truncate">{p.name}</span>
                              </label>
                            {/each}
                          </div>
                        </div>
                      {/if}
                    {/each}
                  </div>
                </div>
              </div>

              <div class="flex justify-end pt-1">
                <button
                  type="submit"
                  class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs cursor-pointer"
                >
                  + Lưu & Tạo Tab Mới
                </button>
              </div>
            </form>
          </div>

          <!-- List of Configured Custom Tabs -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-slate-900">Các Tab Tùy Biến Đang Hoạt Động</h3>
            {#if !themeDraft.customTabs || themeDraft.customTabs.length === 0}
              <div class="bg-white border border-slate-300 rounded-lg p-6 text-center text-slate-400 text-xs italic">
                Chưa có tab tùy biến nào.
              </div>
            {:else}
              {#each themeDraft.customTabs as cTab (cTab.id)}
                <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-3">
                  <div class="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div class="flex items-center gap-2">
                      <i class="fa-solid {cTab.icon || 'fa-fire'} text-amber-500"></i>
                      <strong class="text-slate-900 text-sm">{cTab.name}</strong>
                      <span class="text-slate-500 text-xs">({cTab.productIds?.length || 0} sản phẩm)</span>
                    </div>

                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        onclick={() => handleOpenEditCustomTab(cTab)}
                        class="text-blue-600 hover:underline text-xs font-semibold cursor-pointer"
                      >
                        Sửa tab
                      </button>
                      <button
                        type="button"
                        onclick={() => handleToggleCustomTab(cTab.id)}
                        class="px-2 py-0.5 rounded text-[11px] font-semibold border cursor-pointer {cTab.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-500 border-slate-300'}"
                      >
                        {cTab.enabled ? 'Bật trên menu' : 'Tắt'}
                      </button>
                      <button
                        type="button"
                        onclick={() => handleDeleteCustomTab(cTab.id)}
                        class="text-red-600 hover:underline text-xs cursor-pointer"
                      >
                        Xóa tab
                      </button>
                    </div>
                  </div>
                  <!-- Quick toggle products in existing tab -->
                  <div class="space-y-1.5 text-xs">
                    <span class="font-semibold text-slate-700 block">Sản phẩm gắn trong tab này:</span>
                    <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {#each products as p (p.id)}
                        <button
                          type="button"
                          onclick={() => handleToggleProductInTab(cTab.id, p.id)}
                          class="px-2 py-1 rounded text-[11px] border cursor-pointer transition {cTab.productIds.includes(p.id) ? 'bg-blue-100 text-blue-900 border-blue-300 font-bold' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}"
                        >
                          {cTab.productIds.includes(p.id) ? '✓ ' : '+ '}{p.name}
                        </button>
                      {/each}
                    </div>
                  </div>
                </div>
              {/each}
            {/if}
          </div>

          <!-- EDIT CUSTOM TAB MODAL -->
          {#if editingCustomTab}
            <div class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div class="bg-white border border-slate-300 rounded-xl p-6 w-full max-w-2xl shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 class="text-sm font-bold text-slate-900">
                      Chỉnh Sửa Tab Tùy Biến: {editingCustomTab.name}
                    </h4>
                    <p class="text-[11px] text-slate-500">Mã tab: {editingCustomTab.id}</p>
                  </div>
                  <button
                    type="button"
                    onclick={() => editingCustomTab = null}
                    class="text-slate-400 hover:text-slate-800 text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onsubmit={handleSaveEditCustomTab} class="space-y-4 text-xs">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div class="space-y-1">
                      <label for="ed-tab-name" class="font-semibold text-slate-700">Tên Tab Menu *</label>
                      <input id="ed-tab-name" type="text" bind:value={edTabName} required class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900" />
                    </div>

                    <div class="space-y-1">
                      <label for="ed-tab-icon" class="font-semibold text-slate-700">Icon FontAwesome</label>
                      <input id="ed-tab-icon" type="text" bind:value={edTabIcon} class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900" />
                    </div>

                    <div class="space-y-1">
                      <label for="ed-tab-btype" class="font-semibold text-slate-700">Định dạng banner</label>
                      <select id="ed-tab-btype" bind:value={edTabBannerType} class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 bg-white">
                        <option value="text">Dạng Văn Bản (Chữ & Màu nền)</option>
                        <option value="image">Dạng Hình Ảnh (Poster)</option>
                      </select>
                    </div>

                    {#if edTabBannerType === 'text'}
                      <div class="space-y-1 sm:col-span-2">
                        <label for="ed-tab-btitle" class="font-semibold text-slate-700">Tiêu đề lớn banner</label>
                        <input id="ed-tab-btitle" type="text" bind:value={edTabBannerTitle} class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900" />
                      </div>

                      <div class="space-y-1">
                        <label for="ed-tab-bg" class="font-semibold text-slate-700">Màu nền banner</label>
                        <div class="flex items-center gap-1.5">
                          <input id="ed-tab-bg" type="color" bind:value={edTabBannerBg} class="w-8 h-7 rounded border border-slate-300 p-0.5 cursor-pointer" />
                          <input type="text" bind:value={edTabBannerBg} class="flex-grow border border-slate-300 rounded px-2 py-1 text-xs font-mono" />
                        </div>
                      </div>

                      <div class="space-y-1 sm:col-span-3">
                        <label for="ed-tab-bsub" class="font-semibold text-slate-700">Phụ đề mô tả banner</label>
                        <input id="ed-tab-bsub" type="text" bind:value={edTabBannerSub} class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900" />
                      </div>
                    {:else}
                      <div class="space-y-1 sm:col-span-3 bg-slate-50 p-2.5 rounded border border-slate-200">
                        <label for="ed-tab-img" class="font-semibold text-slate-700 block">Đổi Hình Ảnh Banner Đầu Tab</label>
                        {#if edTabBannerImage}
                          <img src={edTabBannerImage} alt="Banner" class="max-h-20 object-contain my-1 rounded border border-slate-300" />
                        {/if}
                        <input id="ed-tab-img" type="file" accept="image/*" onchange={handleEditCustomTabBannerUpload} class="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-600" />
                      </div>
                    {/if}

                    <!-- Products Grouped by Categories in Edit Modal -->
                    <div class="space-y-2.5 sm:col-span-3 bg-slate-50 p-3 rounded border border-slate-200">
                      <span class="font-bold text-slate-800 text-xs block">
                        Sản phẩm hiển thị trong tab ({edTabProductIds.length} đã chọn):
                      </span>
                      <div class="space-y-2 max-h-52 overflow-y-auto p-1">
                        {#each categories as cat}
                          {@const catProds = products.filter(p => p.category === cat.key)}
                          {#if catProds.length > 0}
                            <div class="bg-white p-2 rounded border border-slate-200 space-y-1">
                              <span class="text-[11px] font-bold text-slate-700">{cat.label}:</span>
                              <div class="grid grid-cols-2 sm:grid-cols-3 gap-1">
                                {#each catProds as p (p.id)}
                                  <label class="flex items-center gap-1.5 p-1 rounded bg-slate-50 text-[11px] cursor-pointer hover:bg-slate-100">
                                    <input
                                      type="checkbox"
                                      checked={edTabProductIds.includes(p.id)}
                                      onchange={() => {
                                        if (edTabProductIds.includes(p.id)) {
                                          edTabProductIds = edTabProductIds.filter(id => id !== p.id);
                                        } else {
                                          edTabProductIds = [...edTabProductIds, p.id];
                                        }
                                      }}
                                      class="w-3.5 h-3.5"
                                    />
                                    <span class="truncate">{p.name}</span>
                                  </label>
                                {/each}
                              </div>
                            </div>
                          {/if}
                        {/each}
                      </div>
                    </div>
                  </div>

                  <div class="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button type="button" onclick={() => editingCustomTab = null} class="px-3.5 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer font-medium">Hủy</button>
                    <button type="submit" class="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold cursor-pointer">Lưu Thay Đổi</button>
                  </div>
                </form>
              </div>
            </div>
          {/if}
        </div>
      {:else if activeTab === 'banners' && authService.canManageUsers(currentAdmin.role)}
        <!-- DEDICATED ADVERTISING BANNERS MANAGEMENT MODULE -->
        <div class="space-y-6">
          <div class="flex items-center justify-between pb-3 border-b border-slate-300">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Quản Lý Banner Quảng Cáo</h2>
              <p class="text-xs text-slate-500">Tùy biến số lượng, vị trí (Trên cùng, Bên trái, Bên phải) và nội dung quảng cáo</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-600 font-semibold">Tổng: {themeDraft.banners?.length || 0} banner</span>
              <a
                href="./index.html"
                target="_blank"
                class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold"
              >
                Xem Web Shop &rarr;
              </a>
            </div>
          </div>

          <!-- Global Toggle Toggles -->
          <div class="bg-white border border-slate-300 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <label class="flex items-center justify-between p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <span class="font-bold text-slate-900 block">Khu Vực Banner Trên Cùng (Top Banner)</span>
                <span class="text-[11px] text-slate-500 block">Bật/tắt thanh banner quảng cáo chạy trên đầu trang web</span>
              </div>
              <input
                type="checkbox"
                bind:checked={themeDraft.visibility.showTopAdBanner}
                onchange={() => themeRepo.saveTheme(themeDraft)}
                class="w-4 h-4 cursor-pointer"
              />
            </label>

            <label class="flex items-center justify-between p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <span class="font-bold text-slate-900 block">Khu Vực Banner 2 Bên Sườn (Side Banners)</span>
                <span class="text-[11px] text-slate-500 block">Bật/tắt các banner thả nổi 2 bên trên màn hình lớn</span>
              </div>
              <input
                type="checkbox"
                bind:checked={themeDraft.visibility.showSideAdBanners}
                onchange={() => themeRepo.saveTheme(themeDraft)}
                class="w-4 h-4 cursor-pointer"
              />
            </label>
          </div>

          <!-- Form Create New Banner Card -->
          <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
            <h3 class="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
              Thêm Banner Quảng Cáo Mới
            </h3>

            <form onsubmit={handleCreateBanner} class="space-y-4 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="space-y-1">
                  <label for="ad-pos" class="font-semibold text-slate-700">Vị trí hiển thị *</label>
                  <select
                    id="ad-pos"
                    bind:value={newBannerPos}
                    class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 bg-white"
                  >
                    <option value="top">Phía trên cùng (Top Banner)</option>
                    <option value="side-left">Bên trái sườn trang (Side Left)</option>
                    <option value="side-right">Bên phải sườn trang (Side Right)</option>
                  </select>
                </div>

                <div class="space-y-1">
                  <label for="ad-type" class="font-semibold text-slate-700">Định dạng banner *</label>
                  <select
                    id="ad-type"
                    bind:value={newBannerType}
                    class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 bg-white"
                  >
                    <option value="text">Dạng Văn Bản (Chữ & Nút bấm)</option>
                    <option value="image">Dạng Hình Ảnh (Poster/Ảnh tải lên)</option>
                  </select>
                </div>

                <div class="space-y-1">
                  <label for="ad-link" class="font-semibold text-slate-700">Đường dẫn khi nhấp (Link URL)</label>
                  <input
                    id="ad-link"
                    type="text"
                    bind:value={newBannerLinkUrl}
                    placeholder="#"
                    class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1 sm:col-span-2">
                  <label for="ad-title" class="font-semibold text-slate-700">Tiêu đề thông điệp *</label>
                  <input
                    id="ad-title"
                    type="text"
                    bind:value={newBannerTitle}
                    placeholder="Ví dụ: Giảm giá 50%, Siêu hội mua sắm..."
                    class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="ad-sub" class="font-semibold text-slate-700">Phụ đề ngắn</label>
                  <input
                    id="ad-sub"
                    type="text"
                    bind:value={newBannerSubtitle}
                    placeholder="Chính hãng 100%..."
                    class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <!-- Schedule Dates -->
                <div class="space-y-1">
                  <label for="ad-start" class="font-semibold text-slate-700">Bắt đầu hiển thị (Tự động)</label>
                  <input
                    id="ad-start"
                    type="datetime-local"
                    bind:value={newBannerStartDate}
                    class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 bg-white"
                  />
                </div>

                <div class="space-y-1">
                  <label for="ad-end" class="font-semibold text-slate-700">Kết thúc hiển thị (Tự động)</label>
                  <input
                    id="ad-end"
                    type="datetime-local"
                    bind:value={newBannerEndDate}
                    class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 bg-white"
                  />
                </div>

                {#if newBannerType === 'text'}
                  <div class="space-y-1">
                    <label for="ad-linktext" class="font-semibold text-slate-700">Chữ nút bấm (Button text)</label>
                    <input
                      id="ad-linktext"
                      type="text"
                      bind:value={newBannerLinkText}
                      placeholder="Xem Ngay"
                      class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div class="space-y-1">
                    <label for="ad-bg" class="font-semibold text-slate-700">Màu nền banner</label>
                    <div class="flex items-center gap-1.5">
                      <input id="ad-bg" type="color" bind:value={newBannerBgColor} class="w-8 h-7 rounded border border-slate-300 p-0.5 cursor-pointer" />
                      <input type="text" bind:value={newBannerBgColor} class="flex-grow border border-slate-300 rounded px-2 py-1 text-xs font-mono" />
                    </div>
                  </div>

                  <div class="space-y-1">
                    <label for="ad-tc" class="font-semibold text-slate-700">Màu chữ</label>
                    <div class="flex items-center gap-1.5">
                      <input id="ad-tc" type="color" bind:value={newBannerTextColor} class="w-8 h-7 rounded border border-slate-300 p-0.5 cursor-pointer" />
                      <input type="text" bind:value={newBannerTextColor} class="flex-grow border border-slate-300 rounded px-2 py-1 text-xs font-mono" />
                    </div>
                  </div>
                {:else}
                  <div class="space-y-1 sm:col-span-3">
                    <label for="ad-file" class="font-semibold text-slate-700">Tải ảnh banner lên từ máy tính</label>
                    <input
                      id="ad-file"
                      type="file"
                      accept="image/*"
                      onchange={handleBannerImageUpload}
                      class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-600"
                    />
                  </div>
                {/if}
              </div>

              <div class="flex justify-end pt-1">
                <button
                  type="submit"
                  class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs cursor-pointer"
                >
                  + Thêm Banner Vào Hệ Thống
                </button>
              </div>
            </form>
          </div>

          <!-- List of Current Active Banners -->
          <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
            <h3 class="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
              Danh Sách Banner Đang Chạy ({themeDraft.banners?.length || 0})
            </h3>

            {#if !themeDraft.banners || themeDraft.banners.length === 0}
              <p class="text-xs text-slate-400 italic">Chưa có banner nào. Hãy tạo banner mới ở form phía trên.</p>
            {:else}
              <div class="space-y-3">
                {#each themeDraft.banners as ad, idx (ad.id)}
                  <div class="p-3.5 rounded border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div class="flex items-center gap-3">
                      <!-- Thumbnail preview -->
                      {#if ad.type === 'image' && ad.imageUrl}
                        <img src={ad.imageUrl} alt={ad.title} class="w-14 h-10 object-cover rounded border border-slate-300 shrink-0" />
                      {:else}
                        <div
                          class="w-14 h-10 rounded border border-slate-300 shrink-0 flex items-center justify-center font-bold text-[10px]"
                          style="background-color: {ad.bgColor || '#1e3a8a'}; color: {ad.textColor || '#ffffff'};"
                        >
                          TEXT
                        </div>
                      {/if}

                      <div class="space-y-0.5">
                        <div class="flex items-center gap-2">
                          <span class="font-bold text-slate-900 text-xs">{ad.title}</span>
                          <span class="px-2 py-0.5 rounded text-[10px] font-semibold border {ad.position === 'top' ? 'bg-blue-100 text-blue-900 border-blue-200' : (ad.position === 'side-left' ? 'bg-purple-100 text-purple-900 border-purple-200' : 'bg-emerald-100 text-emerald-900 border-emerald-200')}">
                            {ad.position === 'top' ? 'Trên cùng (Top)' : (ad.position === 'side-left' ? 'Bên trái sườn' : 'Bên phải sườn')}
                          </span>
                        </div>
                        {#if ad.subtitle}
                          <p class="text-[11px] text-slate-500">{ad.subtitle}</p>
                        {/if}
                        {#if ad.startDate || ad.endDate}
                          <div class="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <i class="fa-solid fa-clock text-blue-900"></i>
                            <span>Lịch: {ad.startDate ? new Date(ad.startDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'Ngay lập tức'} → {ad.endDate ? new Date(ad.endDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'Vô thời hạn'}</span>
                          </div>
                        {/if}
                      </div>
                    </div>
                    <div class="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onclick={() => handleSelectEditBanner(ad)}
                        class="text-blue-600 hover:underline cursor-pointer text-xs font-semibold"
                      >
                        Sửa
                      </button>

                      <button
                        type="button"
                        onclick={() => handleToggleBanner(ad.id)}
                        class="px-2 py-0.5 rounded text-[11px] font-semibold border cursor-pointer {ad.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-500 border-slate-300'}"
                      >
                        {ad.enabled ? 'Bật' : 'Tắt'}
                      </button>

                      <button
                        type="button"
                        onclick={() => handleDeleteBanner(ad.id)}
                        class="text-red-600 hover:underline cursor-pointer text-xs font-medium"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <!-- EDIT BANNER MODAL -->
        {#if editingBanner}
          <div class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div class="bg-white border border-slate-300 rounded-xl p-6 w-full max-w-xl shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
              <div class="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 class="text-sm font-bold text-slate-900">
                    Chỉnh Sửa Banner Quảng Cáo
                  </h4>
                  <p class="text-[11px] text-slate-500">Mã banner: {editingBanner.id}</p>
                </div>
                <button
                  type="button"
                  onclick={() => editingBanner = null}
                  class="text-slate-400 hover:text-slate-800 text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onsubmit={handleSaveEditBanner} class="space-y-3.5 text-xs">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label for="ed-b-pos" class="font-semibold text-slate-700">Vị trí hiển thị</label>
                    <select
                      id="ed-b-pos"
                      bind:value={editBannerPos}
                      class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 bg-white"
                    >
                      <option value="top">Phía trên cùng (Top Banner)</option>
                      <option value="side-left">Bên trái sườn trang (Side Left)</option>
                      <option value="side-right">Bên phải sườn trang (Side Right)</option>
                    </select>
                  </div>

                  <div class="space-y-1">
                    <label for="ed-b-type" class="font-semibold text-slate-700">Định dạng banner</label>
                    <select
                      id="ed-b-type"
                      bind:value={editBannerType}
                      class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 bg-white"
                    >
                      <option value="text">Dạng Văn Bản (Chữ & Nút bấm)</option>
                      <option value="image">Dạng Hình Ảnh (Poster)</option>
                    </select>
                  </div>
                </div>

                <div class="space-y-1">
                  <label for="ed-b-title" class="font-semibold text-slate-700">Tiêu đề thông điệp *</label>
                  <input
                    id="ed-b-title"
                    type="text"
                    bind:value={editBannerTitle}
                    required
                    class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="space-y-1">
                  <label for="ed-b-sub" class="font-semibold text-slate-700">Phụ đề ngắn</label>
                  <input
                    id="ed-b-sub"
                    type="text"
                    bind:value={editBannerSubtitle}
                    class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label for="ed-b-start" class="font-semibold text-slate-700">Bắt đầu hiển thị</label>
                    <input
                      id="ed-b-start"
                      type="datetime-local"
                      bind:value={editBannerStartDate}
                      class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 bg-white"
                    />
                  </div>

                  <div class="space-y-1">
                    <label for="ed-b-end" class="font-semibold text-slate-700">Kết thúc hiển thị</label>
                    <input
                      id="ed-b-end"
                      type="datetime-local"
                      bind:value={editBannerEndDate}
                      class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div class="space-y-1">
                  <label for="ed-b-link" class="font-semibold text-slate-700">Đường dẫn khi nhấp (Link URL)</label>
                  <input
                    id="ed-b-link"
                    type="text"
                    bind:value={editBannerLinkUrl}
                    class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                {#if editBannerType === 'text'}
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div class="space-y-1">
                      <label for="ed-b-linktext" class="font-semibold text-slate-700">Chữ nút bấm</label>
                      <input
                        id="ed-b-linktext"
                        type="text"
                        bind:value={editBannerLinkText}
                        class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div class="space-y-1">
                      <label for="ed-b-bg" class="font-semibold text-slate-700">Màu nền</label>
                      <div class="flex items-center gap-1">
                        <input id="ed-b-bg" type="color" bind:value={editBannerBgColor} class="w-8 h-7 rounded border border-slate-300 p-0.5 cursor-pointer" />
                        <input type="text" bind:value={editBannerBgColor} class="flex-grow border border-slate-300 rounded px-2 py-1 text-xs font-mono" />
                      </div>
                    </div>

                    <div class="space-y-1">
                      <label for="ed-b-tc" class="font-semibold text-slate-700">Màu chữ</label>
                      <div class="flex items-center gap-1">
                        <input id="ed-b-tc" type="color" bind:value={editBannerTextColor} class="w-8 h-7 rounded border border-slate-300 p-0.5 cursor-pointer" />
                        <input type="text" bind:value={editBannerTextColor} class="flex-grow border border-slate-300 rounded px-2 py-1 text-xs font-mono" />
                      </div>
                    </div>
                  </div>
                {:else}
                  <div class="space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
                    <label for="ed-b-file" class="font-semibold text-slate-700 block">Đổi Hình Ảnh Banner</label>
                    {#if editBannerImgBase64}
                      <div class="mb-2">
                        <img src={editBannerImgBase64} alt="Preview" class="max-h-24 object-contain border border-slate-300 rounded" />
                      </div>
                    {/if}
                    <input
                      id="ed-b-file"
                      type="file"
                      accept="image/*"
                      onchange={handleEditBannerImageUpload}
                      class="w-full border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-600"
                    />
                  </div>
                {/if}

                <div class="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onclick={() => editingBanner = null}
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
      {:else if activeTab === 'reports' && authService.canViewReports(currentAdmin.role)}
        <!-- REPORTS & ANALYTICS MODULE (AVAILABLE TO ADMIN SALE & SUPER ADMIN) -->
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-300">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Báo Cáo Doanh Thu & Thống Kê</h2>
              <p class="text-xs text-slate-500">Thống kê số lượng đơn hàng, doanh thu, số khách hàng và lượt truy cập</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick={() => analyticsService.exportToExcelCSV(orders, summaryMetrics)}
                class="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <i class="fa-solid fa-file-excel"></i>
                <span>Xuất File Excel (.CSV)</span>
              </button>
            </div>
          </div>

          <!-- SUMMARY METRICS CARDS -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div class="bg-white border border-slate-300 rounded-lg p-4 space-y-1">
              <span class="text-slate-500 font-semibold block">Tổng Doanh Thu</span>
              <span class="text-lg sm:text-xl font-black text-slate-900 block">{formatCurrency(summaryMetrics.totalRevenue)}</span>
              <span class="text-[10px] text-emerald-700 font-medium">✓ Đã trừ đơn hủy</span>
            </div>

            <div class="bg-white border border-slate-300 rounded-lg p-4 space-y-1">
              <span class="text-slate-500 font-semibold block">Tổng Số Đơn Hàng</span>
              <span class="text-lg sm:text-xl font-black text-blue-900 block">{summaryMetrics.totalOrders} đơn</span>
              <span class="text-[10px] text-slate-500 font-medium">Hoàn tất: {summaryMetrics.completedOrdersCount} đơn</span>
            </div>

            <div class="bg-white border border-slate-300 rounded-lg p-4 space-y-1">
              <span class="text-slate-500 font-semibold block">Tổng Số Khách Hàng</span>
              <span class="text-lg sm:text-xl font-black text-purple-900 block">{summaryMetrics.customerCount} người</span>
              <span class="text-[10px] text-slate-500 font-medium">Đã đăng ký tài khoản</span>
            </div>

            <div class="bg-white border border-slate-300 rounded-lg p-4 space-y-1">
              <span class="text-slate-500 font-semibold block">Số Lượt Truy Cập</span>
              <span class="text-lg sm:text-xl font-black text-amber-700 block">{summaryMetrics.visitorCount.toLocaleString()}</span>
              <span class="text-[10px] text-slate-500 font-medium">Lượt ghé thăm website</span>
            </div>
          </div>

          <!-- CHARTS & BREAKDOWN TABS -->
          <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <h3 class="text-sm font-bold text-slate-900">
                Biểu Đồ & Thống Kê Chi Tiết
              </h3>

              <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-semibold">
                <button
                  type="button"
                  onclick={() => reportTimeSpan = 'daily'}
                  class="px-3 py-1 rounded transition cursor-pointer {reportTimeSpan === 'daily' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                >
                  Theo Ngày
                </button>
                <button
                  type="button"
                  onclick={() => reportTimeSpan = 'weekly'}
                  class="px-3 py-1 rounded transition cursor-pointer {reportTimeSpan === 'weekly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                >
                  Theo Tuần
                </button>
                <button
                  type="button"
                  onclick={() => reportTimeSpan = 'monthly'}
                  class="px-3 py-1 rounded transition cursor-pointer {reportTimeSpan === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                >
                  Theo Tháng
                </button>
              </div>
            </div>

            <!-- VISUAL CSS/SVG BAR CHART -->
            <div class="space-y-4 pt-2">
              {#if reportTimeSpan === 'daily'}
                {@const maxRev = Math.max(...dailyStats.map(d => d.revenue), 1)}
                <div class="space-y-2.5">
                  <span class="text-xs font-semibold text-slate-700 block">Biểu đồ doanh thu theo ngày đặt hàng:</span>
                  {#each dailyStats as d}
                    <div class="space-y-1 text-xs">
                      <div class="flex justify-between text-slate-600">
                        <span class="font-medium">{d.date} ({d.orderCount} đơn)</span>
                        <strong class="text-slate-900">{formatCurrency(d.revenue)}</strong>
                      </div>
                      <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                        <div
                          class="bg-blue-900 h-full rounded-full transition-all duration-500"
                          style="width: {Math.max((d.revenue / maxRev) * 100, 4)}%;"
                        ></div>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else if reportTimeSpan === 'weekly'}
                {@const maxRev = Math.max(...weeklyStats.map(w => w.revenue), 1)}
                <div class="space-y-2.5">
                  <span class="text-xs font-semibold text-slate-700 block">Biểu đồ doanh thu theo tuần:</span>
                  {#each weeklyStats as w}
                    <div class="space-y-1 text-xs">
                      <div class="flex justify-between text-slate-600">
                        <span class="font-medium">{w.weekLabel} ({w.orderCount} đơn)</span>
                        <strong class="text-slate-900">{formatCurrency(w.revenue)}</strong>
                      </div>
                      <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                        <div
                          class="bg-purple-900 h-full rounded-full transition-all duration-500"
                          style="width: {Math.max((w.revenue / maxRev) * 100, 4)}%;"
                        ></div>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                {@const maxRev = Math.max(...monthlyStats.map(m => m.revenue), 1)}
                <div class="space-y-2.5">
                  <span class="text-xs font-semibold text-slate-700 block">Biểu đồ doanh thu theo tháng:</span>
                  {#each monthlyStats as m}
                    <div class="space-y-1 text-xs">
                      <div class="flex justify-between text-slate-600">
                        <span class="font-medium">{m.monthLabel} ({m.orderCount} đơn)</span>
                        <strong class="text-slate-900">{formatCurrency(m.revenue)}</strong>
                      </div>
                      <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                        <div
                          class="bg-emerald-800 h-full rounded-full transition-all duration-500"
                          style="width: {Math.max((m.revenue / maxRev) * 100, 4)}%;"
                        ></div>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>

      {:else if activeTab === 'backup' && authService.canManageBackups(currentAdmin.role)}
        <!-- BACKUP & RESTORE MODULE (SUPER ADMIN ONLY) -->
        <div class="space-y-6">
          <div class="pb-3 border-b border-slate-300">
            <h2 class="text-lg font-bold text-slate-900">Sao Lưu & Khôi Phục Toàn Bộ Hệ Thống (Backup & Restore)</h2>
            <p class="text-xs text-slate-500">Dành riêng cho Super Admin: Xuất toàn bộ dữ liệu trang web ra file tải về hoặc khôi phục từ file đã có</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <!-- BACKUP CARD -->
            <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
              <div class="flex items-center gap-2.5 border-b border-slate-200 pb-2.5">
                <i class="fa-solid fa-database text-blue-900 text-base"></i>
                <h3 class="font-bold text-slate-900 text-sm">Sao Lưu Cơ Sở Dữ Liệu SQL (Database Backup)</h3>
              </div>

              <p class="text-slate-600 leading-relaxed">
                Hệ thống sẽ kết xuất toàn bộ cơ sở dữ liệu SQL ra file kịch bản <code class="text-blue-900 font-bold font-mono">.sql</code> chứa đầy đủ cấu trúc bảng và dữ liệu:
              </p>

              <ul class="space-y-1.5 text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200 font-medium">
                <li class="flex items-center gap-2 text-xs">
                  <i class="fa-solid fa-circle-check text-emerald-600"></i>
                  <span>Bảng <strong>products</strong>: Toàn bộ {products.length} sản phẩm, gallery ảnh, thông số & biến thể</span>
                </li>
                <li class="flex items-center gap-2 text-xs">
                  <i class="fa-solid fa-circle-check text-emerald-600"></i>
                  <span>Bảng <strong>users</strong>: {users.length} tài khoản (Mật khẩu mã hóa muối PBKDF2, SĐT & Địa chỉ mã hóa AES-256)</span>
                </li>
                <li class="flex items-center gap-2 text-xs">
                  <i class="fa-solid fa-circle-check text-emerald-600"></i>
                  <span>Bảng <strong>orders</strong>: {orders.length} đơn hàng & lịch sử giao dịch (thông tin người nhận mã hóa)</span>
                </li>
                <li class="flex items-center gap-2 text-xs">
                  <i class="fa-solid fa-circle-check text-emerald-600"></i>
                  <span>Bảng <strong>categories</strong>: {categories.length} ngành hàng & danh mục chi tiết</span>
                </li>
                <li class="flex items-center gap-2 text-xs">
                  <i class="fa-solid fa-circle-check text-emerald-600"></i>
                  <span>Bảng <strong>reviews</strong>: {reviews.length} đánh giá khách hàng & phản hồi quản trị viên</span>
                </li>
                <li class="flex items-center gap-2 text-xs">
                  <i class="fa-solid fa-circle-check text-emerald-600"></i>
                  <span>Bảng <strong>coupons</strong> & <strong>theme_config</strong>: Cấu hình mã ưu đãi và toàn bộ giao diện</span>
                </li>
              </ul>

              <button
                type="button"
                onclick={handleDownloadBackup}
                class="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs flex items-center justify-center gap-2 transition"
              >
                <i class="fa-solid fa-database"></i>
                <span>Tải File Backup Database (.SQL) Về Máy</span>
              </button>
            </div>

            <!-- RESTORE CARD -->
            <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
              <div class="flex items-center gap-2.5 border-b border-slate-200 pb-2.5">
                <i class="fa-solid fa-rotate-left text-emerald-800 text-base"></i>
                <h3 class="font-bold text-slate-900 text-sm">Khôi Phục Cơ Sở Dữ Liệu Từ File Backup</h3>
              </div>

              <p class="text-slate-600 leading-relaxed">
                Chọn file sao lưu database (<code class="text-emerald-800 font-bold font-mono">.sql</code> / <code class="text-emerald-800 font-bold font-mono">.sqlite</code>) để khôi phục toàn vẹn dữ liệu cho hệ thống:
              </p>

              <div class="space-y-2">
                <label for="bk-file" class="font-semibold text-slate-700 block">Chọn file backup database từ máy tính</label>
                <input
                  id="bk-file"
                  type="file"
                  accept=".sql,.sqlite,.json,text/plain"
                  onchange={handleUploadBackupFile}
                  class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs bg-white text-slate-600"
                />
              </div>

              <div class="space-y-1">
                <label for="bk-json" class="font-semibold text-slate-700 block">Hoặc dán nội dung script SQL / JSON backup</label>
                <textarea
                  id="bk-json"
                  bind:value={backupJsonInput}
                  rows={4}
                  placeholder="Dán câu lệnh SQL hoặc mã backup vào đây..."
                  class="w-full border border-slate-300 rounded p-2 text-[11px] font-mono text-slate-800 focus:outline-none"
                ></textarea>
              </div>

              {#if restoreStatusMessage}
                <div class="p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-900 text-[11px]">
                  {restoreStatusMessage}
                </div>
              {/if}

              <button
                type="button"
                onclick={handleExecuteRestore}
                class="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs flex items-center justify-center gap-2 transition"
              >
                <i class="fa-solid fa-arrow-rotate-left"></i>
                <span>Bắt Đầu Khôi Phục Database SQL</span>
              </button>
            </div>
          </div>
        </div>

      {:else if activeTab === 'theme' && authService.canManageUsers(currentAdmin.role)}
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-300">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Tùy Chỉnh Giao Diện Web Bán Hàng</h2>
              <p class="text-xs text-slate-500">Thiết lập chi tiết từng khối: Thương hiệu, Hero Banner, Cam kết, Lợi ích, Thẻ sản phẩm & Footer</p>
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

          <!-- SUB-TABS BAR -->
          <div class="flex overflow-x-auto gap-1 p-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onclick={() => customizerSubTab = 'brand'}
              class="px-3 py-2 rounded transition cursor-pointer whitespace-nowrap {customizerSubTab === 'brand' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}"
            >
              1. Thương Hiệu & Logo
            </button>

            <button
              type="button"
              onclick={() => customizerSubTab = 'browser'}
              class="px-3 py-2 rounded transition cursor-pointer whitespace-nowrap {customizerSubTab === 'browser' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}"
            >
              2. Tab Trình Duyệt (Favicon & Title)
            </button>

            <button
              onclick={() => customizerSubTab = 'hero'}
              class="px-3.5 py-2 rounded transition cursor-pointer whitespace-nowrap {customizerSubTab === 'hero' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}"
            >
              2. Khối Hero Banner
            </button>

            <button
              type="button"
              onclick={() => customizerSubTab = 'trust'}
              class="px-3.5 py-2 rounded transition cursor-pointer whitespace-nowrap {customizerSubTab === 'trust' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}"
            >
              3. Khối Cam Kết Dịch Vụ ({themeDraft.trustBadges?.length || 0})
            </button>

            <button
              type="button"
              onclick={() => customizerSubTab = 'value'}
              class="px-3.5 py-2 rounded transition cursor-pointer whitespace-nowrap {customizerSubTab === 'value' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}"
            >
              4. Khối Giá Trị & Lợi Ích ({themeDraft.valueProps?.length || 0})
            </button>

            <button
              type="button"
              onclick={() => customizerSubTab = 'products'}
              class="px-3.5 py-2 rounded transition cursor-pointer whitespace-nowrap {customizerSubTab === 'products' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}"
            >
              5. Thẻ Sản Phẩm & Danh Mục
            </button>

            <button
              type="button"
              onclick={() => customizerSubTab = 'footer'}
              class="px-3.5 py-2 rounded transition cursor-pointer whitespace-nowrap {customizerSubTab === 'footer' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}"
            >
              6. Chân Trang & Mạng Xã Hội
            </button>
          </div>

          <form onsubmit={handleSaveTheme} class="space-y-6">
            {#if customizerSubTab === 'brand'}
              <!-- SUB-TAB 1: BRANDING & LOGO & VISIBILITY -->
              <div class="space-y-5">
                <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
                  <h3 class="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                    Nhận Diện Cửa Hàng & Màu Sắc Tổng Thể
                  </h3>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div class="space-y-1">
                      <label for="thm-name" class="font-semibold text-slate-700">Tên Cửa Hàng *</label>
                      <input
                        id="thm-name"
                        type="text"
                        bind:value={themeDraft.storeName}
                        required
                        class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div class="space-y-1">
                      <label for="thm-tagline" class="font-semibold text-slate-700">Khẩu Hiệu / Tagline</label>
                      <input
                        id="thm-tagline"
                        type="text"
                        bind:value={themeDraft.storeTagline}
                        class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div class="space-y-1">
                      <label for="thm-color-primary" class="font-semibold text-slate-700">Màu Chủ Đạo (Primary Color)</label>
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

                    <div class="space-y-1 sm:col-span-3 bg-slate-50 p-4 rounded border border-slate-200">
                      <label for="thm-logo-file" class="font-semibold text-slate-700 flex justify-between items-center">
                        <span>Tải Lên File Logo Chính Của Web (PNG, SVG, JPG, WebP)</span>
                        {#if themeDraft.logoImage}
                          <button
                            type="button"
                            onclick={() => themeDraft.logoImage = ''}
                            class="text-red-600 hover:underline cursor-pointer font-normal text-[11px]"
                          >
                            ✕ Xóa file ảnh, dùng icon
                          </button>
                        {/if}
                      </label>
                      <div class="flex items-center gap-3 mt-2">
                        {#if themeDraft.logoImage}
                          <div class="w-14 h-14 bg-white border border-slate-300 rounded p-1 shrink-0 flex items-center justify-center">
                            <img src={themeDraft.logoImage} alt="Logo" class="w-full h-full object-contain" />
                          </div>
                        {:else}
                          <div class="w-14 h-14 bg-slate-900 text-white rounded flex items-center justify-center text-xl shrink-0">
                            <i class="fa-solid {themeDraft.logoIcon}"></i>
                          </div>
                        {/if}
                        <div class="flex-grow space-y-1">
                          <input
                            id="thm-logo-file"
                            type="file"
                            accept="image/*"
                            onchange={handleLogoUpload}
                            class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-600 bg-white"
                          />
                          <p class="text-[11px] text-slate-500">Logo xuất hiện ở góc trái thanh điều hướng Header và Footer.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- VISIBILITY TOGGLES SUMMARY -->
                <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-3">
                  <h3 class="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                    Công Tắc Bật / Tắt Toàn Bộ Các Khối
                  </h3>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <label class="flex items-center justify-between p-2.5 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <span>Khối Banner Hero</span>
                      <input type="checkbox" bind:checked={themeDraft.visibility.showHeroSection} class="w-4 h-4" />
                    </label>
                    <label class="flex items-center justify-between p-2.5 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <span>Huy Hiệu Khuyến Mãi</span>
                      <input type="checkbox" bind:checked={themeDraft.visibility.showPromoBadge} class="w-4 h-4" />
                    </label>
                    <label class="flex items-center justify-between p-2.5 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <span>Ảnh Minh Họa Hero</span>
                      <input type="checkbox" bind:checked={themeDraft.visibility.showHeroImage} class="w-4 h-4" />
                    </label>
                    <label class="flex items-center justify-between p-2.5 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <span>Cam Kết Dịch Vụ</span>
                      <input type="checkbox" bind:checked={themeDraft.visibility.showTrustBadges} class="w-4 h-4" />
                    </label>
                    <label class="flex items-center justify-between p-2.5 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <span>Sản Phẩm Nổi Bật</span>
                      <input type="checkbox" bind:checked={themeDraft.visibility.showFeaturedProducts} class="w-4 h-4" />
                    </label>
                    <label class="flex items-center justify-between p-2.5 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <span>Khối Giá Trị Lợi Ích</span>
                      <input type="checkbox" bind:checked={themeDraft.visibility.showValueProps} class="w-4 h-4" />
                    </label>
                    <!-- Chế độ Bật / Tắt Tab Đặt Hàng Theo Yêu Cầu -->
                    <div class="sm:col-span-3 p-3.5 rounded-xl border border-amber-300 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs">
                            <i class="fa-solid fa-wand-magic-sparkles"></i>
                          </span>
                          <span class="font-bold text-slate-900 text-xs">Chế Độ Bật / Tắt Tab "Đặt Hàng Theo Yêu Cầu"</span>
                        </div>
                        <p class="text-[11px] text-slate-500 mt-0.5">
                          Bật hoặc tắt hiển thị tab này trên thanh menu điều hướng của cửa hàng (ở cả giao diện máy tính và điện thoại).
                        </p>
                      </div>
                      <div class="flex items-center gap-3 shrink-0">
                        <span class="text-xs font-bold px-2.5 py-1 rounded-full {themeDraft.visibility.showCustomOrderTab !== false ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-600 border border-slate-300'}">
                          {themeDraft.visibility.showCustomOrderTab !== false ? '✓ Đang BẬT' : '✕ Đang TẮT'}
                        </span>
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            bind:checked={themeDraft.visibility.showCustomOrderTab}
                            class="sr-only peer"
                          />
                          <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-900"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            {:else if customizerSubTab === 'browser'}
              <!-- SUB-TAB: BROWSER TAB CONFIG (TITLE & FAVICON) -->
              <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4 text-xs">
                <h3 class="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <i class="fa-solid fa-window-maximize text-blue-900"></i>
                  Chỉnh Sửa Tiêu Đề & Icon Hiển Thị Trên Tab Trình Duyệt
                </h3>

                <div class="space-y-4 max-w-2xl">
                  <div class="space-y-1">
                    <label for="brw-title" class="font-semibold text-slate-700">Tiêu đề tab trình duyệt (Document Title) *</label>
                    <input
                      id="brw-title"
                      type="text"
                      bind:value={themeDraft.browserTitle}
                      required
                      placeholder="CSET Store - Siêu Thị Mua Sắm Trực Tuyến..."
                      class="w-full border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    />
                    <p class="text-[11px] text-slate-500">Dòng chữ hiển thị trên thanh tiêu đề của trình duyệt Chrome, Edge, Safari...</p>
                  </div>

                  <div class="space-y-1.5 bg-slate-50 p-4 rounded border border-slate-200">
                    <label for="brw-fav-file" class="font-semibold text-slate-700 flex justify-between items-center">
                      <span>Icon Tab Trình Duyệt (Favicon - PNG, SVG, ICO)</span>
                      {#if themeDraft.faviconImage}
                        <button
                          type="button"
                          onclick={() => themeDraft.faviconImage = ''}
                          class="text-red-600 hover:underline cursor-pointer text-[11px]"
                        >
                          ✕ Xóa favicon tùy biến
                        </button>
                      {/if}
                    </label>

                    <div class="flex items-center gap-3 mt-1">
                      {#if themeDraft.faviconImage}
                        <div class="w-10 h-10 rounded border border-slate-300 bg-white p-1 flex items-center justify-center shrink-0">
                          <img src={themeDraft.faviconImage} alt="Favicon" class="w-full h-full object-contain" />
                        </div>
                      {:else}
                        <div class="w-10 h-10 rounded border border-slate-300 bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                          <i class="fa-solid fa-globe"></i>
                        </div>
                      {/if}

                      <div class="flex-grow space-y-1">
                        <input
                          id="brw-fav-file"
                          type="file"
                          accept="image/*,.ico"
                          onchange={(e) => {
                            const input = e.target as HTMLInputElement;
                            if (input.files && input.files[0]) {
                              const file = input.files[0];
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                themeDraft.faviconImage = (evt.target?.result as string) || '';
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-600 bg-white"
                        />
                        <p class="text-[11px] text-slate-500">Biểu tượng favicon xuất hiện cạnh tiêu đề trang trên tab của trình duyệt.</p>
                      </div>
                    </div>
                  </div>

                  <!-- Browser Tab Mockup Preview -->
                  <div class="p-3 bg-slate-100 rounded-lg border border-slate-300 space-y-1">
                    <span class="text-[10px] text-slate-500 font-bold uppercase block">Mô phỏng hiển thị trên tab:</span>
                    <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-t-lg border-t border-x border-slate-300 shadow-xs max-w-xs">
                      {#if themeDraft.faviconImage}
                        <img src={themeDraft.faviconImage} alt="Favicon" class="w-4 h-4 object-contain" />
                      {:else}
                        <i class="fa-solid fa-globe text-slate-400 text-xs"></i>
                      {/if}
                      <span class="text-xs font-semibold text-slate-800 truncate">{themeDraft.browserTitle || 'CSET Store'}</span>
                    </div>
                  </div>
                </div>
              </div>

            {:else if customizerSubTab === 'hero'}
              <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4 text-xs">
                <h3 class="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                  Chi Tiết Khối Hero Banner
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <!-- Badge Header Configuration (Bật/Tắt & Logo upload) -->
                  <div class="sm:col-span-2 bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-3">
                    <div class="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <span class="font-bold text-slate-900 text-xs flex items-center gap-2">
                          <i class="fa-solid fa-ribbon text-blue-900"></i>
                          Cấu Hình Huy Hiệu Khuyến Mãi (Badge Header)
                        </span>
                        <p class="text-[11px] text-slate-500">Hiển thị dòng huy hiệu nổi bật nằm trên tiêu đề chính của Hero Banner</p>
                      </div>
                      <label class="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          bind:checked={themeDraft.heroBadgeEnabled}
                          class="w-4 h-4 accent-blue-900 rounded cursor-pointer"
                        />
                        <span class="text-xs font-bold text-slate-800">
                          {themeDraft.heroBadgeEnabled !== false ? 'Đang BẬT' : 'Đang TẮT'}
                        </span>
                      </label>
                    </div>

                    {#if themeDraft.heroBadgeEnabled !== false}
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label for="thm-badge-text" class="text-[11px] font-bold text-slate-700 block mb-1">Nội dung chữ hiển thị (Badge Text)</label>
                          <input
                            id="thm-badge-text"
                            type="text"
                            bind:value={themeDraft.badgeText}
                            placeholder="Ưu Đãi Đặc Biệt: Miễn Phí Vận Chuyển..."
                            class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label for="thm-badge-icon" class="text-[11px] font-bold text-slate-700 block mb-1">Icon FontAwesome (Khi chưa tải logo)</label>
                          <input
                            id="thm-badge-icon"
                            type="text"
                            bind:value={themeDraft.heroBadgeIcon}
                            placeholder="fa-gift, fa-fire, fa-bolt, fa-tag..."
                            class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 bg-white focus:outline-none"
                          />
                        </div>

                        <div class="sm:col-span-2 space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label for="thm-badge-logo" class="text-[11px] font-bold text-slate-700">Tải lên Logo / Ảnh riêng cho Badge Header</label>
                            {#if themeDraft.heroBadgeLogo}
                              <button
                                type="button"
                                 onclick={() => themeDraft.heroBadgeLogo = ''}
                                class="text-red-600 hover:underline text-[10px] font-semibold cursor-pointer"
                              >
                                ✕ Xóa logo, dùng lại icon FontAwesome
                              </button>
                            {/if}
                          </div>
                          <div class="flex items-center gap-3">
                            {#if themeDraft.heroBadgeLogo}
                              <div class="w-10 h-10 rounded-full border border-slate-300 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden">
                                <img src={themeDraft.heroBadgeLogo} alt="Badge Logo Preview" class="w-full h-full object-contain" />
                              </div>
                            {/if}
                            <input
                              id="thm-badge-logo"
                              type="file"
                              accept="image/*"
                              onchange={(e) => {
                                const input = e.target as HTMLInputElement;
                                if (input.files && input.files[0]) {
                                  const file = input.files[0];
                                  const reader = new FileReader();
                                  reader.onload = (evt) => {
                                    themeDraft.heroBadgeLogo = (evt.target?.result as string) || '';
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-600 bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      <!-- Live Preview of Badge Header -->
                      <div class="pt-2 border-t border-slate-200">
                        <span class="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Xem trước hiển thị trên trang chủ:</span>
                        <div class="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider">
                          {#if themeDraft.heroBadgeLogo}
                            <img src={themeDraft.heroBadgeLogo} alt="Logo" class="w-4 h-4 object-contain rounded-full" />
                          {:else}
                            <i class="fa-solid {themeDraft.heroBadgeIcon || 'fa-gift'}"></i>
                          {/if}
                          <span>{themeDraft.badgeText || 'Nội dung huy hiệu khuyến mãi'}</span>
                        </div>
                      </div>
                    {/if}
                  </div>

                  <div class="space-y-1">
                    <label for="thm-htitle" class="font-semibold text-slate-700">Tiêu Đề Dòng 1 *</label>
                    <input
                      id="thm-htitle"
                      type="text"
                      bind:value={themeDraft.heroTitle}
                      class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div class="space-y-1">
                    <label for="thm-hsub" class="font-semibold text-slate-700">Tiêu Đề Dòng 2 (Màu nhấn) *</label>
                    <input
                      id="thm-hsub"
                      type="text"
                      bind:value={themeDraft.heroSubtitle}
                      class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div class="space-y-1 sm:col-span-2">
                    <label for="thm-hdesc" class="font-semibold text-slate-700">Đoạn Văn Giới Thiệu Cửa Hàng</label>
                    <textarea
                      id="thm-hdesc"
                      bind:value={themeDraft.heroDescription}
                      rows={3}
                      class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    ></textarea>
                  </div>

                  <div class="space-y-1">
                    <label for="thm-hl-title" class="font-semibold text-slate-700">Thẻ Điểm Nhấn Trên Ảnh Banner</label>
                    <input
                      id="thm-hl-title"
                      type="text"
                      bind:value={themeDraft.heroHighlightTitle}
                      class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div class="space-y-1">
                    <label for="thm-hl-sub" class="font-semibold text-slate-700">Khẩu Hiệu Khuyến Mãi Trên Ảnh</label>
                    <input
                      id="thm-hl-sub"
                      type="text"
                      bind:value={themeDraft.heroHighlightSub}
                      class="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <!-- MULTI-POSTER CAROUSEL MANAGEMENT -->
                  <div class="space-y-3 sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-300">
                    <div class="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <span class="font-bold text-slate-800 text-xs block">Danh Sách Poster Minh Họa Khối Hero ({themeDraft.heroPosters?.length || 0})</span>
                        <p class="text-[11px] text-slate-500">Tải lên từ 2 poster trở lên, ngoài trang chủ sẽ tự động chuyển đổi hiệu ứng carousel mượt mà</p>
                      </div>
                      <button
                        type="button"
                        onclick={() => {
                          const newP: HeroPoster = {
                            id: 'poster-' + Date.now(),
                            imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80',
                            highlightTitle: 'Tiêu Đề Poster Mới',
                            highlightSub: 'Ưu đãi đặc biệt',
                            badgeText: 'Hot Deal'
                          };
                          themeDraft.heroPosters = [...(themeDraft.heroPosters || []), newP];
                        }}
                        class="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-semibold cursor-pointer text-slate-800"
                      >
                        + Thêm Poster
                      </button>
                    </div>

                    <div class="space-y-3">
                      {#each (themeDraft.heroPosters || []) as poster, pIdx (poster.id)}
                        <div class="p-3 bg-white rounded border border-slate-200 space-y-2">
                          <div class="flex items-center justify-between">
                            <span class="font-semibold text-slate-800">Poster #{pIdx + 1}</span>
                            {#if themeDraft.heroPosters.length > 1}
                              <button
                                type="button"
                                onclick={() => themeDraft.heroPosters = themeDraft.heroPosters.filter(p => p.id !== poster.id)}
                                class="text-red-600 hover:underline text-[11px] cursor-pointer"
                              >
                                Xóa poster này
                              </button>
                            {/if}
                          </div>

                          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div class="sm:col-span-1">
                              <label for="p-file-{poster.id}" class="text-[11px] text-slate-600 block mb-0.5">Tải ảnh poster</label>
                              <div class="flex items-center gap-2">
                                <img src={poster.imageUrl} alt="Poster" class="w-12 h-10 object-cover rounded border border-slate-300 shrink-0" />
                                <input
                                  id="p-file-{poster.id}"
                                  type="file"
                                  accept="image/*"
                                  onchange={(e) => {
                                    const input = e.target as HTMLInputElement;
                                    if (input.files && input.files[0]) {
                                      const file = input.files[0];
                                      const reader = new FileReader();
                                      reader.onload = (evt) => {
                                        poster.imageUrl = (evt.target?.result as string) || poster.imageUrl;
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  class="w-full border border-slate-300 rounded px-1.5 py-0.5 text-[10px]"
                                />
                              </div>
                            </div>

                            <div>
                              <label for="p-title-{poster.id}" class="text-[11px] text-slate-600 block mb-0.5">Tiêu đề poster</label>
                              <input id="p-title-{poster.id}" type="text" bind:value={poster.highlightTitle} class="w-full border border-slate-300 rounded px-2 py-1 text-xs" />
                            </div>

                            <div>
                              <label for="p-sub-{poster.id}" class="text-[11px] text-slate-600 block mb-0.5">Phụ đề poster</label>
                              <input id="p-sub-{poster.id}" type="text" bind:value={poster.highlightSub} class="w-full border border-slate-300 rounded px-2 py-1 text-xs" />
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>

            {:else if customizerSubTab === 'trust'}
              <!-- SUB-TAB 3: TRUST BADGES DEEP CUSTOMIZATION -->
              <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
                <div class="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <h3 class="text-sm font-bold text-slate-900">
                      3. Tùy Chỉnh Khối: Cam Kết Dịch Vụ
                    </h3>
                    <p class="text-xs text-slate-500">Tùy biến số lượng khối, tải ảnh logo icon riêng cho từng khối cam kết</p>
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

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                          <div class="space-y-1 sm:col-span-1">
                            <label for="tb-img-{tb.id}" class="text-[11px] font-semibold text-slate-700 block">
                              Tải Ảnh Logo / Icon Khối
                            </label>
                            <div class="flex items-center gap-2">
                              {#if tb.customIconImage}
                                <div class="w-8 h-8 rounded border border-slate-300 p-0.5 bg-white shrink-0 flex items-center justify-center">
                                  <img src={tb.customIconImage} alt="Icon" class="w-full h-full object-contain" />
                                </div>
                              {:else}
                                <div class="w-8 h-8 rounded border border-slate-300 bg-slate-100 shrink-0 flex items-center justify-center text-slate-500 text-xs">
                                  <i class="fa-solid {tb.icon || 'fa-image'}"></i>
                                </div>
                              {/if}
                              <input
                                id="tb-img-{tb.id}"
                                type="file"
                                accept="image/*"
                                onchange={(e) => handleTrustBadgeImageUpload(e, tb.id)}
                                class="flex-grow border border-slate-300 rounded px-2 py-1 text-[11px] bg-white text-slate-600"
                              />
                            </div>
                            {#if tb.customIconImage}
                              <button
                                type="button"
                                onclick={() => tb.customIconImage = ''}
                                class="text-[10px] text-red-600 hover:underline cursor-pointer block mt-0.5"
                              >
                                ✕ Xóa ảnh này
                              </button>
                            {/if}
                          </div>

                          <div class="space-y-1">
                            <label for="tb-title-{tb.id}" class="text-[11px] font-semibold text-slate-700 block">Tiêu Đề Cam Kết</label>
                            <input
                              id="tb-title-{tb.id}"
                              type="text"
                              bind:value={tb.title}
                              placeholder="Chính hãng 100%..."
                              class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white"
                            />
                          </div>

                          <div class="space-y-1">
                            <label for="tb-sub-{tb.id}" class="text-[11px] font-semibold text-slate-700 block">Nội Dung Chi Tiết</label>
                            <input
                              id="tb-sub-{tb.id}"
                              type="text"
                              bind:value={tb.subtitle}
                              placeholder="Cam kết đền tiền..."
                              class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>

            {:else if customizerSubTab === 'value'}
              <!-- SUB-TAB 4: VALUE PROPS DEEP CUSTOMIZATION -->
              <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
                <div class="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <h3 class="text-sm font-bold text-slate-900">
                      4. Tùy Chỉnh Khối: Giá Trị & Lợi Ích
                    </h3>
                    <p class="text-xs text-slate-500">Tùy biến số lượng thẻ lợi ích, tải ảnh minh họa riêng cho từng thẻ</p>
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

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                          <div class="space-y-1 sm:col-span-1">
                            <label for="vp-img-{vp.id}" class="text-[11px] font-semibold text-slate-700 block">
                              Tải Ảnh Logo / Icon Khối
                            </label>
                            <div class="flex items-center gap-2">
                              {#if vp.customIconImage}
                                <div class="w-8 h-8 rounded border border-slate-300 p-0.5 bg-white shrink-0 flex items-center justify-center">
                                  <img src={vp.customIconImage} alt="Icon" class="w-full h-full object-contain" />
                                </div>
                              {:else}
                                <div class="w-8 h-8 rounded border border-slate-300 bg-slate-100 shrink-0 flex items-center justify-center text-slate-500 text-xs">
                                  <i class="fa-solid {vp.icon || 'fa-image'}"></i>
                                </div>
                              {/if}
                              <input
                                id="vp-img-{vp.id}"
                                type="file"
                                accept="image/*"
                                onchange={(e) => handleValuePropImageUpload(e, vp.id)}
                                class="flex-grow border border-slate-300 rounded px-2 py-1 text-[11px] bg-white text-slate-600"
                              />
                            </div>
                            {#if vp.customIconImage}
                              <button
                                type="button"
                                onclick={() => vp.customIconImage = ''}
                                class="text-[10px] text-red-600 hover:underline cursor-pointer block mt-0.5"
                              >
                                ✕ Xóa ảnh này
                              </button>
                            {/if}
                          </div>

                          <div class="space-y-1 sm:col-span-2">
                            <label for="vp-title-{vp.id}" class="text-[11px] font-semibold text-slate-700 block">Tiêu Đề Lợi Ích</label>
                            <input
                              id="vp-title-{vp.id}"
                              type="text"
                              bind:value={vp.title}
                              placeholder="Giá cả cạnh tranh..."
                              class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white"
                            />
                          </div>

                          <div class="space-y-1 sm:col-span-3">
                            <label for="vp-desc-{vp.id}" class="text-[11px] font-semibold text-slate-700 block">Nội Dung Quyền Lợi</label>
                            <textarea
                              id="vp-desc-{vp.id}"
                              bind:value={vp.description}
                              rows={2}
                              placeholder="Mô tả quyền lợi..."
                              class="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white"
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>

            {:else if customizerSubTab === 'products'}
              <!-- SUB-TAB 5: PRODUCT CARDS & CATEGORY STYLING -->
              <div class="space-y-5 text-xs">
                <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
                  <h3 class="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                    Tùy Chỉnh Khối Sản Phẩm Bán Chạy & Thẻ Hàng Hóa
                  </h3>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="space-y-1">
                      <label for="pg-title" class="font-semibold text-slate-700">Tiêu đề khối sản phẩm</label>
                      <input id="pg-title" type="text" bind:value={themeDraft.productGridStyle.sectionTitle} class="w-full border border-slate-300 rounded px-3 py-1.5" />
                    </div>

                    <div class="space-y-1">
                      <label for="pg-sub" class="font-semibold text-slate-700">Phụ đề khối sản phẩm</label>
                      <input id="pg-sub" type="text" bind:value={themeDraft.productGridStyle.sectionSubtitle} class="w-full border border-slate-300 rounded px-3 py-1.5" />
                    </div>

                    <div class="space-y-1">
                      <label for="pg-btn" class="font-semibold text-slate-700">Chữ trên nút mua nhanh</label>
                      <input id="pg-btn" type="text" bind:value={themeDraft.productGridStyle.buyButtonText} class="w-full border border-slate-300 rounded px-3 py-1.5" />
                    </div>

                    <div class="space-y-1">
                      <label for="pg-limit" class="font-semibold text-slate-700 flex items-center justify-between">
                        <span>Giới hạn mua chung (mỗi SP / đơn)</span>
                        <span class="text-[10px] text-slate-400 font-normal">0 = không giới hạn</span>
                      </label>
                      <input
                        id="pg-limit"
                        type="number"
                        min="0"
                        bind:value={themeDraft.defaultMaxPurchaseLimit}
                        placeholder="0 (không giới hạn)"
                        class="w-full border border-slate-300 rounded px-3 py-1.5"
                        title="Giới hạn số lượng mua tối đa cho mỗi sản phẩm trong 1 đơn hàng (áp dụng chung cho các sản phẩm không set riêng)"
                      />
                    </div>
                  </div>
                </div>

                <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-3">
                  <h3 class="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                    Tùy Chỉnh Khối Danh Mục Phổ Biến
                  </h3>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="space-y-1">
                      <label for="cat-blk-title" class="font-semibold text-slate-700">Tiêu đề khối danh mục trang chủ</label>
                      <input id="cat-blk-title" type="text" bind:value={themeDraft.categoryBlockStyle.sectionTitle} class="w-full border border-slate-300 rounded px-3 py-1.5" />
                    </div>
                  </div>
                </div>
              </div>

            {:else if customizerSubTab === 'footer'}
              <!-- SUB-TAB 6: FOOTER & SOCIALS -->
              <div class="bg-white border border-slate-300 rounded-lg p-5 space-y-4 text-xs">
                <h3 class="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                  Thông Tin Liên Hệ & Chân Trang (Footer)
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <label for="thm-hotline" class="font-semibold text-slate-700">Hotline Bán Hàng</label>
                    <input id="thm-hotline" type="text" bind:value={themeDraft.hotline} class="w-full border border-slate-300 rounded px-3 py-1.5" />
                  </div>

                  <div class="space-y-1">
                    <label for="thm-email" class="font-semibold text-slate-700">Email Hỗ Trợ</label>
                    <input id="thm-email" type="email" bind:value={themeDraft.contactEmail} class="w-full border border-slate-300 rounded px-3 py-1.5" />
                  </div>

                  <div class="space-y-1 sm:col-span-2">
                    <label for="thm-addr" class="font-semibold text-slate-700">Địa Chỉ Văn Phòng / Cửa Hàng</label>
                    <input id="thm-addr" type="text" bind:value={themeDraft.storeAddress} class="w-full border border-slate-300 rounded px-3 py-1.5" />
                  </div>

                  <div class="space-y-1 sm:col-span-2">
                    <label for="thm-hours" class="font-semibold text-slate-700">Giờ Mở Cửa Phục Vụ</label>
                    <input id="thm-hours" type="text" bind:value={themeDraft.socials.workingHours} placeholder="08:00 - 21:30..." class="w-full border border-slate-300 rounded px-3 py-1.5" />
                  </div>

                  <!-- Social Links and Messenger Configuration -->
                  <div class="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 class="font-bold text-slate-800 text-xs flex items-center gap-2 border-b border-slate-200 pb-2">
                      <i class="fa-solid fa-share-nodes text-blue-900"></i>
                      Liên Kết Mạng Xã Hội Dưới Chân Trang (Facebook, Zalo & Messenger)
                    </h4>

                    <div class="space-y-1">
                      <label for="thm-soc-txt" class="font-semibold text-slate-700">Dòng chữ dẫn liên kết mạng xã hội dưới footer</label>
                      <input
                        id="thm-soc-txt"
                        type="text"
                        bind:value={themeDraft.socials.socialText}
                        placeholder="Kết nối cùng CSET Store qua Facebook & Zalo:"
                        class="w-full border border-slate-300 rounded px-3 py-1.5 bg-white text-xs"
                      />
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div class="space-y-1">
                        <label for="thm-fb" class="font-semibold text-slate-700 flex items-center gap-1.5">
                          <i class="fa-brands fa-facebook text-[#1877F2]"></i>
                          <span>Đường Dẫn Trang Facebook</span>
                        </label>
                        <input
                          id="thm-fb"
                          type="text"
                          bind:value={themeDraft.socials.facebook}
                          placeholder="https://facebook.com/csetstore"
                          class="w-full border border-slate-300 rounded px-3 py-1.5 bg-white text-xs"
                        />
                      </div>

                      <div class="space-y-1">
                        <label for="thm-zalo" class="font-semibold text-slate-700 flex items-center gap-1.5">
                          <i class="fa-solid fa-comment-dots text-[#0068FF]"></i>
                          <span>Đường Dẫn / SĐT Zalo</span>
                        </label>
                        <input
                          id="thm-zalo"
                          type="text"
                          bind:value={themeDraft.socials.zalo}
                          placeholder="https://zalo.me/0909123456"
                          class="w-full border border-slate-300 rounded px-3 py-1.5 bg-white text-xs"
                        />
                      </div>
                    </div>

                    <div class="space-y-1 pt-1">
                      <label for="thm-mess" class="font-semibold text-slate-700 flex items-center gap-1.5">
                        <i class="fa-brands fa-facebook-messenger text-[#006AFF]"></i>
                        <span>ID Trang Facebook (Plugin Chat Messenger Chính Thức Của Meta)</span>
                      </label>
                      <input
                        id="thm-mess"
                        type="text"
                        bind:value={themeDraft.socials.messengerPageId}
                        placeholder="Vd: 106148332115160 hoặc tên fanpage CSETStore"
                        class="w-full border border-slate-300 rounded px-3 py-1.5 bg-white text-xs"
                      />
                      <p class="text-[10px] text-slate-500">Plugin chat Messenger chính thức từ Meta (Facebook SDK) sẽ tải ở góc dưới bên trái, cho phép khách hàng đăng nhập Facebook và nhắn tin trực tiếp với fanpage.</p>
                    </div>
                  </div>
                  <div class="space-y-1 sm:col-span-2">
                    <label for="thm-footer" class="font-semibold text-slate-700">Nội Dung Bản Quyền Chân Trang</label>
                    <input id="thm-footer" type="text" bind:value={themeDraft.footerText} class="w-full border border-slate-300 rounded px-3 py-1.5" />
                  </div>
                </div>
              </div>
            {/if}

            <div class="flex justify-end pt-2">
              <button
                type="submit"
                class="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs cursor-pointer shadow-sm transition"
              >
                Lưu Cấu Hình Giao Diện
              </button>
            </div>
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
    </div>
  </div>
    <!-- Toast Notification -->
    {#if toastMsg}
      <div class="fixed bottom-4 right-4 z-50">
        <div class="bg-slate-900 text-white px-4 py-2.5 rounded shadow text-xs font-semibold flex items-center gap-2">
          <i class="fa-solid fa-check"></i>
          <span>{toastMsg}</span>
        </div>
      </div>
    {/if}
{/if}
