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
  variants?: {
    edges: Array<{
      node: {
        price: {
          amount: string;
          currencyCode: string;
        };
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
      imageUrl: edge.node.images.edges.length > 0 ? edge.node.images.edges[0]?.node.url ?? null : null,
      price: edge.node.variants?.edges && edge.node.variants.edges.length > 0 && edge.node.variants.edges[0] ? {
        amount: edge.node.variants.edges[0].node.price.amount,
        currencyCode: edge.node.variants.edges[0].node.price.currencyCode
      } : undefined
    }));
  } catch (error) {
    console.error(`Failed to get products from ${storeDomain}:`, error);
    throw error;
  }
}
