# Image Description Usage Guide

## Updated Architecture

### **ImageDescriptionGenerator** (Modified)
- No longer takes `@input targetImage`
- `describeImage(texture: Texture)` now requires texture as parameter
- Cleaner, more flexible API

### **ImageDescriptionCaller** (New)
- Handles the automatic calling on awake
- Connects UI components to the description generator
- Provides event handling and error management

## Setup Instructions

### 1. **Create Scene Objects**

#### **Description Generator Object:**
1. Create SceneObject named `DescriptionGenerator`
2. Add `ImageDescriptionGenerator` script component
3. Configure inputs:
   - **Loading Spinner**: (Optional) SceneObject for loading feedback
   - **Internet Module**: InternetModule asset

#### **Caller Object:**
1. Create SceneObject named `DescriptionCaller`
2. Add `ImageDescriptionCaller` script component
3. Configure inputs:
   - **Target Image**: Image component with texture to describe
   - **Image Description Generator**: Reference to the DescriptionGenerator object
   - **Internet Module**: Same InternetModule asset
   - **Auto Describe On Awake**: Boolean (checked = auto-describe on start)

### 2. **Usage Patterns**

#### **Automatic Description on Scene Load:**
```typescript
// Just set autoDescribeOnAwake = true in the inspector
// The description will happen automatically when the scene loads
```

#### **Manual Trigger:**
```typescript
// Get reference to caller
const caller = this.sceneObject.getComponent("ImageDescriptionCaller");

// Trigger description of current image
caller.triggerDescription();

// Or describe any texture directly
caller.describeTexture(someTexture);
```

#### **Direct Generator Usage:**
```typescript
// Get reference to generator
const generator = this.sceneObject.getComponent("ImageDescriptionGenerator");

// Describe any texture
generator.describeImage(texture)
  .then((description) => {
    print("Got description: " + description);
  });
```

### 3. **Integration Examples**

#### **With Voice Commands:**
```typescript
// In VoiceOutputListener or similar
if (transcription.includes("describe")) {
  const caller = this.getComponent("ImageDescriptionCaller");
  caller.triggerDescription();
}
```

#### **With 3D Model Generation:**
```typescript
// After Snap3D model is created
const modelTexture = generatedModel.getMaterial().mainPass.baseTex;
const caller = this.getComponent("ImageDescriptionCaller");
caller.describeTexture(modelTexture);
```

#### **With Button Events:**
```typescript
// In button tap handler
onButtonTap() {
  const caller = this.getComponent("ImageDescriptionCaller");
  caller.triggerDescription();
}
```

### 4. **Custom Event Handling**

Create a custom caller by extending the base class:

```typescript
@component
export class CustomImageDescriptionCaller extends ImageDescriptionCaller {
  @input
  private voiceSynthesis: VoiceSynthesis;
  @input
  private resultDisplay: Text;

  protected onDescriptionReceived(description: string) {
    // Custom behavior
    if (this.resultDisplay) {
      this.resultDisplay.text = description;
    }
    
    if (this.voiceSynthesis) {
      this.voiceSynthesis.speak(description);
    }
    
    // Call parent for default logging
    super.onDescriptionReceived(description);
  }

  protected onDescriptionError(error: string) {
    if (this.resultDisplay) {
      this.resultDisplay.text = "Error: " + error;
    }
    
    super.onDescriptionError(error);
  }
}
```

### 5. **Workflow Benefits**

- ✅ **Separation of Concerns**: Generator handles API, Caller handles UI/events
- ✅ **Flexible**: Can describe any texture, not just @input images
- ✅ **Automatic**: Can auto-describe on scene load
- ✅ **Extensible**: Easy to customize behavior
- ✅ **Reusable**: One generator can serve multiple callers

### 6. **Console Output**
```
ImageDescriptionCaller: Starting image description...
ImageDescriptionGenerator: Converting texture to base64...
ImageDescriptionGenerator: Successfully converted texture to base64
ImageDescriptionGenerator: Sending request to Gemini API...
ImageDescriptionGenerator: Successfully received description
ImageDescriptionGenerator: This image shows a vibrant sunset over a calm lake...
ImageDescriptionCaller: Description received: This image shows a vibrant sunset...
✅ Image Description: This image shows a vibrant sunset over a calm lake...
```