<script lang="ts">
  import { appStore } from '../stores/store.svelte';
  import { formatCurrency } from '../services/pricingService';

  const statusLabels: Record<string, { label: string; class: string }> = {
    pending: { label: 'Chờ xác nhận', class: 'bg-amber-100 text-amber-800' },
    processing: { label: 'Đang xử lý / Đóng gói', class: 'bg-blue-100 text-blue-900' },
    completed: { label: 'Đã hoàn tất / Đã giao', class: 'bg-emerald-100 text-emerald-800' },
    cancelled: { label: 'Đã hủy', class: 'bg-red-100 text-red-800' }
  };
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
        <div class="w-10 h-10 bg-blue-100 text-blue-900 rounded-xl flex items-center justify-center font-bold">
          <i class="fa-solid fa-user"></i>
        </div>
        <div>
          <span class="text-xs font-bold text-blue-950 block">{appStore.currentCustomer.fullName}</span>
          <span class="text-[11px] text-slate-500 block">@{appStore.currentCustomer.username}</span>
        </div>
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

  {#if !appStore.currentCustomer}
    <div class="glass-panel rounded-3xl p-10 text-center border border-slate-200 bg-white space-y-4">
      <div class="w-16 h-16 bg-blue-50 text-blue-900 rounded-full flex items-center justify-center mx-auto text-2xl">
        <i class="fa-solid fa-user-lock"></i>
      </div>
      <h3 class="text-xl font-bold text-blue-950">Vui lòng đăng nhập để xem đơn hàng</h3>
      <p class="text-slate-500 text-sm max-w-md mx-auto">
        Tài khoản khách hàng giúp bạn lưu trữ và theo dõi hành trình đơn hàng theo thời gian thực.
      </p>
      <div class="flex justify-center gap-3 pt-2">
        <button
          type="button"
          onclick={() => appStore.openAuthModal('login')}
          class="px-6 py-3 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition cursor-pointer shadow"
        >
          Đăng Nhập
        </button>
        <button
          type="button"
          onclick={() => appStore.openAuthModal('register')}
          class="px-6 py-3 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
        >
          Đăng Ký
        </button>
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
        <div class="glass-panel rounded-2xl border border-slate-200 p-6 bg-white space-y-4 shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div class="flex items-center gap-3">
              <span class="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                {order.id}
              </span>
              <span class="text-xs text-slate-400">{order.createdAt}</span>
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
      {/each}
    </div>
  {/if}
</div>
