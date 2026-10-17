<script lang="ts">
  import { appStore } from '../../stores/store.svelte';
import { formatCurrency, getEffectivePrice, getProductDiscountDetails, getProductMaxPurchaseLimit, getProductEffectiveStock } from '../../services/pricingService';
import { themeStore } from '../../stores/themeStore.svelte';
  import { LocalStorageReviewRepository } from '../../repositories';
  import { fetchProductDetailApi } from '../../services/productService';
  import { routerService } from '../../services/routerService';
  import { authService } from '../../services/authService';
  import type { Product, ProductReview } from '../../models/types';

  const reviewRepo = new LocalStorageReviewRepository();

  let product = $state<Product | null>(null);
  let isLoading = $state<boolean>(true);
  let loadError = $state<string | null>(null);
  let currentLoadedId = $state<number | null>(null);

  let reviews = $state<ProductReview[]>([]);
  let quantity = $state<number>(1);
  let selectedImage = $state<string>('');
  let selectedVariants = $state<Record<string, string>>({});
  let missingVariantError = $state<string | null>(null);
  let isFavorite = $state<boolean>(false);
  let isAdding = $state(false);
  let purchaseLimit = $derived(product ? getProductMaxPurchaseLimit(product, themeStore.theme.defaultMaxPurchaseLimit) : undefined);
  let maxAllowedQty = $derived(purchaseLimit && purchaseLimit > 0 ? purchaseLimit : (product?.stock ?? 999));

  let currentAdminUser = $derived(authService.getAdminSession());
  let isCustomerAdmin = $derived(
    Boolean(
      appStore.currentCustomer &&
      appStore.currentCustomer.role !== 'customer' &&
      (appStore.currentCustomer.role === 'super_admin' ||
       appStore.currentCustomer.role === 'sales_admin' ||
       appStore.currentCustomer.role === 'inventory_admin')
    )
  );
  let isAdminViewer = $derived(Boolean(currentAdminUser || isCustomerAdmin));
  let visibleReviews = $derived(
    reviews.filter(r => isAdminViewer ? true : !r.hidden)
  );

  let effectivePrice = $derived(product ? getEffectivePrice(product, selectedVariants) : 0);
  let effectiveStock = $derived(product ? getProductEffectiveStock(product, selectedVariants) : 50);
  let isOutOfStock = $derived(effectiveStock <= 0);
  let discountInfo = $derived(product ? getProductDiscountDetails(product) : { hasDiscount: false, discountPercent: 0 });

  async function fetchProduct(id: number) {
    isLoading = true;
    loadError = null;
    try {
      const data = await fetchProductDetailApi(id);
      if (data) {
        product = data;
        appStore.selectedProduct = data;
        currentLoadedId = id;
        selectedImage = data.image;
        quantity = 1;
        reviews = reviewRepo.getByProductId(data.id, isAdminViewer);
        if (typeof window !== 'undefined' && typeof fetch === 'function') {
          fetch(`/api/reviews?productId=${data.id}&all=1`)
            .then(r => r.ok ? r.json() : null)
            .then(res => {
              if (res?.success && Array.isArray(res.data)) {
                const all = reviewRepo.getAll().filter((r: ProductReview) => r.productId !== data.id);
                localStorage.setItem('cset_reviews_v5', JSON.stringify([...res.data, ...all]));
                reviews = (res.data as ProductReview[]).filter((r: ProductReview) => isAdminViewer ? true : !r.hidden);
              }
            })
            .catch(() => {});
        }
        const initialVariants: Record<string, string> = {};
        if (data.variantGroups && data.variantGroups.length > 0) {
          for (const vg of data.variantGroups) {
            if (vg.options && vg.options.length > 0) {
              initialVariants[vg.name] = vg.options[0];
            }
          }
        }
        selectedVariants = initialVariants;
      } else {
        product = null;
        loadError = 'Không tìm thấy thông tin sản phẩm.';
      }
    } catch {
      product = null;
      loadError = 'Không thể tải dữ liệu sản phẩm từ máy chủ.';
    } finally {
      isLoading = false;
    }
  }

  $effect(() => {
    function handleRouteUpdate() {
      const route = routerService.parseHash();
      if (route.path === '/product' && route.param) {
        const id = parseInt(route.param, 10);
        if (!isNaN(id) && id !== currentLoadedId) {
          fetchProduct(id);
        }
      }
    }
    handleRouteUpdate();
    window.addEventListener('hashchange', handleRouteUpdate);
    return () => window.removeEventListener('hashchange', handleRouteUpdate);
  });

  function selectVariant(groupName: string, option: string) {
    selectedVariants[groupName] = option;
    missingVariantError = null;
  }

  function validateVariants(): boolean {
    if (!product) return false;
    if (product.variantGroups && product.variantGroups.length > 0) {
      for (const vg of product.variantGroups) {
        if (!selectedVariants[vg.name]) {
          missingVariantError = vg.name;
          appStore.showToast(`Vui lòng chọn phân loại "${vg.name}" trước khi mua!`);
          return false;
        }
      }
    }
    missingVariantError = null;
    return true;
  }

  function handleAddToCart() {
    if (isAdding) return;
    if (product && validateVariants()) {
      isAdding = true;
      appStore.addToCart(product, quantity, { ...selectedVariants });
      setTimeout(() => { isAdding = false; }, 300);
    }
  }

  function handleBuyNow() {
    if (isAdding) return;
    if (product && validateVariants()) {
      isAdding = true;
      appStore.addToCart(product, quantity, { ...selectedVariants });
      appStore.openCart();
      setTimeout(() => { isAdding = false; }, 400);
    }
  }
