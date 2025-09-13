import { Router, Request, Response } from 'express';
import { getAllProducts } from '../lib/products.js';
import { getStorefrontToken } from '../lib/stores.js';
import { z } from 'zod';

const router = Router();

const getProductsSchema = z.object({
  storeDomain: z.string().optional().default('shirtsfordemos.myshopify.com'),
  limit: z.number().int().min(1).max(100).optional().default(20)
});

/**
 * GET /v1/products
 * Get all products from a Shopify store
 */
router.get('/products', async (req: Request, res: Response) => {
  try {
    const { storeDomain, limit } = getProductsSchema.parse({
      storeDomain: req.query.storeDomain as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    });

    // Get token for the store
    const token = getStorefrontToken('SF_TOKEN_A');
    if (!token) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'Storefront token not configured'
      });
    }

    // Get all products
    const products = await getAllProducts(storeDomain, token, limit);

    res.json({
      store: storeDomain,
      count: products.length,
      products
    });

  } catch (error) {
    if (error instanceof Error) {
      // Zod validation errors
      if (error.name === 'ZodError') {
        res.status(400).json({
          error: 'Validation Error',
          message: error.message
        });
        return;
      }
    }
    
    console.error('Error in /v1/products:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch products'
    });
  }
});

export default router;
