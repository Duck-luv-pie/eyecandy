@component
export class GetHttpImage extends BaseScriptComponent {
    // Import the RemoteServiceModule and RemoteMediaModule
    private remoteServiceModule: RemoteServiceModule = require('LensStudio:RemoteServiceModule');
    private remoteMediaModule: RemoteMediaModule = require('LensStudio:RemoteMediaModule');

    // Default URL of the image to fetch
    private imageUrl: string =
        'https://developers.snap.com/img/spectacles/spectacles-2024-hero.png';

    // Array to store loaded textures with their URLs
    private loadedTextures: { url: string; texture: Texture; index: number }[] = [];

    // Cache to prevent duplicate downloads
    private loadingCache: Map<string, boolean> = new Map();

    // Method called when the script is awake
    async onAwake() {
        if (!this.remoteServiceModule || !this.remoteMediaModule) {
            print('Remote Service Module or Remote Media Module is missing.');
            return;
        }

        // Load the default image
        this.loadImageFromUrl(this.imageUrl, (texture) => {
            print('Default image texture loaded: ' + texture);
        });
    }

    /**
     * Get a loaded texture by index
     * @param index The index of the texture to retrieve
     * @returns The texture at the specified index, or null if not found
     */
    public getTextureByIndex(index: number): Texture | null {
        const textureData = this.loadedTextures.find(item => item.index === index);
        return textureData ? textureData.texture : null;
    }

    /**
     * Get a loaded texture by product index (for catalogue items)
     * @param productIndex The product index of the texture to retrieve
     * @returns The texture for the specified product index, or null if not found
     */
    public getTextureByProductIndex(productIndex: number): Texture | null {
        // Find the most recent texture for this product index
        const textures = this.loadedTextures.filter(item => item.index === productIndex);
        return textures.length > 0 ? textures[textures.length - 1].texture : null;
    }

    /**
     * Get a loaded texture by URL
     * @param url The URL of the texture to retrieve
     * @returns The texture for the specified URL, or null if not found
     */
    public getTextureByUrl(url: string): Texture | null {
        const textureData = this.loadedTextures.find(item => item.url === url);
        return textureData ? textureData.texture : null;
    }

    /**
     * Get all loaded textures
     * @returns Array of all loaded texture data
     */
    public getAllLoadedTextures(): { url: string; texture: Texture; index: number }[] {
        return [...this.loadedTextures]; // Return a copy
    }

    /**
     * Clear all cached textures
     */
    public clearTextureCache(): void {
        this.loadedTextures = [];
        this.loadingCache.clear();
        print('Texture cache cleared');
    }

    /**
     * Public method to load an image from a URL with callback
     * @param url The image URL to fetch
     * @param onSuccess Callback when texture is loaded successfully
     * @param onError Optional callback when loading fails
     * @param index Optional index to associate with this texture
     */
    public loadImageFromUrl(
        url: string,
        onSuccess: (texture: Texture) => void,
        onError?: (error: string) => void,
        index?: number
    ): void {
        if (!this.remoteServiceModule || !this.remoteMediaModule) {
            const errorMsg = 'Remote Service Module or Remote Media Module is missing.';
            print(errorMsg);
            if (onError) onError(errorMsg);
            return;
        }

        // Check if we already have this texture cached
        const cachedTexture = this.getTextureByUrl(url);
        if (cachedTexture) {
            print(`✅ Using cached texture for URL: ${url}`);
            onSuccess(cachedTexture);
            return;
        }

        // Check if we're already loading this URL
        if (this.loadingCache.get(url)) {
            print(`⏳ Already loading URL: ${url}, skipping duplicate request`);
            return;
        }

        // Mark as loading
        this.loadingCache.set(url, true);

        try {
            print(`🌐 Fetching image from URL: ${url} (index: ${index ?? 'none'})`);

            // Using makeResourceFromUrl to fetch the image
            const resource: DynamicResource = this.remoteServiceModule.makeResourceFromUrl(url);

            // Load resource and convert it to image texture
            if (resource) {
                this.remoteMediaModule.loadResourceAsImageTexture(
                    resource,
                    (texture) => {
                        // Store the texture in our array
                        const textureData = {
                            url: url,
                            texture: texture,
                            index: index ?? this.loadedTextures.length
                        };
                        this.loadedTextures.push(textureData);

                        // Mark as no longer loading
                        this.loadingCache.set(url, false);

                        print(`✅ Image texture loaded and cached (index: ${textureData.index}) from: ${url}`);
                        onSuccess(texture);
                    },
                    (error) => {
                        // Mark as no longer loading
                        this.loadingCache.set(url, false);

                        const errorMsg = `❌ Error loading image texture from ${url}: ${error}`;
                        print(errorMsg);
                        if (onError) onError(errorMsg);
                    }
                );
            } else {
                // Mark as no longer loading
                this.loadingCache.set(url, false);

                const errorMsg = `❌ Failed to create resource from URL: ${url}`;
                print(errorMsg);
                if (onError) onError(errorMsg);
            }
        } catch (error) {
            // Mark as no longer loading
            this.loadingCache.set(url, false);

            const errorMsg = `❌ Error fetching image from ${url}: ${error}`;
            print(errorMsg);
            if (onError) onError(errorMsg);
        }
    }

    /**
     * Public method to load multiple images from URLs
     * @param urls Array of image URLs to fetch
     * @param onImageLoaded Callback when each individual texture is loaded
     * @param onAllComplete Optional callback when all images are processed
     */
    public loadImagesFromUrls(
        urls: string[],
        onImageLoaded: (texture: Texture, url: string, index: number) => void,
        onAllComplete?: (loadedCount: number, totalCount: number) => void
    ): void {
        let loadedCount = 0;
        let processedCount = 0;

        print(`🚀 Starting batch load of ${urls.length} images`);

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];

