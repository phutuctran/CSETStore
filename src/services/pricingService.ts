export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
}

export function calculateCustomQuote(fileSizeBytes: number, infillPercent: number) {
  const sizeKB = fileSizeBytes / 1024;
  // Giả lập tính khối lượng nhựa dựa trên kích thước file và độ rỗng
  const baseGrams = Math.max(5, Math.min(600, Math.round(sizeKB * 0.15)));
  const finalGrams = Math.round(baseGrams * (0.4 + 0.6 * (infillPercent / 100)));
  const totalMinutes = finalGrams * 8;
  const hours = (totalMinutes / 60).toFixed(1);
  const price = finalGrams * 1500;

  return {
    grams: finalGrams,
    hours,
    price
  };
}
