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

  let topBanners = $derived(
    themeStore.theme.banners?.filter(b => b.position === 'top' && isBannerActive(b)) || []
  );

  let isSectionVisible = $derived(
    themeStore.theme.visibility.showTopAdBanner && topBanners.length > 0
  );

  let dismissedIds = $state<string[]>([]);

  function dismissBanner(id: string) {
    dismissedIds = [...dismissedIds, id];
  }
</script>
{#if isSectionVisible}
  <div class="w-full flex flex-col relative z-40">
    {#each topBanners as banner (banner.id)}
      {#if !dismissedIds.includes(banner.id)}
        {#if banner.type === 'text'}
          <div
            class="w-full text-xs font-semibold py-2.5 px-4 transition-all relative border-b border-black/10"
            style="background-color: {banner.bgColor || '#1e3a8a'}; color: {banner.textColor || '#ffffff'};"
          >
            <div class="max-w-[1800px] mx-auto flex items-center justify-between gap-4">
              <div class="flex-grow text-center flex flex-wrap items-center justify-center gap-2">
                <span>{banner.title}</span>
                {#if banner.subtitle}
                  <span class="opacity-80 text-[11px]">| {banner.subtitle}</span>
                {/if}
                {#if banner.linkText}
                  <a
                    href={banner.linkUrl || '#'}
                    class="underline ml-1 font-bold hover:opacity-90 inline-flex items-center gap-1"
                  >
                    <span>{banner.linkText}</span>
                    <i class="fa-solid fa-arrow-right text-[10px]"></i>
                  </a>
                {/if}
              </div>

              <button
                type="button"
                onclick={() => dismissBanner(banner.id)}
                class="opacity-70 hover:opacity-100 p-1 text-xs transition cursor-pointer shrink-0"
                aria-label="Đóng banner thông báo"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        {:else if banner.type === 'image' && banner.imageUrl}
          <div class="w-full relative bg-slate-900 overflow-hidden border-b border-black/10">
            <a href={banner.linkUrl || '#'} class="block w-full h-full">
              <img
                src={banner.imageUrl}
                alt={banner.title || 'Top Banner'}
                class="w-full h-auto max-h-24 sm:max-h-32 object-cover mx-auto"
              />
            </a>
            <button
              type="button"
              onclick={() => dismissBanner(banner.id)}
              class="absolute top-2 right-4 bg-black/60 hover:bg-black/80 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs transition cursor-pointer"
              aria-label="Đóng banner"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        {/if}
      {/if}
    {/each}
  </div>
{/if}
