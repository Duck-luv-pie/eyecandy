import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapShopifyProductToSimilarItem } from './shopify.js';
import type { ShopifyProduct } from '../types/index.js';

describe('shopify utilities', () => {
  describe('mapShopifyProductToSimilarItem', () => {
    it('should map product with image to SimilarItem', () => {
      const shopifyProduct: ShopifyProduct = {
        id: 'gid://shopify/Product/1234567890',
        title: 'Blue Denim Jacket',
        images: {
          edges: [
            {
              node: {
                url: 'https://cdn.shopify.com/image1.jpg'
              }
            }
          ]
        }
      };

      const result = mapShopifyProductToSimilarItem(shopifyProduct);

      expect(result).toEqual({
        id: 'gid://shopify/Product/1234567890',
        title: 'Blue Denim Jacket',
        imageUrl: 'https://cdn.shopify.com/image1.jpg'
      });
    });

    it('should map product without images to SimilarItem with null imageUrl', () => {
      const shopifyProduct: ShopifyProduct = {
        id: 'gid://shopify/Product/1234567890',
        title: 'Plain T-Shirt',
        images: {
          edges: []
        }
      };

      const result = mapShopifyProductToSimilarItem(shopifyProduct);

      expect(result).toEqual({
        id: 'gid://shopify/Product/1234567890',
        title: 'Plain T-Shirt',
        imageUrl: null
      });
    });

    it('should use first image when multiple images exist', () => {
      const shopifyProduct: ShopifyProduct = {
        id: 'gid://shopify/Product/1234567890',
        title: 'Multi-Image Product',
        images: {
          edges: [
            {
              node: {
                url: 'https://cdn.shopify.com/first.jpg'
              }
            },
            {
              node: {
                url: 'https://cdn.shopify.com/second.jpg'
              }
            }
          ]
        }
      };

      const result = mapShopifyProductToSimilarItem(shopifyProduct);

      expect(result.imageUrl).toBe('https://cdn.shopify.com/first.jpg');
    });

    it('should handle empty title', () => {
      const shopifyProduct: ShopifyProduct = {
        id: 'gid://shopify/Product/1234567890',
        title: '',
        images: {
          edges: []
        }
      };

      const result = mapShopifyProductToSimilarItem(shopifyProduct);

      expect(result).toEqual({
        id: 'gid://shopify/Product/1234567890',
        title: '',
        imageUrl: null
      });
    });
  });
});

