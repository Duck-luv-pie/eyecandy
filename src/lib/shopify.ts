import { fetch } from 'undici';
import type {
  ShopifyGraphQLResponse,
  ShopifyProductByHandle,
  ShopifyRecommendations,
  ShopifyProduct
} from '../types/index.js';

export interface ShopifyQueryOptions {
  timeout?: number;
  retries?: number;
}

export class ShopifyGraphQLError extends Error {
  constructor(
    message: string,
    public readonly errors?: Array<{ message: string }>
  ) {
    super(message);
    this.name = 'ShopifyGraphQLError';
  }
}

export class ShopifyNetworkError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'ShopifyNetworkError';
  }
}

export class ShopifyTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShopifyTimeoutError';
  }
}

/**
 * Execute a GraphQL query against Shopify Storefront API
 */
export async function sfQuery<T>(
  storeDomain: string,
  token: string,
  query: string,
  variables: Record<string, unknown> = {},
  options: ShopifyQueryOptions = {}
): Promise<T> {
  const { timeout = 7000, retries = 1 } = options;
  
  const url = `https://${storeDomain}/api/2025-07/graphql.json`;
  
  const body = JSON.stringify({
    query,
    variables
  });

  const headers = {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': token,
  };

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ShopifyNetworkError(
          `HTTP ${response.status}: ${response.statusText}`,
          new Error(`Response not ok: ${response.status}`)
        );
      }

      const result: ShopifyGraphQLResponse<T> = await response.json() as ShopifyGraphQLResponse<T>;

      if (result.errors && result.errors.length > 0) {
        throw new ShopifyGraphQLError(
          'GraphQL errors returned',
          result.errors
        );
      }

      if (!result.data) {
        throw new ShopifyGraphQLError('No data returned from GraphQL query');
      }

      return result.data;
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ShopifyTimeoutError(`Request timeout after ${timeout}ms`);
        }
        
        if (error instanceof ShopifyGraphQLError || 
            error instanceof ShopifyNetworkError || 
            error instanceof ShopifyTimeoutError) {
          throw error;
        }
        
        throw new ShopifyNetworkError(
          `Network error: ${error.message}`,
          error
        );
      }
      
      throw new ShopifyNetworkError('Unknown error occurred');
    }
  }

  throw lastError || new ShopifyNetworkError('Max retries exceeded');
}

/**
 * Resolve product handle to product ID
 */
export async function resolveProductId(
  storeDomain: string,
  token: string,
  handle: string
): Promise<string | null> {
  const query = `
    query ResolveProductId($handle: String!) {
      productByHandle(handle: $handle) { 
        id 
      }
    }
  `;

  try {
    const result = await sfQuery<ShopifyProductByHandle>(
      storeDomain,
      token,
      query,
      { handle }
    );

    return result.productByHandle?.id || null;
  } catch (error) {
    console.error(`Failed to resolve product ID for handle "${handle}" on ${storeDomain}:`, error);
    throw error;
  }
}

/**
 * Get product recommendations
 */
export async function getProductRecommendations(
  storeDomain: string,
  token: string,
  productId: string,
  intent: "RELATED" | "COMPLEMENTARY" | "ALTERNATE" | "NONE" = "RELATED"
): Promise<ShopifyProduct[]> {
  const query = `
    query Recommendations($id: ID!, $intent: ProductRecommendationIntent) {
      productRecommendations(productId: $id, intent: $intent) {
        id
        title
        images(first: 1) { 
          edges { 
            node { 
              url 
            } 
          } 
        }
        variants(first: 1) {
          edges {
            node {
              price {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;

  try {
    const result = await sfQuery<ShopifyRecommendations>(
      storeDomain,
      token,
      query,
      { id: productId, intent }
    );

    return result.productRecommendations;
  } catch (error) {
    console.error(`Failed to get recommendations for product "${productId}" on ${storeDomain}:`, error);
    throw error;
  }
}

/**
 * Map Shopify product to SimilarItem
 */
export function mapShopifyProductToSimilarItem(product: ShopifyProduct): {
  id: string;
  title: string;
  imageUrl: string | null;
  price?: {
    amount: string;
    currencyCode: string;
  };
} {
  return {
    id: product.id,
    title: product.title,
    imageUrl: product.images.edges.length > 0 ? product.images.edges[0]?.node.url ?? null : null,
    price: product.variants?.edges && product.variants.edges.length > 0 && product.variants.edges[0] ? {
      amount: product.variants.edges[0].node.price.amount,
      currencyCode: product.variants.edges[0].node.price.currencyCode
    } : undefined
  };
}

