<script lang="ts">
  import { appStore } from '../../stores/store.svelte';
  import { themeStore } from '../../stores/themeStore.svelte';

  let shortAddress = $derived.by(() => {
    const raw = themeStore.theme.storeAddress || 'Hồ Chí Minh, Việt Nam';
    const parts = raw.split(',');
    return parts.length > 1 ? parts[parts.length - 2].trim() + ', ' + parts[parts.length - 1].trim() : raw;
  });

  function handleSearchFocus() {
    if (appStore.activeTab !== 'shop') {
      appStore.setTab('shop');
    }
  }
</script>

<header class="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 pt-3 pb-3 sticky top-0 z-40 space-y-3 shadow-2xs">
  <!-- Top Bar: Location & User Profile Notification -->
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-2.5 min-w-0">
      <button
        type="button"
        onclick={() => appStore.setTab('home')}
        class="flex items-center space-x-2.5 min-w-0 text-left cursor-pointer group"
      >
        {#if themeStore.theme.logoImage}
          <div class="w-9 h-9 rounded-xl overflow-hidden shadow-xs flex items-center justify-center bg-white border border-slate-200 shrink-0">
            <img src={themeStore.theme.logoImage} alt={themeStore.theme.storeName} class="w-full h-full object-contain" />
          </div>
        {:else}
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs shrink-0 text-white transition"
            style="background-color: {themeStore.theme.primaryColor}"
          >
            <i class="fa-solid {themeStore.theme.logoIcon} text-base"></i>
          </div>
        {/if}
        <div class="min-w-0 leading-tight">
          <span class="font-black text-xs text-blue-950 truncate block group-hover:text-blue-900">
            {themeStore.theme.storeName}
          </span>
          <span class="text-[10px] text-blue-800 font-bold tracking-wider uppercase truncate block">
            {themeStore.theme.storeTagline || shortAddress}
          </span>
        </div>
      </button>
    </div>

    <!-- Right: Notification Bell & Profile -->
    <div class="flex items-center space-x-2 shrink-0">
      <button
        type="button"
        onclick={() => appStore.showToast(`Chào mừng bạn đến với ${themeStore.theme.storeName}!`)}
        class="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center text-sm relative cursor-pointer"
        aria-label="Thông báo"
      >
        <i class="fa-solid fa-bell"></i>
        <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
      </button>

      {#if appStore.currentCustomer}
        <button
          type="button"
          onclick={() => appStore.navigateToProfile()}
          class="w-9 h-9 rounded-xl bg-blue-900 text-white font-bold text-xs flex items-center justify-center cursor-pointer shadow-xs overflow-hidden"
          title="Thông tin tài khoản & đánh giá"
        >
          {#if appStore.currentCustomer.avatar}
            <img src={appStore.currentCustomer.avatar} alt="Avatar" class="w-full h-full object-cover" />
          {:else}
            {appStore.currentCustomer.fullName.charAt(0)}
          {/if}
        </button>
      {:else}
        <button
          type="button"
          onclick={() => appStore.openAuthModal('login')}
          class="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center text-xs font-bold cursor-pointer"
          title="Đăng nhập"
        >
          <i class="fa-solid fa-user"></i>
        </button>
      {/if}
    </div>
  </div>

  <!-- Search Input Bar with Filter Button (Matching Screen 1 in Image #1) -->
  <div class="flex items-center gap-2">
    <div class="relative flex-grow">
      <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
      <input
        type="text"
        bind:value={appStore.searchQuery}
        onfocus={handleSearchFocus}
        placeholder="Tìm sản phẩm, thương hiệu..."
        class="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-900 rounded-2xl pl-9 pr-8 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
      />
      {#if appStore.searchQuery}
        <button
          type="button"
          onclick={() => appStore.searchQuery = ''}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
        >
          ✕
        </button>
      {/if}
    </div>

    <!-- Category Filter Button (Matching Orange/Accent Button in Image #1) -->
    <button
      type="button"
      onclick={() => appStore.setTab('shop')}
      class="w-10 h-10 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white flex items-center justify-center shrink-0 shadow-sm transition active:scale-95 cursor-pointer"
      title="Lọc sản phẩm"
      aria-label="Lọc sản phẩm"
    >
      <i class="fa-solid fa-sliders text-xs"></i>
    </button>
  </div>
</header>
