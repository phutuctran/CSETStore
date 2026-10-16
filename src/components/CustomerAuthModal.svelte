<script lang="ts">
  import { appStore } from '../stores/store.svelte';
  import { evaluatePasswordStrength } from '../services/authService';
  import { LocalStorageUserRepository } from '../repositories';

  const userRepo = new LocalStorageUserRepository();

  let username = $state('');
  let password = $state('');
  let fullName = $state('');
  let phone = $state('');
  let address = $state('');
  let errorMsg = $state('');

  let passwordStrength = $derived(evaluatePasswordStrength(password));

  let isUsernameDuplicate = $derived.by(() => {
    if (!username.trim()) return false;
    const clean = username.trim().toLowerCase();
    return userRepo.getAll().some(u => u.username.toLowerCase() === clean);
  });

  let isPhoneDuplicate = $derived.by(() => {
    if (!phone.trim()) return false;
    const clean = phone.trim();
    return userRepo.getAll().some(u => u.phone && u.phone.trim() === clean);
  });
  async function handleLogin(e: Event) {
    e.preventDefault();
    errorMsg = '';
    const success = await appStore.loginCustomer(username.trim(), password);
    if (!success) {
      errorMsg = 'Tên đăng nhập hoặc mật khẩu không chính xác!';
    }
  }

  async function handleRegister(e: Event) {
    e.preventDefault();
    errorMsg = '';
    if (!username.trim() || !password || !fullName.trim()) {
      errorMsg = 'Vui lòng điền các trường bắt buộc (*)';
      return;
    }
    if (isUsernameDuplicate) {
      errorMsg = 'Tên đăng nhập này đã có người sử dụng, vui lòng chọn tên khác!';
      return;
    }
    if (isPhoneDuplicate) {
      errorMsg = 'Số điện thoại này đã được đăng ký cho tài khoản khác!';
      return;
    }
    if (passwordStrength.score < 2) {
      errorMsg = 'Mật khẩu quá yếu! Vui lòng chọn mật khẩu từ 8 ký tự, kết hợp chữ hoa, chữ số hoặc ký tự đặc biệt.';
      return;
    }
    const success = await appStore.registerCustomer({
      username: username.trim(),
      password,
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim()
    });
    if (!success) {
      errorMsg = 'Đăng ký tài khoản không thành công, vui lòng kiểm tra lại thông tin!';
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
            : 'Tạo tài khoản để lưu địa chỉ và lịch sử mua hàng'}
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

          <div class="space-y-3">
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label for="r-user" class="text-xs font-bold text-slate-600 uppercase">Tên Đăng Nhập *</label>
                {#if isUsernameDuplicate}
                  <span class="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <i class="fa-solid fa-circle-xmark"></i> Đã bị trùng
                  </span>
                {:else if username.trim().length >= 3}
                  <span class="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <i class="fa-solid fa-circle-check"></i> Hợp lệ
                  </span>
                {/if}
              </div>
              <input
                id="r-user"
                type="text"
                bind:value={username}
                required
                placeholder="ten_dang_nhap (ví dụ: myaccount2026)"
                class="w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-sm text-blue-950 focus:outline-none focus:ring-2 {isUsernameDuplicate ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-900'}"
              />
              {#if isUsernameDuplicate}
                <p class="text-[11px] text-rose-600 font-semibold">Tên đăng nhập này đã được sử dụng, vui lòng chọn tên khác!</p>
              {/if}
            </div>

            <div class="space-y-1">
              <label for="r-pass" class="text-xs font-bold text-slate-600 uppercase">Mật Khẩu *</label>
              <input
                id="r-pass"
                type="password"
                bind:value={password}
                required
                placeholder="Nhập mật khẩu an toàn..."
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />

              <!-- Real-time Password Strength Meter & Checklist -->
              {#if password}
                <div class="space-y-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 mt-1.5 animate-in fade-in duration-150">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-600 font-medium text-[11px]">Đánh giá độ mạnh:</span>
                    <span class="font-black text-xs {passwordStrength.colorClass}">
                      {passwordStrength.label}
                    </span>
                  </div>

                  <!-- Progress bar -->
                  <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      class="h-full transition-all duration-300 {passwordStrength.colorClass}"
                      style="width: {passwordStrength.barWidth}"
                    ></div>
                  </div>

                  <!-- Requirement checklist badges -->
                  <div class="grid grid-cols-2 gap-1.5 text-[10px] pt-0.5 text-slate-600">
                    <span class="flex items-center gap-1.5 {passwordStrength.hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-400'}">
                      <i class="fa-solid {passwordStrength.hasMinLength ? 'fa-check text-emerald-600' : 'fa-circle text-[6px] text-slate-300'}"></i>
                      Tối thiểu 8 ký tự
                    </span>
                    <span class="flex items-center gap-1.5 {passwordStrength.hasUppercase && passwordStrength.hasLowercase ? 'text-emerald-700 font-bold' : 'text-slate-400'}">
                      <i class="fa-solid {passwordStrength.hasUppercase && passwordStrength.hasLowercase ? 'fa-check text-emerald-600' : 'fa-circle text-[6px] text-slate-300'}"></i>
                      Chữ hoa & chữ thường
                    </span>
                    <span class="flex items-center gap-1.5 {passwordStrength.hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-400'}">
                      <i class="fa-solid {passwordStrength.hasNumber ? 'fa-check text-emerald-600' : 'fa-circle text-[6px] text-slate-300'}"></i>
                      Có chữ số (0-9)
                    </span>
                    <span class="flex items-center gap-1.5 {passwordStrength.hasSpecial ? 'text-emerald-700 font-bold' : 'text-slate-400'}">
                      <i class="fa-solid {passwordStrength.hasSpecial ? 'fa-check text-emerald-600' : 'fa-circle text-[6px] text-slate-300'}"></i>
                      Ký tự đặc biệt (!@#$)
                    </span>
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label for="r-phone" class="text-xs font-bold text-slate-600 uppercase">Số Điện Thoại</label>
              {#if isPhoneDuplicate}
                <span class="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                  <i class="fa-solid fa-circle-xmark"></i> Số điện thoại đã được dùng
                </span>
              {:else if phone.trim().length >= 9}
                <span class="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <i class="fa-solid fa-circle-check"></i> Hợp lệ
                </span>
              {/if}
            </div>
            <input
              id="r-phone"
              type="tel"
              bind:value={phone}
              placeholder="0901234567..."
              class="w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-sm text-blue-950 focus:outline-none focus:ring-2 {isPhoneDuplicate ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-900'}"
            />
            {#if isPhoneDuplicate}
              <p class="text-[11px] text-rose-600 font-semibold">Số điện thoại này đã được đăng ký tài khoản khác!</p>
            {/if}
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
