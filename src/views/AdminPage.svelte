<script lang="ts">
  import { appStore } from '../stores/store.svelte';
  import { CATEGORIES } from '../models/constants';
  import { formatCurrency } from '../services/pricingService';

  // Form states
  let newName = $state('');
  let newPrice = $state<number | null>(null);
  let newCategory = $state('anime');
  let newDescription = $state('');
  let newGrams = $state<number | null>(null);
  let newPrintHours = $state<number | null>(null);
  let uploadedImageBase64 = $state('');
  let activeAdminTab = $state<'products' | 'orders'>('products');

  function handleImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        uploadedImageBase64 = (evt.target?.result as string) || '';
      };
      reader.readAsDataURL(file);
    }
  }

  function handleAddNewProduct(e: Event) {
    e.preventDefault();
    if (!newName.trim() || !newPrice || newPrice <= 0) {
      alert('Vui lòng nhập tên sản phẩm và giá hợp lệ!');
      return;
    }

    const finalImage = uploadedImageBase64 ||
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80';

    appStore.addProduct({
      name: newName.trim(),
      price: newPrice,
      category: newCategory,
      image: finalImage,
      description: newDescription.trim() || 'Sản phẩm in 3D chất lượng cao được sản xuất tại CSET Store.',
      grams: newGrams || undefined,
      printHours: newPrintHours || undefined
    });

    // Reset form
    newName = '';
    newPrice = null;
    newCategory = 'anime';
    newDescription = '';
    newGrams = null;
    newPrintHours = null;
    uploadedImageBase64 = '';
  }

  function handleDelete(id: number, name: string) {
    if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" khỏi cửa hàng CSET Store?`)) {
      appStore.deleteProduct(id);
    }
  }

  function handleReset() {
    if (confirm('Khôi phục danh sách sản phẩm mẫu ban đầu của CSET Store?')) {
      appStore.resetProducts();
    }
  }
</script>

