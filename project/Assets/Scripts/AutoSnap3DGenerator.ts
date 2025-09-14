import { Snap3D } from "Remote Service Gateway.lspkg/HostedSnap/Snap3D";
import { Snap3DTypes } from "Remote Service Gateway.lspkg/HostedSnap/Snap3DTypes";
import { Snap3DInteractableFactory } from "./Snap3DInteractableFactory";
import { setTimeout } from "SpectaclesInteractionKit.lspkg/Utils/FunctionTimingUtils";

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
    
    private hasGenerated: boolean = false;
    
    onAwake() {
        if (this.enableAutoGeneration && !this.hasGenerated) {
            this.scheduleAutoGeneration();
        }
    }
    
    private scheduleAutoGeneration(): void {
        // Use setTimeout for reliable timing
        setTimeout(() => {
            this.generateAutoModel();
        }, this.delaySeconds * 1000); // Convert seconds to milliseconds
            
        print(`Auto 3D generation scheduled for ${this.delaySeconds} seconds from now...`);
    }
    
    private generateAutoModel(): void {
        if (this.hasGenerated) {
            print("Auto generation already completed");
            return;
        }
        
        if (!this.snap3DFactory) {
            print("Error: Snap3D Factory not assigned. Please assign it in the inspector.");
            return;
        }
        
        if (!this.predefinedPrompt || this.predefinedPrompt.trim().length === 0) {
            print("Error: No prompt defined for auto generation");
            return;
        }
        
        this.hasGenerated = true;
        print(`Starting auto 3D generation with prompt: "${this.predefinedPrompt}"`);
        
        // Call the factory to create the 3D object
        this.snap3DFactory.createInteractable3DObject(this.predefinedPrompt)
            .then((result) => {
                print("Auto generation completed successfully: " + result);
            })
            .catch((error) => {
                print("Auto generation failed: " + error);
            });
    }
    
    /**
     * Public method to manually trigger generation (useful for testing)
     */
    public manualGenerate(): void {
        if (this.hasGenerated) {
            print("Resetting auto generation flag for manual trigger");
            this.hasGenerated = false;
        }
        this.generateAutoModel();
    }
    
    /**
     * Public method to change the prompt and regenerate
     */
    public generateWithNewPrompt(newPrompt: string): void {
        this.predefinedPrompt = newPrompt;
        this.hasGenerated = false;
        this.generateAutoModel();
    }
    
    /**
     * Reset the generation flag to allow another auto generation
     */
    public resetGeneration(): void {
        this.hasGenerated = false;
        print("Auto generation reset - ready for next generation");
    }
    
    /**
     * Schedule another generation with a new delay
     */
    public scheduleNextGeneration(newDelaySeconds: number, newPrompt?: string): void {
        if (newPrompt) {
            this.predefinedPrompt = newPrompt;
        }
        this.delaySeconds = newDelaySeconds;
        this.hasGenerated = false;
        this.scheduleAutoGeneration();
    }
}