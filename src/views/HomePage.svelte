<script lang="ts">
  import { appStore } from '../stores/store.svelte';
  import { themeStore } from '../stores/themeStore.svelte';
  import { LocalStorageCategoryRepository } from '../repositories';
  import ProductCard from '../components/ProductCard.svelte';
  const categoryRepo = new LocalStorageCategoryRepository();
  let categories = $state(categoryRepo.getAll());
  $effect(() => {
    if (typeof window === 'undefined') return;
    const onCatsUpdated = () => {
      categories = categoryRepo.getAll();
    };
    window.addEventListener('cset_categories_updated', onCatsUpdated);
    return () => window.removeEventListener('cset_categories_updated', onCatsUpdated);
  });
  let homeVisibleCount = $state<number>(8);
  let homeIsLoadingMore = $state<boolean>(false);
  let homeSentinelEl = $state<HTMLDivElement | null>(null);

  let baseFeaturedProducts = $derived.by(() => {
    const manualPicks = appStore.products.filter(p => p.showOnHome);
    if (manualPicks.length > 0) {
      return manualPicks;
    }
    return [...appStore.products]
      .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      .slice(0, 5);
  });

  let featuredProducts = $derived(
    baseFeaturedProducts.slice(0, homeVisibleCount)
  );
  let homeHasMore = $derived(homeVisibleCount < baseFeaturedProducts.length);

  function loadMoreHome() {
    if (homeIsLoadingMore || !homeHasMore) return;
    homeIsLoadingMore = true;
    setTimeout(() => {
      homeVisibleCount = Math.min(baseFeaturedProducts.length, homeVisibleCount + 6);
      homeIsLoadingMore = false;
    }, 250);
  }

  $effect(() => {
    if (!homeSentinelEl || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && homeHasMore && !homeIsLoadingMore) {
        loadMoreHome();
      }
    }, { rootMargin: '250px' });

    observer.observe(homeSentinelEl);
    return () => observer.disconnect();
  });

  let activePosterIndex = $state<number>(0);

  $effect(() => {
    const posters = themeStore.theme.heroPosters || [];
    if (posters.length >= 2) {
      const timer = setInterval(() => {
        activePosterIndex = (activePosterIndex + 1) % posters.length;
      }, 4000);
      return () => clearInterval(timer);
    }
  });
</script>

