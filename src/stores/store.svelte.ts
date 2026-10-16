import type { Product, CartItem, Order, CategoryKey } from '../models/types';
import { LocalStorageProductRepository, LocalStorageOrderRepository } from '../repositories';

const productRepo = new LocalStorageProductRepository();
const orderRepo = new LocalStorageOrderRepository();

class StoreState {
  // Navigation State
  activeTab = $state<'home' | 'shop' | 'custom' | 'admin'>('home');

  // Products State
  products = $state<Product[]>(productRepo.getAll());
  selectedCategory = $state<CategoryKey>('all');
  searchQuery = $state<string>('');

  // Cart State
  cart = $state<CartItem[]>([]);
  isCartOpen = $state<boolean>(false);

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

  cartTotal = $derived(
    this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  // Navigation Actions
  setTab(tab: 'home' | 'shop' | 'custom' | 'admin') {
    this.activeTab = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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

  // Cart Actions
  openCart() {
    this.isCartOpen = true;
  }

  closeCart() {
    this.isCartOpen = false;
  }

  addToCart(product: Product, quantity = 1) {
    const existingIndex = this.cart.findIndex(
      (item) => item.productId === product.id && !item.details?.isCustom
    );

    if (existingIndex > -1) {
      this.cart[existingIndex].quantity += quantity;
    } else {
      this.cart.push({
        id: 'ITEM-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity
      });
    }

    this.showToast(`Đã thêm "${product.name}" vào giỏ hàng!`);
  }

  addCustomOrderToCart(customItem: {
    fileName: string;
    grams: number;
    hours: string;
    price: number;
    infill: number;
  }) {
    this.cart.push({
      id: 'CUSTOM-' + Date.now(),
      name: `In 3D Theo Yêu Cầu (${customItem.fileName} - ${customItem.grams}g - Infill ${customItem.infill}%)`,
      price: customItem.price,
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
      quantity: 1,
      details: {
        isCustom: true,
        fileName: customItem.fileName,
        grams: customItem.grams,
        hours: customItem.hours,
        infill: customItem.infill
      }
    });

    this.showToast('Đã thêm dịch vụ in 3D theo yêu cầu vào giỏ hàng!');
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
  checkout(customer: { name: string; phone: string; address: string }): Order | null {
    if (this.cart.length === 0) {
      this.showToast('Giỏ hàng của bạn đang trống!');
      return null;
    }

    const newOrder = orderRepo.create({
      customerName: customer.name,
      phone: customer.phone,
      address: customer.address,
      items: [...this.cart],
      totalAmount: this.cartTotal,
      status: 'pending'
    });

    this.orders = orderRepo.getAll();
    this.clearCart();
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
