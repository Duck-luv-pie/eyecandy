interface Product {
    id: string;
    title: string;
    imageUrl: string | null;
}

interface SearchResponse {
    keyword: string;
    matchedCategories: string[];
    candidates: Array<{
        store: string;
        items: Product[];
        warnings?: string[];
    }>;
}

@component
export class SimpleProductSearch extends BaseScriptComponent {
    private internetModule: InternetModule = require("LensStudio:InternetModule");
    private baseUrl = "https://spectacles-vxd1.onrender.com/";

    onAwake() {
        print("[SimpleSearch] Component initialized successfully!");
        this.testSweaterSearch();
    }

    public searchProducts(keyword: string) {
        print(`[SimpleSearch] Searching for products with keyword: "${keyword}"`);

        // Step 1: Update backend keyword
        this.internetModule
            .fetch(this.baseUrl + "v1/keyword", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ keyword: keyword.trim() })
            })
            .then((response) => response.json())
            .then((data) => {
                print(`[SimpleSearch] ✅ Backend keyword updated successfully`);

                // Step 2: Search for similar products
                this.searchSimilarProducts(keyword.trim());
            })
            .catch(failAsync);
    }

    private searchSimilarProducts(keyword: string) {
        // Use direct products endpoint instead of recommendations
        this.internetModule
            .fetch(this.baseUrl + "v1/products", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                }
            })
            .then((response) => response.json())
            .then((data) => {
                print(`[SimpleSearch] ✅ Products request successful`);
                print(`[SimpleSearch] Raw response: ${JSON.stringify(data)}`);

                // Filter products by keyword
                const allProducts: Product[] = data.products || [];
                const filteredProducts = allProducts.filter(product => {
                    const title = product.title.toLowerCase();
                    return title.includes(keyword.toLowerCase());
                });

                print(`[SimpleSearch] Found ${filteredProducts.length} products matching "${keyword}"`);
                print(`[SimpleSearch] Total products available: ${allProducts.length}`);

                // Log each product
                filteredProducts.forEach((product, index) => {
                    const title = product.title || "none";
                    const imageUrl = product.imageUrl || "none";
                    print(`[SimpleSearch] Product ${index + 1}: ${title}`);
                    print(`[SimpleSearch] Image: ${imageUrl}`);
                });

                // Products received - logged above
            })
            .catch(failAsync);
    }

    private getProductHandleForKeyword(keyword: string): string {
        // Map keywords to product handles in your Shopify store
        const keywordToHandle: { [key: string]: string } = {
            "sweater": "red-sweater", // This should match your red sweater's handle
            "sweaters": "red sweater",
            "sweaters2": "red-sweater",
            "red": "red-sweater",
            "red sweater": "red-sweater",
            "jacket": "some-jacket-handle",
            "shoes": "some-shoe-handle",
            // Add more mappings as needed
        };

        const handle = keywordToHandle[keyword.toLowerCase()];
        if (handle) {
            print(`[SimpleSearch] Using product handle: ${handle}`);
            return handle;
        }

        // Fallback to a default handle
        print(`[SimpleSearch] No specific handle found for "${keyword}", using default`);
        return "red-sweater"; // Default to your red sweater
    }

    private testSweaterSearch() {
        print("[SimpleSearch] ===== TESTING SWEATER SEARCH =====");
        print("[SimpleSearch] Testing search for 'sweater' (should match 'sweaters' category)...");

        // Test will run automatically when search completes
        this.searchProducts("sweater");
    }
}