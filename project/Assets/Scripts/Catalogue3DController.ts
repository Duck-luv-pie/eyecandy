import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton";
import { LSTween } from "LSTween.lspkg/LSTween";
import Easing from "LSTween.lspkg/TweenJS/Easing";
import { HandInputData } from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/HandInputData";
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import { CatalogueItem3D } from "./CatalogueItem3D";
import { SimpleProductSearch } from "./SimpleProductSearch";
import { GetHttpImage } from "../GetHttpImage";

// Define ProductResult interface to match SimpleProductSearch
interface ProductResult {
    name: string;
    imageTexture: Texture | null;
    imageUrl: string | null;
    price?: { amount: string; currencyCode: string }; // Price object from Shopify API
    id?: string;
}



@component
export class Catalogue3DController extends BaseScriptComponent {
    @ui.separator
    @ui.label("3D Catalogue Panel for Spectacles - Inspector Fields")
    @ui.separator

    @ui.group_start("Debug Test")
    @input
    private debugTest: boolean = true;
    @ui.group_end

    @ui.group_start("Main Panel Setup")
    @input
    private cataloguePanel: SceneObject;

    @input
    private itemsContainer: SceneObject;

    @input
    private closeButton: SceneObject;
    @ui.group_end

    @ui.group_start("Navigation Controls")
    @input
    private scrollUpButton: SceneObject;

    @input
    private scrollDownButton: SceneObject;

    @input
    private pageIndicatorText: Text;
    @ui.group_end

    @ui.group_start("Item Prefab")
    @input
    private itemPrefab: SceneObject;
    @ui.group_end

    @ui.group_start("Layout Settings")
    @input
    private itemsPerRow: number = 3;

    @input
    private rowsPerPage: number = 4;

    @input
    private itemSpacing: number = 15;

    @input
    private rowSpacing: number = 12;
    @ui.group_end

    @ui.group_start("Panel Positioning")
    @input
    private followHand: boolean = true;

    @input
    private panelDistance: number = 50;
    // Around line 71, make shopifySearch optional:

    @ui.group_start("Pre-made Items")
    @input
    public catalogueItems: CatalogueItem3D[] = []; // Will be populated automatically from scene objects
    @ui.group_end    // Optional Shopify integration (not an Inspector input to avoid required field error)
    private shopifySearch: SimpleProductSearch | null = null;

    // Optional manual assignment for Shopify search (not required)
    private manualShopifySearch: SimpleProductSearch | null = null;

    // HTTP Image loader component
    private httpImageLoader: GetHttpImage | null = null;

    // Sample catalogue data with more items for scrolling
    private catalogueData = [
        {
            id: 1,
            name: "Magic Sword",
            description: "Legendary blade with mystical powers",
            category: "Weapons"
        },
        {
            id: 2,
            name: "Crystal Staff",
            description: "Staff that channels elemental magic",
            category: "Weapons"
        },
        {
            id: 3,
            name: "Dragon Shield",
            description: "Forged from ancient dragon scales",
            category: "Armor"
        },
        {
            id: 4,
            name: "Healing Potion",
            description: "Restores health instantly",
            category: "Consumables"
        },
        {
            id: 5,
            name: "Fire Ring",
            description: "Ring that grants fire immunity",
            category: "Accessories"
        },
        {
            id: 6,
            name: "Ice Bow",
            description: "Bow that shoots ice arrows",
            category: "Weapons"
        },
        {
            id: 7,
            name: "Lightning Gauntlets",
            description: "Gauntlets that channel lightning",
            category: "Armor"
        },
        {
            id: 8,
            name: "Mana Crystal",
            description: "Increases magical power",
            category: "Accessories"
        },
        {
            id: 9,
            name: "Stealth Cloak",
            description: "Makes wearer invisible",
            category: "Armor"
        },
        {
            id: 10,
            name: "Phoenix Feather",
            description: "Grants resurrection ability",
            category: "Consumables"
        },
        {
            id: 11,
            name: "Shadow Dagger",
            description: "Blade that strikes from shadows",
            category: "Weapons"
        },
        {
            id: 12,
            name: "Wind Boots",
            description: "Boots that grant flight",
            category: "Armor"
        },
        {
            id: 13,
            name: "Thunder Hammer",
            description: "Hammer that summons storms",
            category: "Weapons"
        },
        {
            id: 14,
            name: "Wisdom Scroll",
            description: "Ancient knowledge on parchment",
            category: "Consumables"
        },
        {
            id: 15,
            name: "Void Orb",
            description: "Orb that controls dark energy",
            category: "Accessories"
        }
    ];

    private currentPage: number = 0;
    private totalPages: number = 0;
    private itemsPerPage: number = 0;
    private currentItemObjects: SceneObject[] = [];
    private isVisible: boolean = false;

    // Interaction components
    private closeButtonComponent: PinchButton;
    private scrollUpComponent: PinchButton;
    private scrollDownComponent: PinchButton;

    // Hand tracking
    private handProvider: HandInputData = HandInputData.getInstance();
    private menuHand = this.handProvider.getHand("left");
    private wcfmp = WorldCameraFinderProvider.getInstance();

    // Events
    public onItemSelected: Event<{ id: number; name: string; description: string; category: string }> =
        new Event<{ id: number; name: string; description: string; category: string }>();

    public onCatalogueVisibilityChanged: Event<boolean> = new Event<boolean>();

    // Simplify onAwake to only use pre-made items:

    onAwake() {
        // Hardcode the catalogueItems by finding CatalogueItem3D components in scene
        this.findAndAssignCatalogueItems();

        // Try to find SimpleProductSearch component automatically
        this.findShopifySearchComponent();

        // Try to find GetHttpImage component automatically
        this.findHttpImageComponent();

        this.setupInteractionComponents();
        this.validateCatalogueItems();

        if (this.followHand) {
            this.createEvent("UpdateEvent").bind(this.updateHandPosition.bind(this));
        }

        print(`3D Catalogue initialized with ${this.catalogueItems.length} pre-made items`);

        // Search and fill catalogue with default topic - delay slightly to allow components to initialize
        print("🚀 Starting automatic catalogue search on awake...");

        if (this.shopifySearch) {
            // Component found, search immediately
            print("ShopifySearch component available, searching for products...");
            this.searchAndFillCatalogue("shirt");
        } else {
            // Component not found, try again after a short delay
            print("SimpleProductSearch not found, trying again in 1 second...");
            const delayedEvent = this.createEvent("DelayedCallbackEvent");
            delayedEvent.bind(() => {
                this.findShopifySearchComponent();
                this.searchAndFillCatalogue("sweater");
            });
            delayedEvent.reset(1.0); // 1 second delay
        }
    }

