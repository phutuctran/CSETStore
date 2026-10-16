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
  import CustomTabPage from './views/CustomTabPage.svelte';
  import ProductDetailPage from './views/ProductDetailPage.svelte';
  import CustomOrderPage from './views/CustomOrderPage.svelte';
  import CustomerAuthModal from './components/CustomerAuthModal.svelte';
  import CustomerProfileModal from './components/CustomerProfileModal.svelte';
  import TopAdBanner from './components/TopAdBanner.svelte';
  import SideAdBanners from './components/SideAdBanners.svelte';
  import { routerService } from './services/routerService';
  // Check if side banners are currently enabled to determine full width expansion
  let hasSideBanners = $derived(
    themeStore.theme.visibility.showSideAdBanners &&
    (themeStore.theme.banners?.some(b => (b.position === 'side-left' || b.position === 'side-right') && b.enabled) ?? false)
  );

  // If side banners are OFF, stretch full width across widescreen monitors up to 1920px (3xl:max-w-[1920px])
  let containerWidthClass = $derived(
    hasSideBanners
      ? 'max-w-7xl 2xl:max-w-[1400px] 3xl:max-w-[1600px]'
      : 'max-w-7xl 2xl:max-w-[1760px] 3xl:max-w-[1920px]'
  );

  // Two-way Dynamic Routing with Browser History & URL Hash
  $effect(() => {
    themeStore.applyBrowserMeta(themeStore.theme);

    function syncFromHash() {
      const route = routerService.parseHash();
      if (route.path === '/' || route.path === '') {
        appStore.activeTab = 'home';
      } else if (route.path === '/shop') {
        appStore.activeTab = 'shop';
      } else if (route.path === '/orders') {
        appStore.activeTab = 'orders';
      } else if (route.path === '/product') {
        if (route.param) {
          appStore.activeTab = 'product-detail';
        } else {
          appStore.activeTab = 'shop';
        }
      } else if (route.path === '/custom-order') {
        appStore.activeTab = 'custom-order';
      } else if (route.path === '/tab' && route.param) {
        appStore.activeTab = route.param;
      }
    }

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  });
</script>
<div class="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800 relative">
  <!-- Top Advertising / Announcement Banner -->
  <TopAdBanner />

  <!-- Header / Navigation Bar -->
  <Header />

  <!-- Left and Right Side Banners for Ultra-Wide / 2XL Screens -->
  <SideAdBanners />

  <!-- Main View Container: Widescreen Stretch Container (stretches to full width when side banners are off) -->
  <main class="flex-grow w-full {containerWidthClass} mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-8 md:py-12 transition-all duration-300">
    {#if appStore.activeTab === 'home'}
      <HomePage />
    {:else if appStore.activeTab === 'shop'}
      <ShopPage />
    {:else if appStore.activeTab === 'orders'}
      <CustomerOrdersPage />
    {:else if appStore.activeTab === 'product-detail'}
      <ProductDetailPage />
    {:else if appStore.activeTab === 'custom-order'}
      <CustomOrderPage />
    {:else}
      <!-- Dynamic Custom Tab Page (Siêu Sale, Đang Hot...) -->
      <CustomTabPage tabId={appStore.activeTab} />
    {/if}
  </main>

  <!-- Global Modals -->
  <ProductModal />
  <CartModal />
  <CustomerAuthModal />
  <CustomerProfileModal />
  <Toast />
  <!-- Footer -->
  <footer class="glass-panel border-t border-slate-200 mt-20 py-8 bg-white text-center text-xs text-slate-500 w-full transition-all">
    <div class="w-full {containerWidthClass} mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 space-y-3 transition-all">
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
