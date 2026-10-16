<script lang="ts">
  import { appStore } from '../stores/store.svelte';
  import { CATEGORIES } from '../models/constants';
  import type { CategoryKey } from '../models/types';
  import ProductCard from '../components/ProductCard.svelte';
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
      Hiển thị <span class="text-blue-900 font-bold">{appStore.filteredProducts.length}</span> / {appStore.products.length} sản phẩm
    </div>
  </div>

  <div class="flex flex-col lg:flex-row gap-8">
    <!-- Filter Sidebar -->
    <aside class="w-full lg:w-72 glass-panel p-6 rounded-3xl border border-slate-200 h-fit space-y-6 bg-white shrink-0 shadow-sm">
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
          {#each CATEGORIES as cat}
            <button
              type="button"
              onclick={() => appStore.selectedCategory = cat.key as CategoryKey}
              class="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer {appStore.selectedCategory === cat.key
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'}"
            >
              <span class="flex items-center gap-2">
                <i class="fa-solid {cat.icon || 'fa-box'} w-4"></i>
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
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each appStore.filteredProducts as product (product.id)}
            <ProductCard {product} />
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
