<script lang="ts">
  interface Props {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  }

  let { currentPage, totalItems, pageSize, onPageChange }: Props = $props();

  let totalPages = $derived(Math.max(1, Math.ceil(totalItems / pageSize)));

  let pageNumbers = $derived.by(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  });
</script>

{#if totalPages > 1}
  <nav class="flex items-center justify-center space-x-1.5 pt-6 text-xs select-none" aria-label="Phân trang sản phẩm">
    <!-- Nút Trước -->
    <button
      type="button"
      disabled={currentPage <= 1}
      onclick={() => onPageChange(currentPage - 1)}
      class="px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1 shadow-2xs"
    >
      <i class="fa-solid fa-chevron-left text-[10px]"></i>
      <span class="hidden sm:inline">Trước</span>
    </button>

    <!-- Danh sách số trang -->
    {#each pageNumbers as page, idx}
      {#if typeof page === 'number'}
        <button
          type="button"
          onclick={() => onPageChange(page)}
          class="w-9 h-9 rounded-xl font-bold transition cursor-pointer flex items-center justify-center {page === currentPage
            ? 'bg-blue-900 text-white shadow-sm'
            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}"
        >
          {page}
        </button>
      {:else}
        <span class="w-7 text-center text-slate-400 font-bold">...</span>
      {/if}
    {/each}

    <!-- Nút Tiếp -->
    <button
      type="button"
      disabled={currentPage >= totalPages}
      onclick={() => onPageChange(currentPage + 1)}
      class="px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1 shadow-2xs"
    >
      <span class="hidden sm:inline">Tiếp</span>
      <i class="fa-solid fa-chevron-right text-[10px]"></i>
    </button>
  </nav>
{/if}
