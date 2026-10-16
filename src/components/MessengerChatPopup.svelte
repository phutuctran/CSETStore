<script lang="ts">
  import { themeStore } from '../stores/themeStore.svelte';

  // Derive target Facebook Messenger URL from settings
  // Clicking the circular logo opens this URL directly in a new tab/app
  let messengerUrl = $derived.by(() => {
    const raw = (themeStore.theme.socials?.messengerPageId || '').trim();
    if (!raw) return 'https://m.me/csetstore';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://m.me/${raw.replace(/^@/, '')}`;
  });
</script>

<!-- Floating Circular Messenger Button (Bottom-Left Corner) - Directly Opens Messenger -->
<aside class="fixed bottom-6 left-6 z-50 select-none font-sans" aria-label="Hỗ trợ chat Messenger">
  <div class="relative group">
    <a
      href={messengerUrl}
      target="_blank"
      rel="noopener noreferrer"
      class="w-14 h-14 rounded-full bg-gradient-to-tr from-[#006AFF] to-[#00B2FE] text-white shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer relative z-10"
      aria-label="Nhắn tin với CSET Store qua Facebook Messenger"
      title="Nhắn tin với CSET Store qua Facebook Messenger"
    >
      <i class="fa-brands fa-facebook-messenger text-2xl"></i>
    </a>

    <!-- Subtle Pulsing Glow Ring behind circular button -->
    <span class="absolute -inset-1 rounded-full bg-[#006AFF] opacity-35 animate-ping pointer-events-none"></span>

    <!-- Hover Tooltip -->
    <span class="absolute left-16 top-1/2 -translate-y-1/2 whitespace-nowrap bg-blue-950 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none hidden sm:block">
      Chat qua Facebook Messenger
    </span>
  </div>
</aside>
