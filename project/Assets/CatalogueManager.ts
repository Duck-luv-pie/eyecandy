import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton";

@component
export class ButtonActivationManager extends BaseScriptComponent {
    @input
    @hint("Object to enable after 5 seconds")
    targetObject: SceneObject;
    
    @input
    @hint("PinchButton component to start the 5 second timer")
    button: PinchButton;

    @input
    pinchButtonObject: SceneObject;

    private activationTimer: DelayedCallbackEvent;

    onAwake() {
        // Ensure target is initially disabled
        if (this.targetObject) {
            this.targetObject.getTransform().setWorldPosition(new vec3(10000, 10000, 10000)); // Move far away initially
        }
        
        // Setup button interaction using PinchButton
        if (this.button) {
            print("Setting up PinchButton interaction...");
            
            // Check if the button has the onButtonPinched event
            if (this.button.onButtonPinched) {
                this.button.onButtonPinched.add(() => {
                    print("PinchButton pinched!");
                    this.startActivationTimer();
                });
                print("PinchButton connected successfully!");
            } else {
                print("PinchButton doesn't have onButtonPinched event - checking for alternatives...");
                
                // Try alternative event names
                if ((this.button as any).onPinchDown) {
                    (this.button as any).onPinchDown.add(() => {
                        print("PinchButton pinch down!");
                        this.startActivationTimer();
                    });
                    print("Connected to onPinchDown event!");
                } else if ((this.button as any).onTrigger) {
                    (this.button as any).onTrigger.add(() => {
                        print("PinchButton triggered!");
                        this.startActivationTimer();
                    });
                    print("Connected to onTrigger event!");
                } else {
                    print("Could not find any pinch events on the button");
                    print("Button object type: " + typeof this.button);
                }
            }
        } else {
            print("No PinchButton assigned - you can still call startActivationTimer() manually");
        }
    }

    /**
     * Starts 5 second timer to activate target
     */
    public startActivationTimer(): void {
        // Cancel any existing timer
        if (this.activationTimer) {
            this.activationTimer.cancel();
        }

        print("Button pressed! Activating object in 5 seconds...");
        
        // Start 5 second timer
        this.activationTimer = this.createEvent("DelayedCallbackEvent");
        this.activationTimer.bind(() => {
            this.activateTarget();
            this.pinchButtonObject.enabled = false;
            this.activationTimer = null;
        });
        this.activationTimer.reset(5.0); // 5 seconds
    }

    /**
     * Enables the target object
     */
    private activateTarget(): void {
        if (this.targetObject) {
            // Get the main camera transform - find camera by searching scene objects
            const cameraObjects = global.scene.getRootObjectsCount();
            let cameraTransform: Transform | null = null;
            
            for (let i = 0; i < cameraObjects; i++) {
                const obj = global.scene.getRootObject(i);
                const camera = obj.getComponent("Camera");
                if (camera) {
                    cameraTransform = obj.getTransform();
                    break;
                }
            }
            
            if (cameraTransform) {
                const cameraPosition = cameraTransform.getWorldPosition();
                const cameraForward = cameraTransform.forward;

                // Position object 150cm in front of the user
                const frontPosition = cameraPosition.sub(cameraForward.uniformScale(150));
                this.targetObject.getTransform().setWorldPosition(frontPosition); // Move to front of camera
            } else {
                // Fallback: just enable the object at its current position
                this.targetObject.enabled = true;
            }
            
            print("Target object activated!");
        } else {
            print("No target object assigned");
        }
    }

    /**
     * Public method to manually activate target (for testing)
     */
    public activateTargetManually(): void {
        this.activateTarget();
    }
}
