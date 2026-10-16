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

<header class="sticky top-0 z-40 glass-panel border-b border-slate-200 w-full transition-all">
  <div class="w-full max-w-7xl 2xl:max-w-[1760px] 3xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 transition-all">
    <div class="flex items-center justify-between h-20">
      <button
        type="button"
        onclick={() => appStore.setTab('home')}
        class="flex items-center space-x-3 text-left cursor-pointer group focus:outline-none"
      >
        {#if themeStore.theme.logoImage}
          <div class="w-10 h-10 rounded-xl overflow-hidden shadow-md flex items-center justify-center bg-white border border-slate-200">
            <img src={themeStore.theme.logoImage} alt={themeStore.theme.storeName} class="w-full h-full object-contain" />
          </div>
        {:else}
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition"
            style="background-color: {themeStore.theme.primaryColor}"
          >
            <i class="fa-solid {themeStore.theme.logoIcon} text-white text-xl"></i>
          </div>
        {/if}
        <div class="hidden 2xl:block leading-tight">
          <span class="text-xl font-black tracking-wider text-blue-950 block">{themeStore.theme.storeName}</span>
          <span class="block text-[10px] text-blue-800 font-bold tracking-widest uppercase">{themeStore.theme.storeTagline}</span>
        </div>
      </button>

      <!-- Desktop Navigation Links -->
      <nav class="hidden md:flex space-x-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        {#each navItems as item}
          <button
            type="button"
            onclick={() => appStore.setTab(item.id)}
            class="px-3.5 2xl:px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center {appStore.activeTab === item.id
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-blue-900 hover:bg-slate-200/50'}"
            title={item.label}
          >
            <i class="{item.icon} text-base 2xl:mr-2"></i>
            <span class="hidden 2xl:inline whitespace-nowrap">{item.label}</span>
          </button>
        {/each}

        <!-- Custom Dynamic Navigation Tabs configured in Admin -->
        {#if themeStore.theme.customTabs}
          {#each themeStore.theme.customTabs.filter(t => t.enabled) as cTab (cTab.id)}
            <button
              type="button"
              onclick={() => appStore.setTab(cTab.id)}
              class="px-3.5 2xl:px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer flex items-center {appStore.activeTab === cTab.id
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-red-700 hover:text-red-900 hover:bg-red-50'}"
              title={cTab.name}
            >
              <i class="fa-solid {cTab.icon || 'fa-fire'} text-base text-amber-500 2xl:mr-2"></i>
              <span class="hidden 2xl:inline whitespace-nowrap">{cTab.name}</span>
            </button>
          {/each}
        {/if}

        <!-- Tab Đặt Hàng Theo Yêu Cầu (Bật/tắt trong Admin Theme Customizer) -->
        {#if themeStore.theme.visibility.showCustomOrderTab !== false}
          <button
            type="button"
            onclick={() => appStore.setTab('custom-order')}
            class="px-3.5 2xl:px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center {appStore.activeTab === 'custom-order'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-blue-900 hover:bg-slate-200/50'}"
            title="Đặt Hàng Theo Yêu Cầu"
          >
            <i class="fa-solid fa-wand-magic-sparkles text-base text-amber-500 2xl:mr-2"></i>
            <span class="hidden 2xl:inline whitespace-nowrap">Đặt Hàng Theo Yêu Cầu</span>
          </button>
        {/if}
      </nav>

      <!-- Right Actions: Customer Account & Cart -->
      <div class="flex items-center space-x-3">
        {#if appStore.currentCustomer}
          <!-- Customer Account Dropdown Menu Button -->
          <div class="relative hidden sm:block">
            <button
              type="button"
              onclick={toggleDropdown}
              class="flex items-center gap-2 bg-blue-50 hover:bg-blue-100/70 px-2.5 2xl:px-3.5 py-2 rounded-xl border border-blue-200 transition cursor-pointer text-xs font-bold text-blue-950 focus:outline-none"
              title={appStore.currentCustomer.fullName}
            >
              <div class="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px]">
                <i class="fa-solid fa-user"></i>
              </div>
              <span class="max-w-[150px] truncate hidden 2xl:inline">{appStore.currentCustomer.fullName}</span>
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
                <!-- User header info -->
                <div class="px-4 py-2.5">
                  <p class="font-bold text-slate-900 text-xs truncate">{appStore.currentCustomer.fullName}</p>
                  <p class="text-[11px] text-slate-500 font-mono">@{appStore.currentCustomer.username}</p>
                </div>

                <!-- Menu options -->
                <div class="py-1">
                  <button
                    type="button"
                    onclick={() => {
                      closeDropdown();
                      appStore.openProfileModal();
                    }}
                    class="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-blue-900 font-semibold flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <i class="fa-solid fa-id-card text-blue-900 w-4 text-center"></i>
                    <span>Thông Tin & Chỉnh Sửa</span>
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

                <!-- Logout option -->
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
            class="hidden sm:flex items-center gap-1.5 px-3 2xl:px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-blue-950 transition cursor-pointer border border-slate-200"
            title="Tài Khoản"
          >
            <i class="fa-solid fa-user text-blue-900"></i>
            <span class="hidden 2xl:inline">Tài Khoản</span>
          </button>
        {/if}

        <button
          type="button"
          onclick={() => appStore.openCart()}
          class="relative p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-blue-950 shadow-sm cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-blue-900"
          aria-label="Xem giỏ hàng"
        >
          <i class="fa-solid fa-cart-shopping text-lg"></i>
          {#if appStore.cartCount > 0}
            <span class="absolute -top-1.5 -right-1.5 bg-blue-900 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
              {appStore.cartCount}
            </span>
          {/if}
        </button>
      </div>
    </div>

    <!-- Mobile Navigation bar -->
    <div class="md:hidden flex overflow-x-auto py-2 border-t border-slate-200 gap-1 scrollbar-none">
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
          <span>Đặt Hàng Theo Yêu Cầu</span>
        </button>
      {/if}
    </div>
  </div>
</header>
