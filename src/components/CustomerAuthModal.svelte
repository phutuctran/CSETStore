<script lang="ts">
  import { appStore } from '../stores/store.svelte';

  let username = $state('');
  let password = $state('');
  let fullName = $state('');
  let phone = $state('');
  let address = $state('');
  let errorMsg = $state('');

  function handleLogin(e: Event) {
    e.preventDefault();
    errorMsg = '';
    const success = appStore.loginCustomer(username.trim(), password);
    if (!success) {
      errorMsg = 'Tên đăng nhập hoặc mật khẩu không đúng!';
    }
  }

  function handleRegister(e: Event) {
    e.preventDefault();
    errorMsg = '';
    if (!username.trim() || !password || !fullName.trim()) {
      errorMsg = 'Vui lòng điền các trường bắt buộc (*)';
      return;
    }
    const success = appStore.registerCustomer({
      username: username.trim(),
      password,
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim()
    });
    if (!success) {
      errorMsg = 'Tên đăng nhập này đã tồn tại, vui lòng chọn tên khác!';
    }
  }
</script>

{#if appStore.isAuthModalOpen}
  <div
    class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
  >
    <button
      type="button"
      class="fixed inset-0 bg-transparent w-full h-full border-none cursor-default"
      onclick={() => appStore.closeAuthModal()}
      aria-label="Đóng popup tài khoản"
    ></button>

    <div
      class="glass-panel w-full max-w-md rounded-3xl border border-slate-200 p-6 md:p-8 relative bg-white shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200"
    >
      <button
        type="button"
        onclick={() => appStore.closeAuthModal()}
        class="absolute top-5 right-5 text-slate-400 hover:text-blue-950 text-xl cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition"
        aria-label="Đóng"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>

      <div class="text-center space-y-2 mb-6">
        <div class="w-12 h-12 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mx-auto text-xl shadow-xs">
          <i class="fa-solid fa-user-lock"></i>
        </div>
        <h3 class="text-2xl font-black text-blue-950">
          {appStore.authMode === 'login' ? 'Đăng Nhập Khách Hàng' : 'Đăng Ký Tài Khoản'}
        </h3>
        <p class="text-xs text-slate-500">
          {appStore.authMode === 'login'
            ? 'Đăng nhập để theo dõi trạng thái đơn hàng của bạn'
            : 'Tạo tài khoản để lưu địa chỉ và lịch sử in 3D'}
        </p>
      </div>

      {#if errorMsg}
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
          <i class="fa-solid fa-circle-exclamation shrink-0"></i>
          <span>{errorMsg}</span>
        </div>
      {/if}

      {#if appStore.authMode === 'login'}
        <form onsubmit={handleLogin} class="space-y-4">
          <div class="space-y-1">
            <label for="c-user" class="text-xs font-bold text-slate-600 uppercase">Tên Đăng Nhập</label>
            <input
              id="c-user"
              type="text"
              bind:value={username}
              required
              placeholder="Nhập tên đăng nhập..."
              class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div class="space-y-1">
            <label for="c-pass" class="text-xs font-bold text-slate-600 uppercase">Mật Khẩu</label>
            <input
              id="c-pass"
              type="password"
              bind:value={password}
              required
              placeholder="Nhập mật khẩu..."
              class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <button
            type="submit"
            class="w-full py-3.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold cursor-pointer shadow-md transition text-sm"
          >
            Đăng Nhập
          </button>
        </form>

        <div class="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-600">
          Chưa có tài khoản?
          <button
            type="button"
            onclick={() => { appStore.authMode = 'register'; errorMsg = ''; }}
            class="text-blue-900 font-bold hover:underline ml-1 cursor-pointer"
          >
            Đăng ký ngay
          </button>
        </div>
      {:else}
        <form onsubmit={handleRegister} class="space-y-3">
          <div class="space-y-1">
            <label for="r-name" class="text-xs font-bold text-slate-600 uppercase">Họ và Tên *</label>
            <input
              id="r-name"
              type="text"
              bind:value={fullName}
              required
              placeholder="Nguyễn Văn A..."
              class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label for="r-user" class="text-xs font-bold text-slate-600 uppercase">Tài Khoản *</label>
              <input
                id="r-user"
                type="text"
                bind:value={username}
                required
                placeholder="ten_dang_nhap"
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div class="space-y-1">
              <label for="r-pass" class="text-xs font-bold text-slate-600 uppercase">Mật Khẩu *</label>
              <input
                id="r-pass"
                type="password"
                bind:value={password}
                required
                placeholder="Mật khẩu..."
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label for="r-phone" class="text-xs font-bold text-slate-600 uppercase">Số Điện Thoại</label>
            <input
              id="r-phone"
              type="tel"
              bind:value={phone}
              placeholder="0901234567..."
              class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div class="space-y-1">
            <label for="r-addr" class="text-xs font-bold text-slate-600 uppercase">Địa Chỉ Giao Hàng</label>
            <input
              id="r-addr"
              type="text"
              bind:value={address}
              placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
              class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <button
            type="submit"
            class="w-full py-3.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold cursor-pointer shadow-md transition text-sm mt-2"
          >
            Tạo Tài Khoản
          </button>
        </form>

        <div class="mt-4 pt-3 border-t border-slate-200 text-center text-xs text-slate-600">
          Đã có tài khoản?
          <button
            type="button"
            onclick={() => { appStore.authMode = 'login'; errorMsg = ''; }}
            class="text-blue-900 font-bold hover:underline ml-1 cursor-pointer"
          >
            Đăng nhập
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
