import { sfQuery } from './shopify.js';
import { getStorefrontToken } from './stores.js';
import type { SimilarItem } from '../types/index.js';

export interface ShopifyProduct {
  id: string;
  title: string;
  images: {
    edges: Array<{
      node: {
        url: string;
      };
    }>;
  };
}

export interface ShopifyProductsResponse {
  products: {
    edges: Array<{
      node: ShopifyProduct;
    }>;
  };
}

/**
 * Get all products from a Shopify store
 */
export async function getAllProducts(
  storeDomain: string,
  token: string,
  limit: number = 50
): Promise<SimilarItem[]> {
  const query = `
    query GetAllProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const result = await sfQuery<ShopifyProductsResponse>(
      storeDomain,
      token,
      query,
      { first: limit }
    );

    // Map to SimilarItem format
    return result.products.edges.map(edge => ({
      id: edge.node.id,
      title: edge.node.title,
      imageUrl: edge.node.images.edges.length > 0 ? edge.node.images.edges[0]?.node.url ?? null : null
    }));
  } catch (error) {
    console.error(`Failed to get products from ${storeDomain}:`, error);
    throw error;
  }
}