            this.loadImageFromUrl(
                url,
                (texture) => {
                    loadedCount++;
                    processedCount++;
                    onImageLoaded(texture, url, i);
                    print(`📸 Loaded image ${i + 1}/${urls.length}: ${url}`);

                    if (processedCount === urls.length && onAllComplete) {
                        print(`🎯 Batch load complete: ${loadedCount}/${urls.length} images loaded successfully`);
                        onAllComplete(loadedCount, urls.length);
                    }
                },
                (error) => {
                    processedCount++;
                    print(`❌ Failed to load image ${i + 1}/${urls.length}: ${error}`);

                    if (processedCount === urls.length && onAllComplete) {
                        print(`🎯 Batch load complete: ${loadedCount}/${urls.length} images loaded successfully`);
                        onAllComplete(loadedCount, urls.length);
                    }
                },
                i // Pass the index to associate with the texture
            );
        }
    }

    /**
     * Load images for catalogue items in order
     * @param products Array of products with image URLs
     * @param onProductImageLoaded Callback when each product image is loaded
     * @param onAllComplete Optional callback when all product images are processed
     */
    public loadCatalogueImages(
        products: { imageUrl: string | null; name: string }[],
        onProductImageLoaded: (texture: Texture, productIndex: number, product: any) => void,
        onAllComplete?: (loadedCount: number, totalCount: number) => void
    ): void {
        let loadedCount = 0;
        let processedCount = 0;
        const validProducts = products.filter(p => p.imageUrl);

        print(`🛍️ Loading catalogue images: ${validProducts.length} products with URLs out of ${products.length} total`);

        // Debug: Log all URLs being processed
        print(`🔍 DEBUG: All image URLs being processed:`);
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            print(`🔍 Index ${i}: "${product.name}" -> URL: "${product.imageUrl}"`);
        }

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const productIndex = i; // Capture the index explicitly

            if (product.imageUrl) {
                print(`🌐 Starting load for product ${productIndex}: "${product.name}" from "${product.imageUrl}"`);

                // Use IIFE to capture the correct product and index for async callbacks
                ((capturedProduct, capturedIndex) => {
                    this.loadUniqueImageForProduct(
                        capturedProduct.imageUrl!,
                        capturedIndex,
                        (texture, prodIndex) => {
                            loadedCount++;
                            processedCount++;

                            // Call the callback with the captured product data
                            onProductImageLoaded(texture, prodIndex, capturedProduct);
                            print(`🛒 Loaded product image ${prodIndex}: ${capturedProduct.name} from ${capturedProduct.imageUrl}`);

                            if (processedCount === validProducts.length && onAllComplete) {
                                onAllComplete(loadedCount, validProducts.length);
                            }
                        },
                        (error, prodIndex) => {
                            processedCount++;
                            print(`⚠️ Failed to load product image ${prodIndex} (${capturedProduct.name}) from ${capturedProduct.imageUrl}: ${error}`);

                            if (processedCount === validProducts.length && onAllComplete) {
                                onAllComplete(loadedCount, validProducts.length);
                            }
                        }
                    );
                })(product, productIndex); // IIFE to capture product and index
            } else {
                print(`⚠️ Product ${i} "${product.name}" has no image URL`);
            }
        }
    }

    /**
     * Load a unique image for a specific product index, bypassing cache if needed
     * @param url The image URL to fetch
     * @param productIndex The index of the product this image belongs to
     * @param onSuccess Callback when texture is loaded successfully
     * @param onError Optional callback when loading fails
     */
    private loadUniqueImageForProduct(
        url: string,
        productIndex: number,
        onSuccess: (texture: Texture, productIndex: number) => void,
        onError?: (error: string, productIndex: number) => void
    ): void {
        if (!this.remoteServiceModule || !this.remoteMediaModule) {
            const errorMsg = 'Remote Service Module or Remote Media Module is missing.';
            print(errorMsg);
            if (onError) onError(errorMsg, productIndex);
            return;
        }

        try {
            print(`🌐 Loading unique texture for product ${productIndex} from URL: ${url}`);

            // Create a unique resource for each product - don't use cache for catalogue items
            const resource: DynamicResource = this.remoteServiceModule.makeResourceFromUrl(url);

            // Load resource and convert it to image texture
            if (resource) {
                this.remoteMediaModule.loadResourceAsImageTexture(
                    resource,
                    (texture) => {
                        // Store the texture in our array with unique index
                        const textureData = {
                            url: url,
                            texture: texture,
                            index: productIndex
                        };

                        // Add to loaded textures but with unique index
                        this.loadedTextures.push(textureData);

                        print(`✅ Unique texture loaded for product ${productIndex} from: ${url}`);
                        print(`🔍 TEXTURE DEBUG: Loaded texture for index ${productIndex}, URL: ${url}`);
                        
                        // Pass back the SAME productIndex that was passed in
                        onSuccess(texture, productIndex);
                    },
                    (error) => {
                        const errorMsg = `❌ Error loading unique texture for product ${productIndex} from ${url}: ${error}`;
                        print(errorMsg);
                        if (onError) onError(errorMsg, productIndex);
                    }
                );
            } else {
                const errorMsg = `❌ Failed to create resource for product ${productIndex} from URL: ${url}`;
                print(errorMsg);
                if (onError) onError(errorMsg, productIndex);
            }
        } catch (error) {
            const errorMsg = `❌ Error fetching unique image for product ${productIndex} from ${url}: ${error}`;
            print(errorMsg);
            if (onError) onError(errorMsg, productIndex);
        }
    }
}