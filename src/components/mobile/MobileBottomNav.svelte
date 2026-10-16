<script lang="ts">
  import { appStore } from '../../stores/store.svelte';

  function handleTabClick(tabId: string) {
    if (tabId === 'cart') {
      appStore.openCart();
    } else if (tabId === 'account') {
      if (appStore.currentCustomer) {
        appStore.navigateToProfile();
      } else {
        appStore.openAuthModal('login');
      }
    } else {
      appStore.setTab(tabId);
    }
  }
</script>

<!-- Mobile Bottom Navigation Bar (Docked at bottom of screen like in Image #1) -->
<nav
  class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2 px-2 flex justify-around items-center shadow-lg transition-transform duration-300"
  aria-label="Thanh điều hướng ứng dụng"
>
  <!-- 1. Home Tab -->
  <button
    type="button"
    onclick={() => handleTabClick('home')}
    class="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer {appStore.activeTab === 'home'
      ? 'text-blue-900 font-bold scale-105'
      : 'text-slate-400 hover:text-slate-600 font-medium'}"
  >
    <div class="relative">
      <i class="fa-solid fa-house text-lg"></i>
      {#if appStore.activeTab === 'home'}
        <span class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-900"></span>
      {/if}
    </div>
    <span class="text-[10px] mt-1">Trang Chủ</span>
  </button>

  <!-- 2. Shop Tab -->
  <button
    type="button"
    onclick={() => handleTabClick('shop')}
    class="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer {appStore.activeTab === 'shop'
      ? 'text-blue-900 font-bold scale-105'
      : 'text-slate-400 hover:text-slate-600 font-medium'}"
  >
    <div class="relative">
      <i class="fa-solid fa-layer-group text-lg"></i>
      {#if appStore.activeTab === 'shop'}
        <span class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-900"></span>
      {/if}
    </div>
    <span class="text-[10px] mt-1">Sản Phẩm</span>
  </button>

  <!-- 3. Orders Tab -->
  <button
    type="button"
    onclick={() => handleTabClick('orders')}
    class="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer {appStore.activeTab === 'orders'
      ? 'text-blue-900 font-bold scale-105'
      : 'text-slate-400 hover:text-slate-600 font-medium'}"
  >
    <div class="relative">
      <i class="fa-solid fa-receipt text-lg"></i>
      {#if appStore.activeTab === 'orders'}
        <span class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-900"></span>
      {/if}
    </div>
    <span class="text-[10px] mt-1">Đơn Hàng</span>
  </button>

  <!-- 4. Cart Tab with Badge -->
  <button
    type="button"
    onclick={() => handleTabClick('cart')}
    class="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer text-slate-400 hover:text-blue-900 font-medium relative"
  >
    <div class="relative">
      <i class="fa-solid fa-cart-shopping text-lg text-slate-700"></i>
      {#if appStore.cartCount > 0}
        <span class="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
          {appStore.cartCount}
        </span>
      {/if}
    </div>
    <span class="text-[10px] mt-1">Giỏ Hàng</span>
  </button>

  <!-- 5. User / Account Tab -->
  <button
    type="button"
    onclick={() => handleTabClick('account')}
    class="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer {appStore.activeTab === 'profile' ? 'text-blue-900 font-bold scale-105' : 'text-slate-400 hover:text-blue-900 font-medium'}"
  >
    <div class="relative">
      {#if appStore.currentCustomer}
        <div class="w-5 h-5 rounded-full bg-blue-900 text-white text-[10px] font-bold flex items-center justify-center">
          {appStore.currentCustomer.fullName.charAt(0)}
        </div>
      {:else}
        <i class="fa-solid fa-user text-lg"></i>
      {/if}
    </div>
    <span class="text-[10px] mt-1">{appStore.currentCustomer ? 'Tài Khoản' : 'Đăng Nhập'}</span>
  </button>
</nav>
