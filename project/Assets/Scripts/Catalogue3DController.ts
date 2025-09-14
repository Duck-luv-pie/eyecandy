import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton";
import { LSTween } from "LSTween.lspkg/LSTween";
import Easing from "LSTween.lspkg/TweenJS/Easing";
import { HandInputData } from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/HandInputData";
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import { CatalogueItem3D } from "./CatalogueItem3D";
import { SimpleProductSearch } from "./SimpleProductSearch";



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
    // Around line 71, make shopifySearch optional:

    @ui.group_start("Pre-made Items")
    @input
    private catalogueItems: CatalogueItem3D[] = []; // Array of pre-made CatalogueItem3D components

    @input
    private shopifySearch: SimpleProductSearch | null = null; // Make it optional/nullable
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

    // Simplify onAwake to only use pre-made items:

    onAwake() {
        this.setupInteractionComponents();
        this.validateCatalogueItems();

        if (this.followHand) {
            this.createEvent("UpdateEvent").bind(this.updateHandPosition.bind(this));
        }

        print(`3D Catalogue initialized with ${this.catalogueItems.length} pre-made items`);

        // // Load Shopify products automatically
        // this.loadShopifyProducts("sweater");
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
        this.loadShopifyProducts(keyword);
    }

    public switchToSampleData() {
        this.fillWithSampleData();
    }

    public refreshCatalogue() {
        // Re-load current content
        this.loadShopifyProducts("sweater");
    }

    // Update the setupCatalogueItem method to work with pre-made items:
    private setupCatalogueItem(itemObject: SceneObject, itemData: any): void {
        // This method is now replaced by direct CatalogueItem3D.setItemData() calls
        // Keep for backward compatibility if needed
        const catalogueItemComponent = itemObject.getComponent(CatalogueItem3D.getTypeName()) as CatalogueItem3D;
        if (catalogueItemComponent) {
            catalogueItemComponent.setItemData(itemData);
        }
    }

    // Replace the loadShopifyProducts method with this simplified version:

    public loadShopifyProducts(keyword: string = "sweater") {
        if (!this.shopifySearch) {
            print("ShopifySearch component not assigned!");
            this.fillWithSampleData();
            return;
        }

        print(`Loading Shopify products for keyword: "${keyword}"`);

        // Trigger the search (without callback for now)
        try {
            this.shopifySearch.searchProducts(keyword);
            print("Shopify search initiated...");
        } catch (error) {
            print(`Error calling Shopify search: ${error}`);
        }

        // Use sample data as fallback while Shopify loads
        print("Displaying sample data while Shopify products load...");
        this.fillWithSampleData();
    }

    // Remove the event listener line completely:
    // this.shopifySearch.onProductsReceived.add(...) // DELETE THIS LINE
    private fillCatalogueItems(shopifyProducts: any[]) {
        print(`Filling catalogue with ${shopifyProducts.length} Shopify products`);

        // Get the number of available catalogue item slots
        const availableSlots = this.catalogueItems.length;
        const productsToShow = Math.min(shopifyProducts.length, availableSlots);

        print(`Available slots: ${availableSlots}, Products to show: ${productsToShow}`);

        for (let i = 0; i < availableSlots; i++) {
            const catalogueItem = this.catalogueItems[i];

            if (!catalogueItem) {
                print(`Warning: catalogueItems[${i}] is null`);
                continue;
            }

            if (i < productsToShow) {
                // Fill with Shopify product data
                const product = shopifyProducts[i];
                const itemData = {
                    id: i + 1000, // Use high IDs for Shopify products
                    name: product.name,
                    description: "Available on Shopify",
                    category: "Shopify Products"
                };

                // Activate and setup the catalogue item
                catalogueItem.getSceneObject().enabled = true;
                catalogueItem.setItemData(itemData);

                // Set product image if available
                if (product.imageTexture) {
                    catalogueItem.setItemTexture(product.imageTexture);
                } else {
                    catalogueItem.setPlaceholderImage();
                }

                print(`Filled slot ${i}: ${product.name}`);

            } else {
                // Deactivate unused catalogue items
                catalogueItem.getSceneObject().enabled = false;
                print(`Deactivated slot ${i}`);
            }
        }

        print(`Catalogue filling completed. ${productsToShow} items shown, ${availableSlots - productsToShow} items hidden`);
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
        print("Scroll up - switching to sample data for demo");
        this.fillWithSampleData();
    }

    private scrollDown(): void {
        print("Scroll down - refreshing Shopify products");
        this.loadShopifyProducts("sweater");
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
