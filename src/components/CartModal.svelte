<script lang="ts">
  import { appStore } from '../stores/store.svelte';
  import { formatCurrency } from '../services/pricingService';

  let customerName = $state('');
  let phone = $state('');
  let address = $state('');
  let isSubmitting = $state(false);
  let isGuestOrder = $state(false);

  $effect(() => {
    if (appStore.isCartOpen && appStore.currentCustomer) {
      customerName = appStore.currentCustomer.fullName;
      phone = appStore.currentCustomer.phone || '';
      address = appStore.currentCustomer.address || '';
    }
  });

  function handleSubmitCheckout(e: Event) {
    e.preventDefault();
    if (appStore.cart.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }

    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      alert('Vui lòng điền đầy đủ thông tin giao hàng!');
      return;
    }

    isSubmitting = true;
    const order = appStore.checkout({
      name: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      isGuest: isGuestOrder
    });

    isSubmitting = false;

    if (order) {
      alert(
        `Cảm ơn bạn ${customerName}! Đặt hàng thành công.\n` +
        `Mã đơn hàng: ${order.id}\n` +
        `CSET Store sẽ liên hệ qua số điện thoại ${phone} và giao hàng đến địa chỉ:\n${address} trong thời gian sớm nhất.`
      );
      customerName = '';
      phone = '';
      address = '';
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
      <div class="flex items-center justify-between border-b border-slate-200 pb-4">
        <h3 class="text-xl font-bold text-blue-950 flex items-center">
          <i class="fa-solid fa-cart-shopping text-blue-900 mr-2.5"></i>
          Giỏ Hàng & Thanh Toán
          <span class="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
            {appStore.cartCount} món
          </span>
        </h3>
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
            <div class="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200 gap-3">
              <div class="flex items-center space-x-3 min-w-0">
                <img
                  src={item.image}
                  alt={item.name}
                  class="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                />
                <div class="min-w-0">
                  <p class="text-blue-950 text-sm font-bold truncate">{item.name}</p>
                  <p class="text-blue-900 text-xs font-semibold">{formatCurrency(item.price)}</p>
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
                    onclick={() => appStore.updateCartQuantity(item.id, 1)}
                    class="px-2 py-1 hover:bg-slate-100 text-slate-600"
                  >
                    +
                  </button>
                </div>

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
        <div class="border-t border-slate-200 pt-4 space-y-4">
          <div class="flex justify-between items-center text-lg font-black text-blue-950 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span>Tổng Tiền Thanh Toán:</span>
            <span class="text-2xl text-blue-900">{formatCurrency(appStore.cartTotal)}</span>
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

            <button
              type="submit"
              disabled={isSubmitting}
              class="w-full py-4 rounded-xl bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold cursor-pointer shadow-md transition flex items-center justify-center gap-2"
            >
              <i class="fa-solid fa-check"></i>
              <span>{isSubmitting ? 'Đang Xử Lý...' : 'Xác Nhận Đặt Hàng Ngay'}</span>
            </button>
          </form>
        </div>
      {/if}
    </div>
  </div>
{/if}
