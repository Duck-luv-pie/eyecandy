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

    // Button component for interaction
    private buttonComponent: PinchButton;

    onAwake() {
        // Get the PinchButton component
        this.buttonComponent = this.getSceneObject().getComponent(PinchButton.getTypeName()) as PinchButton;

        if (this.buttonComponent) {
            // PinchButton events for interaction
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
            this.itemImage.mainPass.baseTex = texture;
            this.itemImage.enabled = true;
        }
    }

    /**
     * Set placeholder white image
     */
    public setPlaceholderImage(): void {
        if (this.itemImage) {
            // Set to white color as placeholder
            this.itemImage.mainPass.baseColor = new vec4(1, 1, 1, 1);
            this.itemImage.enabled = true;
            print("Set placeholder white image");
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