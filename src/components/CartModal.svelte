<script lang="ts">
  import { appStore } from '../stores/store.svelte';
import { formatCurrency, getProductMaxPurchaseLimit, getProductEffectiveStock } from '../services/pricingService';
import { themeStore } from '../stores/themeStore.svelte';

  let customerName = $state('');
  let phone = $state('');
  let address = $state('');
  let isSubmitting = $state(false);
  let isOrderCooldown = $state(false);
  let isGuestOrder = $state(false);
  let couponInput = $state('');

  let cartStockIssues = $derived.by(() => {
    const issues: string[] = [];
    for (const item of appStore.cart) {
      if (item.productId) {
        const prod = appStore.products.find(p => p.id === item.productId);
        if (prod) {
          const stock = getProductEffectiveStock(prod, item.selectedVariants);
          if (stock <= 0) {
            issues.push(`"${item.name}" hiện đã hết hàng trong kho!`);
          } else if (item.quantity > stock) {
            issues.push(`"${item.name}" chỉ còn ${stock} sản phẩm (bạn đang chọn ${item.quantity})!`);
          }
        }
      }
    }
    return issues;
  });
  let hasStockIssue = $derived(cartStockIssues.length > 0);
  $effect(() => {
    if (appStore.isCartOpen && appStore.currentCustomer) {
      customerName = appStore.currentCustomer.fullName;
      phone = appStore.currentCustomer.phone || '';
      address = appStore.currentCustomer.address || '';
    }
  });

  async function handleSubmitCheckout(e: Event) {
    e.preventDefault();
    // Chặn double submit hoặc auto-click khi đang xử lý hoặc trong cooldown
    if (isSubmitting || isOrderCooldown) return;

    if (appStore.cart.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }

    if (hasStockIssue) {
      alert(`Không thể đặt hàng vì:\n- ${cartStockIssues.join('\n- ')}\n\nVui lòng điều chỉnh hoặc xóa sản phẩm trước khi thanh toán!`);
      return;
    }
    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      alert('Vui lòng điền đầy đủ thông tin giao hàng!');
      return;
    }

    isSubmitting = true;
    try {
      const order = await appStore.checkout({
        name: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        isGuest: !appStore.currentCustomer || isGuestOrder
      });

      if (order) {
        alert(
          `Cảm ơn bạn ${customerName}! Đặt hàng thành công.\n` +
          `Mã đơn hàng: ${order.id}\n` +
          `CSET Store sẽ liên hệ qua số điện thoại ${phone} và giao hàng đến địa chỉ:\n${address} trong thời gian sớm nhất.`
        );
        customerName = '';
        phone = '';
        address = '';
        // Kích hoạt cooldown 3 giây sau khi đặt hàng thành công
        isOrderCooldown = true;
        setTimeout(() => {
          isOrderCooldown = false;
        }, 3000);
      }
    } catch (err) {
      console.error('[CartModal] Checkout error:', err);
      alert('Đã có lỗi xảy ra trong quá trình xử lý đơn hàng. Vui lòng thử lại!');
    } finally {
      isSubmitting = false;
    }
  }
</script>

