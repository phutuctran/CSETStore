import type { Product, ProductVariantGroup, ProductVariantCombination } from '../models/types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
}

export function getCanonicalVariantKey(variants?: Record<string, string>): string {
  if (!variants || Object.keys(variants).length === 0) return '';
  const sortedKeys = Object.keys(variants).sort();
  const sortedObj: Record<string, string> = {};
  for (const k of sortedKeys) {
    sortedObj[k] = String(variants[k]);
  }
  return JSON.stringify(sortedObj);
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
 * Returns the effective selling price considering variant overrides and timed discounts
 */
export function getEffectivePrice(product: Product, selectedVariants?: Record<string, string>): number {
  let basePrice = product.price;
  if (selectedVariants && product.variantCombinations && product.variantCombinations.length > 0) {
    const targetKey = getCanonicalVariantKey(selectedVariants);
    const matched = product.variantCombinations.find(vc => getCanonicalVariantKey(vc.combination) === targetKey);
    if (matched && typeof matched.price === 'number' && matched.price > 0) {
      basePrice = matched.price;
    }
  }

  if (isDiscountActive(product) && product.discountPercent) {
    const base = product.originalPrice || basePrice;
    const discounted = Math.round(base * (1 - product.discountPercent / 100));
    return Math.max(0, discounted);
  }
  return basePrice;
}

/**
 * Returns effective available stock considering specific variant stock overrides
 */
export function getProductEffectiveStock(product: Product, selectedVariants?: Record<string, string>): number {
  if (selectedVariants && product.variantCombinations && product.variantCombinations.length > 0) {
    const targetKey = getCanonicalVariantKey(selectedVariants);
    const matched = product.variantCombinations.find(vc => getCanonicalVariantKey(vc.combination) === targetKey);
    if (matched && typeof matched.stock === 'number') {
      return Math.max(0, matched.stock);
    }
  }
  return typeof product.stock === 'number' ? Math.max(0, product.stock) : 50;
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

/**
 * Lấy giới hạn số lượng mua tối đa cho sản phẩm trong 1 đơn hàng.
 * Ưu tiên:
 * 1. Giới hạn riêng của sản phẩm (`product.maxPurchaseLimit`) nếu > 0.
 * 2. Giới hạn chung toàn hệ thống (`defaultLimit`) nếu > 0.
 * 3. Trả về undefined nếu không giới hạn.
 */
export function getProductMaxPurchaseLimit(product: Product, defaultLimit?: number): number | undefined {
  if (typeof product.maxPurchaseLimit === 'number' && product.maxPurchaseLimit > 0) {
    return product.maxPurchaseLimit;
  }
  if (typeof defaultLimit === 'number' && defaultLimit > 0) {
    return defaultLimit;
  }
  return undefined;
}

/**
 * Generates all cartesian product combinations from a list of variant groups
 */
export function generateVariantCombinations(
  variantGroups: ProductVariantGroup[],
  defaultPrice = 0,
  defaultStock = 50
): ProductVariantCombination[] {
  if (!variantGroups || variantGroups.length === 0) return [];

  let results: { combination: Record<string, string>; titleParts: string[] }[] = [{ combination: {}, titleParts: [] }];

  for (const group of variantGroups) {
    const nextResults: { combination: Record<string, string>; titleParts: string[] }[] = [];
    for (const opt of group.options) {
      for (const res of results) {
        nextResults.push({
          combination: { ...res.combination, [group.name]: opt },
          titleParts: [...res.titleParts, `${group.name}: ${opt}`]
        });
      }
    }
    results = nextResults;
  }

  return results.map((r, idx) => ({
    id: `VAR-${idx + 1}`,
    combination: r.combination,
    title: r.titleParts.join(' • '),
    price: defaultPrice,
    stock: defaultStock
  }));
}

/**
 * Synchronizes variant combinations against variant groups while preserving custom prices and stocks
 */
export function syncVariantCombinations(
  variantGroups: ProductVariantGroup[],
  existingCombinations: ProductVariantCombination[] | undefined,
  defaultPrice = 0,
  defaultStock = 50
): ProductVariantCombination[] {
  const generated = generateVariantCombinations(variantGroups, defaultPrice, defaultStock);
  if (!existingCombinations || existingCombinations.length === 0) {
    return generated;
  }

  return generated.map(gen => {
    const match = existingCombinations.find(ex =>
      getCanonicalVariantKey(ex.combination) === getCanonicalVariantKey(gen.combination)
    );
    if (match) {
      return {
        ...gen,
        price: typeof match.price === 'number' && match.price > 0 ? match.price : gen.price,
        stock: typeof match.stock === 'number' ? match.stock : gen.stock
      };
    }
    return gen;
  });
}