    private findAndAssignCatalogueItems(): void {
        print("=== Finding and assigning CatalogueItem3D components from scene ===");

        // Clear the array first
        this.catalogueItems = [];

        // Define the prefab names we're looking for
        const prefabNames = [
            "CatalogueItemPrefab",
            "CatalogueItemPrefab 1",
            "CatalogueItemPrefab 2",
            "CatalogueItemPrefab 4",
            "CatalogueItemPrefab 5",
            "CatalogueItemPrefab 3",
            "CatalogueItemPrefab 8",
            "CatalogueItemPrefab 7",
            "CatalogueItemPrefab 6"
        ];

        // Search for each prefab in the scene
        for (const prefabName of prefabNames) {
            const foundObject = this.findSceneObjectByName(prefabName);
            if (foundObject) {
                try {
                    const catalogueItemComponent = foundObject.getComponent(CatalogueItem3D.getTypeName()) as CatalogueItem3D;
                    if (catalogueItemComponent) {
                        this.catalogueItems.push(catalogueItemComponent);
                        print(`✅ Found and added: ${prefabName}`);
                    } else {
                        print(`⚠️ ${prefabName} found but has no CatalogueItem3D component`);
                    }
                } catch (error) {
                    print(`❌ Error getting CatalogueItem3D component from ${prefabName}: ${error}`);
                }
            } else {
                print(`❌ Could not find object: ${prefabName}`);
            }
        }

        print(`🎯 Total CatalogueItem3D components found: ${this.catalogueItems.length}`);

        // Fill remaining slots with null if we need exactly 12
        while (this.catalogueItems.length < 12) {
            this.catalogueItems.push(null as any);
        }
    }

    private findSceneObjectByName(name: string): SceneObject | null {
        // Search recursively starting from scene root
        return this.searchForObjectRecursively(this.getSceneObject().getParent() || this.getSceneObject(), name);
    }

    private searchForObjectRecursively(obj: SceneObject, targetName: string): SceneObject | null {
        // Check current object
        if (obj.name === targetName) {
            return obj;
        }

        // Search children
        for (let i = 0; i < obj.getChildrenCount(); i++) {
            const child = obj.getChild(i);
            if (child.name === targetName) {
                return child;
            }

            // Recursively search in child
            const found = this.searchForObjectRecursively(child, targetName);
            if (found) {
                return found;
            }
        }

        return null;
    }

    private findHttpImageComponent(): void {
        if (this.httpImageLoader) {
            print("GetHttpImage already assigned");
            return;
        }

        print("Searching for GetHttpImage component in scene...");

        try {
            // Search in the current scene object and its children
            const httpImageComponent = this.getSceneObject().getComponent(GetHttpImage.getTypeName()) as GetHttpImage;
            if (httpImageComponent) {
                this.httpImageLoader = httpImageComponent;
                print("✅ Found GetHttpImage component on same object");
                return;
            }

            // Search in parent objects
            let parent = this.getSceneObject().getParent();
            while (parent) {
                const parentHttpImageComponent = parent.getComponent(GetHttpImage.getTypeName()) as GetHttpImage;
                if (parentHttpImageComponent) {
                    this.httpImageLoader = parentHttpImageComponent;
                    print("✅ Found GetHttpImage component on parent object");
                    return;
                }
                parent = parent.getParent();
            }

            // Search in scene root and its children recursively
            this.searchForHttpImageRecursively(this.getSceneObject().getParent() || this.getSceneObject());

        } catch (error) {
            print(`Error searching for GetHttpImage component: ${error}`);
            print("GetHttpImage component may not be initialized yet - image loading will be disabled");
        }

        if (this.httpImageLoader) {
            print("Found GetHttpImage component in scene");
        } else {
            print("GetHttpImage component not found in scene - image loading will be disabled");
        }
    }

    private searchForHttpImageRecursively(obj: SceneObject): void {
        if (this.httpImageLoader) return; // Already found

        try {
            const httpImageComponent = obj.getComponent(GetHttpImage.getTypeName()) as GetHttpImage;
            if (httpImageComponent) {
                this.httpImageLoader = httpImageComponent;
                print("✅ Found GetHttpImage component in scene recursively");
                return;
            }
        } catch (error) {
            // Component type not available yet, skip this object
        }

        // Search children
        for (let i = 0; i < obj.getChildrenCount(); i++) {
            this.searchForHttpImageRecursively(obj.getChild(i));
            if (this.httpImageLoader) return;
        }
    }

