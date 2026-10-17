<script lang="ts">
  import { appStore } from '../stores/store.svelte';
  import { formatCurrency, getEffectivePrice, getProductDiscountDetails } from '../services/pricingService';

  let product = $derived(appStore.selectedProduct);
  let quantity = $state<number>(1);
  let selectedImage = $state<string>('');
  let selectedVariants = $state<Record<string, string>>({});
  let isAdding = $state(false);
  let effectivePrice = $derived(product ? getEffectivePrice(product) : 0);
  let discountInfo = $derived(product ? getProductDiscountDetails(product) : { hasDiscount: false, discountPercent: 0 });

  $effect(() => {
    if (appStore.isProductModalOpen && product) {
      quantity = 1;
      selectedImage = product.image;
      // Initialize default selected variants (first option of each group)
      const initialVariants: Record<string, string> = {};
      if (product.variantGroups && product.variantGroups.length > 0) {
        for (const vg of product.variantGroups) {
          if (vg.options && vg.options.length > 0) {
            initialVariants[vg.name] = vg.options[0];
          }
        }
      }
      selectedVariants = initialVariants;
    }
  });

  function handleAddToCart() {
    if (isAdding) return;
    if (product) {
      isAdding = true;
      appStore.addToCart(product, quantity, { ...selectedVariants });
      setTimeout(() => {
        isAdding = false;
        appStore.closeProductDetail();
      }, 250);
    }
  }
</script>

