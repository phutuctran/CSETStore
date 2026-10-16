<script lang="ts">
  import type { Product } from '../models/types';
  import { appStore } from '../stores/store.svelte';
  import { formatCurrency } from '../services/pricingService';

  interface Props {
    product: Product;
    showQuickAdd?: boolean;
  }

  let { product, showQuickAdd = true }: Props = $props();
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
  <div class="relative overflow-hidden bg-slate-100 aspect-4/3">
    <img
      src={product.image}
      alt={product.name}
      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      loading="lazy"
    />
    <div class="absolute top-3 left-3">
      <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-white/90 text-blue-900 shadow-sm backdrop-blur-xs">
        {product.category}
      </span>
    </div>
  </div>

  <div class="p-5 flex flex-col flex-grow justify-between space-y-4">
    <div class="space-y-1">
      <h3 class="font-bold text-blue-950 text-base line-clamp-1 group-hover:text-blue-900 transition">
        {product.name}
      </h3>
      <p class="text-xs text-slate-500 line-clamp-2">
        {product.description}
      </p>
    </div>

    <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
      <div>
        <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Giá bán</span>
        <span class="text-blue-900 font-extrabold text-lg">{formatCurrency(product.price)}</span>
      </div>

      {#if showQuickAdd}
        <button
          type="button"
          onclick={(e) => {
            e.stopPropagation();
            appStore.addToCart(product);
          }}
          class="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          title="Thêm vào giỏ"
        >
          <i class="fa-solid fa-cart-plus"></i>
          <span>Thêm</span>
        </button>
      {/if}
    </div>
  </div>
</div>