    private findShopifySearchComponent(): void {
        if (this.shopifySearch) {
            print("SimpleProductSearch already assigned");
            return;
        }

        print("Searching for SimpleProductSearch component in scene...");

        try {
            // Search in the current scene object and its children
            const searchComponent = this.getSceneObject().getComponent(SimpleProductSearch.getTypeName()) as SimpleProductSearch;
            if (searchComponent) {
                this.shopifySearch = searchComponent;
                print("Found SimpleProductSearch component on same object");

                // Verify the component has the required method
                if (this.shopifySearch.searchProducts && typeof this.shopifySearch.searchProducts === 'function') {
                    print("✅ SimpleProductSearch component is valid and has searchProducts method");
                } else {
                    print("⚠️ SimpleProductSearch component found but searchProducts method is not available");
                    this.shopifySearch = null;
                }
                return;
            }

            // Search in parent objects
            let parent = this.getSceneObject().getParent();
            while (parent) {
                const parentSearchComponent = parent.getComponent(SimpleProductSearch.getTypeName()) as SimpleProductSearch;
                if (parentSearchComponent) {
                    this.shopifySearch = parentSearchComponent;
                    print("Found SimpleProductSearch component on parent object");

                    // Verify the component has the required method
                    if (this.shopifySearch.searchProducts && typeof this.shopifySearch.searchProducts === 'function') {
                        print("✅ SimpleProductSearch component is valid and has searchProducts method");
                    } else {
                        print("⚠️ SimpleProductSearch component found but searchProducts method is not available");
                        this.shopifySearch = null;
                    }
                    return;
                }
                parent = parent.getParent();
            }

            // Search in scene root and its children recursively
            this.searchInSceneRecursively(this.getSceneObject().getParent() || this.getSceneObject());

        } catch (error) {
            print(`Error searching for SimpleProductSearch component: ${error}`);
            print("SimpleProductSearch component may not be initialized yet - will use sample data");
        }

        if (this.shopifySearch) {
            print("Found SimpleProductSearch component in scene");
        } else {
            print("SimpleProductSearch component not found in scene - will use sample data");
        }
    }

    private searchInSceneRecursively(obj: SceneObject): void {
        if (this.shopifySearch) return; // Already found

        try {
            const searchComponent = obj.getComponent(SimpleProductSearch.getTypeName()) as SimpleProductSearch;
            if (searchComponent) {
                // Verify the component has the required method
                if (searchComponent.searchProducts && typeof searchComponent.searchProducts === 'function') {
                    this.shopifySearch = searchComponent;
                    print("✅ Found valid SimpleProductSearch component in scene recursively");
                    return;
                } else {
                    print("⚠️ Found SimpleProductSearch component but searchProducts method is not available");
                }
            }
        } catch (error) {
            // Component type not available yet, skip this object
        }

        // Search children
        for (let i = 0; i < obj.getChildrenCount(); i++) {
            this.searchInSceneRecursively(obj.getChild(i));
            if (this.shopifySearch) return;
        }
    }

    private validateCatalogueItems() {
        print(`=== Validating ${this.catalogueItems.length} catalogue items ===`);

        for (let i = 0; i < this.catalogueItems.length; i++) {
            const item = this.catalogueItems[i];
            if (item) {
                print(`Item ${i}: ${item.getSceneObject().name} - OK`);
            } else {
                print(`Item ${i}: NULL - Please assign in Inspector`);
            }
        }
    }

    // Add convenience methods:
    public switchToShopifyProducts(keyword: string) {
        this.searchAndFillCatalogue(keyword);
    }

    public switchToSampleData() {
        this.fillWithSampleData();
    }

    public refreshCatalogue() {
        // Re-search with sweater as default
        this.searchAndFillCatalogue("sweater");
    }

    /**
     * Public method to search for a specific topic and update catalogue
     * @param topic The search topic (e.g., "shoes", "jacket", "dress")
     */
    public searchForTopic(topic: string): void {
        print(`🔍 User requested search for: "${topic}"`);
        this.searchAndFillCatalogue(topic);
    }

    /**
     * Public method to test delayed image loading for all catalogue items
     * This will assign test data and trigger delayed image loading
     */
    public testDelayedImageLoading(): void {
        print(`⏰ Testing delayed image loading for ${this.catalogueItems.length} catalogue items`);

        // Test URLs (can be from actual Shopify products or test images)
        const testImageUrls = [
            "https://cdn.shopify.com/s/files/1/0702/5213/4550/files/red_sweater.png?v=1757798642",
            "https://cdn.shopify.com/s/files/1/0702/5213/4550/files/bluesweater.png?v=1757814249",
            "https://cdn.shopify.com/s/files/1/0702/5213/4550/files/christmas_sweater.png?v=1757830373",
            "https://developers.snap.com/img/spectacles/spectacles-2024-hero.png",
            "https://cdn.shopify.com/s/files/1/0702/5213/4550/files/red_sweater.png?v=1757798642",
            "https://cdn.shopify.com/s/files/1/0702/5213/4550/files/bluesweater.png?v=1757814249"
        ];

        for (let i = 0; i < this.catalogueItems.length; i++) {
            const catalogueItem = this.catalogueItems[i];
            if (catalogueItem) {
                // Activate the item
                catalogueItem.getSceneObject().enabled = true;

                // Set catalogue index
                catalogueItem.setCatalogueIndex(i);

                // Create test product data with actual image URLs
                const testImageUrl = testImageUrls[i % testImageUrls.length];
                const testProductData = {
                    id: i + 100,
                    name: `Test Product ${i + 1}`,
                    description: `Test description for product ${i + 1}`,
                    category: `Category ${i + 1}`,
                    imageUrl: testImageUrl,
                    price: {
                        amount: `${(i + 1) * 10}.99`,
                        currencyCode: 'USD'
                    }
                };

                // This will automatically trigger delayed loading
                catalogueItem.setProductDataWithDelay(testProductData, true);

                print(`⏰ Item ${i}: Scheduled delayed load (${i * 500}ms) for "${testProductData.name}" from: ${testImageUrl}`);
            }
        }

        print(`✅ Delayed image loading test initiated - images will load sequentially with 500ms intervals`);
    }

