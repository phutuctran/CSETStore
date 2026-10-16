<script lang="ts">
  import { appStore } from '../stores/store.svelte';
</script>

{#if appStore.toastMessage}
  <div class="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
    <div class="bg-blue-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 border border-blue-800">
      <div class="w-7 h-7 bg-blue-800 text-white rounded-full flex items-center justify-center shrink-0">
        <i class="fa-solid fa-check text-xs"></i>
      </div>
      <p class="text-sm font-semibold pr-2">{appStore.toastMessage}</p>
      <button
        type="button"
        onclick={() => appStore.toastMessage = null}
        class="text-blue-300 hover:text-white text-sm cursor-pointer ml-auto"
        aria-label="Đóng thông báo"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  </div>
{/if}
