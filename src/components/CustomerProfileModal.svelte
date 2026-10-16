<script lang="ts">
  import { appStore } from '../stores/store.svelte';

  let fullName = $state('');
  let phone = $state('');
  let address = $state('');
  let password = $state('');
  let isSaving = $state(false);

  $effect(() => {
    if (appStore.isProfileModalOpen && appStore.currentCustomer) {
      fullName = appStore.currentCustomer.fullName;
      phone = appStore.currentCustomer.phone || '';
      address = appStore.currentCustomer.address || '';
      password = '';
    }
  });

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Vui lòng nhập họ và tên!');
      return;
    }
    isSaving = true;
    appStore.updateCustomerProfile({
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      password: password ? password : undefined
    });
    isSaving = false;
  }
</script>

{#if appStore.isProfileModalOpen && appStore.currentCustomer}
  <div
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
  >
    <button
      type="button"
      class="fixed inset-0 bg-transparent w-full h-full border-none cursor-default"
      onclick={() => appStore.closeProfileModal()}
      aria-label="Đóng popup thông tin cá nhân"
    ></button>

    <div
      class="glass-panel w-full max-w-lg rounded-2xl border border-slate-200 p-6 md:p-8 relative bg-white shadow-xl z-10 animate-in fade-in zoom-in-95 duration-200"
    >
      <button
        type="button"
        onclick={() => appStore.closeProfileModal()}
        class="absolute top-5 right-5 text-slate-400 hover:text-slate-800 text-xl cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition"
        aria-label="Đóng"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>

      <div class="flex items-center space-x-3 border-b border-slate-200 pb-4 mb-5">
        <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center text-xl font-bold">
          <i class="fa-solid fa-user-pen"></i>
        </div>
        <div>
          <h3 class="text-lg font-bold text-slate-900">Thông Tin Cá Nhân & Chỉnh Sửa</h3>
          <span class="text-xs text-slate-500 font-mono">Tài khoản: @{appStore.currentCustomer.username}</span>
        </div>
      </div>

      <form onsubmit={handleSubmit} class="space-y-4 text-xs">
        <div class="space-y-1">
          <label for="prof-fullname" class="font-bold text-slate-700 uppercase">Họ và Tên *</label>
          <input
            id="prof-fullname"
            type="text"
            bind:value={fullName}
            required
            placeholder="Họ và tên..."
            class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label for="prof-phone" class="font-bold text-slate-700 uppercase">Số Điện Thoại</label>
            <input
              id="prof-phone"
              type="tel"
              bind:value={phone}
              placeholder="0901234567..."
              class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div class="space-y-1">
            <label for="prof-pass" class="font-bold text-slate-700 uppercase">Đổi Mật Khẩu</label>
            <input
              id="prof-pass"
              type="password"
              bind:value={password}
              placeholder="Bỏ trống nếu không đổi..."
              class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label for="prof-addr" class="font-bold text-slate-700 uppercase">Địa Chỉ Giao Hàng Mặc Định</label>
          <textarea
            id="prof-addr"
            bind:value={address}
            rows={2}
            placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
            class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
          ></textarea>
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onclick={() => appStore.closeProfileModal()}
            class="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="submit"
            disabled={isSaving}
            class="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <i class="fa-solid fa-floppy-disk"></i>
            <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
