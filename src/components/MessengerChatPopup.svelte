<script lang="ts">
  import { themeStore } from '../stores/themeStore.svelte';

  let isOpen = $state(false);

  // Derive target Facebook Messenger URL from settings
  let messengerUrl = $derived.by(() => {
    const raw = (themeStore.theme.socials?.messengerPageId || '').trim();
    if (!raw) return 'https://m.me/csetstore';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://m.me/${raw.replace(/^@/, '')}`;
  });

  // Extract clean page ID for Meta XFBML attributes
  let pageId = $derived.by(() => {
    const raw = (themeStore.theme.socials?.messengerPageId || '').trim();
    if (!raw || raw === 'https://m.me' || raw === 'https://m.me/' || raw === 'http://m.me') {
      return '106148332115160';
    }
    const match = raw.match(/(?:facebook\.com\/|m\.me\/)?([a-zA-Z0-9.]+)\/?$/);
    return match && match[1] !== 'm.me' ? match[1] : '106148332115160';
  });

  function openMessengerChat(query?: string) {
    let target = messengerUrl;
    if (query) {
      try {
        const u = new URL(target);
        u.searchParams.set('ref', encodeURIComponent(query));
        target = u.toString();
      } catch {}
    }
    window.open(target, '_blank', 'noopener,noreferrer');
  }

  // Load Meta Facebook SDK in the background for compatibility
  $effect(() => {
    if (typeof window === 'undefined') return;

    const chatbox = document.getElementById('fb-customer-chat');
    if (chatbox) {
      chatbox.setAttribute('page_id', pageId);
      chatbox.setAttribute('attribution', 'biz_inbox');
      chatbox.setAttribute('alignment', 'left');
    }

    const win = window as unknown as {
      fbAsyncInit?: () => void;
      FB?: {
        init: (options: { xfbml: boolean; version: string }) => void;
        XFBML?: { parse: () => void };
      };
    };

    win.fbAsyncInit = function() {
      if (win.FB) {
        win.FB.init({
          xfbml: true,
          version: 'v21.0'
        });
      }
    };

    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = 'https://connect.facebook.net/vi_VN/sdk/xfbml.customerchat.js';
      document.body.appendChild(js);
    }
  });
</script>

<!-- Official Meta XFBML background containers -->
<div id="fb-root"></div>
<div id="fb-customer-chat" class="fb-customerchat"></div>

<!-- Floating Circular Messenger Widget (Bottom-Left Corner) -->
<div class="fixed bottom-6 left-6 z-50 select-none font-sans" aria-label="Hỗ trợ chat Messenger">
  <!-- Interactive Messenger Popup Card -->
  {#if isOpen}
    <div
      class="absolute bottom-18 left-0 w-80 sm:w-88 bg-white border border-slate-200 rounded-3xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200"
      role="dialog"
      aria-modal="true"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#006AFF] to-[#00B2FE] text-white flex items-center justify-center text-xl shadow-xs">
            <i class="fa-brands fa-facebook-messenger"></i>
          </div>
          <div>
            <h4 class="text-sm font-black text-blue-950 flex items-center gap-1.5">
              <span>{themeStore.theme.storeName}</span>
              <i class="fa-solid fa-circle-check text-blue-600 text-xs" title="Chính thức"></i>
            </h4>
            <div class="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Thường trả lời ngay</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onclick={() => isOpen = false}
          class="w-7 h-7 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-sm cursor-pointer transition"
          aria-label="Đóng cửa sổ chat"
        >
          ✕
        </button>
      </div>

      <!-- Welcome Message & Instructions -->
      <div class="space-y-2">
        <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed space-y-1">
          <p class="font-bold text-blue-950">Chào bạn! Rất vui được hỗ trợ bạn.</p>
          <p class="text-[11px] text-slate-500">
            Đăng nhập Facebook để nhắn tin trực tiếp và nhận tư vấn nhanh nhất từ fanpage chính thức của CSET Store.
          </p>
        </div>

        <!-- Quick Question Suggestions -->
        <div class="space-y-1.5 pt-1">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gợi ý chủ đề nhanh:</span>
          <div class="flex flex-col gap-1.5">
            <button
              type="button"
              onclick={() => openMessengerChat('Tư vấn thông tin sản phẩm và khuyến mãi')}
              class="w-full text-left px-3 py-2 rounded-xl bg-blue-50/60 hover:bg-blue-100/70 border border-blue-100 text-xs text-blue-950 font-semibold transition cursor-pointer flex items-center justify-between"
            >
              <span>💬 Tư vấn sản phẩm & ưu đãi</span>
              <i class="fa-solid fa-arrow-right text-[10px] text-blue-600"></i>
            </button>
            <button
              type="button"
              onclick={() => openMessengerChat('Tra cứu tiến độ đơn hàng')}
              class="w-full text-left px-3 py-2 rounded-xl bg-blue-50/60 hover:bg-blue-100/70 border border-blue-100 text-xs text-blue-950 font-semibold transition cursor-pointer flex items-center justify-between"
            >
              <span>📦 Tra cứu tiến độ đơn hàng</span>
              <i class="fa-solid fa-arrow-right text-[10px] text-blue-600"></i>
            </button>
            <button
              type="button"
              onclick={() => openMessengerChat('Nhận mã giảm giá và voucher hôm nay')}
              class="w-full text-left px-3 py-2 rounded-xl bg-blue-50/60 hover:bg-blue-100/70 border border-blue-100 text-xs text-blue-950 font-semibold transition cursor-pointer flex items-center justify-between"
            >
              <span>🎁 Nhận voucher khuyến mãi</span>
              <i class="fa-solid fa-arrow-right text-[10px] text-blue-600"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Action Button: Open Facebook Messenger -->
      <button
        type="button"
        onclick={() => openMessengerChat()}
        class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#006AFF] to-[#00B2FE] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
      >
        <i class="fa-brands fa-facebook-messenger text-base"></i>
        <span>Đăng Nhập Facebook & Nhắn Tin</span>
      </button>
    </div>
  {/if}

  <!-- Circular Floating Messenger Button -->
  <div class="relative group">
    <button
      type="button"
      onclick={() => isOpen = !isOpen}
      class="w-14 h-14 rounded-full bg-gradient-to-tr from-[#006AFF] to-[#00B2FE] text-white shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer relative z-10"
      aria-label="Mở khung chat Messenger"
      title="Nhắn tin với CSET Store qua Facebook Messenger"
    >
      <i class="fa-brands fa-facebook-messenger text-2xl transition-transform duration-200 {isOpen ? 'rotate-90 scale-90' : ''}"></i>
    </button>

    <!-- Subtle Pulsing Glow Ring behind circular button -->
    {#if !isOpen}
      <span class="absolute -inset-1 rounded-full bg-[#006AFF] opacity-35 animate-ping pointer-events-none"></span>
    {/if}

    <!-- Hover Tooltip -->
    {#if !isOpen}
      <span class="absolute left-16 top-1/2 -translate-y-1/2 whitespace-nowrap bg-blue-950 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none hidden sm:block">
        Chat với CSET Store
      </span>
    {/if}
  </div>
</div>