<div class="space-y-16">
  <!-- Hero Section (Conditional) -->
  {#if themeStore.theme.visibility.showHeroSection}
    <section class="relative rounded-3xl overflow-hidden border border-slate-200/90 p-6 sm:p-10 lg:p-12 xl:p-14 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 bg-gradient-to-br from-white via-blue-50/20 to-slate-50/60 shadow-xs">
      <!-- Decorative ambient gradient circles -->
      <div class="absolute -top-24 -right-24 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none"></div>

      <div class="space-y-6 max-w-xl xl:max-w-2xl text-center lg:text-left z-10">
        {#if themeStore.theme.visibility.showPromoBadge && (themeStore.theme.heroBadgeEnabled !== false)}
          <div class="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-900 text-xs font-bold uppercase tracking-wider shadow-2xs">
            {#if themeStore.theme.heroBadgeLogo}
              <img src={themeStore.theme.heroBadgeLogo} alt="Badge Logo" class="w-4 h-4 object-contain rounded-full" />
            {:else}
              <i class="fa-solid {themeStore.theme.heroBadgeIcon || 'fa-gift'} text-blue-700"></i>
            {/if}
            {#if themeStore.theme.badgeText}
              <span>{themeStore.theme.badgeText}</span>
            {/if}
          </div>
        {/if}

        <h1 class="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-blue-950 leading-[1.15] tracking-tight">
          {themeStore.theme.heroTitle} <br />
          <span class="text-blue-900">{themeStore.theme.heroSubtitle}</span>
        </h1>

        <p class="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
          {themeStore.theme.heroDescription}
        </p>

        <div class="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
          <button
            type="button"
            onclick={() => appStore.setTab('shop')}
            class="px-7 py-3.5 sm:px-8 sm:py-4 rounded-xl text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex items-center gap-2.5"
            style="background-color: {themeStore.theme.heroStyle?.primaryBtnBg || themeStore.theme.primaryColor}; color: {themeStore.theme.heroStyle?.primaryBtnTextColor || '#ffffff'};"
          >
            <i class="fa-solid fa-bag-shopping"></i>
            <span>{themeStore.theme.heroStyle?.primaryBtnText || 'Mua Sắm Ngay'}</span>
          </button>

          {#if themeStore.theme.heroStyle?.showSecondaryBtn !== false}
            <button
              type="button"
              onclick={() => appStore.setTab('shop')}
              class="px-7 py-3.5 sm:px-8 sm:py-4 rounded-xl bg-white hover:bg-slate-100 text-blue-950 font-bold text-sm sm:text-base border border-slate-200 shadow-2xs hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex items-center gap-2.5"
            >
              <i class="fa-solid fa-fire text-amber-500"></i>
              <span>{themeStore.theme.heroStyle?.secondaryBtnText || 'Sản Phẩm Bán Chạy'}</span>
            </button>
          {/if}
        </div>

        <!-- Trust Badges (Conditional) -->
        {#if themeStore.theme.visibility.showTrustBadges && themeStore.theme.trustBadges?.length > 0}
          <div class="pt-6 flex flex-wrap gap-4 sm:gap-6 border-t border-slate-200/80 text-left">
            {#each themeStore.theme.trustBadges as tb (tb.id)}
              <div class="flex-1 min-w-[130px] p-2 rounded-xl hover:bg-white/60 transition">
                <span class="flex items-center text-xs sm:text-sm font-black text-blue-950 gap-2">
                  {#if tb.customIconImage}
                    <img src={tb.customIconImage} alt={tb.title} class="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0" />
                  {:else}
                    <i class="fa-solid {tb.icon} text-blue-900"></i>
                  {/if}
                  <span>{tb.title}</span>
                </span>
                <span class="text-[11px] sm:text-xs text-slate-500 font-medium block mt-0.5">{tb.subtitle}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Banner Hero Carousel / Image Container -->
      {#if themeStore.theme.visibility.showHeroImage}
        {@const posters = (themeStore.theme.heroPosters && themeStore.theme.heroPosters.length > 0)
          ? themeStore.theme.heroPosters
          : [{ id: 'p-default', imageUrl: themeStore.theme.heroImage, highlightTitle: themeStore.theme.heroHighlightTitle, highlightSub: themeStore.theme.heroHighlightSub }]}
        <div class="relative w-full lg:w-5/12 xl:w-1/2 flex items-center justify-center self-stretch">
          <div class="relative w-full h-72 sm:h-84 md:h-[400px] lg:h-[440px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl bg-gradient-to-tr from-slate-100 to-slate-50 group">
            {#each posters as poster, idx (poster.id)}
              <div
                class="absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out {idx === activePosterIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}"
              >
                <img
                  src={poster.imageUrl}
                  alt={poster.highlightTitle || 'Hero Poster'}
                  class="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-102"
                />
                {#if poster.highlightTitle || poster.highlightSub}
                  <div class="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/60 shadow-lg flex items-center justify-between z-20">
                    <div class="space-y-0.5">
                      <p class="text-xs sm:text-sm font-black text-blue-950">{poster.highlightTitle}</p>
                      {#if poster.highlightSub}
                        <p class="text-[10px] sm:text-xs text-slate-500 font-medium">{poster.highlightSub}</p>
                      {/if}
                    </div>
                    <span class="px-2.5 py-1 rounded-lg bg-blue-900 text-white font-bold text-[10px] sm:text-xs shrink-0 shadow-2xs">
                      {poster.badgeText || 'Hot Deal'}
                    </span>
                  </div>
                {/if}
              </div>
            {/each}

            <!-- Controls when 2 or more posters exist -->
            {#if posters.length >= 2}
              <!-- Top Left Dots Indicator -->
              <div class="absolute top-4 left-4 z-30 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-full">
                {#each posters as _, dotIdx}
                  <button
                    type="button"
                    onclick={() => activePosterIndex = dotIdx}
                    class="h-1.5 rounded-full transition-all cursor-pointer {dotIdx === activePosterIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'}"
                    aria-label="Chuyển đến poster {dotIdx + 1}"
                  ></button>
                {/each}
              </div>

              <!-- Prev/Next arrows -->
              <button
                type="button"
                onclick={() => activePosterIndex = (activePosterIndex - 1 + posters.length) % posters.length}
                class="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition cursor-pointer shadow-md"
                aria-label="Poster trước"
              >
                <i class="fa-solid fa-chevron-left"></i>
              </button>

              <button
                type="button"
                onclick={() => activePosterIndex = (activePosterIndex + 1) % posters.length}
                class="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition cursor-pointer shadow-md"
                aria-label="Poster sau"
              >
                <i class="fa-solid fa-chevron-right"></i>
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </section>
  {/if}

  <!-- Category Quick Browse -->
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl font-black text-blue-950 flex items-center gap-2">
          <i class="fa-solid fa-layer-group text-blue-800 text-lg"></i>
          {themeStore.theme.categoryBlockStyle?.sectionTitle || 'Danh Mục Mua Sắm Phổ Biến'}
        </h2>
        <p class="text-xs text-slate-500 mt-0.5">Khám phá hàng ngàn sản phẩm chính hãng theo từng ngành hàng</p>
      </div>
      <button
        type="button"
        onclick={() => appStore.setTab('shop')}
        class="text-blue-900 font-bold text-xs sm:text-sm hover:underline cursor-pointer flex items-center gap-1 group"
      >
        <span>Xem tất cả</span>
        <i class="fa-solid fa-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
      </button>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
      {#each categories as cat}
        <button
          type="button"
          onclick={() => {
            appStore.selectedCategory = cat.key;
            appStore.setTab('shop');
          }}
          class="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-700 hover:shadow-md transition-all duration-200 text-center cursor-pointer group flex flex-col items-center justify-center space-y-2.5 hover:-translate-y-0.5"
        >
          <div class="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-blue-50/80 text-blue-900 flex items-center justify-center text-xl group-hover:bg-blue-900 group-hover:text-white transition-all duration-200 overflow-hidden p-2 shadow-2xs">
            {#if cat.customIconImage}
              <img src={cat.customIconImage} alt={cat.label} class="w-full h-full object-contain" />
            {:else}
              <i class="fa-solid {cat.icon || 'fa-box'}"></i>
            {/if}
          </div>
          <span class="text-xs font-bold text-slate-700 group-hover:text-blue-950 transition block leading-tight">
            {cat.label}
          </span>
        </button>
      {/each}
    </div>
  </section>

  <!-- Featured Products (Conditional) -->
  {#if themeStore.theme.visibility.showFeaturedProducts}
    <section class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-black text-blue-950 flex items-center gap-2">
            <i class="fa-solid fa-sparkles text-amber-500"></i>
            {themeStore.theme.productGridStyle?.sectionTitle || 'Sản Phẩm Bán Chạy & Nổi Bật'}
          </h2>
          <p class="text-xs text-slate-500 mt-1">{themeStore.theme.productGridStyle?.sectionSubtitle || 'Các sản phẩm chính hãng được người mua đánh giá cao nhất'}</p>
        </div>
        <button
          type="button"
          onclick={() => appStore.setTab('shop')}
          class="text-blue-900 font-bold text-sm cursor-pointer hover:underline flex items-center gap-1.5"
        >
          <span>Xem Tất Cả ({appStore.products.length})</span>
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>

      {#if featuredProducts.length > 0}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
          {#each featuredProducts as product (product.id)}
            <ProductCard {product} />
          {/each}
        </div>
      {:else}
        <div class="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80">
          <i class="fa-solid fa-box-open text-3xl mb-2 text-slate-300"></i>
          <p class="text-xs font-semibold text-slate-500">Chưa có sản phẩm nào được hiển thị</p>
        </div>
      {/if}

      {#if homeHasMore}
        <div bind:this={homeSentinelEl} class="py-6 flex flex-col items-center justify-center gap-2">
          {#if homeIsLoadingMore}
            <div class="flex items-center gap-2 text-xs font-semibold text-blue-900 bg-blue-50 px-4 py-2 rounded-full border border-blue-200 shadow-xs animate-pulse">
              <i class="fa-solid fa-spinner fa-spin"></i>
              <span>Đang cuộn tải thêm sản phẩm...</span>
            </div>
          {:else}
            <button
              type="button"
              onclick={loadMoreHome}
              class="px-6 py-2.5 rounded-full bg-white border border-slate-300 hover:border-blue-900 text-blue-950 font-bold text-xs hover:bg-blue-50 transition shadow-xs cursor-pointer flex items-center gap-2"
            >
              <span>Cuộn xuống hoặc nhấn để xem tiếp ({appStore.products.length - homeVisibleCount} sản phẩm còn lại)</span>
              <i class="fa-solid fa-chevron-down text-[10px]"></i>
            </button>
          {/if}
        </div>
      {/if}
    </section>
  {/if}

  <!-- Value Propositions Banner (Conditional) -->
  {#if themeStore.theme.visibility.showValueProps && themeStore.theme.valueProps?.length > 0}
    <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {#each themeStore.theme.valueProps as vp (vp.id)}
        <div class="glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-3">
          <div class="w-12 h-12 bg-blue-50 text-blue-900 rounded-xl flex items-center justify-center text-xl overflow-hidden p-1.5">
            {#if vp.customIconImage}
              <img src={vp.customIconImage} alt={vp.title} class="w-full h-full object-contain" />
            {:else}
              <i class="fa-solid {vp.icon}"></i>
            {/if}
          </div>
          <h3 class="font-bold text-blue-950 text-base">{vp.title}</h3>
          <p class="text-slate-600 text-xs leading-relaxed">
            {vp.description}
          </p>
        </div>
      {/each}
    </section>
  {/if}
</div>
