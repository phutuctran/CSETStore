<script lang="ts">
  import { appStore } from '../stores/store.svelte';
  import { formatCurrency } from '../services/pricingService';

  let product = $derived(appStore.selectedProduct);
  let quantity = $state<number>(1);

  $effect(() => {
    // Reset quantity to 1 whenever a new product modal opens
    if (appStore.isProductModalOpen) {
      quantity = 1;
    }
  });

  function handleAddToCart() {
    if (product) {
      appStore.addToCart(product, quantity);
      appStore.closeProductDetail();
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

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <!-- Image Preview -->
        <div class="h-80 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            class="w-full h-full object-cover"
          />
        </div>

        <!-- Details -->
        <div class="space-y-6">
          <div>
            <span class="px-3 py-1 bg-blue-50 text-blue-900 text-xs font-bold rounded-lg uppercase tracking-wider inline-block">
              {product.category}
            </span>
            <h3 class="text-2xl font-black text-blue-950 mt-2">
              {product.name}
            </h3>
            <p class="text-3xl font-black text-blue-900 mt-2">
              {formatCurrency(product.price)}
            </p>
          </div>

          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span class="text-xs font-bold text-slate-500 uppercase block tracking-wider">
              Thông tin chi tiết in 3D:
            </span>
            <p class="text-slate-600 text-sm leading-relaxed">
              {product.description}
            </p>

            <div class="pt-2 grid grid-cols-2 gap-3 text-xs border-t border-slate-200 mt-2">
              {#if product.grams}
                <div class="text-slate-600">
                  <span class="font-bold text-blue-950">Khối lượng:</span> ~{product.grams}g
                </div>
              {/if}
              {#if product.printHours}
                <div class="text-slate-600">
                  <span class="font-bold text-blue-950">Thời gian in:</span> ~{product.printHours} giờ
                </div>
              {/if}
            </div>
          </div>

          <!-- Quantity Selector -->
          <div class="flex items-center space-x-4">
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

          <!-- Actions -->
          <div class="flex gap-4">
            <button
              type="button"
              onclick={handleAddToCart}
              class="flex-grow py-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-lg cursor-pointer transition flex items-center justify-center gap-2"
            >
              <i class="fa-solid fa-cart-plus"></i>
              <span>Thêm Vào Giỏ Hàng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
