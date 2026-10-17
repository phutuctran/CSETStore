<script lang="ts">
  import { appStore } from '../stores/store.svelte';
import { formatCurrency, getEffectivePrice, getProductDiscountDetails, getProductMaxPurchaseLimit } from '../services/pricingService';
import { themeStore } from '../stores/themeStore.svelte';
  import { LocalStorageReviewRepository } from '../repositories';
  import { fetchProductDetailApi } from '../services/productService';
  import { routerService } from '../services/routerService';
  import { authService } from '../services/authService';
  import ProductCard from '../components/ProductCard.svelte';
  import type { Product, ProductReview } from '../models/types';

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
  let isAdding = $state(false);
  let purchaseLimit = $derived(product ? getProductMaxPurchaseLimit(product, themeStore.theme.defaultMaxPurchaseLimit) : undefined);
  let maxAllowedQty = $derived(purchaseLimit && purchaseLimit > 0 ? purchaseLimit : (product?.stock ?? 999));
  // Phân quyền Quản Trị Viên trên Storefront:
  // Khách hàng thông thường (role: 'customer') hoặc khách vãng lai (chưa đăng nhập) TUYỆT ĐỐI KHÔNG có quyền Admin.
  // Chỉ tài khoản đăng nhập có vai trò Quản Trị Viên (super_admin, sales_admin, inventory_admin) mới có quyền Admin.
  let isAdminViewer = $derived(
    Boolean(
      appStore.currentCustomer &&
      appStore.currentCustomer.role !== 'customer' &&
      (appStore.currentCustomer.role === 'super_admin' ||
       appStore.currentCustomer.role === 'sales_admin' ||
       appStore.currentCustomer.role === 'inventory_admin')
    )
  );
  // Khách hàng và khách vãng lai chỉ nhìn thấy các đánh giá chưa bị ẩn
  let visibleReviews = $derived(
    reviews.filter(r => isAdminViewer ? true : !r.hidden)
  );
  let storefrontReplyingId = $state<string | null>(null);
  let storefrontReplyText = $state<string>('');
  let effectivePrice = $derived(product ? getEffectivePrice(product) : 0);
  let discountInfo = $derived(product ? getProductDiscountDetails(product) : { hasDiscount: false, discountPercent: 0 });
  let relatedProducts = $derived.by(() => {
    const p = product;
    if (!p) return [];
    return appStore.products.filter(item => item.category === p.category && item.id !== p.id).slice(0, 4);
  });
  // Reviews & Permissions
  let userHasPurchased = $derived(
    product ? reviewRepo.hasPurchased(product.id, appStore.currentCustomer?.id, appStore.currentCustomer?.phone) : false
  );

  // Review Form state
  let newRating = $state<number>(5);
  let newComment = $state<string>('');
  let newReviewImages = $state<string[]>([]);
  let isSubmittingReview = $state(false);

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
    } catch (e) {
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

  function handleReviewImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];
      Array.from(input.files).forEach(file => {
        if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
          appStore.showToast(`File "${file.name}" không hợp lệ. Chỉ chấp nhận các định dạng hình ảnh!`);
          return;
        }
        if (file.size > 3 * 1024 * 1024) {
          appStore.showToast(`File ảnh "${file.name}" vượt quá giới hạn tối đa 3MB!`);
          return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
          const b64 = (evt.target?.result as string) || '';
          if (b64) newReviewImages = [...newReviewImages, b64];
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function handleSubmitReview(e: Event) {
    e.preventDefault();
    if (!product) return;
    if (!appStore.currentCustomer) {
      appStore.openAuthModal('login');
      return;
    }
    if (!userHasPurchased) {
      alert('Chỉ khách hàng đã mua sản phẩm này thành công mới có quyền gửi đánh giá!');
      return;
    }
    if (!newComment.trim()) {
      alert('Vui lòng nhập nội dung đánh giá của bạn!');
      return;
    }

    isSubmittingReview = true;
    const created = reviewRepo.create({
      productId: product.id,
      userId: appStore.currentCustomer.id,
      userName: appStore.currentCustomer.fullName,
      rating: newRating,
      comment: newComment.trim(),
      images: newReviewImages.length > 0 ? newReviewImages : undefined,
      verifiedPurchase: true
    });

    reviews = reviewRepo.getByProductId(product.id, isAdminViewer);
    newComment = '';
    newReviewImages = [];
    newRating = 5;
    isSubmittingReview = false;
    appStore.showToast('Cảm ơn bạn đã gửi đánh giá cho sản phẩm!');
  }

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

  function handleStorefrontToggleHide(rev: ProductReview) {
    if (!isAdminViewer) {
      appStore.showToast('Bạn không có quyền thực hiện thao tác quản trị này!');
      return;
    }
    reviewRepo.toggleVisibility(rev.id);
    if (product) {
      reviews = reviewRepo.getByProductId(product.id, isAdminViewer);
    }
    appStore.showToast(`Đã ${!rev.hidden ? 'ẩn' : 'hiển thị'} đánh giá của "${rev.userName}"!`);
  }

  function handleStorefrontStartReply(rev: ProductReview) {
    if (!isAdminViewer) {
      appStore.showToast('Chỉ Quản trị viên mới có quyền trả lời đánh giá!');
      return;
    }
    storefrontReplyingId = rev.id;
    storefrontReplyText = rev.adminReply ? rev.adminReply.reply : '';
  }

  function handleStorefrontSubmitReply(rev: ProductReview) {
    if (!isAdminViewer) {
      alert('Bạn không có quyền phản hồi dưới tư cách Quản trị viên!');
      return;
    }
    if (!storefrontReplyText.trim()) {
      alert('Vui lòng nhập nội dung câu trả lời!');
      return;
    }
    const adminName = appStore.currentCustomer
      ? `${appStore.currentCustomer.fullName} (Ban Quản Trị CSET Store)`
      : 'Ban Quản Trị CSET Store';

    reviewRepo.reply(rev.id, storefrontReplyText.trim(), adminName);
    if (product) {
      reviews = reviewRepo.getByProductId(product.id, isAdminViewer);
    }
    storefrontReplyingId = null;
    storefrontReplyText = '';
    appStore.showToast(`Đã đăng phản hồi cho đánh giá của "${rev.userName}" thành công!`);
  }
</script>

{#if isLoading}
  <!-- Modern Loading Skeleton -->
  <div class="space-y-10 animate-pulse">
    <!-- Breadcrumb Skeleton -->
    <div class="flex items-center gap-2">
      <div class="h-3.5 w-16 bg-slate-200 rounded-md"></div>
      <span class="text-slate-300">/</span>
      <div class="h-3.5 w-20 bg-slate-200 rounded-md"></div>
      <span class="text-slate-300">/</span>
      <div class="h-3.5 w-40 bg-slate-200 rounded-md"></div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
      <!-- Left Column: Image Gallery Skeleton -->
      <div class="space-y-4">
        <div class="aspect-square rounded-3xl bg-slate-200 border border-slate-300/60 flex flex-col items-center justify-center text-slate-400 gap-3">
          <i class="fa-solid fa-spinner fa-spin text-3xl text-blue-900"></i>
          <span class="text-xs font-semibold text-slate-500">Đang get dữ liệu sản phẩm từ máy chủ...</span>
        </div>
        <div class="flex gap-3">
          <div class="w-20 h-20 rounded-xl bg-slate-200"></div>
          <div class="w-20 h-20 rounded-xl bg-slate-200"></div>
          <div class="w-20 h-20 rounded-xl bg-slate-200"></div>
        </div>
      </div>

      <!-- Right Column: Info Skeleton -->
      <div class="space-y-6">
        <div class="space-y-3">
          <div class="flex gap-2">
            <div class="h-6 w-24 bg-slate-200 rounded-lg"></div>
            <div class="h-6 w-20 bg-slate-200 rounded-lg"></div>
          </div>
          <div class="h-9 w-3/4 bg-slate-200 rounded-xl"></div>
          <div class="h-4 w-1/2 bg-slate-200 rounded-md"></div>
          <div class="h-20 w-full bg-slate-200/80 rounded-2xl"></div>
        </div>
        <div class="h-32 w-full bg-slate-200/70 rounded-2xl"></div>
        <div class="h-24 w-full bg-slate-200/70 rounded-2xl"></div>
        <div class="h-12 w-full bg-slate-200/90 rounded-2xl"></div>
      </div>
    </div>
  </div>
{:else if product}
  <div class="space-y-12 animate-in fade-in duration-200">
    <!-- Breadcrumb -->
    <nav class="flex items-center space-x-2 text-xs text-slate-500 font-medium">
      <button type="button" onclick={() => appStore.setTab('home')} class="hover:text-blue-900 cursor-pointer">Trang Chủ</button>
      <span>/</span>
      <button type="button" onclick={() => appStore.setTab('shop')} class="hover:text-blue-900 cursor-pointer">Sản Phẩm</button>
      <span>/</span>
      <span class="text-blue-900 font-semibold truncate max-w-xs">{product.name}</span>
    </nav>

    <!-- Main Product Layout Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
      <!-- Left Column: Image Gallery Preview -->
      <div class="space-y-4 relative lg:landscape:sticky lg:landscape:top-24">
        <div class="aspect-square rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-md flex items-center justify-center relative">
          <img
            src={selectedImage || product.image}
            alt={product.name}
            class="w-full h-full object-cover transition-all duration-300"
          />
          {#if discountInfo.hasDiscount}
            <span class="absolute top-4 left-4 px-3.5 py-1.5 rounded-xl text-xs font-black bg-rose-600 text-white shadow-lg">
              GIẢM {discountInfo.discountPercent}%
            </span>
          {/if}
        </div>

        <!-- Thumbnails Gallery Strip -->
        {#if product.images && product.images.length > 1}
          <div class="flex gap-3 overflow-x-auto p-1 scrollbar-none">
            {#each product.images as img}
              <button
                type="button"
                onclick={() => selectedImage = img}
                class="w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer transition shrink-0 {(selectedImage === img || (!selectedImage && img === product.image)) ? 'border-blue-900 ring-2 ring-blue-300' : 'border-slate-200 hover:border-slate-400'}"
              >
                <img src={img} alt="Thumbnail" class="w-full h-full object-cover" />
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Right Column: Product Information & Action Box -->
      <div class="space-y-6">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-3 py-1 bg-blue-50 text-blue-900 text-xs font-bold rounded-lg uppercase tracking-wider">
              {product.category}
            </span>
            {#if product.subCategory}
              <span class="px-3 py-1 bg-purple-50 text-purple-900 text-xs font-bold rounded-lg">
                {product.subCategory}
              </span>
            {/if}
            {#if product.brand}
              <span class="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                Hãng: <strong>{product.brand}</strong>
              </span>
            {/if}
            {#if product.sku}
              <span class="px-2.5 py-1 bg-slate-100 text-slate-500 font-mono text-xs rounded">
                SKU: {product.sku}
              </span>
            {/if}
          </div>

          <h1 class="text-2xl sm:text-3xl font-black text-blue-950 leading-snug">
            {product.name}
          </h1>

          <div class="flex items-center gap-4 text-xs text-slate-500">
            <span class="flex items-center gap-1 text-amber-500 font-bold">
              <i class="fa-solid fa-star"></i> {product.rating ?? 4.9}
            </span>
            <span>|</span>
            <span class="text-slate-600 font-medium">{visibleReviews.length} đánh giá khách hàng</span>
            <span>|</span>
            <span class="text-emerald-700 font-bold flex items-center gap-1">
              <i class="fa-solid fa-circle-check"></i> Còn hàng ({product.stock ?? 50})
            </span>
          </div>

          <!-- Price Block -->
          <div class="p-5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-baseline gap-4 mt-2">
            <span class="text-3xl sm:text-4xl font-black text-blue-950">
              {formatCurrency(effectivePrice)}
            </span>
            {#if discountInfo.hasDiscount && discountInfo.originalPrice}
              <span class="text-base text-slate-400 line-through font-semibold">
                {formatCurrency(discountInfo.originalPrice)}
              </span>
            {/if}
          </div>
        </div>


        <!-- Product Variant Selection (Màu sắc, kích cỡ,...) -->
        {#if product.variantGroups && product.variantGroups.length > 0}
          <div class="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-200 bg-white space-y-5 shadow-xs">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 class="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center gap-2">
                  <i class="fa-solid fa-shapes text-blue-900"></i>
                  Lựa Chọn Phân Loại Sản Phẩm *
                </h4>
                <p class="text-[11px] text-slate-500 mt-0.5">Vui lòng chọn đầy đủ các phân loại bên dưới trước khi thêm vào giỏ hàng</p>
              </div>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900">
                {product.variantGroups.length} nhóm phân loại
              </span>
            </div>

            {#if missingVariantError}
              <div class="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <i class="fa-solid fa-circle-exclamation text-rose-600"></i>
                <span>Vui lòng chọn phân loại <strong>"{missingVariantError}"</strong> để tiếp tục</span>
              </div>
            {/if}

            <div class="space-y-4">
              {#each product.variantGroups as vg}
                {@const isMissing = missingVariantError === vg.name}
                <div class="space-y-2 p-3 rounded-2xl transition {isMissing ? 'bg-rose-50/50 border border-rose-300 ring-2 ring-rose-200' : 'bg-slate-50/60 border border-slate-100'}">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>{vg.name}:</span>
                      {#if isMissing}
                        <span class="text-rose-600 font-bold text-[10px]">* Bắt buộc chọn</span>
                      {/if}
                    </span>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold {selectedVariants[vg.name] ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'bg-slate-200 text-slate-600'}">
                      {selectedVariants[vg.name] || 'Chưa chọn'}
                    </span>
                  </div>

                  <div class="flex flex-wrap gap-2 pt-1">
                    {#each vg.options as opt}
                      {@const isSelected = selectedVariants[vg.name] === opt}
                      <button
                        type="button"
                        onclick={() => selectVariant(vg.name, opt)}
                        class="px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 {isSelected
                          ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-300 font-bold scale-[1.02]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}"
                      >
                        {#if isSelected}
                          <i class="fa-solid fa-check text-[11px]"></i>
                        {/if}
                        <span>{opt}</span>
                      </button>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>

            <!-- Summary Pill of Selected Variants -->
            {#if Object.keys(selectedVariants).length > 0}
              <div class="p-3 rounded-2xl bg-blue-50/80 border border-blue-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span class="text-slate-600 font-semibold flex items-center gap-1.5">
                  <i class="fa-solid fa-circle-check text-blue-900"></i>
                  Đang chọn:
                </span>
                <span class="font-black text-blue-950">
                  {Object.entries(selectedVariants).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                </span>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Quantity & Buy Action Buttons -->
        <div class="space-y-4 pt-2">
          <div class="flex items-center space-x-4 flex-wrap gap-y-2">
            <span class="text-xs font-bold text-slate-700 uppercase">Số lượng:</span>
            {#if purchaseLimit && purchaseLimit > 0}
              <span class="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
                <i class="fa-solid fa-circle-exclamation text-amber-600"></i>
                <span>Giới hạn mua: tối đa {purchaseLimit} sp/đơn</span>
              </span>
            {/if}
            <div class="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
              <button
                type="button"
                onclick={() => quantity = Math.max(1, quantity - 1)}
                class="px-3.5 py-2 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                aria-label="Giảm"
              >
                <i class="fa-solid fa-minus text-xs"></i>
              </button>
              <span class="px-5 py-2 font-bold text-sm text-blue-950 min-w-12 text-center">{quantity}</span>
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
                class="px-3.5 py-2 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition cursor-pointer"
                aria-label="Tăng"
              >
                <i class="fa-solid fa-plus text-xs"></i>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              disabled={isAdding}
              onclick={handleAddToCart}
              class="w-full py-4 rounded-2xl bg-white border-2 border-blue-900 text-blue-900 hover:bg-blue-50 disabled:opacity-60 font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <i class="fa-solid {isAdding ? 'fa-check' : 'fa-cart-plus'} text-base"></i>
              <span>{isAdding ? 'Đang thêm...' : 'Thêm Vào Giỏ Hàng'}</span>
            </button>

            <button
              type="button"
              disabled={isAdding}
              onclick={handleBuyNow}
              class="w-full py-4 rounded-2xl bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white font-bold transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <i class="fa-solid fa-bolt text-base"></i>
              <span>Mua Ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Specifications & Product Description: 2 Dòng Nối Tiếp (Full-width matching reviews) -->
    <section class="space-y-6 pt-8 border-t border-slate-200">
      <!-- Dòng 1: Thông Số & Chính Sách -->
      <div class="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white space-y-5 shadow-xs">
        <div class="flex items-center gap-3 border-b border-slate-100 pb-3.5">
          <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center text-base font-bold shadow-2xs">
            <i class="fa-solid fa-list-check"></i>
          </div>
          <div>
            <h3 class="text-lg font-black text-blue-950">Thông Số & Chính Sách</h3>
            <p class="text-xs text-slate-500">Nguồn gốc xuất xứ, điều kiện bảo hành và thông số kỹ thuật chi tiết</p>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600 bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
          <div><span class="text-slate-400 block text-[11px]">Xuất xứ:</span> <strong class="text-slate-800 text-sm">{product.origin || 'Chính hãng'}</strong></div>
          <div><span class="text-slate-400 block text-[11px]">Bảo hành:</span> <strong class="text-slate-800 text-sm">{product.warranty || '12 tháng chính hãng'}</strong></div>
          {#if product.condition}
            <div><span class="text-slate-400 block text-[11px]">Tình trạng:</span> <strong class="text-slate-800 text-sm">{product.condition}</strong></div>
          {/if}
          {#if product.weight}
            <div><span class="text-slate-400 block text-[11px]">Khối lượng:</span> <strong class="text-slate-800 text-sm">{product.weight}</strong></div>
          {/if}
        </div>

        {#if product.specifications && product.specifications.length > 0}
          <div class="space-y-3 pt-2 border-t border-slate-100">
            <span class="text-xs font-bold text-slate-800 uppercase tracking-wider block">Thông Số Kỹ Thuật Chi Tiết:</span>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {#each product.specifications as spec}
                <div class="flex items-center justify-between p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 hover:bg-slate-100/60 transition">
                  <span class="text-slate-500 font-medium">{spec.name}:</span>
                  <strong class="text-slate-900 text-right">{spec.value}</strong>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Dòng 2: Mô Tả Sản Phẩm Nối Tiếp -->
      <div class="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
        <div class="flex items-center gap-3 border-b border-slate-100 pb-3.5">
          <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center text-base font-bold shadow-2xs">
            <i class="fa-solid fa-file-lines"></i>
          </div>
          <div>
            <h3 class="text-lg font-black text-blue-950">Mô Tả Sản Phẩm</h3>
            <p class="text-xs text-slate-500">Đặc điểm nổi bật và giới thiệu chi tiết sản phẩm</p>
          </div>
        </div>

        <div class="text-sm text-slate-700 leading-relaxed bg-slate-50/60 p-5 sm:p-6 rounded-2xl border border-slate-200/80 whitespace-pre-line">
          <p>{product.description}</p>
        </div>
      </div>
    </section>

    <!-- REVIEWS & COMMENTS SECTION -->
    <section class="space-y-8 pt-8 border-t border-slate-200">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-2xl font-black text-blue-950 flex items-center gap-2">
            <i class="fa-solid fa-comments text-blue-900"></i>
            Đánh Giá & Nhận Xét Từ Khách Hàng ({visibleReviews.length})
          </h3>
          <p class="text-xs text-slate-500 mt-1">Đánh giá thực tế từ những khách hàng đã mua sản phẩm này</p>
        </div>

        {#if userHasPurchased}
          <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <i class="fa-solid fa-badge-check"></i>
            <span>Bạn đã mua sản phẩm này - Đủ điều kiện đánh giá</span>
          </div>
        {:else if appStore.currentCustomer}
          <div class="text-xs text-slate-400 italic">
            (Chỉ những tài khoản đã mua sản phẩm này mới có thể viết đánh giá)
          </div>
        {/if}
      </div>

      <!-- Add Review Form (Only for verified buyers) -->
      {#if userHasPurchased}
        <form onsubmit={handleSubmitReview} class="bg-white border border-slate-300 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
          <h4 class="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <i class="fa-solid fa-pen text-blue-900"></i>
            Viết Đánh Giá Của Bạn
          </h4>

          <!-- Star Rating Picker -->
          <div class="space-y-1">
            <span class="text-xs font-bold text-slate-700 block">Đánh giá số sao:</span>
            <div class="flex items-center gap-2">
              {#each [1, 2, 3, 4, 5] as star}
                <button
                  type="button"
                  onclick={() => newRating = star}
                  class="text-2xl cursor-pointer transition {star <= newRating ? 'text-amber-400 scale-110' : 'text-slate-200 hover:text-amber-200'}"
                  aria-label="Chọn {star} sao"
                >
                  ★
                </button>
              {/each}
              <span class="text-xs font-bold text-slate-700 ml-2">({newRating} / 5 sao)</span>
            </div>
          </div>

          <!-- Comment input -->
          <div class="space-y-1">
            <label for="rev-comment" class="text-xs font-bold text-slate-700">Nội dung nhận xét *</label>
            <textarea
              id="rev-comment"
              bind:value={newComment}
              required
              rows={3}
              placeholder="Chia sẻ cảm nhận về chất lượng sản phẩm, dịch vụ đóng gói và giao hàng..."
              class="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            ></textarea>
          </div>

          <!-- Image upload for review -->
          <div class="space-y-2">
            <label for="rev-imgs" class="text-xs font-bold text-slate-700 block">Đính kèm hình ảnh thực tế (Tùy chọn)</label>
            <input
              id="rev-imgs"
              type="file"
              multiple
              accept="image/*"
              onchange={handleReviewImageUpload}
              class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-600 bg-white"
            />
            {#if newReviewImages.length > 0}
              <div class="flex gap-2 flex-wrap pt-1">
                {#each newReviewImages as img}
                  <img src={img} alt="Review thumb" class="w-16 h-16 rounded-xl object-cover border border-slate-300" />
                {/each}
              </div>
            {/if}
          </div>

          <button
            type="submit"
            disabled={isSubmittingReview}
            class="px-6 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            {isSubmittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá Của Bạn'}
          </button>
        </form>
      {/if}

      <!-- Reviews List Display -->
      <div class="space-y-4">
        {#if visibleReviews.length === 0}
          <div class="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs italic">
            Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên mua và để lại cảm nhận!
          </div>
        {:else}
          {#each visibleReviews as rev (rev.id)}
            <div class="bg-white border rounded-3xl p-6 space-y-3.5 shadow-xs transition {rev.hidden ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'}">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-9 h-9 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs">
                    {rev.userName.charAt(0)}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-900 text-xs block">{rev.userName}</span>
                      {#if rev.hidden}
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          Đang ẩn đối với khách
                        </span>
                      {/if}
                    </div>
                    <span class="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <i class="fa-solid fa-badge-check"></i> Đã mua hàng tại CSET Store
                    </span>
                  </div>
                </div>

                <div class="text-right">
                  <div class="text-amber-400 text-sm">
                    {#each Array(rev.rating) as _}★{/each}
                    {#each Array(5 - rev.rating) as _}<span class="text-slate-200">★</span>{/each}
                  </div>
                  <span class="text-[10px] text-slate-400">{rev.createdAt}</span>
                </div>
              </div>

              <p class="text-xs text-slate-700 leading-relaxed pl-12">
                {rev.comment}
              </p>

              <!-- Attached review photos -->
              {#if rev.images && rev.images.length > 0}
                <div class="flex gap-2 pl-12 pt-1">
                  {#each rev.images as img}
                    <img src={img} alt="Ảnh đánh giá" class="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-2xs" />
                  {/each}
                </div>
              {/if}

              <!-- Official Admin Reply Display -->
              {#if rev.adminReply}
                <div class="ml-12 mt-3 p-4 bg-blue-50/80 border-l-4 border-blue-900 rounded-r-2xl space-y-1.5 shadow-2xs">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-blue-950 flex items-center gap-1.5">
                      <i class="fa-solid fa-store text-blue-900"></i>
                      {rev.adminReply.replierName || 'Phản hồi từ CSET Store'}
                      <span class="text-[9px] bg-blue-200 text-blue-950 font-bold px-1.5 py-0.5 rounded">Quản Trị Viên</span>
                    </span>
                    <span class="text-[10px] text-slate-400">{rev.adminReply.repliedAt}</span>
                  </div>
                  <p class="text-xs text-slate-700 leading-relaxed pl-5">
                    {rev.adminReply.reply}
                  </p>
                </div>
              {/if}

              <!-- Admin Direct Action Bar on Storefront (When Admin is viewing) -->
              {#if isAdminViewer}
                <div class="ml-12 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                      <i class="fa-solid fa-shield-halved mr-1"></i>Thao tác Quản trị viên
                    </span>
                  </div>
                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      onclick={() => handleStorefrontToggleHide(rev)}
                      class="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      <i class="fa-solid {rev.hidden ? 'fa-eye' : 'fa-eye-slash'} mr-1"></i>
                      {rev.hidden ? 'Hiện đánh giá' : 'Ẩn đánh giá'}
                    </button>
                    <button
                      type="button"
                      onclick={() => handleStorefrontStartReply(rev)}
                      class="text-xs font-bold text-blue-900 hover:text-blue-700 cursor-pointer"
                    >
                      <i class="fa-solid fa-reply mr-1"></i>
                      {rev.adminReply ? 'Chỉnh sửa phản hồi' : 'Trả lời đánh giá này'}
                    </button>
                  </div>
                </div>

                <!-- Inline Admin Reply Form on Storefront -->
                {#if storefrontReplyingId === rev.id}
                  <div class="ml-12 mt-3 p-4 bg-slate-50 border border-slate-300 rounded-2xl space-y-2.5">
                    <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5 block">
                      <i class="fa-solid fa-pen-to-square text-blue-900"></i>
                      <span>{rev.adminReply ? 'Chỉnh sửa phản hồi chính thức của Quản trị viên:' : 'Trả lời đánh giá của khách hàng:'}</span>
                    </span>
                    <textarea
                      bind:value={storefrontReplyText}
                      rows={2}
                      placeholder="Nhập nội dung phản hồi chính thức từ cửa hàng..."
                      class="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    ></textarea>
                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        onclick={() => storefrontReplyingId = null}
                        class="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onclick={() => handleStorefrontSubmitReply(rev)}
                        class="px-4 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-sm cursor-pointer"
                      >
                        Đăng Phản Hồi
                      </button>
                    </div>
                  </div>
                {/if}
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    </section>

    <!-- Related Products -->
    {#if relatedProducts.length > 0}
      <section class="space-y-4 pt-8 border-t border-slate-200">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-blue-950 flex items-center gap-2">
            <i class="fa-solid fa-layer-group text-blue-900"></i>
            Sản Phẩm Cùng Ngành Hàng
          </h3>
          <button
            type="button"
            onclick={() => appStore.setTab('shop')}
            class="text-xs font-bold text-blue-900 hover:underline cursor-pointer"
          >
            Xem tất cả <i class="fa-solid fa-arrow-right ml-1"></i>
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {#each relatedProducts as relProduct (relProduct.id)}
            <ProductCard product={relProduct} />
          {/each}
        </div>
      </section>
    {/if}
  </div>
{:else}
  <div class="py-20 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
    <div class="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-2xl">
      <i class="fa-solid fa-box-open"></i>
    </div>
    <h2 class="text-xl font-black text-slate-800">{loadError || 'Không tìm thấy sản phẩm'}</h2>
    <p class="text-sm text-slate-500 max-w-md mx-auto">
      Sản phẩm này có thể đã ngừng kinh doanh hoặc đường dẫn không chính xác.
    </p>
    <div class="flex items-center justify-center gap-3 pt-2">
      {#if currentLoadedId}
        <button
          type="button"
          onclick={() => currentLoadedId && fetchProduct(currentLoadedId)}
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
        >
          <i class="fa-solid fa-rotate-right"></i>
          <span>Thử tải lại</span>
        </button>
      {/if}
      <button
        type="button"
        onclick={() => appStore.setTab('shop')}
        class="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition shadow-md cursor-pointer"
      >
        <i class="fa-solid fa-arrow-left"></i>
        <span>Quay lại danh mục sản phẩm</span>
      </button>
    </div>
  </div>
{/if}
