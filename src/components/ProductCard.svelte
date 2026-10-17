<script lang="ts">
  import type { Product } from '../models/types';
  import { appStore } from '../stores/store.svelte';
  import { themeStore } from '../stores/themeStore.svelte';
  import { formatCurrency, getEffectivePrice, getProductDiscountDetails } from '../services/pricingService';
  interface Props {
    product: Product;
    showQuickAdd?: boolean;
  }

  let { product, showQuickAdd = true }: Props = $props();
  let effectivePrice = $derived(getEffectivePrice(product));
  let discountInfo = $derived(getProductDiscountDetails(product));
  let isAdding = $state(false);
</script>

<div
  role="button"
  tabindex="0"
  onclick={() => appStore.viewProductDetail(product)}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      appStore.viewProductDetail(product);
    }
  }}
  class="glass-panel group rounded-2xl overflow-hidden border border-slate-200 flex flex-col justify-between bg-white shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-900"
>
  <div class="relative overflow-hidden bg-slate-100 aspect-square">
    <img
      src={product.image}
      alt={product.name}
      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      loading="lazy"
    />
    
    <!-- Badges -->
    <div class="absolute top-3 left-3 flex flex-col items-start gap-1.5">
      <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-white/90 text-blue-900 shadow-sm backdrop-blur-xs w-fit">
        {product.category}
      </span>
      {#if discountInfo.hasDiscount}
        <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white shadow-sm w-fit self-start">
          -{discountInfo.discountPercent}%
        </span>
      {/if}
    </div>

    {#if product.brand}
      <div class="absolute bottom-2.5 right-2.5">
        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/70 text-white backdrop-blur-xs">
          {product.brand}
        </span>
      </div>
    {/if}
  </div>

  <div class="p-4 flex flex-col flex-grow justify-between space-y-3">
    <div class="space-y-1">
      <h3 class="font-bold text-blue-950 text-sm line-clamp-2 group-hover:text-blue-900 transition leading-snug">
        {product.name}
      </h3>
      <p class="text-xs text-slate-500 line-clamp-2">
        {product.description}
      </p>
    </div>

    <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
      <div>
        <div class="flex items-center gap-1.5">
          <span class="text-blue-900 font-black text-base">{formatCurrency(effectivePrice)}</span>
        </div>
        {#if discountInfo.hasDiscount && discountInfo.originalPrice}
          <span class="text-[11px] text-slate-400 line-through block font-medium">
            {formatCurrency(discountInfo.originalPrice)}
          </span>
        {/if}
      </div>

      {#if showQuickAdd}
        {@const hasVariants = Boolean(product.variantGroups && product.variantGroups.length > 0)}
        <button
          type="button"
          disabled={isAdding}
          onclick={(e) => {
            e.stopPropagation();
            if (isAdding) return;
            if (hasVariants) {
              appStore.openProductDetail(product);
              return;
            }
            isAdding = true;
            appStore.addToCart(product);
            setTimeout(() => {
              isAdding = false;
            }, 300);
          }}
          class="px-3 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer {isAdding ? 'scale-95' : ''}"
          title={hasVariants ? 'Chọn phân loại sản phẩm trước khi mua' : 'Thêm vào giỏ'}
        >
          {#if isAdding}
            <i class="fa-solid fa-check text-xs"></i>
            <span>Đã thêm</span>
          {:else if hasVariants}
            <i class="fa-solid fa-shapes text-xs"></i>
            <span>Tùy chọn</span>
          {:else}
            <i class="fa-solid fa-cart-plus"></i>
            <span>{themeStore.theme.productGridStyle?.buyButtonText || 'Thêm'}</span>
          {/if}
        </button>
      {/if}
    </div>
  </div>
</div>
