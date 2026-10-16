<script lang="ts">
  import { appStore } from '../stores/store.svelte';
  import { themeStore } from '../stores/themeStore.svelte';
  import ProductCard from '../components/ProductCard.svelte';
  import Pagination from '../components/Pagination.svelte';
  import type { CustomNavTab } from '../models/types';

  interface Props {
    tabId: string;
  }

  let { tabId }: Props = $props();

  let visibleCount = $state<number>(6);
  let isLoadingMore = $state<boolean>(false);
  let sentinelEl = $state<HTMLDivElement | null>(null);

  let currentTab = $derived<CustomNavTab | undefined>(
    themeStore.theme.customTabs?.find(t => t.id === tabId)
  );

  let tabProducts = $derived(
    currentTab?.productIds && currentTab.productIds.length > 0
      ? appStore.products.filter(p => currentTab?.productIds.includes(p.id))
      : []
  );

  let displayedProducts = $derived(
    tabProducts.slice(0, visibleCount)
  );
  let hasMore = $derived(visibleCount < tabProducts.length);

  function loadMore() {
    if (isLoadingMore || !hasMore) return;
    isLoadingMore = true;
    setTimeout(() => {
      visibleCount = Math.min(tabProducts.length, visibleCount + 6);
      isLoadingMore = false;
    }, 250);
  }

  $effect(() => {
    const _t = tabId;
    visibleCount = 6;
  });

  $effect(() => {
    if (!sentinelEl || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
        loadMore();
      }
    }, { rootMargin: '250px' });

    observer.observe(sentinelEl);
    return () => observer.disconnect();
  });
</script>

{#if currentTab}
  <div class="space-y-8 animate-in fade-in duration-200">
    <!-- Tab Promotional Header Banner (Customized in Admin) -->
    <div class="rounded-3xl overflow-hidden border border-slate-200 shadow-md">
      {#if currentTab.bannerType === 'image' && currentTab.bannerImage}
        <div class="w-full relative bg-slate-900 max-h-56 sm:max-h-72">
          <img
            src={currentTab.bannerImage}
            alt={currentTab.name}
            class="w-full h-auto max-h-56 sm:max-h-72 object-cover"
          />
        </div>
      {:else}
        <div
          class="p-8 sm:p-12 text-center space-y-3"
          style="background-color: {currentTab.bannerBg || '#b91c1c'}; color: {currentTab.bannerTextColor || '#ffffff'};"
        >
          <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase tracking-wider">
            <i class="fa-solid {currentTab.icon || 'fa-fire'}"></i>
            <span>{currentTab.name}</span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            {currentTab.bannerTitle || currentTab.name}
          </h2>
          {#if currentTab.bannerSubtitle}
            <p class="text-sm opacity-90 max-w-2xl mx-auto leading-relaxed">
              {currentTab.bannerSubtitle}
            </p>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Products Display Area -->
    <div class="space-y-4">
      <div class="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h3 class="text-xl font-black text-blue-950 flex items-center gap-2">
            <i class="fa-solid {currentTab.icon || 'fa-star'} text-amber-500"></i>
            Sản Phẩm Tuyển Chọn: {currentTab.name}
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">Danh sách sản phẩm đặc trưng được gán vào tab này</p>
        </div>
        <div class="text-xs font-semibold text-slate-500">
          Hiển thị: <span class="text-blue-900 font-bold">{displayedProducts.length}</span> / {tabProducts.length} sản phẩm
        </div>
      </div>

      {#if tabProducts.length === 0}
        <div class="glass-panel p-12 text-center rounded-3xl border border-slate-200 bg-white space-y-3">
          <div class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
            <i class="fa-solid fa-box-open"></i>
          </div>
          <p class="text-slate-600 font-semibold text-sm">Chưa có sản phẩm nào được gán vào tab này.</p>
          <p class="text-xs text-slate-400">Quản trị viên có thể vào Trang Quản Trị &gt; Tab Tùy Biến để chọn các sản phẩm đưa lên.</p>
        </div>
      {:else}
        <div class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6">
            {#each displayedProducts as product (product.id)}
              <ProductCard {product} />
            {/each}
          </div>

          <!-- Continuous Scroll Loader & Sentinel -->
          {#if hasMore}
            <div bind:this={sentinelEl} class="py-8 flex flex-col items-center justify-center gap-2">
              {#if isLoadingMore}
                <div class="flex items-center gap-2 text-xs font-semibold text-blue-900 bg-blue-50 px-4 py-2 rounded-full border border-blue-200 shadow-xs animate-pulse">
                  <i class="fa-solid fa-spinner fa-spin"></i>
                  <span>Đang cuộn tải thêm sản phẩm...</span>
                </div>
              {:else}
                <button
                  type="button"
                  onclick={loadMore}
                  class="px-6 py-2.5 rounded-full bg-white border border-slate-300 hover:border-blue-900 text-blue-950 font-bold text-xs hover:bg-blue-50 transition shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <span>Cuộn xuống hoặc nhấn để xem tiếp ({tabProducts.length - visibleCount} sản phẩm còn lại)</span>
                  <i class="fa-solid fa-chevron-down text-[10px]"></i>
                </button>
              {/if}
            </div>
          {:else if tabProducts.length > 0}
            <div class="py-8 text-center border-t border-slate-200">
              <div class="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
                <i class="fa-solid fa-circle-check text-emerald-600"></i>
                <span>Đã tải hiển thị toàn bộ {tabProducts.length} sản phẩm</span>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}
