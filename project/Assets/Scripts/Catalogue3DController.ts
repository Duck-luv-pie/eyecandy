import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton";
import { LSTween } from "LSTween.lspkg/LSTween";
import Easing from "LSTween.lspkg/TweenJS/Easing";
import { HandInputData } from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/HandInputData";
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";

@component
export class Catalogue3DController extends BaseScriptComponent {
    @ui.separator
    @ui.label("3D Catalogue Panel for Spectacles")
    @ui.separator

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
    @ui.group_end

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

    onAwake() {
        this.itemsPerPage = this.itemsPerRow * this.rowsPerPage;
        this.totalPages = Math.ceil(this.catalogueData.length / this.itemsPerPage);

        this.setupInteractionComponents();
        // this.hideCatalogue();

        if (this.followHand) {
            this.createEvent("UpdateEvent").bind(this.updateHandPosition.bind(this));
        }

        print(`3D Catalogue initialized: ${this.catalogueData.length} items, ${this.totalPages} pages`);
        this.createSingleItem();
    }

    // Replace the setupInteractionComponents method starting around line 186:

    private setupInteractionComponents(): void {
        print("Setting up interaction components...");

        // Setup close button
        if (this.closeButton) {
            print("Close button found, looking for PinchButton component...");
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
        } else {
            print("Warning: CloseButton object is not assigned");
        }

        // Setup scroll buttons with same pattern
        if (this.scrollUpButton) {
            print("Scroll up button found, looking for PinchButton component...");
            this.scrollUpComponent = this.scrollUpButton.getComponent(PinchButton.getTypeName()) as PinchButton;

            if (this.scrollUpComponent && this.scrollUpComponent.onButtonPinched) {
                this.scrollUpComponent.onButtonPinched.add(() => {
                    this.scrollUp();
                });
                print("Scroll up button interaction setup complete");
            } else {
                print("Warning: ScrollUpButton object exists but has no PinchButton component");
            }
        } else {
            print("Warning: ScrollUpButton object is not assigned");
        }

        if (this.scrollDownButton) {
            print("Scroll down button found, looking for PinchButton component...");
            this.scrollDownComponent = this.scrollDownButton.getComponent(PinchButton.getTypeName()) as PinchButton;

            if (this.scrollDownComponent && this.scrollDownComponent.onButtonPinched) {
                this.scrollDownComponent.onButtonPinched.add(() => {
                    this.scrollDown();
                });
                print("Scroll down button interaction setup complete");
            } else {
                print("Warning: ScrollDownButton object exists but has no PinchButton component");
            }
        } else {
            print("Warning: ScrollDownButton object is not assigned");
        }

        print("Interaction components setup completed");
    }

    // Add this method to your Catalogue3DController class:

    public createSingleItem(): void {
        if (!this.itemPrefab || !this.itemsContainer) {
            print("Cannot create item: missing prefab or container");
            return;
        }

        // Use the first item from your catalogue data
        const itemData = this.catalogueData[0];

        print(`Creating single item: ${itemData.name}`);

        try {
            // Create item instance
            const itemObject = this.itemPrefab.copyWholeHierarchy(this.itemsContainer);
            itemObject.enabled = true;
            itemObject.name = `SingleItem_${itemData.id}`;

            // Position at center (0, 0, 0) relative to container
            itemObject.getTransform().setLocalPosition(vec3.zero());

            // Setup the item content
            this.setupCatalogueItem(itemObject, itemData);

            print(`Successfully created single item: ${itemData.name}`);

        } catch (error) {
            print(`Failed to create single item: ${error}`);
        }
    }



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

    public showCatalogue(): void {
        if (!this.cataloguePanel) return;

        this.isVisible = true;
        this.cataloguePanel.enabled = true;
        this.generateCurrentPage();
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

    private generateCurrentPage(): void {
        this.clearCurrentItems();

        const startIndex = this.currentPage * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.catalogueData.length);

        for (let i = startIndex; i < endIndex; i++) {
            const itemData = this.catalogueData[i];
            const localIndex = i - startIndex;
            this.createCatalogueItem(itemData, localIndex);
        }
    }

    private createCatalogueItem(itemData: any, localIndex: number): void {
        if (!this.itemPrefab || !this.itemsContainer) return;

        // Calculate grid position
        const row = Math.floor(localIndex / this.itemsPerRow);
        const col = localIndex % this.itemsPerRow;

        // Calculate world position relative to container
        const xOffset = (col - (this.itemsPerRow - 1) / 2) * this.itemSpacing;
        const yOffset = -(row * this.rowSpacing);
        const zOffset = 0;

        // Create item instance
        const itemObject = this.itemPrefab.copyWholeHierarchy(this.itemsContainer);
        itemObject.enabled = true;
        itemObject.name = `CatalogueItem_${itemData.id}`;

        // Position the item
        itemObject.getTransform().setLocalPosition(new vec3(xOffset, yOffset, zOffset));

        // Setup the item content and interaction
        this.setupCatalogueItem(itemObject, itemData);

        // Store reference for cleanup
        this.currentItemObjects.push(itemObject);
    }

    private setupCatalogueItem(itemObject: SceneObject, itemData: any): void {
        // Find and setup text components
        const nameText = this.findChildByName(itemObject, "ItemName");
        const descriptionText = this.findChildByName(itemObject, "ItemDescription");
        const categoryText = this.findChildByName(itemObject, "ItemCategory");

        if (nameText) {
            const textComponent = nameText.getComponent("Component.Text") as Text;
            if (textComponent) {
                textComponent.text = itemData.name;
            }
        }

        if (descriptionText) {
            const textComponent = descriptionText.getComponent("Component.Text") as Text;
            if (textComponent) {
                textComponent.text = itemData.description;
            }
        }

        if (categoryText) {
            const textComponent = categoryText.getComponent("Component.Text") as Text;
            if (textComponent) {
                textComponent.text = itemData.category;
            }
        }

        // Setup interaction
        const buttonComponent = itemObject.getComponent(PinchButton.getTypeName()) as PinchButton;
        if (buttonComponent && buttonComponent.onButtonPinched) {
            buttonComponent.onButtonPinched.add(() => {
                this.onItemTapped(itemData);
            });
        } else {
            // Fallback: try to find a child with PinchButton
            const buttonObject = this.findChildByName(itemObject, "ItemButton");
            if (buttonObject) {
                const childButtonComponent = buttonObject.getComponent(PinchButton.getTypeName()) as PinchButton;
                if (childButtonComponent && childButtonComponent.onButtonPinched) {
                    childButtonComponent.onButtonPinched.add(() => {
                        this.onItemTapped(itemData);
                    });
                }
            }
        }

        print(`Setup catalogue item: ${itemData.name}`);
    }

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

    private scrollUp(): void {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.generateCurrentPage();
            this.updatePageIndicator();
            print(`Scrolled to page ${this.currentPage + 1}`);
        }
    }

    private scrollDown(): void {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            this.generateCurrentPage();
            this.updatePageIndicator();
            print(`Scrolled to page ${this.currentPage + 1}`);
        }
    }

    private updatePageIndicator(): void {
        if (this.pageIndicatorText) {
            this.pageIndicatorText.text = `Page ${this.currentPage + 1} of ${this.totalPages}`;
        }
    }

    private clearCurrentItems(): void {
        for (const item of this.currentItemObjects) {
            if (item && !isNull(item)) {
                item.destroy();
            }
        }
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
                this.generateCurrentPage();
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
