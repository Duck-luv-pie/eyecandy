import { describe, it, expect, beforeEach } from 'vitest';
import { RecommendationCache, type CacheKey } from './cache.js';
import type { SimilarItem } from '../types/index.js';

describe('RecommendationCache', () => {
  let cache: RecommendationCache;

  beforeEach(() => {
    cache = new RecommendationCache(60, 100); // 60s TTL, 100 max entries
  });

  const mockItems: SimilarItem[] = [
    { id: 'gid://shopify/Product/1', title: 'Product 1', imageUrl: 'https://example.com/1.jpg' },
    { id: 'gid://shopify/Product/2', title: 'Product 2', imageUrl: null }
  ];

  const mockKey: CacheKey = {
    storeDomain: 'test.myshopify.com',
    productId: 'gid://shopify/Product/123',
    intent: 'RELATED'
  };

  it('should store and retrieve items', () => {
    cache.set(mockKey, mockItems);
    const retrieved = cache.get(mockKey);
    
    expect(retrieved).toEqual(mockItems);
  });

  it('should return null for non-existent keys', () => {
    const retrieved = cache.get(mockKey);
    expect(retrieved).toBeNull();
  });

  it('should generate consistent cache keys', () => {
    const key1: CacheKey = {
      storeDomain: 'store1.myshopify.com',
      productId: 'gid://shopify/Product/123',
      intent: 'RELATED'
    };

    const key2: CacheKey = {
      storeDomain: 'store1.myshopify.com',
      productId: 'gid://shopify/Product/123',
      intent: 'RELATED'
    };

    cache.set(key1, mockItems);
    const retrieved = cache.get(key2);
    
    expect(retrieved).toEqual(mockItems);
  });

  it('should differentiate between different keys', () => {
    const key1: CacheKey = {
      storeDomain: 'store1.myshopify.com',
      productId: 'gid://shopify/Product/123',
      intent: 'RELATED'
    };

    const key2: CacheKey = {
      storeDomain: 'store2.myshopify.com',
      productId: 'gid://shopify/Product/123',
      intent: 'RELATED'
    };

    cache.set(key1, mockItems);
    const retrieved = cache.get(key2);
    
    expect(retrieved).toBeNull();
  });

  it('should clear all entries', () => {
    cache.set(mockKey, mockItems);
    expect(cache.get(mockKey)).toEqual(mockItems);
    
    cache.clear();
    expect(cache.get(mockKey)).toBeNull();
  });

  it('should return cache statistics', () => {
    const stats = cache.getStats();
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('maxSize');
    expect(stats).toHaveProperty('ttl');
    expect(stats.maxSize).toBe(100);
    expect(stats.ttl).toBe(60000); // 60 seconds in ms
  });

  it('should handle empty items array', () => {
    cache.set(mockKey, []);
    const retrieved = cache.get(mockKey);
    
    expect(retrieved).toEqual([]);
  });
});

