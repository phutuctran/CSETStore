import type { Product } from '../models/types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
}

/**
 * Checks if a product's scheduled discount is currently active
 */
export function isDiscountActive(product: Product): boolean {
  if (!product.discountPercent || product.discountPercent <= 0) return false;
  const now = Date.now();
  if (product.discountStartDate) {
    const start = new Date(product.discountStartDate).getTime();
    if (!isNaN(start) && now < start) return false;
  }
  if (product.discountEndDate) {
    const end = new Date(product.discountEndDate).getTime();
    if (!isNaN(end) && now > end) return false;
  }
  return true;
}

/**
 * Returns the effective selling price considering timed discounts
 */
export function getEffectivePrice(product: Product): number {
  if (isDiscountActive(product) && product.discountPercent) {
    const base = product.originalPrice || product.price;
    const discounted = Math.round(base * (1 - product.discountPercent / 100));
    return Math.max(0, discounted);
  }
  return product.price;
}

/**
 * Returns original price or calculates discount percent for display
 */
export function getProductDiscountDetails(product: Product): { hasDiscount: boolean; discountPercent: number; originalPrice?: number } {
  if (isDiscountActive(product) && product.discountPercent) {
    const orig = product.originalPrice || product.price;
    return {
      hasDiscount: true,
      discountPercent: product.discountPercent,
      originalPrice: orig
    };
  }

  if (product.originalPrice && product.originalPrice > product.price) {
    const pct = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    return {
      hasDiscount: pct > 0,
      discountPercent: pct,
      originalPrice: product.originalPrice
    };
  }

  return { hasDiscount: false, discountPercent: 0 };
}

/**
 * Calculates custom 3D printing quote based on file size and infill percentage
 */
export function calculateCustomQuote(fileSizeBytes: number, infillPercent: number): { grams: number; hours: number; price: number } {
  const grams = Math.max(10, Math.round((fileSizeBytes / 1024) * 0.15 * (infillPercent / 20)));
  const hours = Number((grams * 0.1).toFixed(1));
  const price = grams * 3000 + 50000;
  return { grams, hours, price };
}
