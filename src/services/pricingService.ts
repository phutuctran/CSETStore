export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
}

export function calculateDiscountPercent(price: number, originalPrice?: number): number {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}
