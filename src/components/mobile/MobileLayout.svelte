<script lang="ts">
  import { appStore } from '../../stores/store.svelte';
  import MobileHeader from './MobileHeader.svelte';
  import MobileBottomNav from './MobileBottomNav.svelte';
  import MobileHomeView from './MobileHomeView.svelte';
  import MobileProductDetail from './MobileProductDetail.svelte';
  import ShopPage from '../../views/ShopPage.svelte';
  import CustomerOrdersPage from '../../views/CustomerOrdersPage.svelte';
  import CustomOrderPage from '../../views/CustomOrderPage.svelte';
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
    {:else}
      <div class="space-y-4 pb-20">
        <CustomTabPage tabId={appStore.activeTab} />
      </div>
    {/if}
  </main>

  <!-- Docked Bottom Mobile Navigation Bar (Docked at bottom of screen like in Image #1) -->
  {#if appStore.activeTab !== 'product-detail'}
    <MobileBottomNav />
  {/if}
</div>
