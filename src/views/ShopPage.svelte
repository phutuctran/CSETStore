<script lang="ts">
  import { appStore } from '../stores/store.svelte';
  import { LocalStorageCategoryRepository } from '../repositories';
  import ProductCard from '../components/ProductCard.svelte';
  import Pagination from '../components/Pagination.svelte';
  import { routerService } from '../services/routerService';

  const categoryRepo = new LocalStorageCategoryRepository();
  let categories = $state(categoryRepo.getAll());
  let selectedSubCategory = $state<string>('');

  // Pagination State
  let currentPage = $state<number>(1);
  const pageSize = 6;

  // Synchronize route query on mount
  $effect(() => {
    const route = routerService.parseHash();
    if (route.query.page) {
      const p = parseInt(route.query.page, 10);
      if (!isNaN(p) && p > 0) currentPage = p;
    }
    if (route.query.cat && route.query.cat !== appStore.selectedCategory) {
      appStore.selectedCategory = route.query.cat;
    }
  });

  let displayCategories = $derived([
    { key: 'all', label: 'Tất cả sản phẩm', icon: 'fa-layer-group', subcategories: [] },
    ...categories
  ]);

  let activeSubCategories = $derived(
    categories.find(c => c.key === appStore.selectedCategory)?.subcategories || []
  );

  let filteredList = $derived(
    appStore.filteredProducts.filter(p => {
      if (!selectedSubCategory) return true;
      return p.subCategory === selectedSubCategory;
    })
  );
  let visibleCount = $state<number>(8);
  let isLoadingMore = $state<boolean>(false);
  let sentinelEl = $state<HTMLDivElement | null>(null);

  let displayedProducts = $derived(
    filteredList.slice(0, visibleCount)
  );
  let col1Products = $derived(
    displayedProducts.filter((_, i) => i % 2 === 0)
  );
  let col2Products = $derived(
    displayedProducts.filter((_, i) => i % 2 === 1)
  );
  let isMobileFilterExpanded = $state<boolean>(false);
  let hasMore = $derived(visibleCount < filteredList.length);
  function loadMore() {
    if (isLoadingMore || !hasMore) return;
    isLoadingMore = true;
    setTimeout(() => {
      visibleCount = Math.min(filteredList.length, visibleCount + 6);
      isLoadingMore = false;
    }, 250);
  }

  // Reset visibleCount whenever category, subCategory or searchQuery changes
  $effect(() => {
    const _c = appStore.selectedCategory;
    const _s = selectedSubCategory;
    const _q = appStore.searchQuery;
    visibleCount = 8;
  });

  // Setup IntersectionObserver for continuous scroll
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

  function handleCategoryChange(catKey: string) {
    appStore.selectedCategory = catKey;
    selectedSubCategory = '';
    visibleCount = 8;
    routerService.navigate('/shop', undefined, { cat: catKey !== 'all' ? catKey : undefined });
  }
</script>

