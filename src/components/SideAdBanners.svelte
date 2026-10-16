<script lang="ts">
  import { themeStore } from '../stores/themeStore.svelte';
  import type { AdItem } from '../models/types';

  function isBannerActive(b: AdItem): boolean {
    if (!b.enabled) return false;
    const now = Date.now();
    if (b.startDate) {
      const start = new Date(b.startDate).getTime();
      if (!isNaN(start) && now < start) return false;
    }
    if (b.endDate) {
      const end = new Date(b.endDate).getTime();
      if (!isNaN(end) && now > end) return false;
    }
    return true;
  }

  let leftBanners = $derived(
    themeStore.theme.banners?.filter(b => b.position === 'side-left' && isBannerActive(b)) || []
  );

  let rightBanners = $derived(
    themeStore.theme.banners?.filter(b => b.position === 'side-right' && isBannerActive(b)) || []
  );

  let hasTopBanner = $derived(
    themeStore.theme.visibility.showTopAdBanner &&
    (themeStore.theme.banners?.some(b => b.position === 'top' && isBannerActive(b)) ?? false)
  );
  let isSectionVisible = $derived(
    themeStore.theme.visibility.showSideAdBanners && (leftBanners.length > 0 || rightBanners.length > 0)
  );

  let closedIds = $state<string[]>([]);

  // When top banner is visible: Top Banner (~40px) + Header (80px) = side banner should start cleanly at top-36 (144px)
  // When top banner is hidden: Header (80px) = side banner should start cleanly at top-24 (96px)
  let sideTopClass = $derived(hasTopBanner ? 'top-36' : 'top-24');
  let bannerWidthClass = 'w-44';
</script>

{#if isSectionVisible}
  <!-- Left Side Banners (Positioned on 1920px Canvas) -->
  {#if leftBanners.length > 0}
    <aside
      class="absolute left-6 {sideTopClass} z-20 {bannerWidthClass} space-y-3 transition-all duration-200"
      aria-label="Banner quảng cáo bên trái"
    >
      {#each leftBanners as banner (banner.id)}
        {#if !closedIds.includes(banner.id)}
          <div class="rounded-xl border border-slate-300 shadow-md overflow-hidden bg-white relative group">
            <button
              type="button"
              onclick={() => closedIds = [...closedIds, banner.id]}
              class="absolute top-1 right-1 z-10 w-4 h-4 rounded-full bg-black/60 hover:bg-black/90 text-white text-[9px] flex items-center justify-center transition cursor-pointer"
              title="Đóng banner này"
              aria-label="Đóng banner"
            >
              ✕
            </button>

            {#if banner.type === 'image' && banner.imageUrl}
              <a href={banner.linkUrl || '#'} class="block group-hover:opacity-95 transition">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  class="w-full h-auto max-h-72 3xl:max-h-80 object-cover"
                />
                {#if banner.title}
                  <div class="p-2 bg-slate-900 text-white text-center">
                    <p class="font-bold text-[10px] line-clamp-1">{banner.title}</p>
                    {#if banner.subtitle}
                      <p class="text-[9px] text-slate-300 line-clamp-1">{banner.subtitle}</p>
                    {/if}
                  </div>
                {/if}
              </a>
            {:else}
              <div
                class="p-3 flex flex-col justify-between h-48 text-center"
                style="background-color: {banner.bgColor || '#f1f5f9'}; color: {banner.textColor || '#0f172a'};"
              >
                <div class="space-y-1 mt-2">
                  <h6 class="text-[11px] font-bold leading-tight line-clamp-2">{banner.title}</h6>
                  {#if banner.subtitle}
                    <p class="text-[9px] opacity-80 leading-tight line-clamp-2">{banner.subtitle}</p>
                  {/if}
                </div>

                <a
                  href={banner.linkUrl || '#'}
                  class="px-2 py-1 rounded bg-slate-900 text-white text-[10px] font-semibold hover:bg-slate-800 transition shadow-xs mt-2"
                >
                  {banner.linkText || 'Xem Ngay'}
                </a>
              </div>
            {/if}
          </div>
        {/if}
      {/each}
    </aside>
  {/if}

  <!-- Right Side Banners (Multi-banner dynamic stack) -->
  {#if rightBanners.length > 0}
    <aside
      class="absolute right-6 {sideTopClass} z-20 {bannerWidthClass} space-y-3 transition-all duration-200"
      aria-label="Banner quảng cáo bên phải"
    >
      {#each rightBanners as banner (banner.id)}
        {#if !closedIds.includes(banner.id)}
          <div class="rounded-xl border border-slate-300 shadow-md overflow-hidden bg-white relative group">
            <button
              type="button"
              onclick={() => closedIds = [...closedIds, banner.id]}
              class="absolute top-1 right-1 z-10 w-4 h-4 rounded-full bg-black/60 hover:bg-black/90 text-white text-[9px] flex items-center justify-center transition cursor-pointer"
              title="Đóng banner này"
              aria-label="Đóng banner"
            >
              ✕
            </button>

            {#if banner.type === 'image' && banner.imageUrl}
              <a href={banner.linkUrl || '#'} class="block group-hover:opacity-95 transition">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  class="w-full h-auto max-h-72 3xl:max-h-80 object-cover"
                />
                {#if banner.title}
                  <div class="p-2 bg-slate-900 text-white text-center">
                    <p class="font-bold text-[10px] line-clamp-1">{banner.title}</p>
                    {#if banner.subtitle}
                      <p class="text-[9px] text-slate-300 line-clamp-1">{banner.subtitle}</p>
                    {/if}
                  </div>
                {/if}
              </a>
            {:else}
              <div
                class="p-3 flex flex-col justify-between h-48 text-center"
                style="background-color: {banner.bgColor || '#f1f5f9'}; color: {banner.textColor || '#0f172a'};"
              >
                <div class="space-y-1 mt-2">
                  <h6 class="text-[11px] font-bold leading-tight line-clamp-2">{banner.title}</h6>
                  {#if banner.subtitle}
                    <p class="text-[9px] opacity-80 leading-tight line-clamp-2">{banner.subtitle}</p>
                  {/if}
                </div>

                <a
                  href={banner.linkUrl || '#'}
                  class="px-2 py-1 rounded bg-slate-900 text-white text-[10px] font-semibold hover:bg-slate-800 transition shadow-xs mt-2"
                >
                  {banner.linkText || 'Khám Phá'}
                </a>
              </div>
            {/if}
          </div>
        {/if}
      {/each}
    </aside>
  {/if}
{/if}
