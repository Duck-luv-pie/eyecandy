import { z } from 'zod';

/**
 * Zod schema for validating similar products request
 */
export const similarRequestSchema = z.object({
  keyword: z.string()
    .min(1, "Keyword is required")
    .max(100, "Keyword cannot exceed 100 characters"),
  
  productId: z.string()
    .regex(/^gid:\/\/shopify\/Product\/\d+$/, "Invalid Shopify product ID format")
    .optional(),
  
  handle: z.string()
    .min(1, "Handle cannot be empty")
    .max(255, "Handle cannot exceed 255 characters")
    .regex(/^[a-z0-9\-]+$/, "Handle must contain only lowercase letters, numbers, and hyphens")
    .optional(),
  
  intent: z.enum(["RELATED", "COMPLEMENTARY", "ALTERNATE", "NONE"])
    .default("RELATED"),
  
  perStore: z.number()
    .int("perStore must be an integer")
    .min(1, "perStore must be at least 1")
    .max(24, "perStore cannot exceed 24")
    .default(6),
  
  maxStores: z.number()
    .int("maxStores must be an integer")
    .min(1, "maxStores must be at least 1")
    .max(25, "maxStores cannot exceed 25")
    .default(5)
}).refine(
  (data: any) => data.productId || data.handle,
  {
    message: "Either productId or handle must be provided",
    path: ["productId", "handle"]
  }
).refine(
  (data: any) => !(data.productId && data.handle),
  {
    message: "Cannot provide both productId and handle",
    path: ["productId", "handle"]
  }
);

export type SimilarRequestInput = z.input<typeof similarRequestSchema>;
export type SimilarRequestValidated = z.output<typeof similarRequestSchema>;

