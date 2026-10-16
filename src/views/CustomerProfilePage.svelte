<script lang="ts">
  import { appStore } from '../stores/store.svelte';
  import { themeStore } from '../stores/themeStore.svelte';
  import { LocalStorageReviewRepository, LocalStorageOrderRepository } from '../repositories';
  import { evaluatePasswordStrength } from '../services/authService';
  import { formatCurrency } from '../services/pricingService';
  import type { ProductReview, Product } from '../models/types';

  const reviewRepo = new LocalStorageReviewRepository();
  const orderRepo = new LocalStorageOrderRepository();

  // Active section inside profile page: 'profile' | 'reviews' | 'security'
  let activeSection = $state<'profile' | 'reviews' | 'security'>('profile');

  // Customer Profile Form Fields
  let fullName = $state('');
  let phone = $state('');
  let email = $state('');
  let gender = $state<'male' | 'female' | 'other'>('male');
  let birthday = $state('');
  let city = $state('');
  let district = $state('');
  let ward = $state('');
  let address = $state('');
  let bio = $state('');
  let avatar = $state('');
  let isSavingProfile = $state(false);

  // Password Change Fields
  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let isSavingPassword = $state(false);
  let passwordError = $state('');
  let passwordSuccess = $state('');
  let strength = $derived(evaluatePasswordStrength(newPassword));

  // Review Edit State
  let editingReviewId = $state<string | null>(null);
  let editRating = $state<number>(5);
  let editComment = $state<string>('');
  let isSavingReview = $state(false);
  let reviewsTrigger = $state(0); // Reactive trigger for review updates

  function handleAvatarFileUpload(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];
      if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
        appStore.showToast('Định dạng file không hợp lệ. Chỉ chấp nhận file hình ảnh (PNG, JPG, WebP, SVG)!');
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        appStore.showToast('Kích thước file ảnh không được vượt quá 3MB!');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          avatar = ev.target.result as string;
          appStore.showToast('Đã tải ảnh đại diện lên thành công!');
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function useInitialLetterAvatar() {
    avatar = '';
    appStore.showToast('Đã chuyển sang dùng chữ cái đầu mặc định!');
  }

  // Sync state whenever customer changes
  $effect(() => {
    if (appStore.currentCustomer) {
      fullName = appStore.currentCustomer.fullName || '';
      phone = appStore.currentCustomer.phone || '';
      email = appStore.currentCustomer.email || '';
      gender = appStore.currentCustomer.gender || 'male';
      birthday = appStore.currentCustomer.birthday || '';
      city = appStore.currentCustomer.city || '';
      district = appStore.currentCustomer.district || '';
      ward = appStore.currentCustomer.ward || '';
      address = appStore.currentCustomer.address || '';
      bio = appStore.currentCustomer.bio || '';
      avatar = appStore.currentCustomer.avatar || '';
    }
  });

  // Calculate customer statistics
  let customerOrders = $derived.by(() => {
    if (!appStore.currentCustomer) return [];
    const all = orderRepo.getAll();
    return all.filter(o =>
      (appStore.currentCustomer?.id && o.customerId === appStore.currentCustomer.id) ||
      (appStore.currentCustomer?.phone && o.phone === appStore.currentCustomer.phone)
    );
  });

  let totalSpent = $derived(
    customerOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  );

  // Get reviews posted by this customer
  let myReviews = $derived.by(() => {
    void reviewsTrigger;
    if (!appStore.currentCustomer) return [];
    const all = reviewRepo.getAll();
    return all.filter(r =>
      (appStore.currentCustomer?.id && r.userId === appStore.currentCustomer.id) ||
      (appStore.currentCustomer?.username && r.userName === appStore.currentCustomer.username) ||
      (appStore.currentCustomer?.fullName && r.userName === appStore.currentCustomer.fullName)
    );
  });

  function getProduct(productId: number): Product | undefined {
    return appStore.products.find(p => p.id === productId);
  }

  async function handleSaveProfile(e: Event) {
    e.preventDefault();
    if (!fullName.trim()) {
      appStore.showToast('Vui lòng nhập họ và tên!');
      return;
    }
    isSavingProfile = true;
    const success = await appStore.updateCustomerProfile({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gender,
      birthday,
      city: city.trim(),
      district: district.trim(),
      ward: ward.trim(),
      address: address.trim(),
      bio: bio.trim(),
      avatar: avatar.trim()
    });
    isSavingProfile = false;
    if (success) {
      appStore.showToast('Đã lưu thông tin tài khoản thành công!');
    }
  }

  async function handleSavePassword(e: Event) {
    e.preventDefault();
    passwordError = '';
    passwordSuccess = '';

    if (!newPassword) {
      passwordError = 'Vui lòng nhập mật khẩu mới!';
      return;
    }
    if (newPassword.length < 6) {
      passwordError = 'Mật khẩu mới phải có ít nhất 6 ký tự!';
      return;
    }
    if (newPassword !== confirmPassword) {
      passwordError = 'Mật khẩu xác nhận không khớp!';
      return;
    }

    isSavingPassword = true;
    const success = await appStore.updateCustomerProfile({
      password: newPassword
    });
    isSavingPassword = false;

    if (success) {
      passwordSuccess = 'Đổi mật khẩu thành công!';
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
      appStore.showToast('Đổi mật khẩu tài khoản thành công!');
    } else {
      passwordError = 'Không thể đổi mật khẩu, vui lòng thử lại!';
    }
  }

  function startEditingReview(review: ProductReview) {
    editingReviewId = review.id;
    editRating = review.rating;
    editComment = review.comment;
  }

  function cancelEditingReview() {
    editingReviewId = null;
    editRating = 5;
    editComment = '';
  }

  function saveEditedReview(reviewId: string) {
    if (!editComment.trim()) {
      appStore.showToast('Nội dung đánh giá không được để trống!');
      return;
    }
    isSavingReview = true;
    const ok = reviewRepo.update(reviewId, {
      rating: editRating,
      comment: editComment.trim()
    });
    isSavingReview = false;
    if (ok) {
      reviewsTrigger += 1;
      editingReviewId = null;
      appStore.showToast('Đã cập nhật đánh giá thành công!');
    } else {
      appStore.showToast('Cập nhật đánh giá thất bại!');
    }
  }

  function handleDeleteReview(reviewId: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
    const ok = reviewRepo.delete(reviewId);
    if (ok) {
      reviewsTrigger += 1;
      appStore.showToast('Đã xóa đánh giá của bạn!');
    } else {
      appStore.showToast('Không thể xóa đánh giá!');
    }
  }

  function navigateToProduct(productId: number) {
    const prod = getProduct(productId);
    if (prod) {
      appStore.viewProductDetail(prod);
    }
  }
