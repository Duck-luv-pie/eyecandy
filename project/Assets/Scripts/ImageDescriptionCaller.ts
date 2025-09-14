// @input Asset.InternetModule internetModule
// @input Component.Image targetImage
// @input Component.ScriptComponent imageDescriptionGenerator

import { ImageDescriptionGenerator } from "./ImageDescriptionGenerator";

@component
export class ImageDescriptionCaller extends BaseScriptComponent {
  @ui.separator
  @ui.label("Automatic Image Description on Awake")
  @input
  private targetImage: Image;
  @input
  private imageDescriptionGenerator: ImageDescriptionGenerator;
  @input
  private internetModule: InternetModule;
  @input
  private autoDescribeOnAwake: boolean = true;

  onAwake() {
    if (this.autoDescribeOnAwake) {
      this.describeCurrentImage();
    }
  }

  /**
   * Describe the image from the targetImage component
   */
  public describeCurrentImage() {
    if (!this.targetImage || !this.targetImage.mainPass.baseTex) {
      print("ImageDescriptionCaller: No image texture found");
      return;
    }

    if (!this.imageDescriptionGenerator) {
      print("ImageDescriptionCaller: No ImageDescriptionGenerator component found");
      return;
    }

    const texture = this.targetImage.mainPass.baseTex;
    print("ImageDescriptionCaller: Starting image description...");

    this.imageDescriptionGenerator.describeImage(texture)
      .then((description) => {
        print("ImageDescriptionCaller: Description received: " + description);
        this.onDescriptionReceived(description);
      })
      .catch((error) => {
        print("ImageDescriptionCaller: Error: " + error);
        this.onDescriptionError(error);
      });
  }

  /**
   * Describe any texture directly
   */
  public describeTexture(texture: Texture) {
    if (!texture) {
      print("ImageDescriptionCaller: No texture provided");
      return;
    }

    if (!this.imageDescriptionGenerator) {
      print("ImageDescriptionCaller: No ImageDescriptionGenerator component found");
      return;
    }

    print("ImageDescriptionCaller: Starting texture description...");

    this.imageDescriptionGenerator.describeImage(texture)
      .then((description) => {
        print("ImageDescriptionCaller: Texture description: " + description);
        this.onDescriptionReceived(description);
      })
      .catch((error) => {
        print("ImageDescriptionCaller: Texture description error: " + error);
        this.onDescriptionError(error);
      });
  }

  /**
   * Called when description is successfully received
   * Override this in derived classes for custom behavior
   */
  protected onDescriptionReceived(description: string) {
    // Default behavior: just print
    print("✅ Image Description: " + description);
    
    // You can extend this method to:
    // - Send to voice synthesis
    // - Update UI components
    // - Save to data
    // - Trigger other events
  }

  /**
   * Called when description fails
   * Override this in derived classes for custom error handling
   */
  protected onDescriptionError(error: string) {
    // Default behavior: just print error
    print("❌ Description Error: " + error);
    
    // You can extend this method to:
    // - Show error UI
    // - Retry logic
    // - Fallback behavior
  }

  /**
   * Enable/disable automatic description on awake
   */
  public setAutoDescribe(enabled: boolean) {
    this.autoDescribeOnAwake = enabled;
  }

  /**
   * Manually trigger description (useful for button events)
   */
  public triggerDescription() {
    this.describeCurrentImage();
  }
}