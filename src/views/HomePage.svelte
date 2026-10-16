<script lang="ts">
  import { appStore } from '../stores/store.svelte';
  import { themeStore } from '../stores/themeStore.svelte';
  import ProductCard from '../components/ProductCard.svelte';

  let featuredProducts = $derived(appStore.products.slice(0, 4));
</script>

<div class="space-y-16">
  <!-- Hero Section (Conditional) -->
  {#if themeStore.theme.visibility.showHeroSection}
    <section class="relative rounded-3xl overflow-hidden glass-panel border border-slate-200 p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 bg-white">
      <div class="space-y-6 max-w-2xl text-center lg:text-left z-10">
        {#if themeStore.theme.visibility.showPromoBadge}
          <div class="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider">
            <i class="fa-solid fa-bolt"></i>
            <span>{themeStore.theme.badgeText}</span>
          </div>
        {/if}

        <h1 class="text-4xl md:text-5xl lg:text-6xl font-black text-blue-950 leading-tight">
          {themeStore.theme.heroTitle} <br />
          <span class="text-blue-900">{themeStore.theme.heroSubtitle}</span>
        </h1>

        <p class="text-slate-600 text-base md:text-lg leading-relaxed">
          {themeStore.theme.heroDescription}
        </p>
        <div class="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
          <button
            type="button"
            onclick={() => appStore.setTab('shop')}
            class="px-8 py-4 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition cursor-pointer flex items-center"
            style="background-color: {themeStore.theme.primaryColor}"
          >
            <i class="fa-solid fa-bag-shopping mr-2"></i>
            Khám Phá Sản Phẩm
          </button>

          <button
            type="button"
            onclick={() => appStore.setTab('custom')}
            class="px-8 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-950 font-bold border border-slate-300 transition cursor-pointer flex items-center"
          >
            <i class="fa-solid fa-upload mr-2"></i>
            Tải File Báo Giá Ngay
          </button>
        </div>

        <!-- Trust Badges (Conditional) -->
        {#if themeStore.theme.visibility.showTrustBadges}
          <div class="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/80 text-left">
            <div>
              <span class="block text-2xl font-black text-blue-950">{themeStore.theme.precisionText.split(' - ')[0]}</span>
              <span class="text-xs text-slate-500 font-medium">{themeStore.theme.precisionText.split(' - ')[1] || 'Độ chính xác cao'}</span>
            </div>
            <div>
              <span class="block text-2xl font-black text-blue-950">{themeStore.theme.supportText.split(' - ')[0]}</span>
              <span class="text-xs text-slate-500 font-medium">{themeStore.theme.supportText.split(' - ')[1] || 'Hỗ trợ'}</span>
            </div>
            <div>
              <span class="block text-2xl font-black text-blue-950">{themeStore.theme.pricingNote.split(' - ')[0]}</span>
              <span class="text-xs text-slate-500 font-medium">{themeStore.theme.pricingNote.split(' - ')[1] || 'Chi phí'}</span>
            </div>
          </div>
        {/if}
      </div>

      <!-- Bambu Lab Machine Graphic (Conditional) -->
      {#if themeStore.theme.visibility.showHeroPrinter}
        <div class="relative w-full lg:w-1/2 flex justify-center">
          <div class="relative w-72 h-72 md:w-96 md:h-96 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-slate-100 group">
            <img
              src={themeStore.theme.heroImage}
              alt={themeStore.theme.printerModel}
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div class="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-white/50 shadow-md flex items-center justify-between">
              <div>
                <p class="text-xs font-bold text-blue-950">{themeStore.theme.printerModel}</p>
                <p class="text-[10px] text-slate-500 font-medium">{themeStore.theme.printerSpeedText}</p>
              </div>
              <span class="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse"></span>
            </div>
          </div>
        </div>
      {/if}
    </section>
  {/if}

  <!-- Featured Products (Conditional) -->
  {#if themeStore.theme.visibility.showFeaturedProducts}
    <section class="space-y-8">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-black text-blue-950">Sản Phẩm Nổi Bật</h2>
          <p class="text-xs text-slate-500 mt-1">Các mẫu in 3D hoàn thiện được ưa chuộng nhất tại CSET Store</p>
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

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each featuredProducts as product (product.id)}
          <ProductCard {product} />
        {/each}
      </div>
    </section>
  {/if}

  <!-- Value Propositions Banner (Conditional) -->
  {#if themeStore.theme.visibility.showValueProps}
    <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-3">
        <div class="w-12 h-12 bg-blue-50 text-blue-900 rounded-xl flex items-center justify-center text-xl">
          <i class="fa-solid fa-microchip"></i>
        </div>
        <h3 class="font-bold text-blue-950 text-base">Vật Liệu Đa Dạng</h3>
        <p class="text-slate-600 text-xs leading-relaxed">
          Hỗ trợ PLA+, PETG chịu nhiệt, ABS độ bền cao, TPU dẻo và Resin chi tiết cực mịn.
        </p>
      </div>

      <div class="glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-3">
        <div class="w-12 h-12 bg-blue-50 text-blue-900 rounded-xl flex items-center justify-center text-xl">
          <i class="fa-solid fa-calculator"></i>
        </div>
        <h3 class="font-bold text-blue-950 text-base">Báo Giá Tự Động Minh Bạch</h3>
        <p class="text-slate-600 text-xs leading-relaxed">
          Hệ thống tự động tính khối lượng nhựa và thời gian in theo dung lượng file thực tế.
        </p>
      </div>

      <div class="glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-3">
        <div class="w-12 h-12 bg-blue-50 text-blue-900 rounded-xl flex items-center justify-center text-xl">
          <i class="fa-solid fa-truck-fast"></i>
        </div>
        <h3 class="font-bold text-blue-950 text-base">Giao Hàng Toàn Quốc</h3>
        <p class="text-slate-600 text-xs leading-relaxed">
          Đóng gói cẩn thận với xốp bóng khí chống sốc, đảm bảo sản phẩm nguyên vẹn đến tay bạn.
        </p>
      </div>
    </section>
  {/if}
</div>