</script>

{#if isLoading}
  <!-- Mobile Loading Skeleton -->
  <div class="space-y-4 pb-20 animate-pulse bg-white min-h-screen">
    <div class="w-full aspect-square bg-slate-200"></div>
    <div class="p-4 space-y-3">
      <div class="h-6 w-3/4 bg-slate-200 rounded-lg"></div>
      <div class="h-4 w-1/2 bg-slate-200 rounded-md"></div>
      <div class="h-10 w-full bg-slate-200 rounded-2xl"></div>
    </div>
  </div>
{:else if product}
  <div class="pb-28 bg-slate-50 min-h-screen animate-in fade-in duration-200">
    <!-- Top Hero Image Area with Floating Controls (Matching Screen 2 in Image #1) -->
    <div class="relative w-full aspect-square max-h-[380px] bg-slate-900 overflow-hidden">
      <img
        src={selectedImage || product.image}
        alt={product.name}
        class="w-full h-full object-cover transition-all duration-300"
      />

      <!-- Floating Top Bar Buttons (Back & Favorite) -->
      <div class="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
        <button
          type="button"
          onclick={() => window.history.back()}
          class="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-slate-800 flex items-center justify-center text-sm shadow-md hover:bg-white active:scale-95 transition cursor-pointer"
          aria-label="Quay lại"
        >
          <i class="fa-solid fa-chevron-left"></i>
        </button>

        <button
          type="button"
          onclick={() => {
            isFavorite = !isFavorite;
            appStore.showToast(isFavorite ? 'Đã lưu vào danh sách yêu thích!' : 'Đã bỏ yêu thích!');
          }}
          class="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-sm shadow-md active:scale-95 transition cursor-pointer {isFavorite ? 'text-rose-600' : 'text-slate-600 hover:text-rose-600'}"
          aria-label="Yêu thích"
        >
          <i class="fa-solid fa-heart {isFavorite ? 'animate-bounce' : ''}"></i>
        </button>
      </div>

      <!-- Multiple images thumbnail indicators -->
      {#if product.images && product.images.length > 1}
        <div class="absolute bottom-10 left-0 right-0 flex justify-center gap-1.5 z-20">
          {#each product.images as img, i}
            <button
              type="button"
              onclick={() => selectedImage = img}
              class="w-2 h-2 rounded-full transition-all {selectedImage === img ? 'w-5 bg-white' : 'bg-white/60'}"
              aria-label="Ảnh {i + 1}"
            ></button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Slide-Up Card Sheet with Rounded Top Corners (Matching Screen 2 in Image #1) -->
    <div class="rounded-t-3xl -mt-6 relative z-10 bg-white p-5 space-y-5 shadow-xl border-t border-slate-100">
      <!-- Title & Basic Info -->
      <div class="space-y-2">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-100">
            {product.category}
          </span>
          {#if discountInfo.hasDiscount}
            <span class="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-600 text-white shadow-xs">
              GIẢM {discountInfo.discountPercent}%
            </span>
          {/if}
          {#if product.brand}
            <span class="text-xs text-slate-500 font-semibold">
              Hãng: <strong class="text-slate-800">{product.brand}</strong>
            </span>
          {/if}
        </div>

        <h1 class="text-lg sm:text-xl font-black text-blue-950 leading-snug">
          {product.name}
        </h1>

        <!-- Rating, Delivery & Warranty Info Row -->
        <div class="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
          <span class="flex items-center gap-1 text-amber-500 font-bold">
            <i class="fa-solid fa-star"></i> {product.rating ?? 4.9}
          </span>
          <span>•</span>
          <span>{visibleReviews.length} đánh giá</span>
          <span>•</span>
          {#if isOutOfStock}
            <span class="text-rose-600 font-bold">
              <i class="fa-solid fa-circle-xmark"></i> Hết hàng
            </span>
          {:else}
            <span class="text-emerald-700 font-bold">
              <i class="fa-solid fa-circle-check"></i> Còn hàng ({effectiveStock})
            </span>
          {/if}
        </div>
      </div>

      <!-- Quantity Selector Row -->
      <div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 gap-2 flex-wrap">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-700 uppercase">Chọn số lượng:</span>
          {#if purchaseLimit && purchaseLimit > 0}
            <span class="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
              <i class="fa-solid fa-circle-exclamation text-amber-600"></i>
              <span>Tối đa {purchaseLimit}</span>
            </span>
          {/if}
        </div>
        <div class="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
          <button
            type="button"
            onclick={() => quantity = Math.max(1, quantity - 1)}
            class="px-3 py-1.5 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            aria-label="Giảm"
          >
            <i class="fa-solid fa-minus text-xs"></i>
          </button>
          <span class="px-4 py-1.5 font-bold text-xs text-blue-950 min-w-8 text-center">{quantity}</span>
          <button
            type="button"
            disabled={quantity >= maxAllowedQty}
            onclick={() => {
              if (quantity < maxAllowedQty) {
                quantity += 1;
              } else {
                appStore.showToast(`Đã đạt giới hạn mua tối đa (${purchaseLimit} sản phẩm) cho sản phẩm này!`);
              }
            }}
            class="px-3 py-1.5 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition cursor-pointer"
            aria-label="Tăng"
          >
            <i class="fa-solid fa-plus text-xs"></i>
          </button>
        </div>
      </div>

      <!-- Product Variants Selection (Choice of Add-on in Image #1) -->
      {#if product.variantGroups && product.variantGroups.length > 0}
        <div class="space-y-4 pt-1 border-t border-slate-100">
          <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <i class="fa-solid fa-shapes text-blue-900"></i>
            Tùy Chọn Phân Loại *
          </h4>

          {#if missingVariantError}
            <div class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              Vui lòng chọn <strong>"{missingVariantError}"</strong>
            </div>
          {/if}

          {#each product.variantGroups as vg}
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs">
                <span class="font-bold text-slate-700">{vg.name}:</span>
                <span class="font-bold text-blue-900">{selectedVariants[vg.name] || 'Chưa chọn'}</span>
              </div>
              <div class="flex flex-wrap gap-2">
                {#each vg.options as opt}
                  {@const isSelected = selectedVariants[vg.name] === opt}
                  <button
                    type="button"
                    onclick={() => selectVariant(vg.name, opt)}
                    class="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer {isSelected
                      ? 'bg-blue-900 text-white border-blue-900 shadow-sm font-bold'
                      : 'bg-white text-slate-700 border-slate-200'}"
                  >
                    {opt}
                  </button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Specifications Highlights (Ingredients style chips in Image #1) -->
      <div class="space-y-2 pt-1 border-t border-slate-100">
        <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider">Thông Số & Chính Sách</h4>
        <div class="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
          <div><strong>Xuất xứ:</strong> {product.origin || 'Chính hãng'}</div>
          <div><strong>Bảo hành:</strong> {product.warranty || '12 tháng'}</div>
          {#if product.condition}
            <div><strong>Tình trạng:</strong> {product.condition}</div>
          {/if}
          {#if product.weight}
            <div><strong>Khối lượng:</strong> {product.weight}</div>
          {/if}
        </div>
      </div>

      <!-- Description -->
      <div class="space-y-1.5 pt-1 border-t border-slate-100">
        <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider">Mô Tả Sản Phẩm</h4>
        <p class="text-xs text-slate-600 leading-relaxed bg-white">
          {product.description}
        </p>
      </div>

      <!-- Customer Reviews Preview -->
      <div class="space-y-3 pt-2 border-t border-slate-100">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <i class="fa-solid fa-comments text-blue-900"></i>
            Đánh Giá ({visibleReviews.length})
          </h4>
          <span class="text-xs font-bold text-amber-500">★ {product.rating ?? 4.9}</span>
        </div>

        {#if visibleReviews.length === 0}
          <p class="text-xs text-slate-400 italic">Chưa có đánh giá nào cho sản phẩm này.</p>
        {:else}
          {#each visibleReviews.slice(0, 3) as rev}
            <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-900">{rev.userName}</span>
                <span class="text-amber-400">
                  {#each Array(rev.rating) as _}★{/each}
                </span>
              </div>
              <p class="text-slate-600 leading-relaxed text-[11px]">{rev.comment}</p>
              {#if rev.adminReply}
                <div class="p-2 bg-blue-50 border-l-2 border-blue-900 rounded-r-lg text-[10px] text-blue-950">
                  <strong>Phản hồi từ shop:</strong> {rev.adminReply.reply}
                </div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Fixed Bottom Sticky Action Bar (Matching Screen 2 in Image #1) -->
    <div class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-4 shadow-xl">
      <div class="min-w-0">
        <span class="text-[10px] text-slate-400 font-bold uppercase block">Tổng tiền</span>
        <div class="flex items-baseline gap-1.5">
          <span class="text-lg font-black text-blue-950 truncate">
            {formatCurrency(effectivePrice * quantity)}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          disabled={isAdding || isOutOfStock}
          onclick={handleAddToCart}
          class="px-4 py-3 rounded-2xl border-2 border-blue-900 text-blue-900 font-bold text-xs hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <i class="fa-solid {isAdding ? 'fa-check' : 'fa-cart-plus'}"></i>
          <span>{isOutOfStock ? 'Hết Hàng' : (isAdding ? 'Đã Thêm' : 'Thêm Giỏ')}</span>
        </button>

        <button
          type="button"
          disabled={isAdding || isOutOfStock}
          onclick={handleBuyNow}
          class="px-6 py-3 rounded-2xl bg-blue-900 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <i class="fa-solid fa-bolt"></i>
          <span>{isOutOfStock ? 'Tạm Hết' : 'Mua Ngay'}</span>
        </button>
      </div>
    </div>
  </div>
{:else}
  <div class="p-8 text-center space-y-4">
    <h3 class="font-bold text-slate-800">{loadError || 'Không tìm thấy sản phẩm'}</h3>
    <button
      type="button"
      onclick={() => appStore.setTab('shop')}
      class="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold"
    >
      Quay lại cửa hàng
    </button>
  </div>
{/if}
