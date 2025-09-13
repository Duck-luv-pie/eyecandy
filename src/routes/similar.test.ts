import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import similarRouter from './similar.js';

// Mock the similar service
vi.mock('../lib/similarService.js', () => ({
  getSimilarProducts: vi.fn()
}));

import { getSimilarProducts } from '../lib/similarService.js';

const app = express();
app.use(express.json());
app.use('/v1', similarRouter);

describe('/v1/similar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return similar products for valid request with productId', async () => {
    const mockResponse = {
      keyword: 'jacket',
      matchedCategories: ['mens jackets', 'outerwear'],
      candidates: [
        {
          store: 'store-a.myshopify.com',
          items: [
            {
              id: 'gid://shopify/Product/123',
              title: 'Blue Denim Jacket',
              imageUrl: 'https://cdn.shopify.com/image1.jpg'
            }
          ]
        }
      ]
    };

    vi.mocked(getSimilarProducts).mockResolvedValue(mockResponse);

    const response = await request(app)
      .post('/v1/similar')
      .send({
        keyword: 'jacket',
        productId: 'gid://shopify/Product/1234567890',
        intent: 'RELATED',
        perStore: 6,
        maxStores: 3
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
    expect(getSimilarProducts).toHaveBeenCalledWith({
      keyword: 'jacket',
      productId: 'gid://shopify/Product/1234567890',
      intent: 'RELATED',
      perStore: 6,
      maxStores: 3
    });
  });

  it('should return similar products for valid request with handle', async () => {
    const mockResponse = {
      keyword: 'outerwear',
      matchedCategories: ['outerwear'],
      candidates: [
        {
          store: 'store-a.myshopify.com',
          items: []
        }
      ]
    };

    vi.mocked(getSimilarProducts).mockResolvedValue(mockResponse);

    const response = await request(app)
      .post('/v1/similar')
      .send({
        keyword: 'outer',
        handle: 'blue-denim-jacket',
        intent: 'COMPLEMENTARY'
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
    expect(getSimilarProducts).toHaveBeenCalledWith({
      keyword: 'outer',
      handle: 'blue-denim-jacket',
      intent: 'COMPLEMENTARY',
      perStore: 6,
      maxStores: 5
    });
  });

  it('should return 400 for invalid productId format', async () => {
    const response = await request(app)
      .post('/v1/similar')
      .send({
        keyword: 'jacket',
        productId: 'invalid-product-id'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation Error');
  });

  it('should return 400 for invalid handle format', async () => {
    const response = await request(app)
      .post('/v1/similar')
      .send({
        keyword: 'jacket',
        handle: 'Invalid Handle With Spaces'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation Error');
  });

  it('should return 400 when both productId and handle are provided', async () => {
    const response = await request(app)
      .post('/v1/similar')
      .send({
        keyword: 'jacket',
        productId: 'gid://shopify/Product/1234567890',
        handle: 'blue-jacket'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation Error');
  });

  it('should return 400 when neither productId nor handle are provided', async () => {
    const response = await request(app)
      .post('/v1/similar')
      .send({
        keyword: 'jacket'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation Error');
  });

  it('should return 400 for empty keyword', async () => {
    const response = await request(app)
      .post('/v1/similar')
      .send({
        keyword: '',
        productId: 'gid://shopify/Product/1234567890'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation Error');
  });

  it('should return 400 for perStore exceeding limit', async () => {
    const response = await request(app)
      .post('/v1/similar')
      .send({
        keyword: 'jacket',
        productId: 'gid://shopify/Product/1234567890',
        perStore: 25
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation Error');
  });

  it('should return 400 for maxStores exceeding limit', async () => {
    const response = await request(app)
      .post('/v1/similar')
      .send({
        keyword: 'jacket',
        productId: 'gid://shopify/Product/1234567890',
        maxStores: 26
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation Error');
  });

  it('should return 400 for business logic errors', async () => {
    vi.mocked(getSimilarProducts).mockRejectedValue(new Error('Either productId or handle must be provided'));

    const response = await request(app)
      .post('/v1/similar')
      .send({
        keyword: 'jacket',
        productId: 'gid://shopify/Product/1234567890'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    expect(response.body.message).toBe('Either productId or handle must be provided');
  });

  it('should return 500 for unexpected errors', async () => {
    vi.mocked(getSimilarProducts).mockRejectedValue(new Error('Unexpected error'));

    const response = await request(app)
      .post('/v1/similar')
      .send({
        keyword: 'jacket',
        productId: 'gid://shopify/Product/1234567890'
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal Server Error');
  });
});

