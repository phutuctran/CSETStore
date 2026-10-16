<script lang="ts">
  import { appStore } from '../stores/store.svelte';

  const navItems = [
    { id: 'home', label: 'Trang Chủ', icon: 'fa-solid fa-house' },
    { id: 'shop', label: 'Cửa Hàng', icon: 'fa-solid fa-store' },
    { id: 'custom', label: 'Đặt In Theo Yêu Cầu', icon: 'fa-solid fa-sliders' },
    { id: 'admin', label: 'Quản Trị (Admin)', icon: 'fa-solid fa-user-shield', isAdmin: true }
  ] as const;
</script>

<header class="sticky top-0 z-40 glass-panel border-b border-slate-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-20">
      <!-- Logo -->
      <button
        type="button"
        onclick={() => appStore.setTab('home')}
        class="flex items-center space-x-3 text-left cursor-pointer group focus:outline-none"
      >
        <div class="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center shadow-md group-hover:bg-blue-800 transition">
          <i class="fa-solid fa-cube text-white text-xl"></i>
        </div>
        <div>
          <span class="text-xl font-black tracking-wider text-blue-950 block">CSET STORE</span>
          <span class="block text-[10px] text-blue-800 font-bold tracking-widest uppercase">3D Printing Studio</span>
        </div>
      </button>

      <!-- Desktop Navigation Links -->
      <nav class="hidden md:flex space-x-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        {#each navItems as item}
          <button
            type="button"
            onclick={() => appStore.setTab(item.id)}
            class="px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center {appStore.activeTab === item.id
              ? (item.isAdmin ? 'bg-amber-700 text-white shadow-sm' : 'bg-blue-900 text-white shadow-sm')
              : (item.isAdmin ? 'text-amber-700 hover:text-amber-900 hover:bg-amber-50' : 'text-slate-600 hover:text-blue-900 hover:bg-slate-200/50')}"
          >
            <i class="{item.icon} mr-2"></i>
            {item.label}
          </button>
        {/each}
      </nav>

      <!-- Right Actions: Cart & Mobile toggle -->
      <div class="flex items-center space-x-3">
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
            ? (item.isAdmin ? 'bg-amber-700 text-white' : 'bg-blue-900 text-white')
            : (item.isAdmin ? 'text-amber-700' : 'text-slate-600')}"
        >
          <i class="{item.icon} mr-1.5"></i>
          {item.label}
        </button>
      {/each}
    </div>
  </div>
</header>