    /**
     * Public method to force load images for all items immediately (for comparison)
     */
    public testImmediateImageLoading(): void {
        print(`🚀 Testing immediate image loading for ${this.catalogueItems.length} catalogue items`);

        // Same test URLs 
        const testImageUrls = [
            "https://cdn.shopify.com/s/files/1/0702/5213/4550/files/red_sweater.png?v=1757798642",
            "https://cdn.shopify.com/s/files/1/0702/5213/4550/files/bluesweater.png?v=1757814249",
            "https://cdn.shopify.com/s/files/1/0702/5213/4550/files/christmas_sweater.png?v=1757830373"
        ];

        for (let i = 0; i < this.catalogueItems.length; i++) {
            const catalogueItem = this.catalogueItems[i];
            if (catalogueItem) {
                // Activate the item
                catalogueItem.getSceneObject().enabled = true;

                // Set catalogue index
                catalogueItem.setCatalogueIndex(i);

                // Create test product data
                const testImageUrl = testImageUrls[i % testImageUrls.length];
                const testProductData = {
                    id: i + 200,
                    name: `Immediate Test ${i + 1}`,
                    description: `Immediate load test ${i + 1}`,
                    category: `Category ${i + 1}`,
                    imageUrl: testImageUrl,
                    price: {
                        amount: `${(i + 1) * 10}.99`,
                        currencyCode: 'USD'
                    }
                };

                // Set data but disable auto-loading
                catalogueItem.setProductDataWithDelay(testProductData, false);

                // Then manually trigger immediate load
                catalogueItem.loadImageFromUrl(testImageUrl);

                print(`🚀 Item ${i}: Immediate load triggered for "${testProductData.name}" from: ${testImageUrl}`);
            }
        }

        print(`⚡ Immediate image loading test initiated - all images loading at once`);
    }    /**
     * Debug method to check what textures are currently loaded
     */
    public debugTextureStatus(): void {
        print("=== DELAYED LOADING DEBUG STATUS ===");

        // Check individual catalogue item textures and URLs
        print("=== INDIVIDUAL CATALOGUE ITEM TEXTURES (DELAYED LOADING) ===");
        for (let i = 0; i < this.catalogueItems.length; i++) {
            const item = this.catalogueItems[i];
            if (item && item.getSceneObject().enabled) {
                const hasTexture = item.hasTexture();
                const textureInfo = item.getTextureInfo();
                const itemData = item.getItemData();
                const currentImageUrl = item.getCurrentImageUrl();

                print(`📸 Item ${i}: "${itemData?.name || 'Unknown'}"`);
                print(`   ${textureInfo}`);
                print(`   Has Texture: ${hasTexture}`);
                print(`   Current URL: ${currentImageUrl || 'None'}`);
                print(`   Expected delay: ${i * 500}ms`);
            } else {
                print(`❌ Item ${i}: Disabled or NULL`);
            }
        }        // Check old batch loading textures (for comparison - will be deprecated)
        if (this.httpImageLoader) {
            print("=== DEPRECATED BATCH LOADING TEXTURES ===");
            const allTextures = this.httpImageLoader.getAllLoadedTextures();
            print(`Total batch textures loaded: ${allTextures.length}`);

            for (let i = 0; i < allTextures.length; i++) {
                const textureData = allTextures[i];
                print(`Batch Texture ${i}: Index=${textureData.index}, URL=${textureData.url}`);
            }
        } else {
            print("No HTTP image loader found");
        }

        print("=== CATALOGUE ITEM STATUS ===");
        for (let i = 0; i < this.catalogueItems.length; i++) {
            const item = this.catalogueItems[i];
            if (item) {
                print(`Catalogue item ${i}: enabled=${item.getSceneObject().enabled}`);
            } else {
                print(`Catalogue item ${i}: NULL`);
            }
        }
    }

    // Update the setupCatalogueItem method to work with pre-made items:
    private setupCatalogueItem(itemObject: SceneObject, itemData: any): void {
        // This method is now replaced by direct CatalogueItem3D.setItemData() calls
        // Keep for backward compatibility if needed
        try {
            const catalogueItemComponent = itemObject.getComponent(CatalogueItem3D.getTypeName()) as CatalogueItem3D;
            if (catalogueItemComponent) {
                catalogueItemComponent.setItemData(itemData);
            }
        } catch (error) {
            print(`Error setting up catalogue item: ${error}`);
        }
    }

    /**
     * Search for products by topic and fill the catalogue items array
     * @param topic The search topic/keyword (e.g., "sweater", "shoes", "jacket")
     */
    public searchAndFillCatalogue(topic: string): void {
        print(`=== Searching and filling catalogue with topic: "${topic}" ===`);

        if (!this.shopifySearch) {
            print("No ShopifySearch component available - using sample data");
            this.fillWithSampleData();
            return;
        }

        // Clear any cached images to prevent using old cached textures
        if (this.httpImageLoader) {
            this.httpImageLoader.clearTextureCache();
            print("🗑️ Cleared texture cache for fresh image loading");
        }

        print(`Initiating search for: ${topic}`);
        print(`ShopifySearch component type: ${typeof this.shopifySearch}`);
        print(`ShopifySearch searchProducts method: ${typeof this.shopifySearch.searchProducts}`);

        // Check if searchProducts methosd exists
        if (!this.shopifySearch.searchProducts || typeof this.shopifySearch.searchProducts !== 'function') {
            print("ERROR: searchProducts method is not available on ShopifySearch component");
            print("Available methods on shopifySearch:");
            for (const prop in this.shopifySearch) {
                print(`  - ${prop}: ${typeof this.shopifySearch[prop]}`);
            }
            print("Falling back to sample data");
            this.fillWithSampleData();
            return;
        }

        try {
            // Search for products and fill catalogue items
            this.shopifySearch.searchProducts(topic, (products: ProductResult[]) => {
                print(`Received ${products.length} products for topic "${topic}"`);

                if (products && products.length > 0) {
                    // Fill catalogue with received products
                    this.fillCatalogueItemsWithProducts(products, topic);
                } else {
                    print(`No products found for "${topic}" - using sample data as fallback`);
                    this.fillWithSampleData();
                }
            });
        } catch (error) {
            print(`ERROR calling searchProducts: ${error}`);
            print("Falling back to sample data");
            this.fillWithSampleData();
        }
    }

    /**
     * Format price for display
     * @param price The price object from Shopify API
     * @returns Formatted price string
     */
    private formatPrice(price?: { amount: string; currencyCode: string }): string {
        if (!price) {
            return "Price N/A";
        }

        // Format the price with currency symbol if possible
        const currencySymbols: { [key: string]: string } = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'CAD': 'C$',
            'AUD': 'A$',
            'JPY': '¥'
        };

