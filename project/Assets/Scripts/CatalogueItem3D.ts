import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton";
import { LSTween } from "LSTween.lspkg/LSTween";
import Easing from "LSTween.lspkg/TweenJS/Easing";
import { setTimeout } from "SpectaclesInteractionKit.lspkg/Utils/FunctionTimingUtils";

@component
export class CatalogueItem3D extends BaseScriptComponent {
    @ui.separator
    @ui.label("3D Catalogue Item Component")
    @ui.separator

    @input
    private itemNameText: Text;

    @input
    private itemDescriptionText: Text;

    @input
    private itemCategoryText: Text;

    @input
    private itemImage: Image;

    @input
    private backgroundPanel: SceneObject;

    @input
    private hoverMaterial: Material;

    private originalMaterial: Material;
    private isHovered: boolean = false;
    private itemData: any = null;

    // Store the current texture for this item
    private currentTexture: Texture | null = null;
    private currentImageUrl: string | null = null;

    // Button component for interaction
    private buttonComponent: PinchButton;

    // HTTP Image loading components
    private remoteServiceModule: RemoteServiceModule = require('LensStudio:RemoteServiceModule');
    private remoteMediaModule: RemoteMediaModule = require('LensStudio:RemoteMediaModule');

    // Loading state
    private isLoadingImage: boolean = false;

    // Store the assigned index for this catalogue item
    private catalogueIndex: number = -1; onAwake() {
        // Get the PinchButton component
        this.buttonComponent = this.getSceneObject().getComponent(PinchButton.getTypeName()) as PinchButton;

        if (this.buttonComponent) {
            // PinchButton events for interaction
            // Set up the onButtonPinched event to return texture info
            this.buttonComponent.onButtonPinched.add(() => {
                this.onItemPressed();
            });
            // Note: Hover events need to be set up through the Interactable component
            // print("PinchButton component found and ready");
        }

        // Store original material if available
        if (this.backgroundPanel) {
            const meshRenderer = this.backgroundPanel.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
            if (meshRenderer) {
                this.originalMaterial = meshRenderer.mainMaterial;
            }
        }

        // print("Catalogue3D item initialized");
    }



    /**
     * Set the item data and update the display
     */
    public setItemData(data: { id: number; name: string; description: string; category: string }): void {
        this.itemData = data;
        this.updateDisplay();
    }

    /**
     * Set the catalogue index for this item (determines which hardcoded image to use)
     * @param index The index position in the catalogue (0-based)
     */
    public setCatalogueIndex(index: number): void {
        this.catalogueIndex = index;
        print(`📍 Set catalogue index ${index} for item: ${this.itemData?.name || 'Unknown'}`);
    }

    /**
     * Load image with delay based on catalogue index to prevent race conditions
     * @param imageUrl The image URL to load
     * @param delayMs Optional delay in milliseconds (defaults to index * 500ms)
     */
    public loadImageWithDelay(imageUrl: string, delayMs?: number): void {
        if (!imageUrl) {
            print(`⚠️ No image URL provided for item: ${this.itemData?.name || 'Unknown'}`);
            this.setPlaceholderImage();
            return;
        }

        // Calculate delay based on index to stagger loading
        const delay = delayMs !== undefined ? delayMs : (this.catalogueIndex * 500); // 500ms delay per item

        print(`⏰ Scheduling image load for index ${this.catalogueIndex} with ${delay}ms delay: ${imageUrl}`);

        // Use a simple timeout to delay the loading
        const delayedLoad = () => {
            this.loadImageFromUrl(imageUrl);
        };

        // Schedule the load
        setTimeout(delayedLoad, delay);
    }

    /**
     * Set product data with image URL and trigger delayed loading
     * @param productData Product data including imageUrl
     * @param autoLoad Whether to automatically load the image with delay
     */
    public setProductDataWithDelay(productData: any, autoLoad: boolean = true): void {
        this.itemData = productData;

        // Update display with product data
        if (this.itemNameText) {
            this.itemNameText.text = productData.name || 'Unknown Product';
        }

        if (this.itemDescriptionText) {
            // Use a truncated description or fallback text
            const description = productData.description ||
                (productData.price ? this.formatPrice(productData.price) : 'No description available');
            this.itemDescriptionText.text = description;
        }

        if (this.itemCategoryText) {
            // Show price if available, otherwise show category or fallback
            if (productData.price) {
                this.itemCategoryText.text = this.formatPrice(productData.price);
            } else {
                this.itemCategoryText.text = productData.category || 'Product';
            }
        }

        print(`🛒 Set product data for item: ${productData.name}`);

        // Automatically load image with delay if URL is provided and autoLoad is true
        if (autoLoad && productData.imageUrl) {
            this.loadImageWithDelay(productData.imageUrl);
        } else if (!productData.imageUrl) {
            print(`⚠️ No image URL for product: ${productData.name}`);
            this.setPlaceholderImage();
        }
    }

