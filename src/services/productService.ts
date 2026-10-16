import type { Product } from '../models/types';
import { LocalStorageProductRepository } from '../repositories';

const productRepo = new LocalStorageProductRepository();

export interface ProductApiResponse {
  success: boolean;
  data?: Product;
  message?: string;
}

/**
 * Fetches product details on-demand via HTTP GET API.
 * Falls back to local storage repository if offline API is unavailable.
 */
export async function fetchProductDetailApi(id: number): Promise<Product | null> {
  try {
    const res = await fetch(`/api/products/${id}`);
    if (res.ok) {
      const result: unknown = await res.json();
      if (
        result &&
        typeof result === 'object' &&
        'success' in result &&
        result.success === true &&
        'data' in result &&
        result.data &&
        typeof result.data === 'object'
      ) {
        return result.data as Product;
      }
    }
  } catch (err) {
    console.warn(`[ProductService] API request failed for id ${id}, using local repository fallback:`, err);
  }

  // Fallback to client repository
  return productRepo.getById(id) || null;
}
