import { describe, it, expect } from 'vitest';
import { similarRequestSchema } from './validation.js';

describe('similarRequestSchema', () => {
  it('should validate a valid request with productId', () => {
    const validRequest = {
      keyword: 'jacket',
      productId: 'gid://shopify/Product/1234567890',
      intent: 'RELATED' as const,
      perStore: 6,
      maxStores: 5
    };

    const result = similarRequestSchema.parse(validRequest);
    expect(result).toEqual(validRequest);
  });

  it('should validate a valid request with handle', () => {
    const validRequest = {
      keyword: 'outerwear',
      handle: 'blue-denim-jacket',
      intent: 'COMPLEMENTARY' as const,
      perStore: 10,
      maxStores: 3
    };

    const result = similarRequestSchema.parse(validRequest);
    expect(result).toEqual(validRequest);
  });

  it('should apply default values', () => {
    const minimalRequest = {
      keyword: 'shoes',
      productId: 'gid://shopify/Product/1234567890'
    };

    const result = similarRequestSchema.parse(minimalRequest);
    expect(result.intent).toBe('RELATED');
    expect(result.perStore).toBe(6);
    expect(result.maxStores).toBe(5);
  });

  it('should reject invalid productId format', () => {
    const invalidRequest = {
      keyword: 'jacket',
      productId: 'invalid-product-id',
      intent: 'RELATED' as const
    };

    expect(() => similarRequestSchema.parse(invalidRequest)).toThrow();
  });

  it('should reject invalid handle format', () => {
    const invalidRequest = {
      keyword: 'jacket',
      handle: 'Invalid Handle With Spaces',
      intent: 'RELATED' as const
    };

    expect(() => similarRequestSchema.parse(invalidRequest)).toThrow();
  });

  it('should reject when both productId and handle are provided', () => {
    const invalidRequest = {
      keyword: 'jacket',
      productId: 'gid://shopify/Product/1234567890',
      handle: 'blue-jacket',
      intent: 'RELATED' as const
    };

    expect(() => similarRequestSchema.parse(invalidRequest)).toThrow();
  });

  it('should reject when neither productId nor handle are provided', () => {
    const invalidRequest = {
      keyword: 'jacket',
      intent: 'RELATED' as const
    };

    expect(() => similarRequestSchema.parse(invalidRequest)).toThrow();
  });

  it('should reject empty keyword', () => {
    const invalidRequest = {
      keyword: '',
      productId: 'gid://shopify/Product/1234567890'
    };

    expect(() => similarRequestSchema.parse(invalidRequest)).toThrow();
  });

  it('should reject perStore exceeding limit', () => {
    const invalidRequest = {
      keyword: 'jacket',
      productId: 'gid://shopify/Product/1234567890',
      perStore: 25
    };

    expect(() => similarRequestSchema.parse(invalidRequest)).toThrow();
  });

  it('should reject maxStores exceeding limit', () => {
    const invalidRequest = {
      keyword: 'jacket',
      productId: 'gid://shopify/Product/1234567890',
      maxStores: 26
    };

    expect(() => similarRequestSchema.parse(invalidRequest)).toThrow();
  });

  it('should reject invalid intent values', () => {
    const invalidRequest = {
      keyword: 'jacket',
      productId: 'gid://shopify/Product/1234567890',
      intent: 'INVALID_INTENT'
    };

    expect(() => similarRequestSchema.parse(invalidRequest)).toThrow();
  });

  it('should accept all valid intent values', () => {
    const intents = ['RELATED', 'COMPLEMENTARY', 'ALTERNATE', 'NONE'] as const;
    
    for (const intent of intents) {
      const request = {
        keyword: 'jacket',
        productId: 'gid://shopify/Product/1234567890',
        intent
      };

      const result = similarRequestSchema.parse(request);
      expect(result.intent).toBe(intent);
    }
  });

  it('should reject non-integer perStore and maxStores', () => {
    const invalidRequest = {
      keyword: 'jacket',
      productId: 'gid://shopify/Product/1234567890',
      perStore: 6.5,
      maxStores: 5.2
    };

    expect(() => similarRequestSchema.parse(invalidRequest)).toThrow();
  });

  it('should reject zero or negative perStore and maxStores', () => {
    const invalidRequest = {
      keyword: 'jacket',
      productId: 'gid://shopify/Product/1234567890',
      perStore: 0,
      maxStores: -1
    };

    expect(() => similarRequestSchema.parse(invalidRequest)).toThrow();
  });
});

