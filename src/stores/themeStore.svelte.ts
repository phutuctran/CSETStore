import type { ThemeConfig } from '../models/types';
import { LocalStorageThemeRepository } from '../repositories';

const themeRepo = new LocalStorageThemeRepository();

class ThemeStore {
  theme = $state<ThemeConfig>(themeRepo.getTheme());

  constructor() {
    if (typeof window !== 'undefined') {
      this.applyBrowserMeta(this.theme);
      window.addEventListener('storage', (e) => {
        if (e.key === 'cset_theme_config_v5' && e.newValue) {
          try {
            this.theme = JSON.parse(e.newValue);
            this.applyBrowserMeta(this.theme);
          } catch {
            // ignore malformed
          }
        }
      });
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
