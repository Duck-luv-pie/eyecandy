import { LRUCache } from 'lru-cache';
import type { SimilarItem } from '../types/index.js';

export interface CacheKey {
  storeDomain: string;
  productId: string;
  intent: "RELATED" | "COMPLEMENTARY" | "ALTERNATE" | "NONE";
}

export interface CacheValue {
  items: SimilarItem[];
  timestamp: number;
}

/**
 * In-memory LRU cache for product recommendations
 * TTL: 60 seconds
 * Max size: 1000 entries
 */
export class RecommendationCache {
  private cache: LRUCache<string, CacheValue>;

  constructor(ttlSeconds: number = 60, maxSize: number = 1000) {
    this.cache = new LRUCache<string, CacheValue>({
      max: maxSize,
      ttl: ttlSeconds * 1000, // Convert to milliseconds
    });
  }

  /**
   * Generate cache key from parameters
   */
  private generateKey(key: CacheKey): string {
    return `${key.storeDomain}:${key.productId}:${key.intent}`;
  }

  /**
   * Get cached recommendations
   */
  get(key: CacheKey): SimilarItem[] | null {
    const cacheKey = this.generateKey(key);
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      return null;
    }

    return cached.items;
  }

  /**
   * Set cached recommendations
   */
  set(key: CacheKey, items: SimilarItem[]): void {
    const cacheKey = this.generateKey(key);
    const value: CacheValue = {
      items,
      timestamp: Date.now()
    };
    
    this.cache.set(cacheKey, value);
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
      ttl: this.cache.ttl
    };
  }
}

// Global cache instance
export const recommendationCache = new RecommendationCache();
