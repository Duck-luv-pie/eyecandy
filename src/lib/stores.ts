import type { StoreEntry } from '../types/index.js';

/**
 * Static in-memory store configuration
 * In production, this would be loaded from a database
 */
export const STORES_BY_CATEGORY: Record<string, StoreEntry[]> = {
  "mens jackets": [
    { storeDomain: "shirtsfordemos.myshopify.com", storefrontTokenEnvVar: "SF_TOKEN_A" },
    { storeDomain: "shirtsfordemos.myshopify.com", storefrontTokenEnvVar: "SF_TOKEN_B" },
  ],
  "sweaters": [
    { storeDomain: "shirtsfordemos.myshopify.com", storefrontTokenEnvVar: "SF_TOKEN_A" },
    { storeDomain: "shirtsfordemos.myshopify.com", storefrontTokenEnvVar: "SF_TOKEN_C" },
  ],
  "womens clothing": [
    { storeDomain: "shirtsfordemos.myshopify.com", storefrontTokenEnvVar: "SF_TOKEN_D" },
    { storeDomain: "shirtsfordemos.myshopify.com", storefrontTokenEnvVar: "SF_TOKEN_E" },
  ],
  "accessories": [
    { storeDomain: "shirtsfordemos.myshopify.com", storefrontTokenEnvVar: "SF_TOKEN_B" },
    { storeDomain: "shirtsfordemos.myshopify.com", storefrontTokenEnvVar: "SF_TOKEN_F" },
  ],
  "shoes": [
    { storeDomain: "shirtsfordemos.myshopify.com", storefrontTokenEnvVar: "SF_TOKEN_G" },
    { storeDomain: "shirtsfordemos.myshopify.com", storefrontTokenEnvVar: "SF_TOKEN_H" },
  ],
  "electronics": [
    { storeDomain: "shirtsfordemos.myshopify.com", storefrontTokenEnvVar: "SF_TOKEN_I" },
    { storeDomain: "shirtsfordemos.myshopify.com", storefrontTokenEnvVar: "SF_TOKEN_J" },
  ],
  "home decor": [
    { storeDomain: "shirtsfordemos.myshopify.com", storefrontTokenEnvVar: "SF_TOKEN_K" },
    { storeDomain: "shirtsfordemos.myshopify.com", storefrontTokenEnvVar: "SF_TOKEN_L" },
  ],
};

/**
 * Get stores that match the given keyword (case-insensitive substring match)
 */
export function getStoresForKeyword(
  keyword: string,
  maxStores: number = 5
): { stores: StoreEntry[]; matchedCategories: string[] } {
  const keywordLower = keyword.toLowerCase();
  const matchedCategories: string[] = [];
  const storeMap = new Map<string, StoreEntry>();

  // Find categories that match the keyword
  for (const [categoryName, stores] of Object.entries(STORES_BY_CATEGORY)) {
    if (categoryName.toLowerCase().includes(keywordLower)) {
      matchedCategories.push(categoryName);
      
      // Add stores from this category, avoiding duplicates
      for (const store of stores) {
        if (storeMap.size >= maxStores) {
          break;
        }
        storeMap.set(store.storeDomain, store);
      }
    }
  }

  return {
    stores: Array.from(storeMap.values()),
    matchedCategories
  };
}

/**
 * Get storefront token from environment variable
 */
export function getStorefrontToken(tokenEnvVar: string): string | null {
  return process.env[tokenEnvVar] ?? null;
}

/**
 * Validate that a product ID is in the correct Shopify GID format
 */
export function isValidProductId(productId: string): boolean {
  return /^gid:\/\/shopify\/Product\/\d+$/.test(productId);
}

/**
 * Extract numeric ID from Shopify GID
 */
export function extractProductId(productId: string): string | null {
  const match = productId.match(/^gid:\/\/shopify\/Product\/(\d+)$/);
  return match?.[1] ?? null;
}

