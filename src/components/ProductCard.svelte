<script lang="ts">
  import type { Product } from '../models/types';
  import { appStore } from '../stores/store.svelte';
  import { formatCurrency, calculateDiscountPercent } from '../services/pricingService';

  interface Props {
    product: Product;
    showQuickAdd?: boolean;
  }

  let { product, showQuickAdd = true }: Props = $props();
  let discount = $derived(calculateDiscountPercent(product.price, product.originalPrice));
</script>

<div
  role="button"
  tabindex="0"
  onclick={() => appStore.openProductDetail(product)}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      appStore.openProductDetail(product);
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
    <div class="absolute top-3 left-3 flex flex-col gap-1.5">
      <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-white/90 text-blue-900 shadow-sm backdrop-blur-xs">
        {product.category}
      </span>
      {#if discount > 0}
        <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white shadow-sm">
          -{discount}%
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
          <span class="text-blue-900 font-black text-base">{formatCurrency(product.price)}</span>
        </div>
        {#if product.originalPrice && product.originalPrice > product.price}
          <span class="text-[11px] text-slate-400 line-through block font-medium">
            {formatCurrency(product.originalPrice)}
          </span>
        {/if}
      </div>

      {#if showQuickAdd}
        <button
          type="button"
          onclick={(e) => {
            e.stopPropagation();
            appStore.addToCart(product);
          }}
          class="px-3 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          title="Thêm vào giỏ"
        >
          <i class="fa-solid fa-cart-plus"></i>
          <span>Thêm</span>
        </button>
      {/if}
    </div>
  </div>
</div>