    /**
     * Format price for display
     * @param price The price object from Shopify API
     * @returns Formatted price string
     */
    private formatPrice(price?: { amount: string; currencyCode: string }): string {
        if (!price || !price.amount) {
            return 'Price not available';
        }

        const amount = parseFloat(price.amount);
        const currency = price.currencyCode || 'USD';

        // Add currency symbols for common currencies
        const currencySymbols: { [key: string]: string } = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'CAD': 'C$',
            'AUD': 'A$'
        };

        const symbol = currencySymbols[currency] || currency + ' ';

        // Format the amount to 2 decimal places for most currencies, 0 for JPY
        const decimals = currency === 'JPY' ? 0 : 2;
        const formattedAmount = amount.toFixed(decimals);

        return `${symbol}${formattedAmount}`;
    } private updateDisplay(): void {
        if (!this.itemData) return;

        // Update text components
        if (this.itemNameText) {
            this.itemNameText.text = this.itemData.name;
        }

        if (this.itemDescriptionText) {
            this.itemDescriptionText.text = this.itemData.description;
        }

        if (this.itemCategoryText) {
            this.itemCategoryText.text = this.itemData.category;
        }

        print(`Updated item display: ${this.itemData.name}`);
    }



    /**
     * Set a texture for the item image
     */
    public setItemTexture(texture: Texture): void {
        if (this.itemImage && texture) {
            // Store the texture reference for later retrieval
            this.currentTexture = texture;
            this.itemImage.mainPass.baseTex = texture;
            this.itemImage.enabled = true;
            print(`✅ Set texture for item: ${this.itemData?.name || 'Unknown'}`);
        }
    }

    /**
     * Set the image URL (for tracking purposes)
     */
    public setImageUrl(url: string): void {
        this.currentImageUrl = url;
        print(`📸 Set image URL for item: ${this.itemData?.name || 'Unknown'} -> ${url}`);
    }

    /**
     * Set placeholder white image
     */
    public setPlaceholderImage(): void {
        if (this.itemImage) {
            // Clear current texture reference since we're using placeholder
            this.currentTexture = null;
            this.currentImageUrl = null;

            // Set to white color as placeholder
            this.itemImage.mainPass.baseColor = new vec4(1, 1, 1, 1);
            this.itemImage.enabled = true;
            print("Set placeholder white image");
        }
    }

    /**
     * Load image from URL directly in this catalogue item
     * @param imageUrl The URL of the image to load
     * @param onSuccess Optional callback when image loads successfully
     * @param onError Optional callback when image loading fails
     */
    public loadImageFromUrl(
        imageUrl: string,
        onSuccess?: (texture: Texture) => void,
        onError?: (error: string) => void
    ): void {
        if (!imageUrl) {
            print(`⚠️ No image URL provided for item: ${this.itemData?.name || 'Unknown'}`);
            this.setPlaceholderImage();
            return;
        }

        if (this.isLoadingImage) {
            print(`⏳ Already loading image for item: ${this.itemData?.name || 'Unknown'}`);
            return;
        }

        if (!this.remoteServiceModule || !this.remoteMediaModule) {
            const errorMsg = 'Remote Service Module or Remote Media Module is missing.';
            print(errorMsg);
            if (onError) onError(errorMsg);
            this.setPlaceholderImage();
            return;
        }

        this.isLoadingImage = true;
        this.currentImageUrl = imageUrl;

        print(`🌐 CatalogueItem3D: Loading image for "${this.itemData?.name || 'Unknown'}" from: ${imageUrl}`);

        try {
            // Create resource for this specific item
            const resource: DynamicResource = this.remoteServiceModule.makeResourceFromUrl(imageUrl);

            if (resource) {
                this.remoteMediaModule.loadResourceAsImageTexture(
                    resource,
                    (texture) => {
                        this.isLoadingImage = false;

                        // Store the texture and apply it
                        this.currentTexture = texture;
                        this.setItemTexture(texture);

                        print(`✅ CatalogueItem3D: Successfully loaded image for "${this.itemData?.name || 'Unknown'}"`);

                        if (onSuccess) onSuccess(texture);
                    },
                    (error) => {
                        this.isLoadingImage = false;

                        const errorMsg = `❌ CatalogueItem3D: Failed to load image for "${this.itemData?.name || 'Unknown'}" from ${imageUrl}: ${error}`;
                        print(errorMsg);

                        // Set placeholder on error
                        this.setPlaceholderImage();

                        if (onError) onError(errorMsg);
                    }
                );
            } else {
                this.isLoadingImage = false;

                const errorMsg = `❌ CatalogueItem3D: Failed to create resource for "${this.itemData?.name || 'Unknown'}" from URL: ${imageUrl}`;
                print(errorMsg);

                // Set placeholder on error
                this.setPlaceholderImage();

                if (onError) onError(errorMsg);
            }
        } catch (error) {
            this.isLoadingImage = false;

            const errorMsg = `❌ CatalogueItem3D: Error loading image for "${this.itemData?.name || 'Unknown'}" from ${imageUrl}: ${error}`;
            print(errorMsg);

            // Set placeholder on error
            this.setPlaceholderImage();

            if (onError) onError(errorMsg);
        }
    }

    /**
     * Handle button press - returns texture and item info
     */
    private onItemPressed(): void {
        print("=== CATALOGUE ITEM PRESSED ===");
        print(`Item Name: ${this.itemData?.name || 'Unknown'}`);
        print(`Item ID: ${this.itemData?.id || 'No ID'}`);
        print(`Item Category: ${this.itemData?.category || 'No Category'}`);
        print(`Item Description: ${this.itemData?.description || 'No Description'}`);

        // Return texture information using helper method
        print(`🖼️ ${this.getTextureInfo()}`);
        print(`📊 Has Texture: ${this.hasTexture()}`);

        if (this.hasTexture()) {
            print(`✅ TEXTURE AVAILABLE FOR RETURN:`);
            print(`   - Texture Object: Ready for use`);
            print(`   - Source URL: ${this.currentImageUrl}`);
            print(`   - Usage: You can access this texture via getCurrentTexture()`);

            // TODO: DEVELOPER USAGE EXAMPLE
            // const textureInfo = this.getCompleteItemInfo();
            // Use textureInfo.texture for your texture operations
            // Use textureInfo.imageUrl for the original image file reference
            // Use textureInfo.itemData for the complete item information
        } else {
            print(`❌ NO TEXTURE AVAILABLE`);
            print(`   - This item is using placeholder or no image was loaded`);
        }

        print("===============================");

        // Play selection animation
        this.playSelectionAnimation();
    }

    /**
     * Get the current texture for this catalogue item
     * @returns The current texture or null if none is set
     */
    public getCurrentTexture(): Texture | null {
        return this.currentTexture;
    }

    /**
     * Get the current image URL for this catalogue item
     * @returns The current image URL or null if none is set
     */
    public getCurrentImageUrl(): string | null {
        return this.currentImageUrl;
    }

    /**
     * Get complete item info including texture and URL
     * @returns Object containing all item data, texture, and URL
     */
    public getCompleteItemInfo(): {
        itemData: any;
        texture: Texture | null;
        imageUrl: string | null
    } {
        return {
            itemData: this.itemData,
            texture: this.currentTexture,
            imageUrl: this.currentImageUrl
        };
    }

    /**
     * Check if this item has a valid texture loaded
     * @returns True if texture is available, false otherwise
     */
    public hasTexture(): boolean {
        return this.currentTexture !== null;
    }

    /**
     * Get texture info as a formatted string (for debugging)
     * @returns Formatted string with texture and URL info
     */
    public getTextureInfo(): string {
        if (this.currentTexture && this.currentImageUrl) {
            return `Texture: Available, URL: ${this.currentImageUrl}`;
        } else if (this.currentTexture) {
            return `Texture: Available, URL: Not stored`;
        } else {
            return `Texture: None, URL: ${this.currentImageUrl || 'None'}`;
        }
    }

    private onHoverEnter(): void {
        if (this.isHovered) return;

        this.isHovered = true;

        // Scale up slightly on hover
        const currentScale = this.getSceneObject().getTransform().getLocalScale();
        const hoverScale = currentScale.uniformScale(1.05);

        LSTween.scaleToLocal(this.getSceneObject().getTransform(), hoverScale, 200)
            .easing(Easing.Quadratic.Out)
            .start();

        // Change material if available
        if (this.backgroundPanel && this.hoverMaterial) {
            const meshRenderer = this.backgroundPanel.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
            if (meshRenderer) {
                meshRenderer.mainMaterial = this.hoverMaterial;
            }
        }

        print(`Hover enter: ${this.itemData?.name || 'Unknown item'}`);
    }

    private onHoverExit(): void {
        if (!this.isHovered) return;

        this.isHovered = false;

        // Scale back to original size
        const currentScale = this.getSceneObject().getTransform().getLocalScale();
        const originalScale = currentScale.uniformScale(1 / 1.05);

        LSTween.scaleToLocal(this.getSceneObject().getTransform(), originalScale, 200)
            .easing(Easing.Quadratic.Out)
            .start();

        // Restore original material
        if (this.backgroundPanel && this.originalMaterial) {
            const meshRenderer = this.backgroundPanel.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
            if (meshRenderer) {
                meshRenderer.mainMaterial = this.originalMaterial;
            }
        }

        print(`Hover exit: ${this.itemData?.name || 'Unknown item'}`);
    }

    /**
     * Get the item data
     */
    public getItemData(): any {
        return this.itemData;
    }

    /**
     * Manually trigger selection animation
     */
    public playSelectionAnimation(): void {
        const originalScale = this.getSceneObject().getTransform().getLocalScale();
        const bounceScale = originalScale.uniformScale(1.2);

        LSTween.scaleToLocal(this.getSceneObject().getTransform(), bounceScale, 100)
            .easing(Easing.Quadratic.Out)
            .onComplete(() => {
                LSTween.scaleToLocal(this.getSceneObject().getTransform(), originalScale, 150)
                    .easing(Easing.Quadratic.Out)
                    .start();
            })
            .start();
    }
}