{#if appStore.isProductModalOpen && product}
  <div
    class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
  >
    <button
      type="button"
      class="fixed inset-0 bg-transparent w-full h-full border-none cursor-default"
      onclick={() => appStore.closeProductDetail()}
      aria-label="Đóng popup chi tiết"
    ></button>

    <div
      class="glass-panel w-full max-w-3xl rounded-3xl border border-slate-200 p-6 md:p-8 relative bg-white shadow-2xl z-10 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
    >
      <button
        type="button"
        onclick={() => appStore.closeProductDetail()}
        class="absolute top-6 right-6 text-slate-400 hover:text-blue-950 text-2xl cursor-pointer w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition"
        aria-label="Đóng"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <!-- Image Gallery Preview -->
        <div class="space-y-3">
          <div class="h-80 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center relative">
            <img
              src={selectedImage || product.image}
              alt={product.name}
              class="w-full h-full object-cover transition-all duration-300"
            />
            {#if discountInfo.hasDiscount}
              <span class="absolute top-3 left-3 px-3 py-1 rounded-lg text-xs font-black bg-rose-600 text-white shadow-md">
                GIẢM {discountInfo.discountPercent}%
              </span>
            {/if}
          </div>

          <!-- Thumbnails list if multiple images exist -->
          {#if product.images && product.images.length > 1}
            <div class="flex gap-2 overflow-x-auto p-1">
              {#each product.images as img}
                <button
                  type="button"
                  onclick={() => selectedImage = img}
                  class="w-14 h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition shrink-0 {(selectedImage === img || (!selectedImage && img === product.image)) ? 'border-blue-900 ring-2 ring-blue-200' : 'border-slate-200 hover:border-slate-400'}"
                >
                  <img src={img} alt="Thumbnail" class="w-full h-full object-cover" />
                </button>
              {/each}
            </div>
          {/if}
        </div>
        <!-- Details -->
        <div class="space-y-5">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="px-2.5 py-1 bg-blue-50 text-blue-900 text-xs font-bold rounded-lg uppercase tracking-wider inline-block">
                {product.category}
              </span>
              {#if product.subCategory}
                <span class="px-2.5 py-1 bg-purple-50 text-purple-900 text-xs font-semibold rounded-lg">
                  Loại: <strong>{product.subCategory}</strong>
                </span>
              {/if}
              {#if product.brand}
                <span class="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                  Thương hiệu: <strong>{product.brand}</strong>
                </span>
              {/if}
              {#if product.sku}
                <span class="px-2 py-0.5 bg-slate-100 text-slate-500 font-mono text-[11px] rounded">
                  SKU: {product.sku}
                </span>
              {/if}
            </div>

            <h3 class="text-2xl font-black text-blue-950 mt-2.5 leading-snug">
              {product.name}
            </h3>

            <div class="flex items-baseline gap-3 mt-2">
              <p class="text-3xl font-black text-blue-900">
                {formatCurrency(effectivePrice)}
              </p>
              {#if discountInfo.hasDiscount && discountInfo.originalPrice}
                <span class="text-sm text-slate-400 line-through font-semibold">
                  {formatCurrency(discountInfo.originalPrice)}
                </span>
              {/if}
            </div>
          </div>
          <!-- Variant Selector (Phân loại sản phẩm: Màu sắc, Size, ...) -->
          {#if product.variantGroups && product.variantGroups.length > 0}
            <div class="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-3.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-blue-950 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <i class="fa-solid fa-shapes text-blue-900"></i>
                  Tùy Chọn Phân Loại *
                </span>
                <span class="text-[11px] font-semibold text-blue-800 bg-white px-2 py-0.5 rounded-full border border-blue-100">
                  Vui lòng chọn trước khi thêm
                </span>
              </div>
              {#each product.variantGroups as vg}
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-slate-700">{vg.name}:</span>
                    <span class="font-semibold text-blue-900 bg-white px-2.5 py-0.5 rounded-lg border border-blue-100">{selectedVariants[vg.name] || 'Chưa chọn'}</span>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    {#each vg.options as opt}
                      {@const isSelected = selectedVariants[vg.name] === opt}
                      <button
                        type="button"
                        onclick={() => { selectedVariants[vg.name] = opt; }}
                        class="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer {isSelected
                          ? 'bg-blue-900 text-white border-blue-900 shadow-sm font-bold scale-[1.02]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}"
                      >
                        {opt}
                      </button>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Quantity Selector & Add to Cart -->
          <div class="space-y-3 pt-1 border-t border-slate-200">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-600 uppercase">Số lượng:</span>
              <div class="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onclick={() => quantity = Math.max(1, quantity - 1)}
                  class="px-3 py-1.5 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  aria-label="Giảm số lượng"
                >
                  <i class="fa-solid fa-minus text-xs"></i>
                </button>
                <span class="px-4 py-1.5 font-bold text-sm text-blue-950 min-w-10 text-center">{quantity}</span>
                <button
                  type="button"
                  onclick={() => quantity += 1}
                  class="px-3 py-1.5 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  aria-label="Tăng số lượng"
                >
                  <i class="fa-solid fa-plus text-xs"></i>
                </button>
              </div>
            </div>

            <!-- Action Button -->
            <div class="pt-1">
              <button
                type="button"
                disabled={isAdding}
                onclick={handleAddToCart}
                class="w-full py-4 rounded-xl bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white font-bold shadow-lg cursor-pointer transition flex items-center justify-center gap-2"
              >
                <i class="fa-solid {isAdding ? 'fa-check' : 'fa-cart-plus'}"></i>
                <span>{isAdding ? 'Đang Thêm...' : 'Thêm Vào Giỏ Hàng'}</span>
              </button>
            </div>
          </div>

          <!-- Description & Specifications Accordion / Block -->
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span class="text-xs font-bold text-slate-500 uppercase block tracking-wider">
              Mô tả chi tiết sản phẩm:
            </span>
            <p class="text-slate-600 text-sm leading-relaxed">
              {product.description}
            </p>

            <div class="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs border-t border-slate-200 text-slate-600">
              <div><strong>Xuất xứ:</strong> {product.origin || 'Chính hãng'}</div>
              <div><strong>Bảo hành:</strong> {product.warranty || '12 tháng'}</div>
              {#if product.condition}
                <div><strong>Tình trạng:</strong> {product.condition}</div>
              {/if}
              {#if product.weight}
                <div><strong>Khối lượng:</strong> {product.weight}</div>
              {/if}
              <div><strong>Tồn kho:</strong> {product.stock ?? 50} sản phẩm</div>
              <div><strong>Đánh giá:</strong> ⭐ {product.rating ?? 4.9} / 5.0</div>
            </div>

            {#if product.specifications && product.specifications.length > 0}
              <div class="pt-2 border-t border-slate-200 space-y-1.5">
                <span class="text-[11px] font-bold text-slate-700 uppercase block">Thông số kỹ thuật:</span>
                <div class="space-y-1 text-xs">
                  {#each product.specifications as spec}
                    <div class="flex justify-between py-0.5 border-b border-slate-100 last:border-none">
                      <span class="text-slate-500">{spec.name}:</span>
                      <span class="font-medium text-slate-800">{spec.value}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