<div class="space-y-8 max-w-5xl mx-auto">
  <!-- Admin Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
    <div>
      <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
        <i class="fa-solid fa-shield-halved"></i>
        <span>Hệ Thống Quản Trị Cửa Hàng</span>
      </div>
      <h2 class="text-3xl font-black text-blue-950">Trang Quản Trị - CSET Store</h2>
      <p class="text-slate-600 text-sm mt-1">
        Thêm mới sản phẩm, cập nhật bảng giá và quản lý đơn đặt hàng từ khách.
      </p>
    </div>

    <!-- Switch Subtabs -->
    <div class="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
      <button
        type="button"
        onclick={() => activeAdminTab = 'products'}
        class="px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer {activeAdminTab === 'products'
          ? 'bg-blue-900 text-white shadow-sm'
          : 'text-slate-600 hover:text-blue-900'}"
      >
        <i class="fa-solid fa-boxes-stacked mr-1.5"></i>
        Sản Phẩm ({appStore.products.length})
      </button>

      <button
        type="button"
        onclick={() => activeAdminTab = 'orders'}
        class="px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer {activeAdminTab === 'orders'
          ? 'bg-blue-900 text-white shadow-sm'
          : 'text-slate-600 hover:text-blue-900'}"
      >
        <i class="fa-solid fa-receipt mr-1.5"></i>
        Đơn Hàng ({appStore.orders.length})
      </button>
    </div>
  </div>

  {#if activeAdminTab === 'products'}
    <!-- Add Product Form Card -->
    <div class="glass-panel p-8 rounded-3xl border border-slate-200 space-y-6 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-200 pb-4">
        <h3 class="text-xl font-bold text-blue-950 flex items-center">
          <i class="fa-solid fa-plus-circle text-blue-900 mr-2.5"></i>
          Thêm Sản Phẩm Mới Vào Cửa Hàng
        </h3>
        <button
          type="button"
          onclick={handleReset}
          class="text-xs text-slate-500 hover:text-blue-900 underline font-medium cursor-pointer"
        >
          Khôi phục dữ liệu gốc
        </button>
      </div>

      <form onsubmit={handleAddNewProduct} class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label for="adm-name" class="text-xs font-bold text-slate-600 uppercase">Tên Sản Phẩm *</label>
            <input
              id="adm-name"
              type="text"
              bind:value={newName}
              required
              placeholder="Ví dụ: Tượng One Piece Luffy Gear 5..."
              class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div class="space-y-2">
            <label for="adm-price" class="text-xs font-bold text-slate-600 uppercase">Giá Bán (VNĐ) *</label>
            <input
              id="adm-price"
              type="number"
              bind:value={newPrice}
              required
              placeholder="Ví dụ: 350000"
              class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div class="space-y-2">
            <label for="adm-cat" class="text-xs font-bold text-slate-600 uppercase">Danh Mục *</label>
            <select
              id="adm-cat"
              bind:value={newCategory}
              class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              {#each CATEGORIES.filter(c => c.key !== 'all') as c}
                <option value={c.key}>{c.label}</option>
              {/each}
            </select>
          </div>

          <div class="space-y-2">
            <label for="adm-img" class="text-xs font-bold text-slate-600 uppercase">Hình Ảnh Sản Phẩm</label>
            <input
              id="adm-img"
              type="file"
              accept="image/*"
              onchange={handleImageUpload}
              class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-600 focus:outline-none"
            />
          </div>

          <div class="space-y-2">
            <label for="adm-grams" class="text-xs font-bold text-slate-600 uppercase">Khối Lượng Nhựa (gam - Tùy chọn)</label>
            <input
              id="adm-grams"
              type="number"
              bind:value={newGrams}
              placeholder="Ví dụ: 120"
              class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div class="space-y-2">
            <label for="adm-hours" class="text-xs font-bold text-slate-600 uppercase">Thời Gian In (giờ - Tùy chọn)</label>
            <input
              id="adm-hours"
              type="number"
              step="0.1"
              bind:value={newPrintHours}
              placeholder="Ví dụ: 8.5"
              class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label for="adm-desc" class="text-xs font-bold text-slate-600 uppercase">Mô Tả Sản Phẩm</label>
          <textarea
            id="adm-desc"
            bind:value={newDescription}
            rows={3}
            placeholder="Mô tả công nghệ in, chất liệu nhựa, lưu ý khi trưng bày..."
            class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900"
          ></textarea>
        </div>

        {#if uploadedImageBase64}
          <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <img src={uploadedImageBase64} alt="Preview" class="w-16 h-16 rounded-lg object-cover" />
            <span class="text-xs text-emerald-700 font-bold">Hình ảnh đã chọn thành công</span>
          </div>
        {/if}

        <button
          type="submit"
          class="w-full py-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold cursor-pointer shadow-md transition flex items-center justify-center gap-2"
        >
          <i class="fa-solid fa-upload"></i>
          <span>Đăng Sản Phẩm Lên Cửa Hàng</span>
        </button>
      </form>
    </div>

    <!-- Product List Table -->
    <div class="glass-panel p-8 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-200 pb-4">
        <h3 class="text-xl font-bold text-blue-950 flex items-center">
          <i class="fa-solid fa-list text-blue-900 mr-2.5"></i>
          Danh Sách Sản Phẩm Hiện Có
        </h3>
        <span class="text-xs font-bold px-3 py-1 bg-slate-100 rounded-full text-slate-700">
          Tổng cộng: {appStore.products.length}
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-700">
          <thead class="bg-slate-100 text-blue-950 uppercase text-xs">
            <tr>
              <th class="p-3.5 rounded-l-xl">Ảnh</th>
              <th class="p-3.5">Tên Sản Phẩm</th>
              <th class="p-3.5">Danh Mục</th>
              <th class="p-3.5">Giá Bán</th>
              <th class="p-3.5 rounded-r-xl text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each appStore.products as p (p.id)}
              <tr class="hover:bg-slate-50 transition">
                <td class="p-3.5">
                  <img src={p.image} alt={p.name} class="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                </td>
                <td class="p-3.5 font-bold text-blue-950 max-w-xs">{p.name}</td>
                <td class="p-3.5">
                  <span class="px-2.5 py-1 text-[11px] font-extrabold uppercase rounded-lg bg-blue-50 text-blue-900">
                    {p.category}
                  </span>
                </td>
                <td class="p-3.5 text-blue-900 font-extrabold">{formatCurrency(p.price)}</td>
                <td class="p-3.5 text-center">
                  <button
                    type="button"
                    onclick={() => handleDelete(p.id, p.name)}
                    class="px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs font-bold transition cursor-pointer"
                    title="Xóa sản phẩm"
                  >
                    <i class="fa-solid fa-trash mr-1"></i> Xóa
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {:else}
    <!-- Orders Management Card -->
    <div class="glass-panel p-8 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-6">
      <div class="flex items-center justify-between border-b border-slate-200 pb-4">
        <h3 class="text-xl font-bold text-blue-950 flex items-center">
          <i class="fa-solid fa-receipt text-blue-900 mr-2.5"></i>
          Quản Lý Đơn Hàng Từ Khách
        </h3>
        <span class="text-xs font-bold px-3 py-1 bg-slate-100 rounded-full text-slate-700">
          Tổng đơn: {appStore.orders.length}
        </span>
      </div>

      {#if appStore.orders.length === 0}
        <div class="text-center py-12 space-y-3">
          <div class="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-2xl">
            <i class="fa-solid fa-file-invoice"></i>
          </div>
          <p class="text-slate-600 font-semibold">Chưa có đơn hàng nào phát sinh</p>
          <p class="text-xs text-slate-400">Các đơn đặt hàng từ trang mua hàng sẽ được lưu và hiển thị tại đây.</p>
        </div>
      {:else}
        <div class="space-y-4">
          {#each appStore.orders as order (order.id)}
            <div class="p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <span class="text-xs font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                    {order.id}
                  </span>
                  <span class="text-xs text-slate-400 ml-2">{order.createdAt}</span>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-slate-500">Trạng thái:</span>
                  <select
                    value={order.status}
                    onchange={(e) => appStore.updateOrderStatus(order.id, (e.target as HTMLSelectElement).value as any)}
                    class="text-xs font-bold rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-blue-950"
                  >
                    <option value="pending">Chờ xác nhận</option>
                    <option value="processing">Đang in / Đang xử lý</option>
                    <option value="completed">Đã giao hoàn tất</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
              </div>

              <!-- Customer info -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-white p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span class="text-slate-400 block font-semibold">Khách hàng:</span>
                  <span class="font-bold text-blue-950">{order.customerName}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-semibold">Điện thoại:</span>
                  <span class="font-bold text-blue-950">{order.phone}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-semibold">Địa chỉ giao:</span>
                  <span class="font-bold text-blue-950">{order.address}</span>
                </div>
              </div>

              <!-- Item list -->
              <div class="space-y-2">
                <span class="text-xs font-bold text-slate-500 uppercase block">Chi tiết đơn:</span>
                <div class="space-y-1.5">
                  {#each order.items as it}
                    <div class="flex justify-between items-center text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100">
                      <span>{it.name} <strong class="text-blue-950">x{it.quantity}</strong></span>
                      <span class="font-bold text-blue-900">{formatCurrency(it.price * it.quantity)}</span>
                    </div>
                  {/each}
                </div>
              </div>

              <!-- Total -->
              <div class="flex justify-end pt-2 text-sm font-black text-blue-950">
                Tổng thanh toán: <span class="ml-2 text-blue-900 text-base">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
