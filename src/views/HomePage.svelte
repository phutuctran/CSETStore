<script lang="ts">
  import { appStore } from '../stores/store.svelte';
  import ProductCard from '../components/ProductCard.svelte';

  let featuredProducts = $derived(appStore.products.slice(0, 4));
</script>

<div class="space-y-16">
  <!-- Hero Section -->
  <section class="relative rounded-3xl overflow-hidden glass-panel border border-slate-200 p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 bg-white">
    <div class="space-y-6 max-w-2xl text-center lg:text-left z-10">
      <div class="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider">
        <i class="fa-solid fa-bolt"></i>
        <span>Đồng Giá In 1.500đ / gam nhựa</span>
      </div>

      <h1 class="text-4xl md:text-5xl lg:text-6xl font-black text-blue-950 leading-tight">
        CSET Store <br />
        <span class="text-blue-900">In 3D Thông Minh & Nhanh Chóng</span>
      </h1>

      <p class="text-slate-600 text-base md:text-lg leading-relaxed">
        Sử dụng hệ thống máy in cao cấp <strong>Bambu Lab A1 Combo</strong> với công nghệ đa màu sắc nét.
        Tải file <code class="bg-slate-100 px-1.5 py-0.5 rounded text-blue-950 font-mono text-sm">.stl</code>,
        <code class="bg-slate-100 px-1.5 py-0.5 rounded text-blue-950 font-mono text-sm">.3mf</code>,
        <code class="bg-slate-100 px-1.5 py-0.5 rounded text-blue-950 font-mono text-sm">.obj</code>
        trực tiếp lên web để tính khối lượng và báo giá chuẩn xác trong 1 giây.
      </p>

      <div class="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
        <button
          type="button"
          onclick={() => appStore.setTab('shop')}
          class="px-8 py-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-lg hover:shadow-xl transition cursor-pointer flex items-center"
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

      <!-- Trust Badges -->
      <div class="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/80 text-left">
        <div>
          <span class="block text-2xl font-black text-blue-950">0.08mm</span>
          <span class="text-xs text-slate-500 font-medium">Độ chính xác cao</span>
        </div>
        <div>
          <span class="block text-2xl font-black text-blue-950">24/7</span>
          <span class="text-xs text-slate-500 font-medium">In liên tục giao nhanh</span>
        </div>
        <div>
          <span class="block text-2xl font-black text-blue-950">1.500đ</span>
          <span class="text-xs text-slate-500 font-medium">Giá rẻ minh bạch / gam</span>
        </div>
      </div>
    </div>

    <!-- Bambu Lab Machine Graphic -->
    <div class="relative w-full lg:w-1/2 flex justify-center">
      <div class="relative w-72 h-72 md:w-96 md:h-96 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-slate-100 group">
        <img
          src="https://images.unsplash.com/photo-1615655406736-b37c4fabf923?w=800&auto=format&fit=crop&q=80"
          alt="Bambu Lab A1 Combo 3D Printer"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div class="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-white/50 shadow-md flex items-center justify-between">
          <div>
            <p class="text-xs font-bold text-blue-950">Bambu Lab A1 Combo</p>
            <p class="text-[10px] text-slate-500 font-medium">In 4 màu - Tốc độ 500mm/s</p>
          </div>
          <span class="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse"></span>
        </div>
      </div>
    </div>
  </section>

  <!-- Featured Products -->
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

  <!-- Value Propositions Banner -->
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
</div>
