import type { ThemeConfig } from '../models/types';
import { LocalStorageThemeRepository } from '../repositories';

const themeRepo = new LocalStorageThemeRepository();

class ThemeStore {
  theme = $state<ThemeConfig>(themeRepo.getTheme());

  constructor() {
    if (typeof window !== 'undefined') {
      this.applyBrowserMeta(this.theme);

      // 1. Cross-window storage listener
      window.addEventListener('storage', (e) => {
        if (e.key === 'cset_theme_config_v5' && e.newValue) {
          try {
            this.theme = JSON.parse(e.newValue);
            this.applyBrowserMeta(this.theme);
          } catch {}
        }
      });

      // 2. Same-window custom event listener (immediate local reaction)
      window.addEventListener('cset_theme_updated', ((e: CustomEvent<ThemeConfig>) => {
        if (e.detail) {
          this.theme = { ...e.detail };
          this.applyBrowserMeta(this.theme);
        }
      }) as EventListener);

      // 3. BroadcastChannel for instant cross-tab real-time sync
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('cset_theme_sync');
          bc.onmessage = (msg) => {
            if (msg.data && typeof msg.data === 'object') {
              this.theme = { ...msg.data };
              this.applyBrowserMeta(this.theme);
            }
          };
        } catch {}
      }

      // 4. Fetch latest theme from SQL API
      fetch('/api/theme')
        .then(r => r.ok ? r.json() : null)
        .then(res => {
          if (res?.success && res.data) {
            this.theme = { ...res.data };
            this.applyBrowserMeta(this.theme);
          }
        })
        .catch(() => {});
    }
  }

  applyBrowserMeta(t: ThemeConfig) {
    if (typeof document === 'undefined') return;
    if (t.browserTitle) {
      document.title = t.browserTitle;
    }
    if (t.faviconImage) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = t.faviconImage;
    }
  }

  saveTheme(newTheme: ThemeConfig) {
    this.theme = { ...newTheme };
    themeRepo.saveTheme(this.theme);
    this.applyBrowserMeta(this.theme);
  }
  resetTheme() {
    this.theme = themeRepo.resetTheme();
  }
}

export const themeStore = new ThemeStore();
