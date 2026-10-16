<script lang="ts">
  import { appStore } from '../stores/store.svelte';
  import { themeStore } from '../stores/themeStore.svelte';
  import { CATEGORIES } from '../models/constants';
  import ProductCard from '../components/ProductCard.svelte';

  let featuredProducts = $derived(appStore.products.slice(0, 8));
</script>

<div class="space-y-16">
  <!-- Hero Section (Conditional) -->
  {#if themeStore.theme.visibility.showHeroSection}
    <section class="relative rounded-3xl overflow-hidden glass-panel border border-slate-200 p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 bg-white">
      <div class="space-y-6 max-w-2xl text-center lg:text-left z-10">
        {#if themeStore.theme.visibility.showPromoBadge}
          <div class="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider">
            <i class="fa-solid fa-gift"></i>
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
            class="px-8 py-4 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition cursor-pointer flex items-center gap-2"
            style="background-color: {themeStore.theme.primaryColor}"
          >
            <i class="fa-solid fa-bag-shopping"></i>
            <span>Mua Sắm Ngay</span>
          </button>

          <button
            type="button"
            onclick={() => appStore.setTab('shop')}
            class="px-8 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-950 font-bold border border-slate-300 transition cursor-pointer flex items-center gap-2"
          >
            <i class="fa-solid fa-fire text-amber-500"></i>
            <span>Sản Phẩm Bán Chạy</span>
          </button>
        </div>

        <!-- Trust Badges (Conditional) -->
        {#if themeStore.theme.visibility.showTrustBadges}
          <div class="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200/80 text-left">
            <div>
              <span class="block text-base font-black text-blue-950"><i class="fa-solid fa-shield-check text-blue-900 mr-1.5"></i>Chính Hãng</span>
              <span class="text-xs text-slate-500 font-medium">{themeStore.theme.guaranteeText.split(' - ')[1] || 'Cam kết chất lượng 100%'}</span>
            </div>
            <div>
              <span class="block text-base font-black text-blue-950"><i class="fa-solid fa-truck-fast text-blue-900 mr-1.5"></i>Giao Nhanh 2H</span>
              <span class="text-xs text-slate-500 font-medium">{themeStore.theme.shippingText.split(' - ')[1] || 'Đóng gói cẩn thận'}</span>
            </div>
            <div>
              <span class="block text-base font-black text-blue-950"><i class="fa-solid fa-rotate-left text-blue-900 mr-1.5"></i>Đổi Trả 7 Ngày</span>
              <span class="text-xs text-slate-500 font-medium">{themeStore.theme.returnPolicyText.split(' - ')[1] || 'Thủ tục tiện lợi'}</span>
            </div>
          </div>
        {/if}
      </div>

      <!-- Banner Hero Image (Conditional) -->
      {#if themeStore.theme.visibility.showHeroImage}
        <div class="relative w-full lg:w-1/2 flex justify-center">
          <div class="relative w-72 h-72 md:w-96 md:h-96 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-slate-100 group">
            <img
              src={themeStore.theme.heroImage}
              alt={themeStore.theme.heroHighlightTitle}
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div class="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-md flex items-center justify-between">
              <div>
                <p class="text-xs font-black text-blue-950">{themeStore.theme.heroHighlightTitle}</p>
                <p class="text-[10px] text-slate-500 font-medium">{themeStore.theme.heroHighlightSub}</p>
              </div>
              <span class="px-2.5 py-1 rounded-lg bg-blue-900 text-white font-bold text-[10px]">Hot Deal</span>
            </div>
          </div>
        </div>
      {/if}
    </section>
  {/if}

  <!-- Category Quick Browse -->
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-black text-blue-950">Danh Mục Mua Sắm Phổ Biến</h2>
      <button
        type="button"
        onclick={() => appStore.setTab('shop')}
        class="text-blue-900 font-bold text-xs hover:underline cursor-pointer"
      >
        Xem tất cả danh mục &rarr;
      </button>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {#each CATEGORIES.filter(c => c.key !== 'all') as cat}
        <button
          type="button"
          onclick={() => {
            appStore.selectedCategory = cat.key;
            appStore.setTab('shop');
          }}
          class="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-900 hover:shadow-md transition text-center cursor-pointer group flex flex-col items-center justify-center space-y-2"
        >
          <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center text-xl group-hover:bg-blue-900 group-hover:text-white transition">
            <i class="fa-solid {cat.icon || 'fa-box'}"></i>
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
            Sản Phẩm Bán Chạy & Nổi Bật
          </h2>
          <p class="text-xs text-slate-500 mt-1">Các sản phẩm chính hãng được người mua đánh giá cao nhất</p>
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
          <i class="fa-solid fa-tags"></i>
        </div>
        <h3 class="font-bold text-blue-950 text-base">Giá Cả Cạnh Tranh & Nhiều Ưu Đãi</h3>
        <p class="text-slate-600 text-xs leading-relaxed">
          Cập nhật mã giảm giá mỗi ngày, chương trình flash sale và tích lũy điểm thưởng cho thành viên.
        </p>
      </div>

      <div class="glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-3">
        <div class="w-12 h-12 bg-blue-50 text-blue-900 rounded-xl flex items-center justify-center text-xl">
          <i class="fa-solid fa-certificate"></i>
        </div>
        <h3 class="font-bold text-blue-950 text-base">Sản Phẩm Đảm Bảo 100% Chính Hãng</h3>
        <p class="text-slate-600 text-xs leading-relaxed">
          Nguồn gốc xuất xứ rõ ràng từ các thương hiệu uy tín hàng đầu, đầy đủ hóa đơn bảo hành.
        </p>
      </div>

      <div class="glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-3">
        <div class="w-12 h-12 bg-blue-50 text-blue-900 rounded-xl flex items-center justify-center text-xl">
          <i class="fa-solid fa-headset"></i>
        </div>
        <h3 class="font-bold text-blue-950 text-base">Chăm Sóc Khách Hàng Tận Tâm</h3>
        <p class="text-slate-600 text-xs leading-relaxed">
          Đội ngũ chuyên viên tư vấn giàu kinh nghiệm, hỗ trợ giải đáp mọi thắc mắc 24/7.
        </p>
      </div>
    </section>
  {/if}
</div>
