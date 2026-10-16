<script lang="ts">
  import { appStore } from '../../stores/store.svelte';
  import { themeStore } from '../../stores/themeStore.svelte';
  import MobileHeader from './MobileHeader.svelte';
  import MobileBottomNav from './MobileBottomNav.svelte';
  import MobileHomeView from './MobileHomeView.svelte';
  import MobileProductDetail from './MobileProductDetail.svelte';
  import ShopPage from '../../views/ShopPage.svelte';
  import CustomerOrdersPage from '../../views/CustomerOrdersPage.svelte';
  import CustomOrderPage from '../../views/CustomOrderPage.svelte';
  import CustomerProfilePage from '../../views/CustomerProfilePage.svelte';
  import CustomTabPage from '../../views/CustomTabPage.svelte';
</script>

<div class="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none relative">
  <!-- Top Mobile Header (Hidden on Product Detail to allow Screen 2 Hero Image) -->
  {#if appStore.activeTab !== 'product-detail'}
    <MobileHeader />
  {/if}

  <!-- Main Mobile Content Area -->
  <main class="flex-grow w-full px-3 py-3 {appStore.activeTab !== 'product-detail' ? 'pb-20' : ''}">
    {#if appStore.activeTab === 'home'}
      <MobileHomeView />
    {:else if appStore.activeTab === 'shop'}
      <div class="space-y-4 pb-20">
        <ShopPage />
      </div>
    {:else if appStore.activeTab === 'orders'}
      <div class="space-y-4 pb-20">
        <CustomerOrdersPage />
      </div>
    {:else if appStore.activeTab === 'product-detail'}
      <MobileProductDetail />
    {:else if appStore.activeTab === 'custom-order'}
      <div class="space-y-4 pb-20">
        <CustomOrderPage />
      </div>
    {:else if appStore.activeTab === 'profile'}
      <div class="space-y-4 pb-20">
        <CustomerProfilePage />
      </div>
    {:else}
      <div class="space-y-4 pb-20">
        <CustomTabPage tabId={appStore.activeTab} />
      </div>
    {/if}
  </main>

  <!-- Mobile Footer Branding (Synchronized with Admin Theme Customizer) -->
  {#if appStore.activeTab !== 'product-detail'}
    <footer class="mt-4 mb-20 py-6 border-t border-slate-200 text-center text-xs text-slate-500 space-y-2 px-4">
      <div class="flex items-center justify-center space-x-2 text-blue-950 font-bold">
        {#if themeStore.theme.logoImage}
          <img src={themeStore.theme.logoImage} alt={themeStore.theme.storeName} class="w-4 h-4 object-contain" />
        {:else}
          <i class="fa-solid {themeStore.theme.logoIcon} text-blue-900"></i>
        {/if}
        <span>{themeStore.theme.storeName}</span>
      </div>
      {#if themeStore.theme.storeTagline}
        <p class="text-[10px] text-blue-800 font-semibold tracking-wider uppercase">{themeStore.theme.storeTagline}</p>
      {/if}
      <p class="text-[10px] text-slate-400">{themeStore.theme.footerText}</p>
    </footer>
  {/if}

  <!-- Docked Bottom Mobile Navigation Bar (Docked at bottom of screen like in Image #1) -->
  {#if appStore.activeTab !== 'product-detail'}
    <MobileBottomNav />
  {/if}
</div>
