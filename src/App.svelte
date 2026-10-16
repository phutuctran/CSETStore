<script lang="ts">
  import { appStore } from './stores/store.svelte';
  import Header from './components/Header.svelte';
  import Toast from './components/Toast.svelte';
  import ProductModal from './components/ProductModal.svelte';
  import CartModal from './components/CartModal.svelte';
  import HomePage from './views/HomePage.svelte';
  import ShopPage from './views/ShopPage.svelte';
  import CustomOrderPage from './views/CustomOrderPage.svelte';
  import AdminPage from './views/AdminPage.svelte';
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
    {:else if appStore.activeTab === 'custom'}
      <CustomOrderPage />
    {:else if appStore.activeTab === 'admin'}
      <AdminPage />
    {/if}
  </main>

  <!-- Global Modals -->
  <ProductModal />
  <CartModal />
  <Toast />

  <!-- Footer -->
  <footer class="glass-panel border-t border-slate-200 mt-20 py-8 bg-white text-center text-xs text-slate-500">
    <div class="max-w-7xl mx-auto px-4 space-y-2">
      <div class="flex items-center justify-center space-x-2 text-blue-950 font-bold">
        <i class="fa-solid fa-cube text-blue-900"></i>
        <span>CSET STORE - 3D Printing Studio</span>
      </div>
      <p>© 2026 CSET Store. Đồ án xây dựng Website In 3D sử dụng Svelte 5 và Kiến trúc Layered Component.</p>
    </div>
  </footer>
</div>
