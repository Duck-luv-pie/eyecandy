@component
export class ButtonActivationManager extends BaseScriptComponent {
    @input
    @hint("Object to enable after 5 seconds")
    targetObject: SceneObject;
    
    @input
    @hint("Button to start the 5 second timer")
    activationButton: SceneObject;

    private activationTimer: DelayedCallbackEvent;

    onAwake() {
        // Ensure target is initially disabled
        if (this.targetObject) {
            this.targetObject.enabled = false;
        }
        
        // Setup button interaction
        if (this.activationButton) {
            const touchComponent = this.activationButton.getComponent("TouchComponent");
            if (touchComponent) {
                touchComponent.onTouchStart.add(() => {
                    this.startActivationTimer();
                });
            } else {
                print("No TouchComponent found on button - you can still call startActivationTimer() manually");
            }
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
            this.activationTimer = null;
        });
        this.activationTimer.reset(5.0); // 5 seconds
    }

    /**
     * Enables the target object
     */
    private activateTarget(): void {
        if (this.targetObject) {
            this.targetObject.enabled = true;
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
