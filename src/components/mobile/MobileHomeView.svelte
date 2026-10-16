<script lang="ts">
  import { appStore } from '../../stores/store.svelte';
  import { themeStore } from '../../stores/themeStore.svelte';
  import { LocalStorageCategoryRepository } from '../../repositories';
  import type { AdItem } from '../../models/types';
  import ProductCard from '../ProductCard.svelte';

  const categoryRepo = new LocalStorageCategoryRepository();
  let categories = $state(categoryRepo.getAll());

  // Category image map for high quality squircle icons
  const categoryImages: Record<string, string> = {
    electronics: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80',
    fashion: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&auto=format&fit=crop&q=80',
    home: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=200&auto=format&fit=crop&q=80',
    beauty: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&auto=format&fit=crop&q=80',
    books: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=80'
  };

  // Continuous scroll state
  let visibleCount = $state<number>(6);
  let isLoadingMore = $state<boolean>(false);
  let sentinelEl = $state<HTMLDivElement | null>(null);
  function isBannerActive(b: AdItem): boolean {
    if (!b.enabled) return false;
    const now = Date.now();
    if (b.startDate) {
      const start = new Date(b.startDate).getTime();
      if (!isNaN(start) && now < start) return false;
    }
    if (b.endDate) {
      const end = new Date(b.endDate).getTime();
      if (!isNaN(end) && now > end) return false;
    }
    return true;
  }

  let mobileSideBanners = $derived(
    themeStore.theme.visibility.showSideAdBanners
      ? (themeStore.theme.banners?.filter(b => (b.position === 'side-left' || b.position === 'side-right') && isBannerActive(b)) || [])
      : []
  );

  // Products featured list based on auto top 5 or manual pinned
  let baseFeaturedProducts = $derived.by(() => {
    const mode = themeStore.theme.productGridStyle?.homeDisplayMode || 'auto_top5';
    if (mode === 'auto_top5') {
      return [...appStore.products]
        .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
        .slice(0, 5);
    }
    const manualPicks = appStore.products.filter(p => p.showOnHome);
    if (manualPicks.length > 0) return manualPicks;
    return [...appStore.products]
      .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      .slice(0, 5);
  });

  let displayedProducts = $derived(
    baseFeaturedProducts.slice(0, visibleCount)
  );
  let hasMore = $derived(visibleCount < baseFeaturedProducts.length);

  function loadMore() {
    if (isLoadingMore || !hasMore) return;
    isLoadingMore = true;
    setTimeout(() => {
      visibleCount = Math.min(baseFeaturedProducts.length, visibleCount + 4);
      isLoadingMore = false;
    }, 200);
  }

  $effect(() => {
    if (!sentinelEl || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
        loadMore();
      }
    }, { rootMargin: '200px' });

    observer.observe(sentinelEl);
    return () => observer.disconnect();
  });

  function selectCategory(catKey: string) {
    appStore.selectedCategory = catKey;
    appStore.setTab('shop');
  }
</script>

