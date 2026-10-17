import type { Product, CartItem, Order, CategoryKey, User, Coupon } from '../models/types';
import { LocalStorageProductRepository, LocalStorageOrderRepository, LocalStorageCouponRepository } from '../repositories';
import { authService } from '../services/authService';
import { routerService } from '../services/routerService';
import { getEffectivePrice } from '../services/pricingService';
const productRepo = new LocalStorageProductRepository();
const orderRepo = new LocalStorageOrderRepository();
const couponRepo = new LocalStorageCouponRepository();

export function getCanonicalVariantKey(variants?: Record<string, string>): string {
  if (!variants || Object.keys(variants).length === 0) return '';
  const sortedKeys = Object.keys(variants).sort();
  const sortedObj: Record<string, string> = {};
  for (const k of sortedKeys) {
    sortedObj[k] = String(variants[k]);
  }
  return JSON.stringify(sortedObj);
}
class StoreState {
  // Navigation State (supports 'home', 'shop', 'orders', or any custom tab id)
  activeTab = $state<string>('home');
  // Customer Auth State
  currentCustomer = $state<User | null>(authService.getCustomerSession());
  isAuthModalOpen = $state<boolean>(false);
  isProfileModalOpen = $state<boolean>(false);
  authMode = $state<'login' | 'register'>('login');

  // Products State
  products = $state<Product[]>(productRepo.getAll());
  selectedCategory = $state<CategoryKey>('all');
  searchQuery = $state<string>('');

  constructor() {
    if (typeof window !== 'undefined') {
      this.syncFromServer();
      window.addEventListener('storage', (e) => {
        if (e.key === 'cset_products_v5') {
          this.products = productRepo.getAll();
        }
        if (e.key === 'cset_orders_v5') {
          this.orders = orderRepo.getAll();
        }
      });
    }
  }
  // Cart State
  cart = $state<CartItem[]>([]);
  isCartOpen = $state<boolean>(false);

  // Coupon State
  appliedCoupon = $state<Coupon | null>(null);
  couponError = $state<string>('');

  // Product Detail Modal State
  selectedProduct = $state<Product | null>(null);
  isProductModalOpen = $state<boolean>(false);

  // Orders (Admin)
  orders = $state<Order[]>(orderRepo.getAll());

  // Toast notification
  toastMessage = $state<string | null>(null);
  // Derived state
  filteredProducts = $derived(
    this.products.filter((p) => {
      const matchCat = this.selectedCategory === 'all' || p.category === this.selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(this.searchQuery.toLowerCase().trim());
      return matchCat && matchSearch;
    })
  );

  cartCount = $derived(
    this.cart.reduce((sum, item) => sum + item.quantity, 0)
  );