        const symbol = currencySymbols[price.currencyCode] || price.currencyCode;
        return `${symbol}${price.amount}`;
    }

    /**
     * Fill catalogue items with products using delayed sequential loading
     * @param products Array of ProductResult from Shopify search
     * @param topic The search topic for logging purposes
     */
    private fillCatalogueItemsWithProducts(products: ProductResult[], topic: string): void {
        print(`📦 Filling catalogue with ${products.length} products using delayed sequential loading for topic "${topic}"`);

        const availableSlots = this.catalogueItems.length;
        const maxProductsToShow = Math.min(products.length, availableSlots);

        print(`Available slots: ${availableSlots}, Products to show: ${maxProductsToShow}`);

        // Fill each catalogue item with product data and start delayed loading
        for (let i = 0; i < availableSlots; i++) {
            const catalogueItem = this.catalogueItems[i];

            if (!catalogueItem) {
                print(`Warning: catalogueItems[${i}] is null - skipping`);
                continue;
            }

            if (i < maxProductsToShow) {
                // We have a product for this slot - activate and fill it
                const product = products[i];

                // Activate the catalogue item
                catalogueItem.getSceneObject().enabled = true;

                // Set the catalogue index for delayed loading
                catalogueItem.setCatalogueIndex(i);

                // Use the new delayed loading method
                catalogueItem.setProductDataWithDelay(product, true);

                print(`✅ Filled slot ${i}: ${product.name} with delayed loading (${i * 500}ms delay)`);

            } else {
                // No product for this slot - deactivate it
                catalogueItem.getSceneObject().enabled = false;
                print(`❌ Deactivated slot ${i} (no product available)`);
            }
        }

        print(`🎯 Catalogue filling completed for "${topic}" using delayed sequential loading: ${maxProductsToShow} items will load with staggered delays`);
    }

    /**
     * Load all product images in batch and assign them to the correct catalogue items
     * @param products Array of products to load images for
     */
    private loadAllProductImages(products: ProductResult[]): void {
        print(`🖼️ Starting batch image load for ${products.length} products`);

        // Debug: Log all image URLs first
        print(`🔍 DEBUG: Checking all product image URLs:`);
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            print(`🔍 Product ${i}: "${product.name}" -> URL: "${product.imageUrl}"`);
        }

        // Verify we have unique URLs
        const urlSet = new Set();
        let duplicateUrls = 0;
        for (let i = 0; i < products.length; i++) {
            if (products[i].imageUrl) {
                if (urlSet.has(products[i].imageUrl)) {
                    duplicateUrls++;
                    print(`⚠️ WARNING: Duplicate URL found for product ${i}: ${products[i].imageUrl}`);
                } else {
                    urlSet.add(products[i].imageUrl);
                }
            }
        }
        print(`📊 URL Analysis: ${urlSet.size} unique URLs, ${duplicateUrls} duplicates found`);

        // Additional debug: Store products array for comparison
        print(`🔍 ASYNC DEBUG: Storing ${products.length} products for async comparison`);
        for (let i = 0; i < products.length; i++) {
            print(`🔍 PRE-ASYNC Product ${i}: "${products[i].name}" -> URL: "${products[i].imageUrl}"`);
        }

        // Use the new batch loading method
        this.httpImageLoader.loadCatalogueImages(
            products,
            (texture: Texture, productIndex: number, product: any) => {
                // Successfully loaded an image - assign it to the correct catalogue item
                if (productIndex < this.catalogueItems.length && this.catalogueItems[productIndex]) {
                    const catalogueItem = this.catalogueItems[productIndex];

                    // Set both the texture and the image URL for tracking
                    catalogueItem.setItemTexture(texture);
                    if (product.imageUrl) {
                        catalogueItem.setImageUrl(product.imageUrl);
                    }

                    print(`🖼️ ✅ Assigned unique texture to catalogue item ${productIndex}: ${product.name} from URL: ${product.imageUrl}`);
                    print(`🔍 ASYNC DEBUG: ProductIndex=${productIndex}, ProductName=${product.name}, URL=${product.imageUrl}`);
                } else {
                    print(`⚠️ Cannot assign texture - invalid productIndex ${productIndex} or catalogueItem is null`);
                }
            },
            (loadedCount: number, totalCount: number) => {
                // All images processed
                print(`🎉 Batch image loading complete: ${loadedCount}/${totalCount} images loaded successfully`);

                // Verify each catalogue item has a unique texture
                print(`🔍 Verifying catalogue item textures:`);
                for (let i = 0; i < Math.min(products.length, this.catalogueItems.length); i++) {
                    const catalogueItem = this.catalogueItems[i];
                    if (catalogueItem) {
                        const loadedTexture = this.httpImageLoader.getTextureByProductIndex(i);
                        print(`📸 Catalogue item ${i}: texture loaded = ${loadedTexture ? 'YES' : 'NO'} for "${products[i]?.name || 'Unknown'}"`);
                    }
                }
            }
        );
    }    /**
     * Load product image using GetHttpImage component
     * @param product The product with image data
     * @param catalogueItem The catalogue item component to update
     * @param index The index for logging purposes
     */
    private loadProductImage(product: ProductResult, catalogueItem: CatalogueItem3D, index: number): void {
        // If product already has a texture, use it directly
        if (product.imageTexture) {
            catalogueItem.setItemTexture(product.imageTexture);
            print(`Set pre-loaded texture for slot ${index}: ${product.name}`);
            return;
        }

        // If we have an image URL and the HTTP image loader component, fetch the image
        if (product.imageUrl && this.httpImageLoader) {
            print(`🌐 Loading image from URL for slot ${index}: ${product.imageUrl}`);

            this.httpImageLoader.loadImageFromUrl(
                product.imageUrl,
                (texture: Texture) => {
                    // Success: Set the loaded texture and URL
                    catalogueItem.setItemTexture(texture);
                    catalogueItem.setImageUrl(product.imageUrl);
                    print(`✅ Successfully loaded image for slot ${index}: ${product.name}`);
                },
                (error: string) => {
                    // Error: Use placeholder
                    print(`⚠️ Failed to load image for slot ${index}: ${error}`);
                    catalogueItem.setPlaceholderImage();
                }
            );
        } else {
            // No URL or no HTTP loader available - use placeholder
            if (!product.imageUrl) {
                print(`No image URL available for slot ${index}: ${product.name}`);
            } else if (!this.httpImageLoader) {
                print(`GetHttpImage component not available for slot ${index}: ${product.name}`);
            }
            catalogueItem.setPlaceholderImage();
        }
    }

    // Replace the loadShopifyProducts method with this simplified version:

    public loadShopifyProducts(keyword: string = "sweater") {
        if (!this.shopifySearch) {
            print("ShopifySearch component not assigned - using sample data");
            this.fillWithSampleData();
            return;
        }

        print(`Loading Shopify products for keyword: "${keyword}"`);

        // Search for products with callback
        try {
            this.shopifySearch.searchProducts(keyword, (products) => {
                print(`Received ${products.length} products from Shopify callback`);
                if (products && products.length > 0) {
                    this.fillCatalogueItems(products);
                } else {
                    print("No products received, using sample data");
                    this.fillWithSampleData();
                }
            });

            // Also listen to the event (as backup)
            this.shopifySearch.onProductsReceived.add((products) => {
                print(`Received ${products.length} products from Shopify event`);
                if (products && products.length > 0) {
                    this.fillCatalogueItems(products);
                }
            });

            print("Shopify search initiated with callback...");
        } catch (error) {
            print(`Error calling Shopify search: ${error}`);
            this.fillWithSampleData();
        }
    }

    private fillCatalogueItems(shopifyProducts: ProductResult[]) {
        print(`📦 Filling catalogue with ${shopifyProducts.length} Shopify products using delayed sequential loading`);

        // Get the number of available catalogue item slots
        const availableSlots = this.catalogueItems.length;
        const productsToShow = Math.min(shopifyProducts.length, availableSlots);

        print(`Available slots: ${availableSlots}, Products to show: ${productsToShow}`);

        // Fill each catalogue item with product data and start delayed loading
        for (let i = 0; i < availableSlots; i++) {
            const catalogueItem = this.catalogueItems[i];

            if (!catalogueItem) {
                print(`Warning: catalogueItems[${i}] is null`);
                continue;
            }

            if (i < productsToShow) {
                // Fill with Shopify product data
                const product = shopifyProducts[i];

                // Activate and setup the catalogue item
                catalogueItem.getSceneObject().enabled = true;

                // Set the catalogue index for delayed loading
                catalogueItem.setCatalogueIndex(i);

                // Use the new delayed loading method
                catalogueItem.setProductDataWithDelay(product, true);

                print(`✅ Filled slot ${i}: ${product.name} with delayed loading (${i * 500}ms delay)`);

            } else {
                // Deactivate unused catalogue items
                catalogueItem.getSceneObject().enabled = false;
                print(`❌ Deactivated slot ${i}`);
            }
        }

        print(`🎯 Catalogue filling completed using delayed sequential loading. ${productsToShow} items will load with staggered delays`);
    }
    private fillWithSampleData() {
        print("Filling catalogue with sample data");

        const availableSlots = this.catalogueItems.length;
        const samplesToShow = Math.min(this.catalogueData.length, availableSlots);

        for (let i = 0; i < availableSlots; i++) {
            const catalogueItem = this.catalogueItems[i];

            if (!catalogueItem) continue;

            if (i < samplesToShow) {
                // Fill with sample data
                const sampleData = this.catalogueData[i];

                catalogueItem.getSceneObject().enabled = true;
                catalogueItem.setItemData(sampleData);
                catalogueItem.setPlaceholderImage();

                print(`Filled slot ${i} with sample: ${sampleData.name}`);

            } else {
                // Deactivate unused items
                catalogueItem.getSceneObject().enabled = false;
                print(`Deactivated slot ${i}`);
            }
        }
    }

    // Add this new method:

    // public createGridLayout(numItems: number = 20, cols: number = 4): void {
    //     print(`=== Creating ${numItems} items in ${cols}-column grid ===`);

    //     if (!this.itemPrefab || !this.itemsContainer) {
    //         print("ERROR: Missing prefab or container!");
    //         return;
    //     }

    //     // Clear any existing items
    //     this.clearCurrentItems();

    //     const itemsToCreate = Math.min(numItems, this.catalogueData.length);
    //     const rows = Math.ceil(itemsToCreate / cols);

    //     // Grid spacing based on Spectacles samples
    //     const itemSpacing = 15;
    //     const rowSpacing = 12;

    //     print(`Creating ${cols}x${rows} grid with ${itemsToCreate} items`);

    //     for (let i = 0; i < itemsToCreate; i++) {
    //         try {
    //             // Calculate grid position
    //             const row = Math.floor(i / cols);
    //             const col = i % cols;

    //             // Calculate centered position
    //             const xOffset = (col - (cols - 1) / 2) * itemSpacing;
    //             const yOffset = (rows - 1) / 2 * rowSpacing - (row * rowSpacing);

    //             // Create and position item
    //             const itemObject = this.itemPrefab.copyWholeHierarchy(this.itemsContainer);
    //             itemObject.enabled = true;
    //             itemObject.name = `GridItem_${i + 1}_${this.catalogueData[i].name}`;

    //             itemObject.getTransform().setLocalPosition(new vec3(xOffset, yOffset, 0));

    //             // Setup item data
    //             this.setupCatalogueItem(itemObject, this.catalogueData[i]);

    //             // Store reference
    //             this.currentItemObjects.push(itemObject);

    //             print(`Item ${i + 1}: ${this.catalogueData[i].name} at (${xOffset.toFixed(1)}, ${yOffset.toFixed(1)})`);

    //         } catch (error) {
    //             print(`Error creating item ${i + 1}: ${error}`);
    //             break;
    //         }
    //     }

    //     print(`Grid creation completed: ${this.currentItemObjects.length} items created`);
    // }

    // Replace the setupInteractionComponents method starting around line 186:

    private setupInteractionComponents(): void {
        print("Setting up interaction components...");

        // Setup close button
        if (this.closeButton) {
            print("Close button found, looking for PinchButton component...");
            try {
                // Use the correct getComponent syntax with getTypeName()
                this.closeButtonComponent = this.closeButton.getComponent(PinchButton.getTypeName()) as PinchButton;

                if (this.closeButtonComponent && this.closeButtonComponent.onButtonPinched) {
                    this.closeButtonComponent.onButtonPinched.add(() => {
                        this.hideCatalogue();
                    });
                    print("Close button interaction setup complete");
                } else {
                    print("Warning: CloseButton object exists but has no PinchButton component");
                    print("Available components on close button:");
                    // Debug: list all components on the close button
                    const componentCount = this.closeButton.getComponentCount("Component");
                    for (let i = 0; i < componentCount; i++) {
                        const comp = this.closeButton.getComponentByIndex("Component", i);
                        print(`  - ${comp.getTypeName()}`);
                    }
                }
            } catch (error) {
                print(`Error setting up close button: ${error}`);
            }
        } else {
            print("Warning: CloseButton object is not assigned");
        }

        // Setup scroll buttons with same pattern
        if (this.scrollUpButton) {
            print("Scroll up button found, looking for PinchButton component...");
            try {
                this.scrollUpComponent = this.scrollUpButton.getComponent(PinchButton.getTypeName()) as PinchButton;

                if (this.scrollUpComponent && this.scrollUpComponent.onButtonPinched) {
                    this.scrollUpComponent.onButtonPinched.add(() => {
                        this.scrollUp();
                    });
                    print("Scroll up button interaction setup complete");
                } else {
                    print("Warning: ScrollUpButton object exists but has no PinchButton component");
                }
            } catch (error) {
                print(`Error setting up scroll up button: ${error}`);
            }
        } else {
            print("Warning: ScrollUpButton object is not assigned");
        }

        if (this.scrollDownButton) {
            print("Scroll down button found, looking for PinchButton component...");
            try {
                this.scrollDownComponent = this.scrollDownButton.getComponent(PinchButton.getTypeName()) as PinchButton;

                if (this.scrollDownComponent && this.scrollDownComponent.onButtonPinched) {
                    this.scrollDownComponent.onButtonPinched.add(() => {
                        this.scrollDown();
                    });
                    print("Scroll down button interaction setup complete");
                } else {
                    print("Warning: ScrollDownButton object exists but has no PinchButton component");
                }
            } catch (error) {
                print(`Error setting up scroll down button: ${error}`);
            }
        } else {
            print("Warning: ScrollDownButton object is not assigned");
        }

        print("Interaction components setup completed");
    }

    // Add this method to your Catalogue3DController class:

    // Replace your createSingleItem method around line 263:

    // Replace your createSingleItem method around line 263:

    // Replace your createSingleItem method around line 263:

    // public createSingleItem(): void {
    //     print("=== Creating 20 items in grid format ===");

    //     // Check if required components exist
    //     if (!this.itemPrefab) {
    //         print("ERROR: itemPrefab is not assigned in Inspector!");
    //         return;
    //     }

    //     if (!this.itemsContainer) {
    //         print("ERROR: itemsContainer is not assigned in Inspector!");
    //         return;
    //     }

    //     print("Creating 20 items in grid layout...");

    //     // Grid configuration for 20 items
    //     const itemsToCreate = Math.min(20, this.catalogueData.length);
    //     const gridCols = 4; // 4 columns
    //     const gridRows = 5; // 5 rows (4x5 = 20 items)
    //     const itemSpacing = 12; // Space between items
    //     const rowSpacing = 10; // Space between rows

    //     let createdCount = 0;

    //     try {
    //         for (let i = 0; i < itemsToCreate; i++) {
    //             // Calculate grid position
    //             const row = Math.floor(i / gridCols);
    //             const col = i % gridCols;

    //             // Calculate world position (centered grid)
    //             const xOffset = (col - (gridCols - 1) / 2) * itemSpacing;
    //             const yOffset = -(row - (gridRows - 1) / 2) * rowSpacing;
    //             const zOffset = 0;

    //             // Create item instance
    //             const itemObject = this.itemPrefab.copyWholeHierarchy(this.itemsContainer);
    //             itemObject.enabled = true;
    //             itemObject.name = `GridItem_${this.catalogueData[i].id}`;

    //             // Position the item in grid
    //             itemObject.getTransform().setLocalPosition(new vec3(xOffset, yOffset, zOffset));

    //             // Setup with actual data
    //             this.setupCatalogueItem(itemObject, this.catalogueData[i]);

    //             // Store reference
    //             this.currentItemObjects.push(itemObject);

    //             createdCount++;
    //             print(`Created item ${createdCount}: ${this.catalogueData[i].name} at (${xOffset}, ${yOffset})`);
    //         }

    //         print(`Successfully created ${createdCount} items in grid format`);
    //         print(`itemsContainer children count: ${this.itemsContainer.getChildrenCount()}`);

    //     } catch (error) {
    //         print(`ERROR creating grid items: ${error}`);
    //         print(`Successfully created ${createdCount} items before error`);
    //     }
    // }




    private updateHandPosition(): void {
        if (!this.isVisible || !this.followHand) return;

        if (this.menuHand.isTracked() && this.menuHand.isFacingCamera()) {
            const handPosition = this.menuHand.indexTip.position;
            const cameraTransform = this.wcfmp.getTransform();
            const forward = cameraTransform.forward.uniformScale(this.panelDistance);
            const targetPosition = handPosition.add(forward);

            this.cataloguePanel.getTransform().setWorldPosition(targetPosition);

            // Make panel face the camera
            const lookDirection = cameraTransform.getWorldPosition().sub(targetPosition).normalize();
            this.cataloguePanel.getTransform().setWorldRotation(quat.lookAt(lookDirection, vec3.up()));
        }
    }

    // Replace your showCatalogue method around line 638:

    public showCatalogue(): void {
        if (!this.cataloguePanel) return;

        this.isVisible = true;
        this.cataloguePanel.enabled = true;

        // Use pre-made items instead of generating pages
        // this.generateCurrentPage(); // REMOVE THIS LINE
        this.updatePageIndicator();

        // Animate panel appearance
        const startScale = vec3.zero();
        const endScale = vec3.one();
        this.cataloguePanel.getTransform().setLocalScale(startScale);

        LSTween.scaleToLocal(this.cataloguePanel.getTransform(), endScale, 400)
            .easing(Easing.Quadratic.Out)
            .start();

        this.onCatalogueVisibilityChanged.invoke(true);
        print("3D Catalogue shown");
    }

    public hideCatalogue(): void {
        if (!this.cataloguePanel) return;

        this.isVisible = false;

        // Animate panel disappearance
        LSTween.scaleToLocal(this.cataloguePanel.getTransform(), vec3.zero(), 300)
            .easing(Easing.Quadratic.In)
            .onComplete(() => {
                this.cataloguePanel.enabled = false;
                this.clearCurrentItems();
            })
            .start();

        this.onCatalogueVisibilityChanged.invoke(false);
        print("3D Catalogue hidden");
    }

    public toggleCatalogue(): void {
        if (this.isVisible) {
            this.hideCatalogue();
        } else {
            this.showCatalogue();
        }
    }

    // private generateCurrentPage(): void {
    //     this.clearCurrentItems();

    //     const startIndex = this.currentPage * this.itemsPerPage;
    //     const endIndex = Math.min(startIndex + this.itemsPerPage, this.catalogueData.length);

    //     for (let i = startIndex; i < endIndex; i++) {
    //         const itemData = this.catalogueData[i];
    //         const localIndex = i - startIndex;
    //         this.createCatalogueItem(itemData, localIndex);
    //     }
    // }

    // private createCatalogueItem(itemData: any, localIndex: number): void {
    //     if (!this.itemPrefab || !this.itemsContainer) return;

    //     // Calculate grid position
    //     const row = Math.floor(localIndex / this.itemsPerRow);
    //     const col = localIndex % this.itemsPerRow;

    //     // Calculate world position relative to container
    //     const xOffset = (col - (this.itemsPerRow - 1) / 2) * this.itemSpacing;
    //     const yOffset = -(row * this.rowSpacing);
    //     const zOffset = 0;

    //     // Create item instance
    //     const itemObject = this.itemPrefab.copyWholeHierarchy(this.itemsContainer);
    //     itemObject.enabled = true;
    //     itemObject.name = `CatalogueItem_${itemData.id}`;

    //     // Position the item
    //     itemObject.getTransform().setLocalPosition(new vec3(xOffset, yOffset, zOffset));

    //     // Setup the item content and interaction
    //     this.setupCatalogueItem(itemObject, itemData);

    //     // Store reference for cleanup
    //     this.currentItemObjects.push(itemObject);
    // }

    private onItemTapped(itemData: any): void {
        print(`Item selected: ${itemData.name} (${itemData.category})`);

        // Animate the selection (scale bounce effect)
        const itemObject = this.findItemObjectById(itemData.id);
        if (itemObject) {
            const originalScale = itemObject.getTransform().getLocalScale();
            const bounceScale = originalScale.uniformScale(1.2);

            LSTween.scaleToLocal(itemObject.getTransform(), bounceScale, 100)
                .easing(Easing.Quadratic.Out)
                .onComplete(() => {
                    LSTween.scaleToLocal(itemObject.getTransform(), originalScale, 150)
                        .easing(Easing.Quadratic.Out)
                        .start();
                })
                .start();
        }

        // Invoke event for external handling
        this.onItemSelected.invoke({
            id: itemData.id,
            name: itemData.name,
            description: itemData.description,
            category: itemData.category
        });
    }

    // Update the scroll methods to work with pre-made items:

    private scrollUp(): void {
        print("🔼 Scroll up - searching for shoes");
        this.searchAndFillCatalogue("shoes");
    }

    private scrollDown(): void {
        print("🔽 Scroll down - searching for jacket");
        this.searchAndFillCatalogue("jacket");
    }

    private updatePageIndicator(): void {
        if (this.pageIndicatorText) {
            this.pageIndicatorText.text = `Page ${this.currentPage + 1} of ${this.totalPages}`;
        }
    }

    // Update clearCurrentItems to work with pre-made items:

    private clearCurrentItems(): void {
        // Don't destroy pre-made items, just hide them
        for (let i = 0; i < this.catalogueItems.length; i++) {
            const item = this.catalogueItems[i];
            if (item) {
                item.getSceneObject().enabled = false;
            }
        }
        // Clear the dynamic objects array (if any remain)
        this.currentItemObjects = [];
    }


    private findChildByName(parent: SceneObject, name: string): SceneObject | null {
        for (let i = 0; i < parent.getChildrenCount(); i++) {
            const child = parent.getChild(i);
            if (child.name === name) {
                return child;
            }
            // Recursively search in children
            const found = this.findChildByName(child, name);
            if (found) {
                return found;
            }
        }
        return null;
    }

    private findItemObjectById(id: number): SceneObject | null {
        for (const item of this.currentItemObjects) {
            if (item.name === `CatalogueItem_${id}`) {
                return item;
            }
        }
        return null;
    }

    // Public API methods
    public addItem(itemData: { id: number; name: string; description: string; category: string }): void {
        this.catalogueData.push(itemData);
        this.totalPages = Math.ceil(this.catalogueData.length / this.itemsPerPage);
        print(`Added item: ${itemData.name}. Total items: ${this.catalogueData.length}`);
    }

    public removeItem(id: number): void {
        const index = this.catalogueData.findIndex(item => item.id === id);
        if (index !== -1) {
            this.catalogueData.splice(index, 1);
            this.totalPages = Math.ceil(this.catalogueData.length / this.itemsPerPage);

            // Adjust current page if necessary
            if (this.currentPage >= this.totalPages && this.totalPages > 0) {
                this.currentPage = this.totalPages - 1;
            }

            if (this.isVisible) {
                //this.generateCurrentPage();
                this.updatePageIndicator();
            }

            print(`Removed item with ID: ${id}`);
        }
    }

    public getCurrentPage(): number {
        return this.currentPage;
    }

    public getTotalPages(): number {
        return this.totalPages;
    }

    public getItemCount(): number {
        return this.catalogueData.length;
    }
}
