export interface SimilarItem {
  id: string;        // Shopify gid, e.g., "gid://shopify/Product/1234567890"
  title: string;     // product title
  imageUrl: string | null; // first image URL or null
}

export interface StoreEntry {
  storeDomain: string;              // e.g., "acme.myshopify.com"
  storefrontTokenEnvVar: string;    // e.g., "SF_TOKEN_ACME"
}

export interface SimilarRequest {
  keyword: string;             // required; substring match against CATEGORY names
  productId?: string;          // optional; gid://shopify/Product/...
  handle?: string;             // optional; if productId absent, resolve per store via productByHandle
  intent?: "RELATED" | "COMPLEMENTARY" | "ALTERNATE" | "NONE"; // default "RELATED"
  perStore?: number;           // default 6, max 24
  maxStores?: number;          // default 5, max 25
}

export interface SimilarResponse {
  keyword: string;
  matchedCategories: string[];     // categories that matched the keyword
  candidates: Array<{
    store: string;                 // storeDomain
    items: SimilarItem[];          // mapped to { id, title, imageUrl }
    warnings?: string[];           // e.g., "Handle not found on this store"
  }>;
}

export interface StoreCandidate {
  store: string;
  items: SimilarItem[];
  warnings?: string[];
}

// Shopify GraphQL Types
export interface ShopifyProduct {
  id: string;
  title: string;
  images: {
    edges: Array<{
      node: {
        url: string;
      };
    }>;
  };
}

export interface ShopifyProductByHandle {
  productByHandle: {
    id: string;
  } | null;
}

export interface ShopifyRecommendations {
  productRecommendations: ShopifyProduct[];
}

export interface ShopifyGraphQLResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
  }>;
}

