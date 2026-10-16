import type { ThemeConfig } from '../models/types';
import { LocalStorageThemeRepository } from '../repositories';

const themeRepo = new LocalStorageThemeRepository();

class ThemeStore {
  theme = $state<ThemeConfig>(themeRepo.getTheme());

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'cset_theme_config_v2' && e.newValue) {
          try {
            this.theme = JSON.parse(e.newValue);
          } catch {
            // ignore malformed
          }
        }
      });
    }
  }

  saveTheme(newTheme: ThemeConfig) {
    this.theme = { ...newTheme };
    themeRepo.saveTheme(this.theme);
  }

  resetTheme() {
    this.theme = themeRepo.resetTheme();
  }
}

export const themeStore = new ThemeStore();
