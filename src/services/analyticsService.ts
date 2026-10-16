import type { Order, User } from '../models/types';

const VISIT_COUNT_KEY = 'cset_visit_count_v4';

export interface DailyReport {
  date: string; // YYYY-MM-DD
  orderCount: number;
  revenue: number;
}

export interface WeeklyReport {
  weekLabel: string; // vd: Tuần 1, Tuần 2...
  orderCount: number;
  revenue: number;
}

export interface MonthlyReport {
  monthLabel: string; // vd: Tháng 01/2026
  orderCount: number;
  revenue: number;
}

export interface SummaryMetrics {
  totalOrders: number;
  validOrdersCount: number;
  completedOrdersCount: number;
  totalRevenue: number;
  customerCount: number;
  visitorCount: number;
}

export class AnalyticsService {
  /**
   * Tracks and increments visitor count in localStorage
   */
  trackVisitor(): number {
    if (typeof window === 'undefined') return 1250;
    const current = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '1250', 10);
    const updated = current + 1;
    localStorage.setItem(VISIT_COUNT_KEY, updated.toString());
    return updated;
  }

  getVisitorCount(): number {
    if (typeof window === 'undefined') return 1250;
    return parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '1250', 10);
  }

  /**
   * Parses various date string formats into Date object
   */
  parseOrderDate(dateStr: string): Date {
    const clean = dateStr.replace(' ', 'T');
    const d = new Date(clean);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  formatDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Generates Daily Report for orders
   */
  getDailyReports(orders: Order[]): DailyReport[] {
    const map = new Map<string, { count: number; rev: number }>();

    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      const d = this.parseOrderDate(o.createdAt);
      const key = this.formatDateKey(d);
      const cur = map.get(key) || { count: 0, rev: 0 };
      map.set(key, { count: cur.count + 1, rev: cur.rev + o.totalAmount });
    });

    const sortedKeys = Array.from(map.keys()).sort();
    return sortedKeys.map(k => ({
      date: k,
      orderCount: map.get(k)!.count,
      revenue: map.get(k)!.rev
    }));
  }

  /**
   * Generates Monthly Report
   */
  getMonthlyReports(orders: Order[]): MonthlyReport[] {
    const map = new Map<string, { count: number; rev: number }>();

    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      const d = this.parseOrderDate(o.createdAt);
      const mKey = `Tháng ${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      const cur = map.get(mKey) || { count: 0, rev: 0 };
      map.set(mKey, { count: cur.count + 1, rev: cur.rev + o.totalAmount });
    });

    return Array.from(map.entries()).map(([monthLabel, val]) => ({
      monthLabel,
      orderCount: val.count,
      revenue: val.rev
    }));
  }

  /**
   * Generates Weekly Report (groups of 7 days)
   */
  getWeeklyReports(orders: Order[]): WeeklyReport[] {
    const map = new Map<string, { count: number; rev: number }>();

    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      const d = this.parseOrderDate(o.createdAt);
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      const pastDaysOfYear = (d.getTime() - startOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
      const wKey = `Tuần ${weekNum} (${d.getFullYear()})`;
      const cur = map.get(wKey) || { count: 0, rev: 0 };
      map.set(wKey, { count: cur.count + 1, rev: cur.rev + o.totalAmount });
    });

    return Array.from(map.entries()).map(([weekLabel, val]) => ({
      weekLabel,
      orderCount: val.count,
      revenue: val.rev
    }));
  }

  /**
   * Computes Summary Metrics
   */
  getSummaryMetrics(orders: Order[], users: User[]): SummaryMetrics {
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalCompletedOrders = orders.filter(o => o.status === 'completed').length;
    const customerCount = users.filter(u => u.role === 'customer').length;
    const visitorCount = this.getVisitorCount();

    return {
      totalOrders: orders.length,
      validOrdersCount: validOrders.length,
      completedOrdersCount: totalCompletedOrders,
      totalRevenue,
      customerCount,
      visitorCount
    };
  }

  /**
   * Exports orders and financial report data to Excel (.csv with UTF-8 BOM)
   */
  exportToExcelCSV(orders: Order[], metrics: SummaryMetrics): void {
    if (typeof window === 'undefined') return;

    let csv = '\uFEFF'; // UTF-8 BOM for Microsoft Excel Vietnamese character compatibility
    csv += 'BÁO CÁO DOANH THU & ĐƠN HÀNG - CSET STORE\n';
    csv += `Ngày xuất báo cáo: ${new Date().toLocaleString('vi-VN')}\n`;
    csv += `Tổng doanh thu: ${metrics.totalRevenue} VNĐ\n`;
    csv += `Tổng số đơn: ${metrics.totalOrders}\n`;
    csv += `Tổng số khách hàng: ${metrics.customerCount}\n`;
    csv += `Số lượt truy cập: ${metrics.visitorCount}\n\n`;

    csv += 'DANH SÁCH CHI TIẾT ĐƠN HÀNG\n';
    csv += 'Mã Đơn,Ngày Đặt,Khách Hàng,Số Điện Thoại,Địa Chỉ,Số Lượng Món,Tổng Tiền (VNĐ),Trạng Thái\n';

    orders.forEach(o => {
      const itemsCount = o.items.reduce((s, it) => s + it.quantity, 0);
      const statusText = o.status === 'completed' ? 'Đã hoàn tất' : (o.status === 'processing' ? 'Đang xử lý' : (o.status === 'cancelled' ? 'Đã hủy' : 'Chờ xác nhận'));
      const safeAddr = `"${o.address.replace(/"/g, '""')}"`;
      const safeName = `"${o.customerName.replace(/"/g, '""')}"`;

      csv += `${o.id},${o.createdAt},${safeName},'${o.phone},${safeAddr},${itemsCount},${o.totalAmount},${statusText}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_Cao_Doanh_Thu_CSETStore_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const analyticsService = new AnalyticsService();
