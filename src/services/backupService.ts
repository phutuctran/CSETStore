export interface BackupPayload {
  version: string;
  createdAt: string;
  author: string;
  products: unknown[];
  categories: unknown[];
  orders: unknown[];
  users: unknown[];
  theme: unknown;
  reviews: unknown[];
  visitorCount?: number;
}

export class BackupService {
  /**
   * Packages all repository data in localStorage into a single JSON backup payload
   */
  exportFullBackup(author: string): BackupPayload {
    if (typeof window === 'undefined') {
      return {
        version: '4.0.0',
        createdAt: new Date().toISOString(),
        author,
        products: [],
        categories: [],
        orders: [],
        users: [],
        theme: {},
        reviews: []
      };
    }

    const payload: BackupPayload = {
      version: '4.0.0',
      createdAt: new Date().toISOString(),
      author,
      products: JSON.parse(localStorage.getItem('cset_products_v4') || '[]'),
      categories: JSON.parse(localStorage.getItem('cset_categories_v4') || '[]'),
      orders: JSON.parse(localStorage.getItem('cset_orders_v4') || '[]'),
      users: JSON.parse(localStorage.getItem('cset_users_v4') || '[]'),
      theme: JSON.parse(localStorage.getItem('cset_theme_config_v4') || '{}'),
      reviews: JSON.parse(localStorage.getItem('cset_reviews_v4') || '[]'),
      visitorCount: parseInt(localStorage.getItem('cset_visit_count_v4') || '1250', 10)
    };

    return payload;
  }

  /**
   * Downloads the backup payload as a .json file directly to client computer
   */
  downloadBackupFile(author: string): void {
    if (typeof window === 'undefined') return;
    const payload = this.exportFullBackup(author);
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `CSETStore_Backup_Full_${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Restores all data from an imported backup file string and updates localStorage
   */
  restoreFromBackupJSON(rawJson: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(rawJson);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Dữ liệu file không hợp lệ!' };
      }

      if (Array.isArray(data.products)) {
        localStorage.setItem('cset_products_v4', JSON.stringify(data.products));
      }
      if (Array.isArray(data.categories)) {
        localStorage.setItem('cset_categories_v4', JSON.stringify(data.categories));
      }
      if (Array.isArray(data.orders)) {
        localStorage.setItem('cset_orders_v4', JSON.stringify(data.orders));
      }
      if (Array.isArray(data.users)) {
        localStorage.setItem('cset_users_v4', JSON.stringify(data.users));
      }
      if (data.theme && typeof data.theme === 'object') {
        localStorage.setItem('cset_theme_config_v4', JSON.stringify(data.theme));
      }
      if (Array.isArray(data.reviews)) {
        localStorage.setItem('cset_reviews_v4', JSON.stringify(data.reviews));
      }
      if (data.visitorCount) {
        localStorage.setItem('cset_visit_count_v4', data.visitorCount.toString());
      }

      return {
        success: true,
        message: `Khôi phục thành công! (Phiên bản backup: ${data.version || '4.0'}, Tạo lúc: ${data.createdAt || 'N/A'})`
      };
    } catch {
      return { success: false, message: 'Không thể giải mã file backup JSON. Vui lòng kiểm tra định dạng file!' };
    }
  }
}

export const backupService = new BackupService();
