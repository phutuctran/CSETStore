<script lang="ts">
  import { appStore } from '../../stores/store.svelte';
  import { themeStore } from '../../stores/themeStore.svelte';
  import { LocalStorageCategoryRepository } from '../../repositories';
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

  <!-- 2. Promotional Banner Carousel (Layout inspired by Promo Card in Image #1) -->
  <div class="flex gap-3 overflow-x-auto pb-1 scrollbar-none px-1">
    <!-- Card 1: Main Discount Promo Banner -->
    <div class="min-w-[280px] sm:min-w-[320px] rounded-3xl p-5 bg-gradient-to-r from-blue-950 to-blue-900 text-white flex items-center justify-between shadow-lg relative overflow-hidden shrink-0">
      <div class="space-y-2 z-10 max-w-[170px]">
        <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-rose-600 text-white shadow">
          ƯU ĐÃI ĐẾN 40%
        </span>
        <h4 class="font-black text-base leading-tight">Siêu Hội Mua Sắm 2026</h4>
        <p class="text-[11px] text-blue-200">Áp dụng cho mọi đơn từ 300.000đ</p>
        <button
          type="button"
          onclick={() => appStore.setTab('shop')}
          class="mt-1 px-3.5 py-1.5 rounded-xl bg-white text-blue-950 font-bold text-xs shadow-xs hover:bg-blue-50 transition cursor-pointer"
        >
          Mua Ngay &rarr;
        </button>
      </div>
      <div class="w-24 h-24 rounded-2xl overflow-hidden shadow-md shrink-0 border border-white/20">
        <img
          src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80"
          alt="Promo banner"
          class="w-full h-full object-cover"
        />
      </div>
    </div>

    <!-- Card 2: Hot Deal Banner -->
    <div class="min-w-[280px] sm:min-w-[320px] rounded-3xl p-5 bg-gradient-to-r from-purple-950 to-blue-950 text-white flex items-center justify-between shadow-lg relative overflow-hidden shrink-0">
      <div class="space-y-2 z-10 max-w-[170px]">
        <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-amber-500 text-white shadow">
          TRENDING TECH
        </span>
        <h4 class="font-black text-base leading-tight">Công Nghệ Đỉnh Cao</h4>
        <p class="text-[11px] text-purple-200">Bảo hành 12-24 tháng đổi mới</p>
        <button
          type="button"
          onclick={() => appStore.setTab('shop')}
          class="mt-1 px-3.5 py-1.5 rounded-xl bg-white text-blue-950 font-bold text-xs shadow-xs hover:bg-slate-100 transition cursor-pointer"
        >
          Khám Phá &rarr;
        </button>
      </div>
      <div class="w-24 h-24 rounded-2xl overflow-hidden shadow-md shrink-0 border border-white/20">
        <img
          src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80"
          alt="Tech banner"
          class="w-full h-full object-cover"
        />
      </div>
    </div>
  </div>

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
