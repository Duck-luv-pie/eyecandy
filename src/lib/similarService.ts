import { 
  resolveProductId, 
  getProductRecommendations, 
  mapShopifyProductToSimilarItem,
  ShopifyTimeoutError,
  ShopifyGraphQLError,
  ShopifyNetworkError
} from './shopify.js';
import { getStorefrontToken, isValidProductId, getStoresForKeyword } from './stores.js';
import { ConcurrencyLimiter } from './concurrency.js';
import { recommendationCache, type CacheKey } from './cache.js';
import { MOCK_RECOMMENDATIONS, shouldUseMockData } from './mockData.js';
import type { 
  SimilarRequest, 
  SimilarResponse, 
  StoreCandidate, 
  StoreEntry 
} from '../types/index.js';

/**
 * Process recommendations for a single store
 */
async function mapRecommendationsForStore(
  store: StoreEntry,
  productIdOrHandle: string,
  intent: "RELATED" | "COMPLEMENTARY" | "ALTERNATE" | "NONE",
  perStore: number
): Promise<StoreCandidate> {
  const warnings: string[] = [];
  let items: Array<{ id: string; title: string; imageUrl: string | null }> = [];

  try {
    // Check if we should use mock data
    if (shouldUseMockData()) {
      console.log(`Using mock data for ${store.storeDomain} (no real tokens configured)`);
      items = MOCK_RECOMMENDATIONS.slice(0, perStore);
      return { store: store.storeDomain, items };
    }

    // Check if token exists
    const token = getStorefrontToken(store.storefrontTokenEnvVar);
    if (!token) {
      warnings.push(`Missing storefront token for ${store.storefrontTokenEnvVar}`);
      return { store: store.storeDomain, items: [], warnings };
    }

    // Determine if we need to resolve handle to productId
    let productId: string;
    
    if (isValidProductId(productIdOrHandle)) {
      productId = productIdOrHandle;
    } else {
      // It's a handle, resolve it to productId
      const resolvedId = await resolveProductId(store.storeDomain, token, productIdOrHandle);
      if (!resolvedId) {
        warnings.push(`Handle "${productIdOrHandle}" not found on this store`);
        return { store: store.storeDomain, items: [], warnings };
      }
      productId = resolvedId;
    }

    // Check cache first
    const cacheKey: CacheKey = {
      storeDomain: store.storeDomain,
      productId,
      intent
    };

    const cachedItems = recommendationCache.get(cacheKey);
    if (cachedItems) {
      items = cachedItems.slice(0, perStore);
    } else {
      // Get recommendations from Shopify
      const recommendations = await getProductRecommendations(
        store.storeDomain,
        token,
        productId,
        intent
      );

      // Map to SimilarItem format and limit count
      items = recommendations
        .slice(0, perStore)
        .map(mapShopifyProductToSimilarItem);

      // Cache the results
      recommendationCache.set(cacheKey, items);
    }

  } catch (error) {
    if (error instanceof ShopifyTimeoutError) {
      warnings.push(`Request timeout for ${store.storeDomain}`);
    } else if (error instanceof ShopifyGraphQLError) {
      warnings.push(`GraphQL error for ${store.storeDomain}: ${error.message}`);
    } else if (error instanceof ShopifyNetworkError) {
      warnings.push(`Network error for ${store.storeDomain}: ${error.message}`);
    } else {
      warnings.push(`Unknown error for ${store.storeDomain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    store: store.storeDomain,
    items,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Get similar products across multiple stores
 */
export async function getSimilarProducts(
  request: SimilarRequest
): Promise<SimilarResponse> {
  const {
    keyword,
    productId,
    handle,
    intent = "RELATED",
    perStore = 6,
    maxStores = 5
  } = request;

  // Validate input
  if (!productId && !handle) {
    throw new Error("Either productId or handle must be provided");
  }

  if (productId && handle) {
    throw new Error("Cannot provide both productId and handle");
  }

  if (perStore > 24) {
    throw new Error("perStore cannot exceed 24");
  }

  if (maxStores > 25) {
    throw new Error("maxStores cannot exceed 25");
  }

  // Get stores for the keyword
  const { stores, matchedCategories } = getStoresForKeyword(keyword, maxStores);

  if (stores.length === 0) {
    return {
      keyword,
      matchedCategories,
      candidates: []
    };
  }

  // Process stores with concurrency limiting (max 3 concurrent requests)
  const concurrencyLimiter = new ConcurrencyLimiter(3);
  const productIdOrHandle = productId || handle!;

  const candidatePromises = stores.map(store =>
    concurrencyLimiter.execute(() =>
      mapRecommendationsForStore(store, productIdOrHandle, intent, perStore)
    )
  );

  const candidates = await Promise.all(candidatePromises);

  return {
    keyword,
    matchedCategories,
    candidates
  };
}

