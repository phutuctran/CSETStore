<script lang="ts">
  import { appStore } from '../stores/store.svelte';
  import { formatCurrency } from '../services/pricingService';
  import { LocalStorageOrderRepository } from '../repositories';
  import type { Order } from '../models/types';

  const orderRepo = new LocalStorageOrderRepository();
  const statusLabels: Record<string, { label: string; class: string }> = {
    pending: { label: 'Chờ xác nhận', class: 'bg-amber-100 text-amber-800' },
    processing: { label: 'Đang xử lý / Đóng gói', class: 'bg-blue-100 text-blue-900' },
    completed: { label: 'Đã hoàn tất / Đã giao', class: 'bg-emerald-100 text-emerald-800' },
    cancelled: { label: 'Đã hủy', class: 'bg-red-100 text-red-800' }
  };

  let guestSearchQuery = $state('');
  let guestSearched = $state(false);
  let guestSearchResults = $state<Order[]>([]);
  let isSearchingGuest = $state(false);

  // Recent guest orders stored locally on this device
  let localGuestOrders = $derived.by(() => {
    const all = orderRepo.getAll();
    return all.filter(o => !o.customerId);
  });

  async function handleGuestSearch(e: Event) {
    e.preventDefault();
    const q = guestSearchQuery.trim().toLowerCase();
    if (!q) return;

    isSearchingGuest = true;
    guestSearched = true;
    try {
      await appStore.syncFromServer();
      const allOrders = appStore.orders;
      const cleanQ = q.replace(/[\s+-]+/g, '');
      guestSearchResults = allOrders.filter(o => {
        const matchId = o.id.toLowerCase().includes(q);
        const cleanPhone = (o.phone || '').replace(/[\s+-]+/g, '');
        const matchPhone = cleanPhone && (cleanPhone.includes(cleanQ) || cleanQ.includes(cleanPhone));
        return matchId || matchPhone;
      });
    } catch {
      const local = orderRepo.getAll();
      const cleanQ = q.replace(/[\s+-]+/g, '');
      guestSearchResults = local.filter(o => {
        const matchId = o.id.toLowerCase().includes(q);
        const cleanPhone = (o.phone || '').replace(/[\s+-]+/g, '');
        const matchPhone = cleanPhone && (cleanPhone.includes(cleanQ) || cleanQ.includes(cleanPhone));
        return matchId || matchPhone;
      });
    } finally {
      isSearchingGuest = false;
    }
  }
</script>

