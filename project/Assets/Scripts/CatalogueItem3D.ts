import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton";
import { LSTween } from "LSTween.lspkg/LSTween";
import Easing from "LSTween.lspkg/TweenJS/Easing";

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

    onAwake() {
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

    private updateDisplay(): void {
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