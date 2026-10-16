<script lang="ts">
  import { appStore } from '../stores/store.svelte';
  import { calculateCustomQuote, formatCurrency } from '../services/pricingService';

  let selectedFileName = $state<string>('');
  let fileSizeBytes = $state<number>(180 * 1024); // default ~180KB demo
  let infillPercent = $state<number>(20);
  let fileInputElement: HTMLInputElement | null = $state(null);
  let isDragging = $state(false);

  // Derived calculation based on pricing service
  let quote = $derived(calculateCustomQuote(fileSizeBytes, infillPercent));

  function onFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      processFile(target.files[0]);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }

  function processFile(file: File) {
    selectedFileName = file.name;
    fileSizeBytes = file.size;
    appStore.showToast(`Đã nhận file "${file.name}" (${(file.size / 1024).toFixed(0)} KB)!`);
  }

  function handleAddToCart() {
    appStore.addCustomOrderToCart({
      fileName: selectedFileName || 'MoHinhIn3D.stl',
      grams: quote.grams,
      hours: quote.hours,
      price: quote.price,
      infill: infillPercent
    });
  }
</script>

<div class="space-y-8 max-w-4xl mx-auto">
  <div class="text-center space-y-3">
    <div class="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider">
      <i class="fa-solid fa-calculator"></i>
      <span>Báo Giá Tự Động Minh Bạch</span>
    </div>
    <h2 class="text-3xl md:text-4xl font-black text-blue-950">
      Báo Giá & Đặt In 3D Theo Yêu Cầu
    </h2>
    <p class="text-slate-600 text-sm md:text-base max-w-2xl mx-auto">
      Tải lên file <code class="text-blue-900 font-mono font-bold">.stl</code>,
      <code class="text-blue-900 font-mono font-bold">.3mf</code>,
      <code class="text-blue-900 font-mono font-bold">.obj</code>,
      <code class="text-blue-900 font-mono font-bold">.step</code> để hệ thống tự động phân tích khối lượng nhựa,
      thời gian và tính giá chuẩn 1.500đ / gam.
    </p>
  </div>

  <div class="glass-panel p-8 rounded-3xl border border-slate-200 space-y-8 bg-white shadow-sm">
    <!-- File Dropzone -->
    <div
      role="button"
      tabindex="0"
      onclick={() => fileInputElement?.click()}
      onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInputElement?.click();
        }
      }}
      ondragover={(e) => { e.preventDefault(); isDragging = true; }}
      ondragleave={() => isDragging = false}
      ondrop={handleDrop}
      class="border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 {isDragging
        ? 'border-blue-900 bg-blue-50/70 scale-[0.99]'
        : 'border-slate-300 hover:border-blue-900 bg-slate-50 hover:bg-slate-100/60'}"
    >
      <input
        type="file"
        bind:this={fileInputElement}
        accept=".stl,.3mf,.obj,.step"
        onchange={onFileChange}
        class="hidden"
      />
      <div class="space-y-4 max-w-md mx-auto">
        <div class="w-20 h-20 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-xs">
          <i class="fa-solid fa-cloud-arrow-up"></i>
        </div>
        <div>
          {#if selectedFileName}
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-1">
              <i class="fa-solid fa-file-circle-check"></i>
              <span>File đã sẵn sàng</span>
            </div>
            <p class="text-blue-950 font-bold text-lg break-all">{selectedFileName}</p>
            <p class="text-xs text-slate-500 mt-1">Dung lượng: {(fileSizeBytes / 1024).toFixed(1)} KB (Bấm để đổi file)</p>
          {:else}
            <p class="text-blue-950 font-bold text-lg">Bấm hoặc kéo thả file 3D vào đây</p>
            <p class="text-xs text-slate-400 mt-1">Hỗ trợ định dạng: .STL, .3MF, .OBJ, .STEP (Tối đa 50MB)</p>
          {/if}
        </div>
      </div>
    </div>

    <!-- Calculated Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-1">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
          <i class="fa-solid fa-weight-hanging text-blue-900"></i>
          Khối Lượng Nhựa Cần In
        </span>
        <span class="text-3xl font-black text-blue-950 block">{quote.grams} gam</span>
        <p class="text-[11px] text-slate-500">Đã bao gồm nhựa viền brim và chân đế hỗ trợ</p>
      </div>

      <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-1">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
          <i class="fa-solid fa-clock text-blue-900"></i>
          Thời Gian In Dự Kiến
        </span>
        <span class="text-3xl font-black text-blue-950 block">{quote.hours} giờ</span>
        <p class="text-[11px] text-slate-500">Tốc độ in cao cấp trên máy Bambu Lab A1</p>
      </div>
    </div>

    <!-- Configuration Options -->
    <div class="space-y-4">
      <div class="space-y-2">
        <label for="infill-select" class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Mật Độ Rỗng (Infill %)
        </label>
        <select
          id="infill-select"
          bind:value={infillPercent}
          class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-blue-950 font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
        >
          <option value={15}>15% (Tiêu chuẩn nhẹ - Mô hình trưng bày, tượng)</option>
          <option value={20}>20% (Khuyên dùng - Cân bằng tốt nhất giữa độ bền & chi phí)</option>
          <option value={40}>40% (Độ chắc chắn cao - Dụng cụ, gá kẹp, giá đỡ)</option>
          <option value={100}>100% (Đặc hoàn toàn - Chi tiết máy chịu lực cực đại)</option>
        </select>
      </div>
    </div>

    <!-- Price & Add to Cart -->
    <div class="p-6 md:p-8 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div class="text-center sm:text-left">
        <span class="text-xs font-bold text-blue-800 uppercase tracking-wider block">
          Đơn giá chuẩn: 1.500 VNĐ / gam
        </span>
        <span class="text-3xl md:text-4xl font-black text-blue-950 mt-1 block">
          {formatCurrency(quote.price)}
        </span>
      </div>

      <button
        type="button"
        onclick={handleAddToCart}
        class="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-lg hover:shadow-xl cursor-pointer transition flex items-center justify-center gap-2 shrink-0"
      >
        <i class="fa-solid fa-cart-plus text-base"></i>
        <span>Thêm Vào Giỏ Hàng</span>
      </button>
    </div>
  </div>
</div>
