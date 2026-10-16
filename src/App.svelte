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
  import CustomerProfilePage from './views/CustomerProfilePage.svelte';
  import CustomerAuthModal from './components/CustomerAuthModal.svelte';
  import MessengerChatPopup from './components/MessengerChatPopup.svelte';
  import TopAdBanner from './components/TopAdBanner.svelte';
  import SideAdBanners from './components/SideAdBanners.svelte';
  import MobileLayout from './components/mobile/MobileLayout.svelte';
  import { routerService } from './services/routerService';

  // Responsive device viewport detection: automatically adapt to mobile devices (< 768px)
  let isMobile = $state(false);

  $effect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 767px)');
    isMobile = mql.matches;
    const handler = (e: MediaQueryListEvent) => {
      isMobile = e.matches;
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  });

  // Window dimensions and orientation tracking
  let windowWidth = $state<number>(typeof window !== 'undefined' ? window.innerWidth : 1920);
  let isLandscape = $state<boolean>(typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : true);

  $effect(() => {
    if (typeof window === 'undefined') return;
    function updateDimensions() {
      windowWidth = window.innerWidth;
      isLandscape = window.innerWidth > window.innerHeight;
    }
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  });

  // Proportional Full HD scaling is active on landscape desktop screens (>= 1200px)
  // On portrait tablets (like iPad 1067x1536) or vertical screens, use fluid 100% width
  let isDesktopScaled = $derived(!isMobile && isLandscape && windowWidth >= 1200);
  let desktopScale = $derived.by(() => {
    if (!isDesktopScaled) return 1;
    if (windowWidth < 1920) {
      return windowWidth / 1920;
    }
    return 1;
  });
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
      } else if (route.path === '/profile' || route.path === '/account') {
        appStore.activeTab = 'profile';
      } else if (route.path === '/tab' && route.param) {
        appStore.activeTab = route.param;
      }
    }

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  });
</script>
{#if isMobile}
  <!-- Dedicated Mobile App Layout (Inspired by Image #1) -->
  <MobileLayout />
{:else}
  <!-- Desktop Layout (Full HD scaled in landscape, fluid responsive in portrait/tablets) -->
  <div
    class="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800 relative origin-top mx-auto"
    style={isDesktopScaled ? `width: 1920px; min-width: 1920px; zoom: ${desktopScale};` : 'width: 100%; max-width: 100%;'}
  >
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
    {:else if appStore.activeTab === 'profile'}
      <CustomerProfilePage />
    {:else}
      <!-- Dynamic Custom Tab Page (Siêu Sale, Đang Hot...) -->
      <CustomTabPage tabId={appStore.activeTab} />
    {/if}
  </main>

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
      <!-- Social Media Connections (Facebook, Zalo) -->
      {#if themeStore.theme.socials?.facebook || themeStore.theme.socials?.zalo}
        <div class="flex flex-wrap items-center justify-center gap-2 text-xs pt-1">
          <span class="text-slate-600 font-medium">
            {themeStore.theme.socials.socialText || 'Kết nối cùng CSET Store qua Facebook & Zalo:'}
          </span>
          {#if themeStore.theme.socials?.facebook}
            <a
              href={themeStore.theme.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 font-semibold transition cursor-pointer"
              title="Trang Facebook CSET Store"
            >
              <i class="fa-brands fa-facebook text-[#1877F2] text-sm"></i>
              <span>Facebook</span>
            </a>
          {/if}
          {#if themeStore.theme.socials?.zalo}
            <a
              href={themeStore.theme.socials.zalo}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 text-cyan-900 border border-cyan-200 hover:bg-cyan-100 font-semibold transition cursor-pointer"
              title="Chat Zalo cùng CSET Store"
            >
              <i class="fa-solid fa-comment-dots text-[#0068FF] text-sm"></i>
              <span>Zalo</span>
            </a>
          {/if}
        </div>
      {/if}
      <p>{themeStore.theme.footerText}</p>
    </div>
  </footer>
  </div>
{/if}
  <!-- Global Modals -->
  <ProductModal />
  <CartModal />
  <CustomerAuthModal />
  <MessengerChatPopup />
  <Toast />
