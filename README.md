# Shopify Backend - Similar Products API

A minimal TypeScript Node/Express backend that queries the Shopify Storefront GraphQL API and returns a compact list of similar products. Built for AR applications like Snap Spectacles.

## Features

- **GraphQL Integration**: Queries Shopify's Storefront GraphQL API
- **Multi-Store Support**: Groups stores by categories for targeted queries
- **Concurrency Control**: Limits concurrent requests to avoid overwhelming APIs
- **Caching**: In-memory LRU cache for improved performance
- **Error Handling**: Robust error handling with partial results
- **Type Safety**: Full TypeScript implementation with strict typing
- **Input Validation**: Zod schema validation for all requests
- **Testing**: Comprehensive unit tests with Vitest

## Project Structure

```
src/
├── app.ts                 # Express application setup
├── routes/
│   └── similar.ts        # Similar products endpoint
├── lib/
│   ├── shopify.ts        # Shopify GraphQL client
│   ├── stores.ts         # Store configuration and category matching
│   ├── concurrency.ts    # Concurrency limiting utility
│   ├── cache.ts          # LRU cache implementation
│   ├── validation.ts     # Zod validation schemas
│   └── similarService.ts # Main business logic
├── types/
│   └── index.ts          # TypeScript type definitions
└── tests/                # Unit tests
```

## Environment Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Environment variables**:
   Copy `env.example` to `.env` and configure:
   ```bash
   cp env.example .env
   ```

   Required environment variables:
   ```env
   PORT=3000
   SF_TOKEN_A=your_storefront_token_here
   SF_TOKEN_B=your_storefront_token_here
   SF_TOKEN_C=your_storefront_token_here
   # Add more tokens as needed for your stores
   ```

3. **Shopify Storefront Access Tokens**:
   - Generate Storefront API access tokens for each Shopify store
   - Add them to your `.env` file with the naming convention `SF_TOKEN_[STORE_NAME]`
   - Update the store configuration in `src/lib/stores.ts`

## Running the Application

### Development
```bash
pnpm dev
```

### Production
```bash
pnpm build
pnpm start
```

### Testing
```bash
pnpm test
```

## API Reference

### POST /v1/similar

Get similar products across multiple Shopify stores.

#### Request Body

```typescript
{
  keyword: string;             // required; substring match against category names
  productId?: string;          // optional; gid://shopify/Product/...
  handle?: string;             // optional; product handle (store-scoped)
  intent?: "RELATED" | "COMPLEMENTARY" | "ALTERNATE" | "NONE"; // default "RELATED"
  perStore?: number;           // default 6, max 24
  maxStores?: number;          // default 5, max 25
}
```

**Rules:**
- `keyword` is required
- Must provide either `productId` or `handle` (not both)
- `handle` will be resolved per store (handles are store-scoped)

#### Response Body

```typescript
{
  keyword: string;
  matchedCategories: string[];     // categories that matched the keyword
  candidates: Array<{
    store: string;                 // storeDomain
    items: Array<{
      id: string;                  // Shopify gid
      title: string;               // product title
      imageUrl: string | null;     // first image URL or null
    }>;
    warnings?: string[];           // errors for this store
  }>;
}
```

## Example Usage

### Using Product ID

```bash
curl -X POST http://localhost:3000/v1/similar \
  -H 'Content-Type: application/json' \
  -d '{
    "keyword": "jacket",
    "productId": "gid://shopify/Product/1234567890",
    "intent": "RELATED",
    "perStore": 6,
    "maxStores": 3
  }'
```

### Using Product Handle

```bash
curl -X POST http://localhost:3000/v1/similar \
  -H 'Content-Type: application/json' \
  -d '{
    "keyword": "outer",
    "handle": "blue-denim-jacket",
    "intent": "RELATED"
  }'
```

### Example Response

```json
{
  "keyword": "jacket",
  "matchedCategories": ["mens jackets", "outerwear"],
  "candidates": [
    {
      "store": "store-a.myshopify.com",
      "items": [
        {
          "id": "gid://shopify/Product/123",
          "title": "Blue Denim Jacket",
          "imageUrl": "https://cdn.shopify.com/image1.jpg"
        },
        {
          "id": "gid://shopify/Product/456",
          "title": "Black Trucker Jacket",
          "imageUrl": "https://cdn.shopify.com/image2.jpg"
        }
      ]
    },
    {
      "store": "store-b.myshopify.com",
      "items": [],
      "warnings": ["Handle not found on this store"]
    }
  ]
}
```

## Configuration

### Store Categories

Update the store configuration in `src/lib/stores.ts`:

```typescript
export const STORES_BY_CATEGORY: Record<string, StoreEntry[]> = {
  "mens jackets": [
    { storeDomain: "store-a.myshopify.com", storefrontTokenEnvVar: "SF_TOKEN_A" },
    { storeDomain: "store-b.myshopify.com", storefrontTokenEnvVar: "SF_TOKEN_B" },
  ],
  "outerwear": [
    { storeDomain: "store-a.myshopify.com", storefrontTokenEnvVar: "SF_TOKEN_A" },
    { storeDomain: "store-c.myshopify.com", storefrontTokenEnvVar: "SF_TOKEN_C" },
  ],
  // Add more categories...
};
```

### Performance Tuning

- **Concurrency**: Default is 3 concurrent requests per query (configurable in `ConcurrencyLimiter`)
- **Cache TTL**: Default is 60 seconds (configurable in `RecommendationCache`)
- **Request Timeout**: Default is 7 seconds per Shopify request
- **Cache Size**: Default is 1000 entries

## Error Handling

The API is designed to be resilient and return partial results even when some stores fail:

- **Missing Tokens**: Store is skipped with a warning
- **Network Timeouts**: Store returns empty results with timeout warning
- **GraphQL Errors**: Store returns empty results with error details
- **Invalid Handles**: Store returns empty results with "not found" warning

## Health Check

```bash
curl http://localhost:3000/health
```

Returns server status and uptime information.

## Security

- Storefront tokens are never exposed to clients
- CORS is enabled (TODO: restrict origins for production)
- Input validation prevents injection attacks
- Rate limiting can be added at the reverse proxy level

## Testing

Run the test suite:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

Test coverage includes:
- Category matching logic
- Input validation
- Error handling
- Concurrency limiting
- Cache functionality
- API endpoint behavior

## Deployment

1. Build the application:
   ```bash
   pnpm build
   ```

2. Set environment variables in your deployment environment

3. Start the application:
   ```bash
   pnpm start
   ```

## Future Enhancements

- [ ] Database integration for store configuration
- [ ] Redis cache for distributed caching
- [ ] Rate limiting middleware
- [ ] API authentication
- [ ] Metrics and monitoring
- [ ] Docker containerization
- [ ] CI/CD pipeline

