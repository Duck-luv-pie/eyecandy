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
     */
    public loadImageFromUrl(
        url: string,
        onSuccess: (texture: Texture) => void,
        onError?: (error: string) => void
    ): void {
        if (!this.remoteServiceModule || !this.remoteMediaModule) {
            const errorMsg = 'Remote Service Module or Remote Media Module is missing.';
            print(errorMsg);
            if (onError) onError(errorMsg);
            return;
        }

        try {
            print(`Fetching image from URL: ${url}`);

            // Using makeResourceFromUrl to fetch the image
            const resource: DynamicResource = this.remoteServiceModule.makeResourceFromUrl(url);

            // Load resource and convert it to image texture
            if (resource) {
                this.remoteMediaModule.loadResourceAsImageTexture(
                    resource,
                    (texture) => {
                        print(`✅ Image texture loaded successfully from: ${url}`);
                        onSuccess(texture);
                    },
                    (error) => {
                        const errorMsg = `❌ Error loading image texture from ${url}: ${error}`;
                        print(errorMsg);
                        if (onError) onError(errorMsg);
                    }
                );
            } else {
                const errorMsg = `❌ Failed to create resource from URL: ${url}`;
                print(errorMsg);
                if (onError) onError(errorMsg);
            }
        } catch (error) {
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

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];

            this.loadImageFromUrl(
                url,
                (texture) => {
                    loadedCount++;
                    processedCount++;
                    onImageLoaded(texture, url, i);

                    if (processedCount === urls.length && onAllComplete) {
                        onAllComplete(loadedCount, urls.length);
                    }
                },
                (error) => {
                    processedCount++;
                    print(`Failed to load image ${i}: ${error}`);

                    if (processedCount === urls.length && onAllComplete) {
                        onAllComplete(loadedCount, urls.length);
                    }
                }
            );
        }
    }
}