<div class="space-y-8">
  <!-- Page Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
    <div>
      <h2 class="text-3xl font-black text-blue-950">Danh Mục Tất Cả Sản Phẩm</h2>
      <p class="text-slate-600 text-sm mt-1">
        Khám phá hàng ngàn mặt hàng điện tử, thời trang, gia dụng, mỹ phẩm và sách chính hãng.
      </p>
    </div>
    <div class="text-sm font-semibold text-slate-500">
      Hiển thị: <span class="text-blue-900 font-bold">{displayedProducts.length}</span> / {filteredList.length} sản phẩm
    </div>
  </div>

  <div class="flex flex-col lg:flex-row gap-8">
    <!-- Desktop Filter Sidebar -->
    <aside class="hidden lg:block w-72 glass-panel p-6 rounded-3xl border border-slate-200 h-fit space-y-6 bg-white shrink-0 shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-200 pb-4">
        <h3 class="text-lg font-bold text-blue-950 flex items-center">
          <i class="fa-solid fa-filter text-blue-900 mr-2"></i>
          Bộ Lọc
        </h3>
        {#if appStore.selectedCategory !== 'all' || appStore.searchQuery !== ''}
          <button
            type="button"
            onclick={() => {
              appStore.selectedCategory = 'all';
              appStore.searchQuery = '';
            }}
            class="text-xs text-blue-900 hover:underline cursor-pointer font-semibold"
          >
            Đặt lại
          </button>
        {/if}
      </div>

      <!-- Search Input -->
      <div class="space-y-2">
        <label for="filter-search" class="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Tìm Sản Phẩm
        </label>
        <div class="relative">
          <input
            id="filter-search"
            type="text"
            bind:value={appStore.searchQuery}
            placeholder="Nhập tên sản phẩm, thương hiệu..."
            class="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900"
          />
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-slate-400 text-xs"></i>
          {#if appStore.searchQuery}
            <button
              type="button"
              onclick={() => appStore.searchQuery = ''}
              class="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <i class="fa-solid fa-circle-xmark"></i>
            </button>
          {/if}
        </div>
      </div>

      <!-- Categories Filter -->
      <div class="space-y-2">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Ngành Hàng
        </span>
        <div class="space-y-1">
          {#each displayCategories as cat}
            <button
              type="button"
              onclick={() => handleCategoryChange(cat.key)}
              class="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer {appStore.selectedCategory === cat.key
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'}"
            >
              <span class="flex items-center gap-2">
                {#if cat.customIconImage}
                  <img src={cat.customIconImage} alt={cat.label} class="w-4 h-4 object-contain shrink-0" />
                {:else}
                  <i class="fa-solid {cat.icon || 'fa-box'} w-4"></i>
                {/if}
                <span>{cat.label}</span>
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded-full {appStore.selectedCategory === cat.key ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-600'}">
                {cat.key === 'all'
                  ? appStore.products.length
                  : appStore.products.filter(p => p.category === cat.key).length}
              </span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Subcategories filter if present -->
      {#if activeSubCategories.length > 0}
        <div class="space-y-2 pt-2 border-t border-slate-200">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Loại Danh Mục
          </span>
          <div class="flex flex-wrap gap-1.5">
            <button
              type="button"
              onclick={() => selectedSubCategory = ''}
              class="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer {!selectedSubCategory ? 'bg-purple-100 text-purple-900 font-bold border border-purple-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
            >
              Tất cả loại
            </button>
            {#each activeSubCategories as sub}
              <button
                type="button"
                onclick={() => selectedSubCategory = sub.name}
                class="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer {selectedSubCategory === sub.name ? 'bg-purple-100 text-purple-900 font-bold border border-purple-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
              >
                {sub.name}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Support Banner Box -->
      <div class="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 text-xs text-blue-900 space-y-2">
        <p class="font-bold flex items-center">
          <i class="fa-solid fa-truck-ramp-box mr-1.5"></i>
          Giao hàng miễn phí
        </p>
        <p class="text-slate-600 leading-relaxed text-[11px]">
          Áp dụng cho mọi đơn hàng có giá trị từ 300.000đ trên toàn quốc.
        </p>
      </div>
    </aside>

    <!-- Mobile Collapsible Filter (Thu gọn chỉ hiển thị icon) -->
    <div class="lg:hidden bg-white border border-slate-200 rounded-3xl p-3.5 space-y-3 shadow-2xs">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-7 h-7 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center text-xs font-bold shrink-0">
            <i class="fa-solid fa-filter"></i>
          </span>
          <span class="text-xs font-black text-blue-950 truncate">Ngành Hàng</span>
          {#if appStore.selectedCategory !== 'all'}
            {@const activeCat = displayCategories.find(c => c.key === appStore.selectedCategory)}
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 truncate shrink-0">
              {activeCat?.label}
            </span>
          {/if}
        </div>

        <div class="flex items-center gap-2 shrink-0">
          {#if appStore.selectedCategory !== 'all' || selectedSubCategory || appStore.searchQuery}
            <button
              type="button"
              onclick={() => {
                appStore.selectedCategory = 'all';
                selectedSubCategory = '';
                appStore.searchQuery = '';
              }}
              class="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
            >
              Đặt lại
            </button>
          {/if}
          <button
            type="button"
            onclick={() => isMobileFilterExpanded = !isMobileFilterExpanded}
            class="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <span>{isMobileFilterExpanded ? 'Thu gọn icon' : 'Mở rộng'}</span>
            <i class="fa-solid {isMobileFilterExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-[10px]"></i>
          </button>
        </div>
      </div>

      {#if !isMobileFilterExpanded}
        <!-- Compact Icon-Only Horizontal Strip (Thu gọn chỉ icon) -->
        <div class="flex items-center gap-2.5 overflow-x-auto py-1 scrollbar-none px-0.5">
          {#each displayCategories as cat}
            {@const isSelected = appStore.selectedCategory === cat.key}
            <button
              type="button"
              onclick={() => handleCategoryChange(cat.key)}
              class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer relative {isSelected
                ? 'bg-blue-900 text-white shadow-md scale-105 ring-2 ring-blue-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'}"
              title={cat.label}
              aria-label={cat.label}
            >
              {#if cat.customIconImage}
                <img src={cat.customIconImage} alt={cat.label} class="w-5 h-5 object-contain" />
              {:else}
                <i class="fa-solid {cat.icon || 'fa-box'} text-base"></i>
              {/if}
              {#if isSelected}
                <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white"></span>
              {/if}
            </button>
          {/each}
        </div>

        <!-- Quick Subcategories strip on mobile -->
        {#if activeSubCategories.length > 0}
          <div class="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none border-t border-slate-100 text-[11px]">
            <button
              type="button"
              onclick={() => selectedSubCategory = ''}
              class="px-2.5 py-1 rounded-lg font-semibold shrink-0 transition {!selectedSubCategory ? 'bg-purple-100 text-purple-900 font-bold border border-purple-300' : 'bg-slate-100 text-slate-600'}"
            >
              Tất cả
            </button>
            {#each activeSubCategories as sub}
              <button
                type="button"
                onclick={() => selectedSubCategory = sub.name}
                class="px-2.5 py-1 rounded-lg font-semibold shrink-0 transition {selectedSubCategory === sub.name ? 'bg-purple-100 text-purple-900 font-bold border border-purple-300' : 'bg-slate-100 text-slate-600'}"
              >
                {sub.name}
              </button>
            {/each}
          </div>
        {/if}
      {:else}
        <!-- Expanded Mobile Filter with text -->
        <div class="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in duration-150">
          <div class="relative">
            <input
              type="text"
              bind:value={appStore.searchQuery}
              placeholder="Tìm sản phẩm..."
              class="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none"
            />
            <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-slate-400 text-xs"></i>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs">
            {#each displayCategories as cat}
              {@const isSelected = appStore.selectedCategory === cat.key}
              <button
                type="button"
                onclick={() => handleCategoryChange(cat.key)}
                class="px-3 py-2 rounded-xl font-bold border text-left flex items-center justify-between transition cursor-pointer {isSelected
                  ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'}"
              >
                <span class="flex items-center gap-1.5 truncate">
                  <i class="fa-solid {cat.icon || 'fa-box'} text-xs"></i>
                  <span class="truncate">{cat.label}</span>
                </span>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Product Grid Area -->
    <div class="flex-grow">
      {#if appStore.filteredProducts.length === 0}
        <div class="glass-panel rounded-3xl p-12 text-center border border-slate-200 bg-white space-y-4">
          <div class="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-2xl">
            <i class="fa-solid fa-box-open"></i>
          </div>
          <h4 class="text-lg font-bold text-blue-950">Không tìm thấy sản phẩm phù hợp</h4>
          <p class="text-slate-500 text-sm max-w-sm mx-auto">
            Hãy thử tìm kiếm với từ khóa khác hoặc chuyển sang danh mục "Tất cả sản phẩm".
          </p>
          <button
            type="button"
            onclick={() => {
              appStore.selectedCategory = 'all';
              appStore.searchQuery = '';
            }}
            class="px-5 py-2.5 bg-blue-900 text-white font-bold rounded-xl text-xs hover:bg-blue-800 transition cursor-pointer"
          >
            Xem toàn bộ sản phẩm
          </button>
        </div>
      {:else}
        <div class="space-y-6">
          <!-- Staggered 2-Column Mobile Grid (Cột đôi sole nhau lệch nhịp) -->
          <div class="grid grid-cols-2 gap-3.5 items-start md:hidden">
            <!-- Left Column 1 (starts at top) -->
            <div class="flex flex-col gap-3.5">
              {#each col1Products as product (product.id)}
                <ProductCard {product} />
              {/each}
            </div>

            <!-- Right Column 2 (Staggered offset pt-6 / Lệch nhịp sole nhau) -->
            <div class="flex flex-col gap-3.5 pt-6">
              {#each col2Products as product (product.id)}
                <ProductCard {product} />
              {/each}
            </div>
          </div>

          <!-- Standard Grid for Tablet and Desktop -->
          <div class="hidden md:grid md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6">
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
                  <span>Cuộn xuống hoặc nhấn để xem tiếp ({filteredList.length - visibleCount} sản phẩm còn lại)</span>
                  <i class="fa-solid fa-chevron-down text-[10px]"></i>
                </button>
              {/if}
            </div>
          {:else if filteredList.length > 0}
            <div class="py-8 text-center border-t border-slate-200">
              <div class="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
                <i class="fa-solid fa-circle-check text-emerald-600"></i>
                <span>Đã tải hiển thị toàn bộ {filteredList.length} sản phẩm</span>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