  subtotal = $derived(
    this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  discountAmount = $derived.by(() => {
    if (!this.appliedCoupon) return 0;
    const sub = this.subtotal;
    if (this.appliedCoupon.minOrderValue && sub < this.appliedCoupon.minOrderValue) {
      return 0;
    }
    let discount = 0;
    if (this.appliedCoupon.discountType === 'percentage') {
      discount = Math.round((sub * this.appliedCoupon.discountValue) / 100);
      if (this.appliedCoupon.maxDiscountAmount && discount > this.appliedCoupon.maxDiscountAmount) {
        discount = this.appliedCoupon.maxDiscountAmount;
      }
    } else {
      discount = this.appliedCoupon.discountValue;
    }
    return Math.min(discount, sub);
  });

  cartTotal = $derived(
    Math.max(0, this.subtotal - this.discountAmount)
  );

  // Coupon Actions
  applyCoupon(code: string): boolean {
    this.couponError = '';
    if (!code.trim()) {
      this.couponError = 'Vui lòng nhập mã giảm giá!';
      return false;
    }
    const coupon = couponRepo.getByCode(code);
    if (!coupon) {
      this.couponError = 'Mã giảm giá không tồn tại hoặc đã hết hạn!';
      return false;
    }
    if (!coupon.isActive) {
      this.couponError = 'Mã giảm giá hiện đang tạm khóa!';
      return false;
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      this.couponError = 'Mã giảm giá đã đạt giới hạn lượt sử dụng!';
      return false;
    }
    if (coupon.minOrderValue && this.subtotal < coupon.minOrderValue) {
      this.couponError = `Đơn hàng tối thiểu ${coupon.minOrderValue.toLocaleString('vi-VN')} VNĐ để áp dụng mã này!`;
      return false;
    }

    this.appliedCoupon = coupon;
    this.showToast(`Đã áp dụng mã giảm giá "${coupon.code}" thành công!`);
    return true;
  }

  removeCoupon() {
    this.appliedCoupon = null;
    this.couponError = '';
    this.showToast('Đã hủy mã giảm giá');
  }
  // Navigation Actions
  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'home') {
      routerService.navigate('/');
    } else if (tab === 'shop') {
      routerService.navigate('/shop');
    } else if (tab === 'orders') {
      routerService.navigate('/orders');
    } else if (tab === 'custom-order') {
      routerService.navigate('/custom-order');
    } else if (tab.startsWith('tab-')) {
      routerService.navigate('/tab', tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Dedicated Product Detail Page
  viewProductDetail(product: { id: number }) {
    this.selectedProduct = null;
    this.activeTab = 'product-detail';
    routerService.navigate('/product', product.id.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  // Customer Auth Actions
  openAuthModal(mode: 'login' | 'register' = 'login') {
    this.authMode = mode;
    this.isAuthModalOpen = true;
  }

  closeAuthModal() {
    this.isAuthModalOpen = false;
  }

  navigateToProfile() {
    if (!this.currentCustomer) {
      this.openAuthModal('login');
      return;
    }
    this.activeTab = 'profile';
    routerService.navigate('/profile');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  openProfileModal() {
    this.navigateToProfile();
  }

  closeProfileModal() {
    this.isProfileModalOpen = false;
  }

  async loginCustomer(username: string, pass: string) {
    const res = await authService.loginCustomer(username, pass);
    if (res.success && res.user) {
      this.currentCustomer = res.user;
      this.orders = orderRepo.getAll();
      this.closeAuthModal();
      this.showToast(`Xin chào, ${res.user.fullName}!`);
      return true;
    }
    this.showToast(res.message || 'Đăng nhập thất bại!');
    return false;
  }

  async registerCustomer(data: { username: string; password?: string; fullName: string; phone?: string; address?: string }) {
    const res = await authService.registerCustomer(data);
    if (res.success && res.user) {
      this.currentCustomer = res.user;
      this.orders = orderRepo.getAll();
      this.closeAuthModal();
      this.showToast(`Đăng ký tài khoản thành công! Xin chào ${res.user.fullName}!`);
      return true;
    }
    this.showToast(res.message || 'Đăng ký thất bại!');
    return false;
  }

  logoutCustomer() {
    authService.setCustomerSession(null);
    this.currentCustomer = null;
    if (this.activeTab === 'orders') {
      this.activeTab = 'home';
    }
    this.showToast('Đã đăng xuất tài khoản khách hàng!');
  }

  async updateCustomerProfile(patch: Partial<User>) {
    if (!this.currentCustomer) return false;
    const updated = await authService.updateCustomerProfile(this.currentCustomer.id, patch);
    if (updated) {
      this.currentCustomer = updated;
      this.showToast('Đã cập nhật thông tin cá nhân thành công!');
      return true;
    }
    this.showToast('Cập nhật thông tin thất bại!');
    return false;
  }

  async syncFromServer() {
    if (typeof window === 'undefined' || typeof fetch !== 'function') return;
    try {
      const [uRes, pRes, oRes] = await Promise.all([
        fetch('/api/users').catch(() => null),
        fetch('/api/products').catch(() => null),
        fetch('/api/orders').catch(() => null)
      ]);

      if (uRes && uRes.ok) {
        const uJson = await uRes.json();
        if (uJson.success && Array.isArray(uJson.data)) {
          localStorage.setItem('cset_users_v5', JSON.stringify(uJson.data));
          if (this.currentCustomer) {
            const fresh = uJson.data.find((u: User) => u.id === this.currentCustomer?.id || u.username === this.currentCustomer?.username);
            if (fresh) {
              this.currentCustomer = fresh;
            }
          }
        }
      }

      if (pRes && pRes.ok) {
        const pJson = await pRes.json();
        if (pJson.success && Array.isArray(pJson.data)) {
          this.products = pJson.data;
          localStorage.setItem('cset_products_v5', JSON.stringify(pJson.data));
        }
      }

      if (oRes && oRes.ok) {
        const oJson = await oRes.json();
        if (oJson.success && Array.isArray(oJson.data)) {
          this.orders = oJson.data;
          localStorage.setItem('cset_orders_v5', JSON.stringify(oJson.data));
        }
      }
    } catch {}
  }
  customerOrders = $derived(
    this.currentCustomer
      ? this.orders.filter((o) => o.customerId === this.currentCustomer?.id || o.phone === this.currentCustomer?.phone)
      : []
  );

  // Toast Helpers
  showToast(msg: string) {
    this.toastMessage = msg;
    setTimeout(() => {
      if (this.toastMessage === msg) {
        this.toastMessage = null;
      }
    }, 3000);
  }

  // Product Actions
  openProductDetail(product: Product) {
    this.selectedProduct = product;
    this.isProductModalOpen = true;
  }

  closeProductDetail() {
    this.selectedProduct = null;
    this.isProductModalOpen = false;
  }

  addProduct(newProd: Omit<Product, 'id'>) {
    const created = productRepo.create(newProd);
    this.products = productRepo.getAll();
    this.showToast(`Đã thêm sản phẩm "${created.name}" thành công!`);
    return created;
  }

  deleteProduct(id: number) {
    const item = this.products.find((p) => p.id === id);
    const success = productRepo.delete(id);
    if (success) {
      this.products = productRepo.getAll();
      this.showToast(`Đã xóa sản phẩm "${item?.name || id}"!`);
    }
    return success;
  }

  resetProducts() {
    this.products = productRepo.resetToDefaults();
    this.showToast('Đã khôi phục dữ liệu mẫu ban đầu!');
  }

  toggleProductShowOnHome(productId: number) {
    const item = this.products.find((p) => p.id === productId);
    if (!item) return;
    const nextVal = !item.showOnHome;
    item.showOnHome = nextVal;
    productRepo.update(productId, { showOnHome: nextVal });
    this.products = productRepo.getAll();
    this.showToast(nextVal ? `Đã ghim "${item.name}" hiển thị tại trang chủ!` : `Đã bỏ ghim "${item.name}" khỏi trang chủ!`);
  }

  autoSelectTop5BestSellers() {
    const sorted = [...this.products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    const top5Ids = new Set(sorted.slice(0, 5).map(p => p.id));

    for (const p of this.products) {
      const shouldShow = top5Ids.has(p.id);
      if (p.showOnHome !== shouldShow) {
        p.showOnHome = shouldShow;
        productRepo.update(p.id, { showOnHome: shouldShow });
      }
    }
    this.products = productRepo.getAll();
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      fetch('/api/products/auto-top5', { method: 'POST' }).catch(() => {});
    }
    this.showToast('Đã tự động chọn 5 sản phẩm có lượt bán cao nhất hiển thị tại trang chủ!');
  }

  // Cart Actions
  openCart() {
    this.isCartOpen = true;
  }

  closeCart() {
    this.isCartOpen = false;
  }

  // Anti-spam & Throttling
  private lastAddToCartTime = 0;
  private addToCartBurstCount = 0;
  private burstResetTimer: number | undefined;
  private lastCheckoutTime = 0;

  addToCart(product: Product, quantity = 1, selectedVariants?: Record<string, string>): boolean {
    const now = Date.now();
    const timeSinceLast = now - this.lastAddToCartTime;

    // Chống auto-clicker và spam click liên tục (tối thiểu 250ms giữa 2 lần bấm)
    if (timeSinceLast < 250) {
      this.showToast('Thao tác quá nhanh, vui lòng chờ chút nhé!');
      return false;
    }

    // Burst protection: Tối đa 6 lần thêm liên tục trong 2.5 giây
    this.addToCartBurstCount += 1;
    if (this.addToCartBurstCount > 6) {
      this.showToast('Phát hiện thao tác liên tục! Vui lòng chờ 2 giây trước khi thêm tiếp.');
      return false;
    }
    clearTimeout(this.burstResetTimer);
    this.burstResetTimer = setTimeout(() => {
      this.addToCartBurstCount = 0;
    }, 2500);
    this.lastAddToCartTime = now;
    // Yêu cầu chọn phân loại nếu sản phẩm có variantGroups
    if (product.variantGroups && product.variantGroups.length > 0) {
      const hasMissing = product.variantGroups.some((vg) => !selectedVariants || !selectedVariants[vg.name]);
      if (hasMissing) {
        this.openProductDetail(product);
        this.showToast(`Vui lòng chọn phân loại cho "${product.name}"!`);
        return false;
      }
    }

    // Gom sản phẩm cùng loại: kiểm tra trùng productId và trùng các thuộc tính phân loại (variants)
    const targetKey = getCanonicalVariantKey(selectedVariants);
    const existingIndex = this.cart.findIndex(
      (item) => item.productId === product.id && getCanonicalVariantKey(item.selectedVariants) === targetKey
    );

    const variantSuffix = selectedVariants && Object.keys(selectedVariants).length > 0
      ? ` (${Object.values(selectedVariants).join(', ')})`
      : '';

    if (existingIndex > -1) {
      // Nếu cùng loại thì gom về chung 1 sản phẩm và tăng số lượng
      this.cart[existingIndex].quantity += quantity;
      this.showToast(`Đã tăng số lượng "${product.name}${variantSuffix}" lên ${this.cart[existingIndex].quantity}!`);
    } else {
      const effectivePrice = getEffectivePrice(product);
      this.cart.push({
        id: 'ITEM-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        productId: product.id,
        name: product.name,
        price: effectivePrice,
        originalPrice: product.originalPrice || (effectivePrice < product.price ? product.price : undefined),
        image: product.image,
        quantity,
        selectedVariants: selectedVariants && Object.keys(selectedVariants).length > 0 ? { ...selectedVariants } : undefined
      });
      this.showToast(`Đã thêm "${product.name}${variantSuffix}" vào giỏ hàng!`);
    }
    return true;
  }

  addCustomOrderToCart(customOrder: { fileName: string; grams: number; hours: number; price: number; infill: number }) {
    this.cart.push({
      id: 'CUSTOM-' + Date.now(),
      name: `Sản Phẩm Theo Yêu Cầu (${customOrder.fileName})`,
      price: customOrder.price,
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
      quantity: 1,
      details: { isCustom: true, ...customOrder }
    });
    this.openCart();
    this.showToast('Đã thêm sản phẩm theo yêu cầu vào giỏ hàng!');
  }

  removeFromCart(cartItemId: string) {
    this.cart = this.cart.filter((item) => item.id !== cartItemId);
  }

  updateCartQuantity(cartItemId: string, delta: number) {
    const item = this.cart.find((i) => i.id === cartItemId);
    if (!item) return;
    const nextQty = item.quantity + delta;
    if (nextQty <= 0) {
      this.removeFromCart(cartItemId);
    } else {
      item.quantity = nextQty;
    }
  }

  clearCart() {
    this.cart = [];
  }

  // Checkout Action
  async checkout(customer: { name: string; phone: string; address: string; isGuest?: boolean }): Promise<Order | null> {
    const now = Date.now();
    // Chống double submit / auto-click khi đặt hàng
    if (now - this.lastCheckoutTime < 3000) {
      this.showToast('Đơn hàng của bạn đang được xử lý, vui lòng không gửi lại liên tục!');
      return null;
    }

    if (this.cart.length === 0) {
      this.showToast('Giỏ hàng của bạn đang trống!');
      return null;
    }
    this.lastCheckoutTime = now;
    const subtotal = this.subtotal;
    const discount = this.discountAmount;
    const finalTotal = this.cartTotal;
    const coupon = this.appliedCoupon;

    const newOrder = await orderRepo.create({
      customerId: !customer.isGuest && this.currentCustomer ? this.currentCustomer.id : undefined,
      customerName: customer.name,
      phone: customer.phone,
      address: customer.address,
      items: [...this.cart],
      subtotalAmount: subtotal,
      couponCode: coupon ? coupon.code : undefined,
      discountAmount: discount > 0 ? discount : undefined,
      totalAmount: finalTotal,
      status: 'pending'
    });

    // If coupon used, increment its usage
    if (coupon) {
      couponRepo.incrementUsage(coupon.code);
    }

    this.orders = orderRepo.getAll();
    this.clearCart();
    this.appliedCoupon = null;
    this.isCartOpen = false;
    this.showToast(`Đặt hàng thành công! Mã đơn: ${newOrder.id}`);
    return newOrder;
  }

  updateOrderStatus(orderId: string, status: Order['status']) {
    orderRepo.updateStatus(orderId, status);
    this.orders = orderRepo.getAll();
    this.showToast(`Đã cập nhật trạng thái đơn ${orderId} sang "${status}"`);
  }
}

export const appStore = new StoreState();
