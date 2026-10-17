<script lang="ts">
  import { appStore } from '../stores/store.svelte';
  import { themeStore } from '../stores/themeStore.svelte';

  const navItems = [
    { id: 'home', label: 'Trang Chủ', icon: 'fa-solid fa-house' },
    { id: 'shop', label: 'Tất Cả Sản Phẩm', icon: 'fa-solid fa-store' },
  ] as const;

  let isDropdownOpen = $state(false);

  function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
  }

  function closeDropdown() {
    isDropdownOpen = false;
  }
</script>

<header class="sticky top-0 z-40 glass-panel border-b border-slate-200/80 bg-white/95 backdrop-blur-md w-full transition-all shadow-xs">
  <div class="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-20 gap-3 lg:gap-6">
      
      <!-- 1. Brand Logo & Title (Always visible, responsive) -->
      <button
        type="button"
        onclick={() => appStore.setTab('home')}
        class="flex items-center space-x-3 text-left cursor-pointer group focus:outline-none shrink-0"
      >
        {#if themeStore.theme.logoImage}
          <div class="w-10 h-10 rounded-xl overflow-hidden shadow-xs flex items-center justify-center bg-white border border-slate-200 group-hover:border-blue-900 transition">
            <img src={themeStore.theme.logoImage} alt={themeStore.theme.storeName} class="w-full h-full object-contain" />
          </div>
        {:else}
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs transition group-hover:scale-105"
            style="background-color: {themeStore.theme.primaryColor}"
          >
            <i class="fa-solid {themeStore.theme.logoIcon} text-white text-lg"></i>
          </div>
        {/if}
        <div class="block leading-tight">
          <span class="text-base sm:text-lg md:text-xl font-black tracking-tight text-blue-950 block group-hover:text-blue-900 transition">{themeStore.theme.storeName}</span>
          <span class="block text-[10px] text-blue-700 font-bold tracking-wider uppercase">{themeStore.theme.storeTagline}</span>
        </div>
      </button>

      <!-- 2. Integrated Search Bar (Desktop & Tablets) -->
      <div class="hidden md:flex items-center flex-1 max-w-sm lg:max-w-md xl:max-w-lg mx-2">
        <form
          onsubmit={(e) => {
            e.preventDefault();
            if (appStore.activeTab !== 'shop') appStore.setTab('shop');
          }}
          class="relative w-full"
        >
          <input
            type="text"
            bind:value={appStore.searchQuery}
            oninput={() => {
              if (appStore.activeTab !== 'shop' && appStore.searchQuery.trim().length > 1) {
                appStore.setTab('shop');
              }
            }}
            placeholder="Tìm kiếm sản phẩm, thương hiệu..."
            class="w-full pl-10 pr-9 py-2.5 rounded-2xl text-xs bg-slate-100/90 hover:bg-slate-200/60 focus:bg-white border border-slate-200 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 transition focus:outline-none text-slate-800 placeholder:text-slate-400 font-medium"
          />
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          {#if appStore.searchQuery}
            <button
              type="button"
              onclick={() => { appStore.searchQuery = ''; }}
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <i class="fa-solid fa-circle-xmark text-xs"></i>
            </button>
          {/if}
        </form>
      </div>

      <!-- 3. Desktop Navigation Links -->
      <nav class="hidden lg:flex items-center space-x-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 shrink-0">
        {#each navItems as item}
          <button
            type="button"
            onclick={() => appStore.setTab(item.id)}
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 {appStore.activeTab === item.id
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-blue-900 hover:bg-slate-200/60'}"
            title={item.label}
          >
            <i class="{item.icon} text-sm"></i>
            <span class="whitespace-nowrap">{item.label}</span>
          </button>
        {/each}

        <!-- Custom Dynamic Navigation Tabs configured in Admin -->
        {#if themeStore.theme.customTabs}
          {#each themeStore.theme.customTabs.filter(t => t.enabled) as cTab (cTab.id)}
            <button
              type="button"
              onclick={() => appStore.setTab(cTab.id)}
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 {appStore.activeTab === cTab.id
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-700 hover:text-red-900 hover:bg-red-50'}"
              title={cTab.name}
            >
              <i class="fa-solid {cTab.icon || 'fa-fire'} text-sm text-amber-500"></i>
              <span class="whitespace-nowrap">{cTab.name}</span>
            </button>
          {/each}
        {/if}

        <!-- Tab Đặt Hàng Theo Yêu Cầu -->
        {#if themeStore.theme.visibility.showCustomOrderTab !== false}
          <button
            type="button"
            onclick={() => appStore.setTab('custom-order')}
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 {appStore.activeTab === 'custom-order'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-blue-900 hover:bg-slate-200/60'}"
            title="Đặt Hàng Theo Yêu Cầu"
          >
            <i class="fa-solid fa-wand-magic-sparkles text-sm text-amber-500"></i>
            <span class="whitespace-nowrap">Đặt Hàng Riêng</span>
          </button>
        {/if}
      </nav>

      <!-- 4. Right Actions: Customer Account & Cart -->
      <div class="flex items-center space-x-2.5 shrink-0">
        <!-- Hotline Badge or Order Tracking -->
        <button
          type="button"
          onclick={() => appStore.setTab('orders')}
          class="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-blue-900 hover:bg-slate-100 transition cursor-pointer border border-transparent hover:border-slate-200"
          title="Tra cứu đơn hàng"
        >
          <i class="fa-solid fa-truck-fast text-blue-900"></i>
          <span>Tra cứu đơn</span>
        </button>

        {#if appStore.currentCustomer}
          <!-- Customer Account Dropdown Menu Button -->
          <div class="relative">
            <button
              type="button"
              onclick={toggleDropdown}
              class="flex items-center gap-2 bg-blue-50 hover:bg-blue-100/70 px-3 py-2 rounded-xl border border-blue-200 transition cursor-pointer text-xs font-bold text-blue-950 focus:outline-none"
              title={appStore.currentCustomer.fullName}
            >
              <div class="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px]">
                <i class="fa-solid fa-user"></i>
              </div>
              <span class="max-w-[120px] truncate hidden sm:inline">{appStore.currentCustomer.fullName}</span>
              <i class="fa-solid fa-chevron-down text-[10px] text-blue-800 transition-transform duration-200 {isDropdownOpen ? 'rotate-180' : ''}"></i>
            </button>

            <!-- Dropdown Menu List -->
            {#if isDropdownOpen}
              <!-- Backdrop overlay for closing dropdown -->
              <button
                type="button"
                class="fixed inset-0 z-40 bg-transparent w-full h-full border-none cursor-default"
                onclick={closeDropdown}
                aria-label="Đóng menu"
              ></button>

              <div class="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 text-xs divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                <div class="px-4 py-2.5">
                  <p class="font-bold text-slate-900 text-xs truncate">{appStore.currentCustomer.fullName}</p>
                  <p class="text-[11px] text-slate-500 font-mono">@{appStore.currentCustomer.username}</p>
                </div>

                <div class="py-1">
                  <button
                    type="button"
                    onclick={() => {
                      closeDropdown();
                      appStore.navigateToProfile();
                    }}
                    class="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-blue-900 font-semibold flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <i class="fa-solid fa-id-card text-blue-900 w-4 text-center"></i>
                    <span>Tài Khoản & Đánh Giá</span>
                  </button>

                  <button
                    type="button"
                    onclick={() => {
                      closeDropdown();
                      appStore.setTab('orders');
                    }}
                    class="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-blue-900 font-semibold flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <i class="fa-solid fa-box-archive text-blue-900 w-4 text-center"></i>
                    <span>Đơn Hàng Của Tôi</span>
                  </button>
                </div>

                <div class="pt-1">
                  <button
                    type="button"
                    onclick={() => {
                      closeDropdown();
                      appStore.logoutCustomer();
                    }}
                    class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <i class="fa-solid fa-arrow-right-from-bracket w-4 text-center"></i>
                    <span>Đăng Xuất</span>
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {:else}
          <button
            type="button"
            onclick={() => appStore.openAuthModal('login')}
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-blue-950 transition cursor-pointer border border-slate-200"
            title="Tài Khoản"
          >
            <i class="fa-solid fa-user text-blue-900"></i>
            <span class="hidden sm:inline">Đăng Nhập</span>
          </button>
        {/if}

        <!-- Cart Button -->
        <button
          type="button"
          onclick={() => appStore.openCart()}
          class="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white shadow-xs hover:shadow-md cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-blue-700"
          aria-label="Xem giỏ hàng"
        >
          <div class="relative">
            <i class="fa-solid fa-cart-shopping text-sm sm:text-base"></i>
            {#if appStore.cartCount > 0}
              <span class="absolute -top-2 -right-2.5 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow">
                {appStore.cartCount}
              </span>
            {/if}
          </div>
          <span class="hidden sm:inline text-xs font-bold whitespace-nowrap">Giỏ Hàng</span>
          {#if appStore.cartTotal > 0}
            <span class="hidden md:inline text-[11px] font-black bg-blue-800 px-2 py-0.5 rounded-lg text-blue-100">
              {appStore.cartTotal.toLocaleString('vi-VN')}đ
            </span>
          {/if}
        </button>
      </div>
    </div>

    <!-- Mobile Navigation bar & Quick search -->
    <div class="md:hidden flex flex-col py-2 border-t border-slate-200 gap-2">
      <form
        onsubmit={(e) => {
          e.preventDefault();
          if (appStore.activeTab !== 'shop') appStore.setTab('shop');
        }}
        class="relative w-full"
      >
        <input
          type="text"
          bind:value={appStore.searchQuery}
          oninput={() => {
            if (appStore.activeTab !== 'shop' && appStore.searchQuery.trim().length > 1) {
              appStore.setTab('shop');
            }
          }}
          placeholder="Tìm sản phẩm..."
          class="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-100 border border-slate-200 focus:outline-none focus:bg-white text-slate-800"
        />
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
      </form>

      <div class="flex overflow-x-auto py-1 gap-1 scrollbar-none">
        {#each navItems as item}
          <button
            type="button"
            onclick={() => appStore.setTab(item.id)}
            class="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center shrink-0 {appStore.activeTab === item.id
              ? 'bg-blue-900 text-white'
              : 'text-slate-600'}"
          >
            <i class="{item.icon} mr-1.5"></i>
            {item.label}
          </button>
        {/each}

        {#if themeStore.theme.customTabs}
          {#each themeStore.theme.customTabs.filter(t => t.enabled) as cTab (cTab.id)}
            <button
              type="button"
              onclick={() => appStore.setTab(cTab.id)}
              class="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold flex items-center shrink-0 {appStore.activeTab === cTab.id
                ? 'bg-red-600 text-white'
                : 'text-red-700 bg-red-50'}"
            >
              <i class="fa-solid {cTab.icon || 'fa-fire'} mr-1.5 text-amber-500"></i>
              <span>{cTab.name}</span>
            </button>
          {/each}
        {/if}

        {#if themeStore.theme.visibility.showCustomOrderTab !== false}
          <button
            type="button"
            onclick={() => appStore.setTab('custom-order')}
            class="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center shrink-0 {appStore.activeTab === 'custom-order'
              ? 'bg-blue-900 text-white'
              : 'text-slate-600'}"
          >
            <i class="fa-solid fa-wand-magic-sparkles mr-1.5 text-amber-500"></i>
            <span>Đặt Hàng Riêng</span>
          </button>
        {/if}
      </div>
    </div>
  </div>
</header>