</script>

<div class="space-y-8 max-w-5xl mx-auto px-1 sm:px-4">
  <!-- Top Navigation Breadcrumb -->
  <div class="flex items-center space-x-2 text-xs text-slate-500 font-medium">
    <button
      type="button"
      onclick={() => appStore.setTab('home')}
      class="hover:text-blue-900 transition cursor-pointer flex items-center gap-1"
    >
      <i class="fa-solid fa-house"></i>
      <span>Trang Chủ</span>
    </button>
    <span>/</span>
    <span class="text-blue-950 font-bold">Hồ Sơ & Quản Lý Đánh Giá</span>
  </div>

  {#if !appStore.currentCustomer}
    <!-- Not Logged In State -->
    <div class="glass-panel rounded-3xl p-10 sm:p-14 text-center border border-slate-200 bg-white space-y-5 shadow-sm">
      <div class="w-20 h-20 bg-blue-50 text-blue-900 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-xs">
        <i class="fa-solid fa-user-lock"></i>
      </div>
      <div class="space-y-2">
        <h2 class="text-2xl font-black text-blue-950">Vui lòng đăng nhập tài khoản</h2>
        <p class="text-slate-500 text-sm max-w-md mx-auto">
          Đăng nhập để xem và quản lý thông tin cá nhân chi tiết, sổ địa chỉ giao hàng và danh sách các đánh giá, bình luận bạn đã gửi.
        </p>
      </div>
      <div class="flex flex-wrap justify-center gap-3 pt-2">
        <button
          type="button"
          onclick={() => appStore.openAuthModal('login')}
          class="px-8 py-3.5 rounded-2xl bg-blue-900 text-white font-bold text-sm hover:bg-blue-800 transition shadow-md cursor-pointer flex items-center gap-2"
        >
          <i class="fa-solid fa-right-to-bracket"></i>
          <span>Đăng Nhập Ngay</span>
        </button>
        <button
          type="button"
          onclick={() => appStore.openAuthModal('register')}
          class="px-8 py-3.5 rounded-2xl bg-slate-100 text-slate-800 font-bold text-sm hover:bg-slate-200 transition cursor-pointer flex items-center gap-2"
        >
          <i class="fa-solid fa-user-plus"></i>
          <span>Tạo Tài Khoản Mới</span>
        </button>
      </div>
    </div>
  {:else}
    <!-- Profile Hero Card (Modern Gradient & Stats) -->
    <div class="glass-panel rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
      <div class="absolute top-0 right-0 w-80 h-80 bg-blue-50/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <!-- Avatar & Basic Identity -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-5">
          <div class="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-blue-100 text-blue-900 flex items-center justify-center font-black text-3xl shadow-sm border-2 border-white shrink-0 overflow-hidden group">
            {#if appStore.currentCustomer.avatar}
              <img src={appStore.currentCustomer.avatar} alt="Avatar" class="w-full h-full object-cover" />
            {:else}
              <span>{appStore.currentCustomer.fullName.charAt(0)}</span>
            {/if}
          </div>

          <div class="space-y-1.5">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl sm:text-3xl font-black text-blue-950">{appStore.currentCustomer.fullName}</h1>
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-1">
                <i class="fa-solid fa-shield-halved text-[10px]"></i>
                Khách Hàng Thân Thiết
              </span>
            </div>
            <p class="text-xs text-slate-500 font-mono flex items-center gap-2">
              <span>@{appStore.currentCustomer.username}</span>
              <span>•</span>
              <span>Tham gia: {appStore.currentCustomer.createdAt || 'Mới tham gia'}</span>
            </p>
            {#if appStore.currentCustomer.bio}
              <p class="text-xs text-slate-600 italic">{appStore.currentCustomer.bio}</p>
            {/if}
          </div>
        </div>

        <!-- Quick Action Buttons -->
        <div class="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <button
            type="button"
            onclick={() => appStore.setTab('orders')}
            class="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer flex items-center gap-2"
          >
            <i class="fa-solid fa-box-archive text-blue-900"></i>
            <span>Đơn Hàng ({customerOrders.length})</span>
          </button>
          <button
            type="button"
            onclick={() => appStore.logoutCustomer()}
            class="px-4 py-2.5 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer flex items-center gap-2"
          >
            <i class="fa-solid fa-right-from-bracket"></i>
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>

      <!-- Quick Summary Stats Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-slate-100 text-xs">
        <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
          <span class="text-slate-400 block text-[11px] font-medium">Tổng Đơn Hàng</span>
          <strong class="text-base font-black text-blue-950 mt-0.5 block">{customerOrders.length} đơn</strong>
        </div>
        <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
          <span class="text-slate-400 block text-[11px] font-medium">Tổng Chi Tiêu</span>
          <strong class="text-base font-black text-emerald-700 mt-0.5 block">{formatCurrency(totalSpent)}</strong>
        </div>
        <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 col-span-2 sm:col-span-1">
          <span class="text-slate-400 block text-[11px] font-medium">Đánh Giá Đã Gửi</span>
          <strong class="text-base font-black text-blue-900 mt-0.5 block">{myReviews.length} nhận xét</strong>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs for Profile Views -->
    <div class="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
      <button
        type="button"
        onclick={() => activeSection = 'profile'}
        class="px-5 py-3 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 {activeSection === 'profile'
          ? 'bg-blue-900 text-white shadow-md'
          : 'text-slate-600 hover:bg-slate-100'}"
      >
        <i class="fa-solid fa-id-card"></i>
        <span>Thông Tin Chi Tiết & Địa Chỉ</span>
      </button>

      <button
        type="button"
        onclick={() => activeSection = 'reviews'}
        class="px-5 py-3 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 relative {activeSection === 'reviews'
          ? 'bg-blue-900 text-white shadow-md'
          : 'text-slate-600 hover:bg-slate-100'}"
      >
        <i class="fa-solid fa-star"></i>
        <span>Đánh Giá & Nhận Xét Của Tôi</span>
        {#if myReviews.length > 0}
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold {activeSection === 'reviews' ? 'bg-white text-blue-900' : 'bg-blue-100 text-blue-900'}">
            {myReviews.length}
          </span>
        {/if}
      </button>

      <button
        type="button"
        onclick={() => activeSection = 'security'}
        class="px-5 py-3 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 {activeSection === 'security'
          ? 'bg-blue-900 text-white shadow-md'
          : 'text-slate-600 hover:bg-slate-100'}"
      >
        <i class="fa-solid fa-lock"></i>
        <span>Đổi Mật Khẩu & Bảo Mật</span>
      </button>
    </div>

    <!-- TAB 1: THÔNG TIN CHI TIẾT & ĐỊA CHỈ KHÁCH HÀNG -->
    {#if activeSection === 'profile'}
      <form onsubmit={handleSaveProfile} class="space-y-6">
        <div class="glass-panel rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <!-- Section Heading -->
          <div class="border-b border-slate-100 pb-4">
            <h3 class="text-lg font-black text-blue-950 flex items-center gap-2">
              <i class="fa-solid fa-user-pen text-blue-900"></i>
              Thông Tin Khách Hàng Cơ Bản
            </h3>
            <p class="text-xs text-slate-500 mt-1">Cập nhật họ tên, thông tin liên lạc và hồ sơ cá nhân</p>
          </div>

          <!-- Avatar Management Section: Chỉ cho phép chữ cái đầu hoặc tải file lên -->
          <div class="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <span class="text-xs font-bold text-slate-800 uppercase tracking-wider block">Ảnh Đại Diện / Avatar</span>
                <p class="text-[11px] text-slate-500 mt-0.5">Lựa chọn dùng chữ cái đầu mặc định hoặc tải ảnh từ máy tính / điện thoại lên</p>
              </div>
              {#if avatar}
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                  <i class="fa-solid fa-image"></i> Đang dùng ảnh tải lên
                </span>
              {:else}
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <i class="fa-solid fa-font"></i> Đang dùng chữ cái đầu
                </span>
              {/if}
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center gap-5 pt-1">
              <!-- Current Avatar Display -->
              <div class="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 shrink-0 shadow-xs flex items-center justify-center bg-blue-100 text-blue-900 font-black text-2xl">
                {#if avatar}
                  <img src={avatar} alt="Avatar" class="w-full h-full object-cover" />
                {:else}
                  <span>{fullName ? fullName.trim().charAt(0).toUpperCase() : 'U'}</span>
                {/if}
              </div>

              <!-- Action Controls: Upload File or Use Initial Letter -->
              <div class="space-y-2.5 flex-grow">
                <div class="flex flex-wrap items-center gap-3">
                  <!-- Upload file button -->
                  <label class="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition shadow-xs cursor-pointer inline-flex items-center gap-2">
                    <i class="fa-solid fa-cloud-arrow-up text-sm"></i>
                    <span>Tải File Ảnh Lên</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                      onchange={handleAvatarFileUpload}
                      class="hidden"
                    />
                  </label>

                  <!-- Use Initial Letter button -->
                  <button
                    type="button"
                    onclick={useInitialLetterAvatar}
                    class="px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-2 {avatar
                      ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-800 pointer-events-none'}"
                  >
                    <i class="fa-solid fa-font text-sm"></i>
                    <span>{avatar ? 'Xóa Ảnh, Dùng Chữ Cái Đầu' : 'Đang Dùng Chữ Cái Đầu'}</span>
                  </button>
                </div>

                <p class="text-[11px] text-slate-500">
                  Hỗ trợ định dạng file ảnh: <strong>PNG, JPG, JPEG, WebP, SVG</strong> (dung lượng tối đa 3MB).
                </p>
              </div>
            </div>
          </div>

          <!-- Basic Input Fields -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div class="space-y-1.5">
              <label for="prof-fn" class="font-bold text-slate-700 uppercase tracking-wider">Họ và Tên *</label>
              <input
                id="prof-fn"
                type="text"
                bind:value={fullName}
                required
                placeholder="Nguyễn Văn A..."
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
              />
            </div>

            <div class="space-y-1.5">
              <label for="prof-un" class="font-bold text-slate-400 uppercase tracking-wider">Tên Đăng Nhập (Cố định)</label>
              <input
                id="prof-un"
                type="text"
                value={appStore.currentCustomer.username}
                disabled
                class="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 font-mono cursor-not-allowed"
              />
            </div>

            <div class="space-y-1.5">
              <label for="prof-phone" class="font-bold text-slate-700 uppercase tracking-wider">Số Điện Thoại Nhận Hàng</label>
              <input
                id="prof-phone"
                type="tel"
                bind:value={phone}
                placeholder="0912345678..."
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
              />
            </div>

            <div class="space-y-1.5">
              <label for="prof-email" class="font-bold text-slate-700 uppercase tracking-wider">Địa Chỉ Email</label>
              <input
                id="prof-email"
                type="email"
                bind:value={email}
                placeholder="khachhang@example.com..."
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
              />
            </div>

            <div class="space-y-1.5">
              <span class="font-bold text-slate-700 uppercase tracking-wider block">Giới Tính</span>
              <div class="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onclick={() => gender = 'male'}
                  class="flex-1 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer {gender === 'male' ? 'bg-blue-900 text-white border-blue-900' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'}"
                >
                  <i class="fa-solid fa-mars mr-1"></i> Nam
                </button>
                <button
                  type="button"
                  onclick={() => gender = 'female'}
                  class="flex-1 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer {gender === 'female' ? 'bg-blue-900 text-white border-blue-900' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'}"
                >
                  <i class="fa-solid fa-venus mr-1"></i> Nữ
                </button>
                <button
                  type="button"
                  onclick={() => gender = 'other'}
                  class="flex-1 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer {gender === 'other' ? 'bg-blue-900 text-white border-blue-900' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'}"
                >
                  Khác
                </button>
              </div>
            </div>

            <div class="space-y-1.5">
              <label for="prof-bday" class="font-bold text-slate-700 uppercase tracking-wider">Ngày Sinh</label>
              <input
                id="prof-bday"
                type="date"
                bind:value={birthday}
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
              />
            </div>
          </div>

          <div class="space-y-1.5 text-xs">
            <label for="prof-bio" class="font-bold text-slate-700 uppercase tracking-wider">Ghi Chú Cá Nhân / Giới Thiệu Bản Thân</label>
            <input
              id="prof-bio"
              type="text"
              bind:value={bio}
              placeholder="Sở thích mua sắm, phong cách công nghệ..."
              class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
            />
          </div>
        </div>

        <!-- Section 2: Detailed Shipping Address -->
        <div class="glass-panel rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <div class="border-b border-slate-100 pb-4">
            <h3 class="text-lg font-black text-blue-950 flex items-center gap-2">
              <i class="fa-solid fa-location-dot text-blue-900"></i>
              Địa Chỉ Giao Hàng Mặc Định
            </h3>
            <p class="text-xs text-slate-500 mt-1">Thông tin này sẽ tự động điền sẵn khi bạn thanh toán đơn hàng mới</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
            <div class="space-y-1.5">
              <label for="prof-city" class="font-bold text-slate-700 uppercase tracking-wider">Tỉnh / Thành Phố</label>
              <input
                id="prof-city"
                type="text"
                bind:value={city}
                placeholder="Hà Nội, TP.HCM, Đà Nẵng..."
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
              />
            </div>

            <div class="space-y-1.5">
              <label for="prof-dist" class="font-bold text-slate-700 uppercase tracking-wider">Quận / Huyện</label>
              <input
                id="prof-dist"
                type="text"
                bind:value={district}
                placeholder="Quận Cầu Giấy, Quận 1..."
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
              />
            </div>

            <div class="space-y-1.5">
              <label for="prof-ward" class="font-bold text-slate-700 uppercase tracking-wider">Phường / Xã</label>
              <input
                id="prof-ward"
                type="text"
                bind:value={ward}
                placeholder="Phường Dịch Vọng, Phường Bến Nghé..."
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
              />
            </div>
          </div>

          <div class="space-y-1.5 text-xs">
            <label for="prof-addr" class="font-bold text-slate-700 uppercase tracking-wider">Địa Chỉ Chi Tiết (Số nhà, Tên đường, Tòa nhà)</label>
            <textarea
              id="prof-addr"
              bind:value={address}
              rows={3}
              placeholder="Ví dụ: Tầng 5 Tòa nhà Keangnam, đường Phạm Hùng..."
              class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
            ></textarea>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSavingProfile}
            class="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm transition shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <i class="fa-solid fa-floppy-disk"></i>
            <span>{isSavingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi Thông Tin'}</span>
          </button>
        </div>
      </form>
    {/if}

    <!-- TAB 2: QUẢN LÝ ĐÁNH GIÁ & BÌNH LUẬN ĐÃ ĐĂNG -->
    {#if activeSection === 'reviews'}
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 class="text-xl font-black text-blue-950 flex items-center gap-2">
              <i class="fa-solid fa-comments text-blue-900"></i>
              Bình Luận & Đánh Giá Đã Đăng ({myReviews.length})
            </h3>
            <p class="text-xs text-slate-500 mt-1">
              Quản lý toàn bộ các đánh giá, chỉnh sửa nội dung hoặc xóa đánh giá của bạn trên các sản phẩm
            </p>
          </div>

          <button
            type="button"
            onclick={() => appStore.setTab('shop')}
            class="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <i class="fa-solid fa-bag-shopping text-blue-900"></i>
            <span>Khám Phá Thêm Sản Phẩm</span>
          </button>
        </div>

        {#if myReviews.length === 0}
          <div class="glass-panel rounded-3xl p-10 sm:p-14 text-center border border-slate-200 bg-white space-y-4 shadow-2xs">
            <div class="w-16 h-16 rounded-3xl bg-blue-50 text-blue-900 flex items-center justify-center text-2xl mx-auto">
              <i class="fa-regular fa-star"></i>
            </div>
            <h4 class="text-lg font-bold text-blue-950">Bạn chưa đăng đánh giá nào</h4>
            <p class="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Hãy đặt mua sản phẩm và chia sẻ cảm nhận thực tế của bạn để giúp cộng đồng khách hàng có thêm thông tin hữu ích!
            </p>
            <div class="pt-2">
              <button
                type="button"
                onclick={() => appStore.setTab('shop')}
                class="px-6 py-3 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition shadow-sm cursor-pointer inline-flex items-center gap-2"
              >
                <i class="fa-solid fa-cart-shopping"></i>
                <span>Xem Danh Sách Sản Phẩm</span>
              </button>
            </div>
          </div>
        {:else}
          <div class="space-y-4">
            {#each myReviews as rev}
              {@const prod = getProduct(rev.productId)}
              {@const isEditing = editingReviewId === rev.id}

              <div class="glass-panel rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-xs transition hover:border-slate-300">
                <!-- Linked Product Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  {#if prod}
                    <button
                      type="button"
                      onclick={() => navigateToProduct(prod.id)}
                      class="flex items-center gap-3 text-left group cursor-pointer"
                    >
                      <img
                        src={prod.image}
                        alt={prod.name}
                        class="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition"
                      />
                      <div>
                        <span class="text-[10px] font-bold text-blue-900 uppercase tracking-wider">{prod.category}</span>
                        <h4 class="text-xs sm:text-sm font-bold text-blue-950 group-hover:text-blue-700 transition line-clamp-1">
                          {prod.name}
                        </h4>
                        <span class="text-[11px] font-semibold text-slate-500">{formatCurrency(prod.price)}</span>
                      </div>
                    </button>
                  {:else}
                    <div class="text-xs text-slate-400 italic">Sản phẩm #{rev.productId}</div>
                  {/if}

                  <span class="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <i class="fa-regular fa-clock"></i>
                    {rev.createdAt}
                  </span>
                </div>

                {#if isEditing}
                  <!-- Inline Review Edit Form -->
                  <div class="space-y-4 bg-blue-50/50 p-4 sm:p-5 rounded-2xl border border-blue-200 animate-in fade-in duration-150">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-blue-950">Chỉnh Sửa Đánh Giá & Số Sao:</span>
                      <div class="flex items-center gap-1">
                        {#each [1, 2, 3, 4, 5] as star}
                          <button
                            type="button"
                            onclick={() => editRating = star}
                            class="text-lg transition cursor-pointer p-0.5 hover:scale-110"
                            aria-label="{star} sao"
                          >
                            <i class="fa-solid fa-star {star <= editRating ? 'text-amber-400' : 'text-slate-300'}"></i>
                          </button>
                        {/each}
                      </div>
                    </div>

                    <div class="space-y-1">
                      <label for="edit-comment-{rev.id}" class="text-xs font-semibold text-slate-700">Nội dung nhận xét:</label>
                      <textarea
                        id="edit-comment-{rev.id}"
                        bind:value={editComment}
                        rows={3}
                        class="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 leading-relaxed"
                      ></textarea>
                    </div>

                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        onclick={cancelEditingReview}
                        class="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onclick={() => saveEditedReview(rev.id)}
                        disabled={isSavingReview}
                        class="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <i class="fa-solid fa-check"></i>
                        <span>{isSavingReview ? 'Đang lưu...' : 'Lưu Đánh Giá'}</span>
                      </button>
                    </div>
                  </div>
                {:else}
                  <!-- View Mode of the Review -->
                  <div class="space-y-2.5">
                    <!-- Rating Stars -->
                    <div class="flex items-center gap-2">
                      <div class="flex items-center text-amber-400 text-xs">
                        {#each Array(5) as _, i}
                          <i class="fa-solid fa-star {i < rev.rating ? 'text-amber-400' : 'text-slate-200'}"></i>
                        {/each}
                      </div>
                      <span class="text-xs font-bold text-slate-700">{rev.rating}/5 sao</span>
                      {#if rev.verifiedPurchase}
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <i class="fa-solid fa-circle-check"></i> Đã mua hàng
                        </span>
                      {/if}
                    </div>

                    <!-- Review Comment Content -->
                    <p class="text-xs sm:text-sm text-slate-800 leading-relaxed">
                      {rev.comment}
                    </p>

                    <!-- Attached Review Images -->
                    {#if rev.images && rev.images.length > 0}
                      <div class="flex flex-wrap gap-2 pt-1">
                        {#each rev.images as img}
                          <img
                            src={img}
                            alt="Ảnh đính kèm"
                            class="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-2xs"
                          />
                        {/each}
                      </div>
                    {/if}
                  </div>

                  <!-- Admin Reply Box (If Shop has replied) -->
                  {#if rev.adminReply}
                    <div class="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 text-xs space-y-1.5 ml-2 sm:ml-4">
                      <div class="flex items-center justify-between text-blue-950 font-bold">
                        <div class="flex items-center gap-1.5">
                          <i class="fa-solid fa-reply text-blue-900"></i>
                          <span>{rev.adminReply.replierName || 'Phản hồi từ Ban Quản Trị CSET Store'}</span>
                          <span class="text-[9px] px-1.5 py-0.2 rounded bg-blue-900 text-white font-normal uppercase">Shop</span>
                        </div>
                        <span class="text-[10px] text-slate-400 font-mono">{rev.adminReply.repliedAt}</span>
                      </div>
                      <p class="text-slate-700 leading-relaxed text-[11px] sm:text-xs">
                        {rev.adminReply.reply}
                      </p>
                    </div>
                  {/if}

                  <!-- Actions: Edit and Delete -->
                  <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onclick={() => startEditingReview(rev)}
                      class="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-blue-50 hover:text-blue-900 text-slate-600 font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <i class="fa-solid fa-pen-to-square"></i>
                      <span>Sửa Đánh Giá</span>
                    </button>
                    <button
                      type="button"
                      onclick={() => handleDeleteReview(rev.id)}
                      class="px-3.5 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <i class="fa-solid fa-trash-can"></i>
                      <span>Xóa</span>
                    </button>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- TAB 3: ĐỔI MẬT KHẨU & BẢO MẬT -->
    {#if activeSection === 'security'}
      <form onsubmit={handleSavePassword} class="space-y-6 max-w-xl">
        <div class="glass-panel rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <div class="border-b border-slate-100 pb-4">
            <h3 class="text-lg font-black text-blue-950 flex items-center gap-2">
              <i class="fa-solid fa-key text-blue-900"></i>
              Đổi Mật Khẩu Đăng Nhập
            </h3>
            <p class="text-xs text-slate-500 mt-1">Nên sử dụng mật khẩu mạnh có chứa chữ in hoa, số và ký tự đặc biệt</p>
          </div>

          {#if passwordError}
            <div class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <i class="fa-solid fa-triangle-exclamation text-rose-600 text-sm"></i>
              <span>{passwordError}</span>
            </div>
          {/if}

          {#if passwordSuccess}
            <div class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <i class="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
              <span>{passwordSuccess}</span>
            </div>
          {/if}

          <div class="space-y-4 text-xs">
            <div class="space-y-1.5">
              <label for="pwd-cur" class="font-bold text-slate-700 uppercase tracking-wider">Mật Khẩu Hiện Tại (Nếu có)</label>
              <input
                id="pwd-cur"
                type="password"
                bind:value={currentPassword}
                placeholder="Nhập mật khẩu hiện tại..."
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
              />
            </div>

            <div class="space-y-1.5">
              <label for="pwd-new" class="font-bold text-slate-700 uppercase tracking-wider">Mật Khẩu Mới *</label>
              <input
                id="pwd-new"
                type="password"
                bind:value={newPassword}
                required
                placeholder="Nhập mật khẩu mới..."
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
              />

              <!-- Password Strength Meter -->
              {#if newPassword}
                <div class="space-y-1.5 pt-1">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="text-slate-500">Độ mạnh mật khẩu:</span>
                    <strong class="font-bold {strength.colorClass.split(' ')[1]}">{strength.label}</strong>
                  </div>
                  <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full transition-all duration-300 {strength.colorClass.split(' ')[0]}" style="width: {strength.barWidth}"></div>
                  </div>
                  {#if strength.suggestions.length > 0}
                    <ul class="text-[10px] text-slate-500 space-y-0.5 list-disc pl-4 pt-1">
                      {#each strength.suggestions as sug}
                        <li>{sug}</li>
                      {/each}
                    </ul>
                  {/if}
                </div>
              {/if}
            </div>

            <div class="space-y-1.5">
              <label for="pwd-conf" class="font-bold text-slate-700 uppercase tracking-wider">Xác Nhận Mật Khẩu Mới *</label>
              <input
                id="pwd-conf"
                type="password"
                bind:value={confirmPassword}
                required
                placeholder="Nhập lại mật khẩu mới..."
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
              />
            </div>
          </div>

          <div class="pt-2">
            <button
              type="submit"
              disabled={isSavingPassword}
              class="w-full py-3.5 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm transition shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <i class="fa-solid fa-shield-halved"></i>
              <span>{isSavingPassword ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}</span>
            </button>
          </div>
        </div>
      </form>
    {/if}
  {/if}
</div>
