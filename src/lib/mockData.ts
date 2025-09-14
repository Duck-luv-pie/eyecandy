import type { SimilarItem } from '../types/index.js';

/**
 * Mock data for testing when Shopify tokens are not available
 */
export const MOCK_RECOMMENDATIONS: SimilarItem[] = [
  {
    id: "gid://shopify/Product/1234567890",
    title: "Blue Denim Jacket",
    imageUrl: "https://cdn.shopify.com/s/files/1/0000/0000/products/blue-jacket.jpg",
    price: { amount: "89.99", currencyCode: "USD" }
  },
  {
    id: "gid://shopify/Product/1234567891",
    title: "Black Leather Jacket",
    imageUrl: "https://cdn.shopify.com/s/files/1/0000/0000/products/black-jacket.jpg",
    price: { amount: "199.99", currencyCode: "USD" }
  },
  {
    id: "gid://shopify/Product/1234567892",
    title: "Brown Suede Jacket",
    imageUrl: "https://cdn.shopify.com/s/files/1/0000/0000/products/brown-jacket.jpg",
    price: { amount: "149.99", currencyCode: "USD" }
  },
  {
    id: "gid://shopify/Product/1234567893",
    title: "Red Bomber Jacket",
    imageUrl: "https://cdn.shopify.com/s/files/1/0000/0000/products/red-jacket.jpg",
    price: { amount: "79.99", currencyCode: "USD" }
  },
  {
    id: "gid://shopify/Product/1234567894",
    title: "Green Military Jacket",
    imageUrl: "https://cdn.shopify.com/s/files/1/0000/0000/products/green-jacket.jpg",
    price: { amount: "129.99", currencyCode: "USD" }
  },
  {
    id: "gid://shopify/Product/1234567895",
    title: "Gray Hooded Jacket",
    imageUrl: "https://cdn.shopify.com/s/files/1/0000/0000/products/gray-jacket.jpg",
    price: { amount: "99.99", currencyCode: "USD" }
  }
];

/**
 * Check if we should use mock data (when no real tokens are available or for demo purposes)
 */
export function shouldUseMockData(): boolean {
  // For demo purposes, let's use mock data when a specific env var is set
  return process.env.USE_MOCK_DATA === 'true' || 
         // Or when no real tokens are configured
         !['SF_TOKEN_A', 'SF_TOKEN_B', 'SF_TOKEN_C', 'SF_TOKEN_D'].some(varName => 
           process.env[varName] && process.env[varName] !== 'your_storefront_token_here'
         );
}
