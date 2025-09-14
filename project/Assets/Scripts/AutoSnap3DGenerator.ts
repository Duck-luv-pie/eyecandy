import { Snap3D } from "Remote Service Gateway.lspkg/HostedSnap/Snap3D";
import { Snap3DTypes } from "Remote Service Gateway.lspkg/HostedSnap/Snap3DTypes";
import { Snap3DInteractableFactory } from "./Snap3DInteractableFactory";
import { setTimeout } from "SpectaclesInteractionKit.lspkg/Utils/FunctionTimingUtils";
import { ImageDescriptionGenerator } from "./ImageDescriptionGenerator";

@component
export class AutoSnap3DGenerator extends BaseScriptComponent {
    @ui.separator
    @ui.group_start("Auto Generation Settings")
    @input
    @widget(new TextAreaWidget())
    private predefinedPrompt: string = "A green sweater with a mountain landscape design";
    
    @input
    @ui.label("Delay before generation (seconds)")
    private delaySeconds: number = 3.0;
    
    @input
    private enableAutoGeneration: boolean = true;
    
    @input
    private refineMesh: boolean = true;
    
    @input
    private useVertexColor: boolean = false;
    @ui.group_end
    
    @input
    @ui.label("Reference to Snap3D Factory")
    private snap3DFactory: Snap3DInteractableFactory;
    
    @input
    @ui.label("Reference to ImageDescriptionGenerator")
    private imageDescriptionGenerator: ImageDescriptionGenerator;

    private hasGenerated: boolean = false;
    
    onAwake() {
        // No auto-generation on awake
        print("AutoSnap3DGenerator: Ready. Call generateFromImageDescription(texture) to generate based on image description.");
    }
    
    /**
     * Generate a 3D model using the description from ImageDescriptionGenerator
     */
    public generateFromImageDescription(texture: Texture): void {
        if (!this.imageDescriptionGenerator) {
            print("Error: ImageDescriptionGenerator not assigned.");
            return;
        }
        if (!this.snap3DFactory) {
            print("Error: Snap3D Factory not assigned.");
            return;
        }
        if (!texture) {
            print("Error: No texture provided for description.");
            return;
        }
        print("AutoSnap3DGenerator: Requesting image description...");
        this.imageDescriptionGenerator.describeImage(texture)
            .then((description) => {
                print("AutoSnap3DGenerator: Received image description: " + description);
                this.hasGenerated = true;
                print(`Starting 3D generation with prompt: "${description}"`);
                this.snap3DFactory.createInteractable3DObject(description)
                    .then((result) => {
                        print("3D generation completed successfully: " + result);
                    })
                    .catch((error) => {
                        print("3D generation failed: " + error);
                    });
            })
            .catch((error) => {
                print("Image description failed: " + error);
            });
    }
    
    /**
     * Public method to manually trigger generation with a prompt
     */
    public manualGenerate(prompt?: string): void {
        if (this.hasGenerated) {
            print("Resetting auto generation flag for manual trigger");
            this.hasGenerated = false;
        }
        const usePrompt = prompt || this.predefinedPrompt;
        if (!this.snap3DFactory) {
            print("Error: Snap3D Factory not assigned. Please assign it in the inspector.");
            return;
        }
        if (!usePrompt || usePrompt.trim().length === 0) {
            print("Error: No prompt defined for manual generation");
            return;
        }
        this.hasGenerated = true;
        print(`Starting manual 3D generation with prompt: "${usePrompt}"`);
        this.snap3DFactory.createInteractable3DObject(usePrompt)
            .then((result) => {
                print("Manual generation completed successfully: " + result);
            })
            .catch((error) => {
                print("Manual generation failed: " + error);
            });
    }

    /**
     * Reset the generation flag to allow another generation
     */
    public resetGeneration(): void {
        this.hasGenerated = false;
        print("Auto generation reset - ready for next generation");
    }
}