{#if appStore.isCartOpen}
  <div
    class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
  >
    <button
      type="button"
      class="fixed inset-0 bg-transparent w-full h-full border-none cursor-default"
      onclick={() => appStore.closeCart()}
      aria-label="Đóng giỏ hàng"
    ></button>

    <div
      class="glass-panel w-full max-w-2xl rounded-3xl border border-slate-200 p-6 md:p-8 relative space-y-6 bg-white shadow-2xl max-h-[90vh] overflow-y-auto z-10 animate-in fade-in zoom-in-95 duration-200"
    >
      <div class="flex items-center justify-between border-b border-slate-200 pb-4 gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <i class="fa-solid fa-cart-shopping text-blue-900 text-lg sm:text-xl shrink-0"></i>
          <h3 class="text-lg sm:text-xl font-bold text-blue-950 truncate">
            Giỏ Hàng
          </h3>
          <span class="whitespace-nowrap text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 shrink-0 inline-flex items-center">
            {appStore.cartCount} món
          </span>
        </div>
        <button
          type="button"
          onclick={() => appStore.closeCart()}
          class="text-slate-400 hover:text-blue-950 text-xl cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition"
          aria-label="Đóng"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Items List -->
      {#if appStore.cart.length === 0}
        <div class="text-center py-12 space-y-3">
          <div class="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-2xl">
            <i class="fa-solid fa-basket-shopping"></i>
          </div>
          <p class="text-slate-600 font-semibold">Giỏ hàng của bạn đang trống</p>
          <button
            type="button"
            onclick={() => {
              appStore.closeCart();
              appStore.setTab('shop');
            }}
            class="px-5 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-bold shadow hover:bg-blue-800 transition cursor-pointer"
          >
            Khám Phá Cửa Hàng
          </button>
        </div>
      {:else}
        <div class="space-y-3 max-h-60 overflow-y-auto pr-1">
          {#each appStore.cart as item (item.id)}
            {@const prod = item.productId ? appStore.products.find(p => p.id === item.productId) : undefined}
            {@const limit = prod ? getProductMaxPurchaseLimit(prod, themeStore.theme.defaultMaxPurchaseLimit) : undefined}
            {@const stock = prod ? getProductEffectiveStock(prod, item.selectedVariants) : 50}
            {@const isItemOutOfStock = stock <= 0}
            {@const isItemOverStock = item.quantity > stock}
            <div class="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200 gap-3 {isItemOutOfStock || isItemOverStock ? 'border-rose-300 bg-rose-50/40' : ''}">
                <img
                  src={item.image}
                  alt={item.name}
                  class="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                />
                <div class="min-w-0">
                  <p class="text-blue-950 text-sm font-bold truncate">{item.name}</p>
                  <p class="text-blue-900 text-xs font-semibold">{formatCurrency(item.price)}</p>
                  {#if item.selectedVariants && Object.keys(item.selectedVariants).length > 0}
                    <div class="flex flex-wrap gap-1 mt-1">
                      {#each Object.entries(item.selectedVariants) as [k, v]}
                        <span class="inline-block text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                          {k}: <strong>{v}</strong>
                        </span>
                      {/each}
                    </div>
                  {/if}
                  {#if isItemOutOfStock}
                    <span class="inline-block text-[10px] text-rose-700 bg-rose-100/90 border border-rose-300 px-1.5 py-0.5 rounded font-bold mt-0.5">
                      <i class="fa-solid fa-circle-xmark"></i> Hết hàng (Còn 0)
                    </span>
                  {:else if isItemOverStock}
                    <span class="inline-block text-[10px] text-rose-700 bg-rose-100/90 border border-rose-300 px-1.5 py-0.5 rounded font-bold mt-0.5">
                      <i class="fa-solid fa-triangle-exclamation"></i> Vượt tồn kho (Kho còn {stock})
                    </span>
                  {:else if limit && limit > 0}
                    <span class="inline-block text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-semibold mt-0.5">
                      Giới hạn: tối đa {limit} sp
                    </span>
                  {/if}
                  {#if item.details?.isCustom}
                    <span class="inline-block text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded mt-0.5">
                      Đơn In Riêng
                    </span>
                  {/if}
                </div>
              </div>

              <div class="flex items-center space-x-3 shrink-0">
                <!-- Quantity control -->
                <div class="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden text-xs">
                  <button
                    type="button"
                    onclick={() => appStore.updateCartQuantity(item.id, -1)}
                    class="px-2 py-1 hover:bg-slate-100 text-slate-600"
                  >
                    -
                  </button>
                  <span class="px-2 py-1 font-bold text-slate-800">{item.quantity}</span>
                  <button
                    type="button"
                    disabled={Boolean((limit && limit > 0 && item.quantity >= limit) || item.quantity >= stock || isItemOutOfStock)}
                    onclick={() => appStore.updateCartQuantity(item.id, 1)}
                    class="px-2 py-1 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
                    title={isItemOutOfStock ? 'Sản phẩm đã hết hàng' : (item.quantity >= stock ? `Kho chỉ còn ${stock} sản phẩm` : (limit && limit > 0 && item.quantity >= limit ? `Đã đạt giới hạn tối đa (${limit} sản phẩm)` : 'Tăng số lượng'))}
                  >
                    +
                  </button>

                <button
                  type="button"
                  onclick={() => appStore.removeFromCart(item.id)}
                  class="text-red-500 hover:text-red-700 p-1 cursor-pointer transition text-xs font-semibold"
                  title="Xóa món này"
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          {/each}
        </div>

        <!-- Checkout Form & Summary -->
        <!-- Coupon Code Input Box -->
        <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-slate-700 uppercase flex items-center gap-1.5">
              <i class="fa-solid fa-ticket text-amber-500"></i>
              Mã Giảm Giá / Voucher
            </span>
            {#if appStore.appliedCoupon}
              <span class="text-emerald-700 font-bold flex items-center gap-1">
                <i class="fa-solid fa-circle-check"></i>
                Đang áp dụng: {appStore.appliedCoupon.code}
              </span>
            {/if}
          </div>

          {#if !appStore.appliedCoupon}
            <div class="flex gap-2">
              <input
                type="text"
                bind:value={couponInput}
                placeholder="Nhập mã (VD: CSET10, GIAM50K, CSETVIP)..."
                class="flex-grow uppercase bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <button
                type="button"
                onclick={() => {
                  if (couponInput.trim()) {
                    const ok = appStore.applyCoupon(couponInput);
                    if (ok) couponInput = '';
                  }
                }}
                class="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shrink-0 shadow-xs"
              >
                Áp Dụng
              </button>
            </div>
            {#if appStore.couponError}
              <p class="text-rose-600 text-xs font-semibold">{appStore.couponError}</p>
            {/if}
          {:else}
            <div class="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs">
              <div class="space-y-0.5">
                <div class="font-bold text-emerald-900 flex items-center gap-1.5">
                  <span class="bg-emerald-600 text-white px-2 py-0.5 rounded font-black text-[11px]">{appStore.appliedCoupon.code}</span>
                  <span>{appStore.appliedCoupon.description}</span>
                </div>
                <p class="text-emerald-700 text-[11px]">Tiết kiệm: -{formatCurrency(appStore.discountAmount)}</p>
              </div>
              <button
                type="button"
                onclick={() => appStore.removeCoupon()}
                class="text-rose-600 hover:text-rose-800 text-xs font-bold underline cursor-pointer shrink-0 ml-2"
              >
                Hủy mã
              </button>
            </div>
          {/if}
        </div>

        <!-- Checkout Form & Summary -->
        <div class="border-t border-slate-200 pt-4 space-y-4">
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div class="flex justify-between items-center text-slate-600">
              <span>Tạm tính tiền hàng:</span>
              <span class="font-bold text-slate-800">{formatCurrency(appStore.subtotal)}</span>
            </div>
            {#if appStore.discountAmount > 0}
              <div class="flex justify-between items-center text-emerald-600 font-semibold">
                <span>Giảm giá ({appStore.appliedCoupon?.code}):</span>
                <span>-{formatCurrency(appStore.discountAmount)}</span>
              </div>
            {/if}
            <div class="flex justify-between items-center text-sm font-black text-blue-950 pt-2 border-t border-slate-200">
              <span class="text-base">Tổng Tiền Thanh Toán:</span>
              <span class="text-2xl text-blue-900">{formatCurrency(appStore.cartTotal)}</span>
            </div>
          </div>
          <form onsubmit={handleSubmitCheckout} class="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h4 class="font-bold text-blue-950 text-sm flex items-center">
              <i class="fa-solid fa-address-card mr-2 text-blue-900"></i>
              Thông Tin Giao Hàng
              {#if appStore.currentCustomer}
                <span class="ml-auto text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Đã đăng nhập ({appStore.currentCustomer.username})
                </span>
              {:else}
                <span class="ml-auto text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                  Đặt hàng dạng Khách (Guest)
                </span>
              {/if}
            </h4>

            {#if !appStore.currentCustomer}
              <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                <span class="text-blue-950 font-medium">Bạn đã có tài khoản CSET Store?</span>
                <button
                  type="button"
                  onclick={() => {
                    appStore.closeCart();
                    appStore.openAuthModal('login');
                  }}
                  class="text-blue-900 font-bold hover:underline cursor-pointer"
                >
                  Đăng nhập để tích điểm & theo dõi đơn &rarr;
                </button>
              </div>
            {/if}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label for="c-name" class="text-xs font-bold text-slate-600 uppercase">Họ và Tên *</label>
                <input
                  id="c-name"
                  type="text"
                  bind:value={customerName}
                  required
                  placeholder="Nhập họ và tên..."
                  class="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div class="space-y-1">
                <label for="c-phone" class="text-xs font-bold text-slate-600 uppercase">Số Điện Thoại *</label>
                <input
                  id="c-phone"
                  type="tel"
                  bind:value={phone}
                  required
                  placeholder="Nhập số điện thoại..."
                  class="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
            </div>

            <div class="space-y-1">
              <label for="c-addr" class="text-xs font-bold text-slate-600 uppercase">Địa Chỉ Nhận Hàng *</label>
              <input
                id="c-addr"
                type="text"
                bind:value={address}
                required
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                class="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            {#if hasStockIssue}
              <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold space-y-1">
                <div class="flex items-center gap-1.5 font-bold text-rose-900">
                  <i class="fa-solid fa-circle-exclamation"></i>
                  <span>Có sản phẩm không đủ tồn kho để đặt:</span>
                </div>
                <ul class="list-disc list-inside space-y-0.5 text-[11px] text-rose-700">
                  {#each cartStockIssues as issue}
                    <li>{issue}</li>
                  {/each}
                </ul>
              </div>
            {/if}

            <button
              type="submit"
              disabled={isSubmitting || isOrderCooldown || hasStockIssue}
              class="w-full py-4 rounded-xl bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold cursor-pointer shadow-md transition flex items-center justify-center gap-2"
            >
              {#if isSubmitting}
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Đang Xử Lý Đơn Hàng...</span>
              {:else if isOrderCooldown}
                <i class="fa-solid fa-hourglass-half"></i>
                <span>Vui Lòng Chờ Trong Giây Lát...</span>
              {:else if hasStockIssue}
                <i class="fa-solid fa-ban"></i>
                <span>Có Sản Phẩm Hết Hàng Trong Giỏ</span>
              {:else}
                <i class="fa-solid fa-check"></i>
                <span>Xác Nhận Đặt Hàng Ngay</span>
              {/if}
            </button>
          </form>
        </div>
      {/if}
    </div>
  </div>
{/if}
