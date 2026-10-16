<script lang="ts">
  import { appStore } from './stores/store.svelte';
  import { themeStore } from './stores/themeStore.svelte';
  import Header from './components/Header.svelte';
  import Toast from './components/Toast.svelte';
  import ProductModal from './components/ProductModal.svelte';
  import CartModal from './components/CartModal.svelte';
  import HomePage from './views/HomePage.svelte';
  import ShopPage from './views/ShopPage.svelte';
  import CustomerOrdersPage from './views/CustomerOrdersPage.svelte';
  import CustomerAuthModal from './components/CustomerAuthModal.svelte';
</script>

<div class="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800">
  <!-- Header / Navigation Bar -->
  <Header />

  <!-- Main View Container (Page Switcher) -->
  <main class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
    {#if appStore.activeTab === 'home'}
      <HomePage />
    {:else if appStore.activeTab === 'shop'}
      <ShopPage />
    {:else if appStore.activeTab === 'orders'}
      <CustomerOrdersPage />
    {/if}
  </main>

  <!-- Global Modals -->
  <ProductModal />
  <CartModal />
  <CustomerAuthModal />
  <Toast />

  <!-- Footer -->
  <footer class="glass-panel border-t border-slate-200 mt-20 py-8 bg-white text-center text-xs text-slate-500">
    <div class="max-w-7xl mx-auto px-4 space-y-3">
      <div class="flex items-center justify-center space-x-2 text-blue-950 font-bold">
        <i class="fa-solid {themeStore.theme.logoIcon} text-blue-900"></i>
        <span>{themeStore.theme.storeName} - {themeStore.theme.storeTagline}</span>
      </div>
      {#if themeStore.theme.visibility.showFooterContact}
        <div class="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-600">
          <span><i class="fa-solid fa-phone mr-1 text-blue-900"></i>Hotline: <strong>{themeStore.theme.hotline}</strong></span>
          <span><i class="fa-solid fa-envelope mr-1 text-blue-900"></i>Email: <strong>{themeStore.theme.contactEmail}</strong></span>
          <span><i class="fa-solid fa-location-dot mr-1 text-blue-900"></i>{themeStore.theme.storeAddress}</span>
        </div>
      {/if}
      <p>{themeStore.theme.footerText}</p>
    </div>
  </footer>
</div>
