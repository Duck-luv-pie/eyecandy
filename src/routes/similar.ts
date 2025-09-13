import { Router, Request, Response } from 'express';
import { similarRequestSchema } from '../lib/validation.js';
import { getSimilarProducts } from '../lib/similarService.js';
import type { SimilarRequestValidated } from '../lib/validation.js';

const router = Router();

/**
 * POST /v1/similar
 * Get similar products across multiple Shopify stores
 */
router.post('/similar', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedRequest = similarRequestSchema.parse(req.body);
    
    // Get similar products
    const result = await getSimilarProducts(validatedRequest);
    
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      // Zod validation errors
      if (error.name === 'ZodError') {
        res.status(400).json({
          error: 'Validation Error',
          message: error.message,
          details: (error as any).issues
        });
        return;
      }
      
      // Business logic errors
      if (error.message.includes('Either productId or handle must be provided') ||
          error.message.includes('Cannot provide both productId and handle') ||
          error.message.includes('perStore cannot exceed') ||
          error.message.includes('maxStores cannot exceed')) {
        res.status(400).json({
          error: 'Bad Request',
          message: error.message
        });
        return;
      }
    }
    
    // Internal server error
    console.error('Unexpected error in /v1/similar:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
});

export default router;