<div class="space-y-6 pb-24 animate-in fade-in duration-200">
  <!-- 1. Categories Squircle Carousel (Layout inspired by Screen 1 in Image #1) -->
  <div class="space-y-3">
    <div class="flex items-center justify-between px-1">
      <h3 class="font-black text-sm text-blue-950">Danh Mục Ngành Hàng</h3>
      <button
        type="button"
        onclick={() => appStore.setTab('shop')}
        class="text-xs font-bold text-blue-900 hover:underline cursor-pointer"
      >
        Xem tất cả
      </button>
    </div>

    <div class="flex gap-3 overflow-x-auto pb-1 scrollbar-none px-1">
      {#each categories as cat (cat.key)}
        {@const imgUrl = cat.customIconImage || categoryImages[cat.key] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'}
        <button
          type="button"
          onclick={() => selectCategory(cat.key)}
          class="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
        >
          <div class="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 bg-white p-1 shadow-xs group-hover:border-blue-900 transition-all duration-300 group-hover:scale-105">
            <img src={imgUrl} alt={cat.label} class="w-full h-full object-cover rounded-xl" />
          </div>
          <span class="text-[11px] font-bold text-slate-700 max-w-[70px] truncate text-center group-hover:text-blue-900">
            {cat.label}
          </span>
        </button>
      {/each}
    </div>
  </div>

  <!-- 2. Configured Side Ad Banners for Mobile (Same as Desktop Side Banners, toggled by showSideAdBanners) -->
  {#if themeStore.theme.visibility.showSideAdBanners && mobileSideBanners.length > 0}
    <div class="space-y-2">
      <div class="flex gap-3 overflow-x-auto pb-1 scrollbar-none px-1">
        {#each mobileSideBanners as banner (banner.id)}
          {#if banner.type === 'image' && banner.imageUrl}
            <a
              href={banner.linkUrl || '#'}
              class="min-w-[280px] sm:min-w-[320px] rounded-3xl overflow-hidden border border-slate-200 shadow-md relative group shrink-0 bg-slate-900 block"
            >
              <div class="relative h-36 w-full overflow-hidden">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 flex flex-col justify-end text-white">
                  <span class="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white w-fit mb-1 shadow-xs">
                    {banner.position === 'side-left' ? 'Khuyến Mãi' : 'Nổi Bật'}
                  </span>
                  <h4 class="font-black text-sm text-white leading-tight line-clamp-1">{banner.title}</h4>
                  {#if banner.subtitle}
                    <p class="text-[11px] text-slate-200 line-clamp-1">{banner.subtitle}</p>
                  {/if}
                </div>
              </div>
            </a>
          {:else}
            <!-- Text Banner -->
            <a
              href={banner.linkUrl || '#'}
              class="min-w-[280px] sm:min-w-[320px] rounded-3xl p-5 flex flex-col justify-between shadow-md shrink-0 block border border-slate-200"
              style="background-color: {banner.bgColor || '#1e3a8a'}; color: {banner.textColor || '#ffffff'};"
            >
              <div class="space-y-1">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 backdrop-blur-xs w-fit inline-block">
                  {banner.position === 'side-left' ? 'Banner Trái' : 'Banner Phải'}
                </span>
                <h4 class="font-black text-base leading-tight">{banner.title}</h4>
                {#if banner.subtitle}
                  <p class="text-xs opacity-90">{banner.subtitle}</p>
                {/if}
              </div>
              <span class="mt-3 text-xs font-bold underline inline-flex items-center gap-1">
                <span>Xem chi tiết</span>
                <i class="fa-solid fa-arrow-right text-[10px]"></i>
              </span>
            </a>
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  <!-- 3. Top Best-Selling / Featured Products (Layout inspired by Top Restaurants/Items in Image #1) -->
  <div class="space-y-3">
    <div class="flex items-center justify-between px-1">
      <div>
        <h3 class="font-black text-sm text-blue-950 flex items-center gap-1.5">
          <i class="fa-solid fa-sparkles text-amber-500 text-xs"></i>
          <span>{themeStore.theme.productGridStyle?.sectionTitle || 'Sản Phẩm Bán Chạy & Nổi Bật'}</span>
        </h3>
        <p class="text-[11px] text-slate-500">Tuyển chọn các mặt hàng chính hãng được đánh giá cao nhất</p>
      </div>
      <button
        type="button"
        onclick={() => appStore.setTab('shop')}
        class="text-xs font-bold text-blue-900 hover:underline cursor-pointer shrink-0"
      >
        Xem tất cả ({appStore.products.length})
      </button>
    </div>

    <!-- 2-Column Responsive Product Grid for Mobile -->
    <div class="grid grid-cols-2 gap-3.5 px-0.5">
      {#each displayedProducts as product (product.id)}
        <ProductCard {product} />
      {/each}
    </div>

    <!-- Continuous Scroll Loader -->
    {#if hasMore}
      <div bind:this={sentinelEl} class="py-4 flex justify-center">
        {#if isLoadingMore}
          <div class="flex items-center gap-2 text-xs font-semibold text-blue-900 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Đang tải thêm...</span>
          </div>
        {:else}
          <button
            type="button"
            onclick={loadMore}
            class="px-5 py-2 rounded-full bg-white border border-slate-300 text-blue-950 text-xs font-bold hover:bg-blue-50 cursor-pointer shadow-2xs"
          >
            Cuộn để tải thêm
          </button>
        {/if}
      </div>
    {/if}
  </div>
</div>
