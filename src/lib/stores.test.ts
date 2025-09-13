import { describe, it, expect } from 'vitest';
import { getStoresForKeyword, isValidProductId, extractProductId } from './stores.js';

describe('stores', () => {
  describe('getStoresForKeyword', () => {
    it('should match categories case-insensitively', () => {
      const result = getStoresForKeyword('JACKET', 10);
      expect(result.matchedCategories).toContain('mens jackets');
      // Note: 'outerwear' doesn't contain 'jacket', so it shouldn't match
    });

    it('should match partial keywords', () => {
      const result = getStoresForKeyword('outer', 10);
      expect(result.matchedCategories).toContain('outerwear');
      expect(result.stores.length).toBeGreaterThan(0);
    });

    it('should deduplicate stores across categories', () => {
      const result = getStoresForKeyword('jacket', 10);
      const storeDomains = result.stores.map(s => s.storeDomain);
      const uniqueDomains = new Set(storeDomains);
      expect(storeDomains.length).toBe(uniqueDomains.size);
    });

    it('should respect maxStores limit', () => {
      const result = getStoresForKeyword('jacket', 2);
      expect(result.stores.length).toBeLessThanOrEqual(2);
    });

    it('should return empty arrays for unmatched keywords', () => {
      const result = getStoresForKeyword('nonexistentcategory', 10);
      expect(result.stores).toHaveLength(0);
      expect(result.matchedCategories).toHaveLength(0);
    });

    it('should match multiple categories', () => {
      const result = getStoresForKeyword('womens', 10);
      expect(result.matchedCategories).toContain('womens clothing');
      expect(result.stores.length).toBeGreaterThan(0);
    });
  });

  describe('isValidProductId', () => {
    it('should validate correct Shopify product IDs', () => {
      expect(isValidProductId('gid://shopify/Product/1234567890')).toBe(true);
      expect(isValidProductId('gid://shopify/Product/1')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidProductId('gid://shopify/Product/abc')).toBe(false);
      expect(isValidProductId('gid://shopify/Product/')).toBe(false);
      expect(isValidProductId('product/123')).toBe(false);
      expect(isValidProductId('')).toBe(false);
      expect(isValidProductId('gid://shopify/Variant/123')).toBe(false);
    });
  });

  describe('extractProductId', () => {
    it('should extract numeric ID from valid GID', () => {
      expect(extractProductId('gid://shopify/Product/1234567890')).toBe('1234567890');
      expect(extractProductId('gid://shopify/Product/1')).toBe('1');
    });

    it('should return null for invalid formats', () => {
      expect(extractProductId('gid://shopify/Product/abc')).toBeNull();
      expect(extractProductId('product/123')).toBeNull();
      expect(extractProductId('')).toBeNull();
    });
  });
});

