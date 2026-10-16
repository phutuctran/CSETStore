<script lang="ts">
  import { appStore } from '../stores/store.svelte';
  import { themeStore } from '../stores/themeStore.svelte';
</script>

<div class="space-y-8 max-w-4xl mx-auto py-4 animate-in fade-in duration-300">
  <!-- Breadcrumb -->
  <nav class="flex items-center space-x-2 text-xs text-slate-500 font-medium">
    <button type="button" onclick={() => appStore.setTab('home')} class="hover:text-blue-900 cursor-pointer">Trang Chủ</button>
    <span>/</span>
    <span class="text-blue-900 font-semibold">Đặt Hàng Theo Yêu Cầu</span>
  </nav>

  <!-- Main Card -->
  <div class="glass-panel p-8 sm:p-12 md:p-16 rounded-3xl border border-slate-200 bg-white text-center space-y-6 shadow-sm">
    <div class="relative w-24 h-24 mx-auto">
      <div class="w-24 h-24 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 text-4xl shadow-xs">
        <i class="fa-solid fa-wand-magic-sparkles"></i>
      </div>
      <span class="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm shadow animate-bounce">
        <i class="fa-solid fa-wrench"></i>
      </span>
    </div>

    <div class="space-y-3 max-w-xl mx-auto">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider">
        <i class="fa-solid fa-clock-rotate-left"></i>
        <span>Tính Năng Đang Phát Triển</span>
      </div>

      <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-blue-950">
        Dịch Vụ Đặt Hàng Theo Yêu Cầu
      </h1>

      <p class="text-slate-600 text-sm sm:text-base leading-relaxed">
        Hệ thống tiếp nhận và xử lý đơn đặt hàng theo thông số, thiết kế và yêu cầu riêng biệt đang được đội ngũ kỹ thuật CSET Store hoàn thiện và sẽ sớm ra mắt trong thời gian tới!
      </p>
    </div>

    <!-- Feature Preview Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-2xl mx-auto text-left">
      <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
        <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center text-sm font-bold">
          <i class="fa-solid fa-ruler-combined"></i>
        </div>
        <h4 class="text-xs font-bold text-slate-800">Tùy Biến Đa Dạng</h4>
        <p class="text-[11px] text-slate-500 leading-relaxed">Đặt hàng theo kích thước, màu sắc và thông số riêng của bạn.</p>
      </div>

      <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
        <div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center text-sm font-bold">
          <i class="fa-solid fa-calculator"></i>
        </div>
        <h4 class="text-xs font-bold text-slate-800">Báo Giá Tự Động</h4>
        <p class="text-[11px] text-slate-500 leading-relaxed">Ước tính chi phí vật liệu và thời gian hoàn thiện rõ ràng, minh bạch.</p>
      </div>

      <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
        <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center text-sm font-bold">
          <i class="fa-solid fa-headset"></i>
        </div>
        <h4 class="text-xs font-bold text-slate-800">Hỗ Trợ 1-1</h4>
        <p class="text-[11px] text-slate-500 leading-relaxed">Đội ngũ chuyên viên tư vấn chi tiết từ khâu ý tưởng đến khi nhận hàng.</p>
      </div>
    </div>

    <!-- Support Notice -->
    {#if themeStore.theme.hotline || themeStore.theme.contactEmail}
      <div class="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 max-w-xl mx-auto text-xs text-slate-600 space-y-1">
        <p class="font-semibold text-blue-950">Cần tư vấn đặt hàng số lượng lớn ngay hôm nay?</p>
        <div class="flex flex-wrap items-center justify-center gap-4 text-[11px] text-blue-900 pt-1 font-bold">
          {#if themeStore.theme.hotline}
            <span><i class="fa-solid fa-phone mr-1"></i>Hotline: {themeStore.theme.hotline}</span>
          {/if}
          {#if themeStore.theme.contactEmail}
            <span><i class="fa-solid fa-envelope mr-1"></i>Email: {themeStore.theme.contactEmail}</span>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Return to shop button -->
    <div class="pt-2">
      <button
        type="button"
        onclick={() => appStore.setTab('shop')}
        class="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition shadow-md cursor-pointer"
      >
        <i class="fa-solid fa-bag-shopping"></i>
        <span>Khám Phá Các Sản Phẩm Sẵn Có</span>
      </button>
    </div>
  </div>
</div>