<div class="space-y-8 max-w-4xl mx-auto">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
    <div>
      <h2 class="text-3xl font-black text-blue-950">Lịch Sử Đơn Hàng Của Bạn</h2>
      <p class="text-slate-600 text-sm mt-1">
        Theo dõi tiến độ đóng gói và vận chuyển các đơn hàng đã đặt tại CSET Store.
      </p>
    </div>

    {#if appStore.currentCustomer}
      <div class="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onclick={() => appStore.navigateToProfile()}
          class="flex items-center gap-3 text-left hover:opacity-80 transition cursor-pointer"
          title="Xem trang cá nhân & đánh giá"
        >
          <div class="w-10 h-10 bg-blue-100 text-blue-900 rounded-xl flex items-center justify-center font-bold overflow-hidden">
            {#if appStore.currentCustomer.avatar}
              <img src={appStore.currentCustomer.avatar} alt="Avatar" class="w-full h-full object-cover" />
            {:else}
              <i class="fa-solid fa-user"></i>
            {/if}
          </div>
          <div>
            <span class="text-xs font-bold text-blue-950 block">{appStore.currentCustomer.fullName}</span>
            <span class="text-[11px] text-slate-500 block">@{appStore.currentCustomer.username} • Xem hồ sơ</span>
          </div>
        </button>
        <button
          type="button"
          onclick={() => appStore.logoutCustomer()}
          class="ml-2 text-xs text-red-600 hover:text-red-800 font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
        >
          Đăng xuất
        </button>
      </div>
    {/if}
  </div>

  {#snippet renderOrderCard(order: Order)}
    <div class="glass-panel rounded-2xl border border-slate-200 p-6 bg-white space-y-4 shadow-xs">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div class="flex items-center gap-3">
          <span class="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            {order.id}
          </span>
          <span class="text-xs text-slate-400">{order.createdAt}</span>
          {#if !order.customerId}
            <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
              Khách vãng lai
            </span>
          {/if}
        </div>

        <div>
          <span class="px-3 py-1 rounded-full text-xs font-bold {statusLabels[order.status]?.class || 'bg-slate-100 text-slate-800'}">
            {statusLabels[order.status]?.label || order.status}
          </span>
        </div>
      </div>

      <!-- Items list -->
      <div class="space-y-2">
        {#each order.items as item}
          <div class="flex items-center justify-between text-xs py-2 border-b border-slate-50 last:border-none">
            <div class="flex items-center space-x-3">
              {#if item.productId}
                <a href="#/product/{item.productId}" title="Xem chi tiết sản phẩm này" class="shrink-0">
                  <img src={item.image} alt={item.name} class="w-10 h-10 rounded-lg object-cover border border-slate-200 hover:opacity-80 transition" />
                </a>
              {:else}
                <img src={item.image} alt={item.name} class="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
              {/if}
              <div>
                {#if item.productId}
                  <a
                    href="#/product/{item.productId}"
                    class="font-bold text-blue-950 hover:text-blue-700 hover:underline inline-flex items-center gap-1.5"
                    title="Xem trang chi tiết sản phẩm này"
                  >
                    <span>{item.name}</span>
                    <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-slate-400"></i>
                  </a>
                {:else}
                  <span class="font-bold text-blue-950 block">{item.name}</span>
                {/if}
                <div class="flex items-center gap-2 text-slate-500 mt-0.5">
                  <span>Số lượng: x{item.quantity}</span>
                  {#if item.selectedVariants && Object.keys(item.selectedVariants).length > 0}
                    <span>•</span>
                    <span class="text-blue-900 font-medium">
                      {Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    </span>
                  {/if}
                </div>
              </div>
            </div>
            <span class="font-bold text-blue-900">{formatCurrency(item.price * item.quantity)}</span>
          </div>
        {/each}
      </div>

      <div class="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div class="text-slate-500">
          <span>Giao đến: </span>
          <strong class="text-blue-950">{order.customerName}</strong> ({order.phone}) - {order.address}
        </div>

        <div class="text-right">
          <span class="text-slate-500 font-semibold">Tổng tiền: </span>
          <span class="text-base font-black text-blue-900 ml-1">{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>
    </div>
  {/snippet}

  {#if !appStore.currentCustomer}
    <!-- GUEST ORDER TRACKING & LOOKUP -->
    <div class="space-y-6">
      <!-- Lookup Box -->
      <div class="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 bg-white space-y-4 shadow-xs">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center text-lg font-bold">
            <i class="fa-solid fa-magnifying-glass"></i>
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-bold text-blue-950">Tra Cứu Đơn Hàng Vãng Lai</h3>
            <p class="text-xs text-slate-500">Tra cứu tình trạng vận chuyển tức thời qua Mã Đơn Hàng hoặc Số Điện Thoại</p>
          </div>
        </div>

        <form onsubmit={handleGuestSearch} class="flex flex-col sm:flex-row gap-2.5 pt-1">
          <div class="relative flex-grow">
            <i class="fa-solid fa-receipt absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              bind:value={guestSearchQuery}
              required
              placeholder="Nhập mã đơn hàng (VD: ORD-MVBP...) hoặc Số điện thoại..."
              class="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition"
            />
          </div>
          <button
            type="submit"
            disabled={isSearchingGuest}
            class="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <i class="fa-solid fa-magnifying-glass {isSearchingGuest ? 'fa-spin' : ''}"></i>
            <span>{isSearchingGuest ? 'Đang tra cứu...' : 'Tra Cứu Đơn'}</span>
          </button>
          {#if guestSearched}
            <button
              type="button"
              onclick={() => { guestSearched = false; guestSearchQuery = ''; guestSearchResults = []; }}
              class="px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition shrink-0"
            >
              Đặt lại
            </button>
          {/if}
        </form>
      </div>

      <!-- Search Results for Guest -->
      {#if guestSearched}
        {#if guestSearchResults.length > 0}
          <div class="space-y-3 animate-in fade-in duration-200">
            <div class="flex items-center justify-between text-xs font-bold text-blue-950 px-1">
              <span>Kết quả tìm kiếm ({guestSearchResults.length} đơn hàng):</span>
            </div>
            {#each guestSearchResults as ord (ord.id)}
              {@render renderOrderCard(ord)}
            {/each}
          </div>
        {:else}
          <div class="glass-panel rounded-2xl p-8 text-center border border-slate-200 bg-white space-y-2 animate-in fade-in duration-200">
            <i class="fa-solid fa-circle-question text-3xl text-amber-500"></i>
            <p class="text-sm font-bold text-blue-950">Không tìm thấy đơn hàng</p>
            <p class="text-xs text-slate-500 max-w-md mx-auto">
              Không có đơn hàng nào khớp với từ khóa <strong>"{guestSearchQuery}"</strong>. Vui lòng kiểm tra lại chính xác mã đơn hàng (ORD-...) hoặc số điện thoại khi đặt.
            </p>
          </div>
        {/if}
      {:else if localGuestOrders.length > 0}
        <!-- Recent orders placed on this browser -->
        <div class="space-y-3">
          <div class="flex items-center justify-between text-xs font-bold text-blue-950 px-1">
            <span class="flex items-center gap-1.5">
              <i class="fa-solid fa-clock-rotate-left text-blue-900"></i>
              Đơn hàng gần đây vừa đặt trên thiết bị này ({localGuestOrders.length}):
            </span>
          </div>
          {#each localGuestOrders as ord (ord.id)}
            {@render renderOrderCard(ord)}
          {/each}
        </div>
      {/if}

      <!-- Member Benefit & Login Banner -->
      <div class="glass-panel rounded-3xl p-8 text-center border border-slate-200 bg-white space-y-4">
        <div class="w-14 h-14 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mx-auto text-xl shadow-2xs">
          <i class="fa-solid fa-user-lock"></i>
        </div>
        <div class="space-y-1">
          <h3 class="text-lg font-bold text-blue-950">Đăng Nhập Để Lưu Trữ Vĩnh Viễn</h3>
          <p class="text-slate-500 text-xs max-w-md mx-auto">
            Đăng nhập hoặc đăng ký tài khoản bằng số điện thoại của bạn để tự động liên kết tất cả đơn hàng, tích điểm thưởng và nhận thông báo khuyến mãi.
          </p>
        </div>
        <div class="flex justify-center gap-3 pt-1">
          <button
            type="button"
            onclick={() => appStore.openAuthModal('login')}
            class="px-6 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition cursor-pointer shadow-xs"
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onclick={() => appStore.openAuthModal('register')}
            class="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs hover:bg-slate-200 transition cursor-pointer border border-slate-200"
          >
            Đăng Ký Tài Khoản
          </button>
        </div>
      </div>
    </div>
  {:else if appStore.customerOrders.length === 0}
    <div class="glass-panel rounded-3xl p-10 text-center border border-slate-200 bg-white space-y-4">
      <div class="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-2xl">
        <i class="fa-solid fa-box-open"></i>
      </div>
      <h3 class="text-xl font-bold text-blue-950">Bạn chưa có đơn hàng nào</h3>
      <p class="text-slate-500 text-sm max-w-md mx-auto">
        Khám phá hàng ngàn sản phẩm chính hãng với nhiều ưu đãi hấp dẫn tại CSET Store ngay hôm nay!
      </p>
      <div class="flex justify-center pt-2">
        <button
          type="button"
          onclick={() => appStore.setTab('shop')}
          class="px-8 py-3.5 rounded-2xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition cursor-pointer shadow-md flex items-center gap-2"
        >
          <i class="fa-solid fa-bag-shopping"></i>
          <span>Khám Phá Cửa Hàng</span>
        </button>
      </div>
    </div>
  {:else}
    <div class="space-y-4">
      {#each appStore.customerOrders as order (order.id)}
        {@render renderOrderCard(order)}
      {/each}
    </div>
  {/if}
</div>
