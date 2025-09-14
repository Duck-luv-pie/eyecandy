# AutoSnap3DGenerator - Image-Driven 3D Generation Guide

## Overview
The `AutoSnap3DGenerator` has been completely rewritten to generate 3D models based on AI image descriptions instead of predefined prompts on awake.

## What Changed

### **Old Behavior (Removed):**
- ❌ Generated 3D models automatically on scene awake
- ❌ Used predefined text prompts
- ❌ Timing-based generation with delays

### **New Behavior:**
- ✅ Generates 3D models from AI image descriptions
- ✅ Triggered by external calls (user interactions)
- ✅ Smart prompt creation from visual descriptions
- ✅ Complete texture → description → 3D pipeline

## New Input Configuration

### **Required Inputs:**
- **Image Description Generator**: Reference to ImageDescriptionGenerator component
- **Snap3D Factory**: Reference to Snap3DInteractableFactory (unchanged)

### **Optional Settings:**
- **Enable Image Driven 3D**: Toggle for the feature
- **Prompt Prefix**: Text added before description (default: "Create a 3D model of ")
- **Fallback Prompt**: Used for manual generation when no description available
- **Refine Mesh**: Whether to refine the generated mesh (unchanged)
- **Use Vertex Color**: Whether to use vertex colors (unchanged)

## Usage Methods

### **1. Generate from Image Description**
```typescript
const generator = this.getComponent("AutoSnap3DGenerator");

generator.generateFromImageDescription("a red mountain bike with black wheels")
  .then((result) => {
    print("3D model created: " + result);
  })
  .catch((error) => {
    print("Generation failed: " + error);
  });
```

### **2. Generate from Texture (Complete Pipeline)**
```typescript
// This will first describe the texture, then generate 3D model
generator.generateFromTexture(someTexture)
  .then((result) => {
    print("Complete pipeline finished: " + result);
  });
```

### **3. Manual Generation with Fallback**
```typescript
// Uses the fallback prompt for testing
generator.manualGenerate();
```

### **4. Custom Prompt Generation**
```typescript
// Bypass image description and use custom prompt
generator.generateWithCustomPrompt("a futuristic robot");
```

## Integration Examples

### **With CatalogueItem3D**
Create a custom catalogue item that triggers 3D generation:

```typescript
@component
export class CatalogueItem3DWith3D extends CatalogueItem3D {
  @input
  private autoSnap3DGenerator: AutoSnap3DGenerator;

  protected onImageDescriptionReceived(description: string): void {
    // Call parent for default behavior
    super.onImageDescriptionReceived(description);
    
    // Trigger 3D generation from the description
    if (this.autoSnap3DGenerator) {
      print("🎯 Triggering 3D generation from catalogue item...");
      this.autoSnap3DGenerator.generateFromImageDescription(description)
        .then((result) => {
          print("✅ 3D model generated from catalogue item: " + result);
        })
        .catch((error) => {
          print("❌ 3D generation failed: " + error);
        });
    }
  }
}
```

### **With Voice Commands**
```typescript
// In your voice listener script
if (transcription.includes("make 3d") || transcription.includes("create model")) {
  // Get the current displayed image texture
  const currentTexture = this.getCurrentDisplayTexture();
  
  if (currentTexture) {
    this.autoSnap3DGenerator.generateFromTexture(currentTexture);
  }
}
```

### **With Button Events**
```typescript
// In a button handler
onGenerateButtonPressed() {
  const imageComponent = this.getComponent("Image");
  if (imageComponent && imageComponent.mainPass.baseTex) {
    this.autoSnap3DGenerator.generateFromTexture(imageComponent.mainPass.baseTex);
  }
}
```

## Prompt Processing Intelligence

The system automatically processes image descriptions to create better 3D prompts:

### **Automatic Cleanup:**
- Removes "This image shows" and similar phrases
- Removes leading articles (a, an, the)
- Truncates overly long descriptions
- Focuses on the main subject

### **Example Transformations:**
```
Input: "This image shows a beautiful red rose with green leaves in a garden"
Output: "Create a 3D model of beautiful red rose with green leaves"

Input: "The image depicts a vintage blue bicycle with a wicker basket"
Output: "Create a 3D model of vintage blue bicycle with a wicker basket"
```

## Workflow Examples

### **Complete Image-to-3D Pipeline:**
```
1. User taps catalogue item with mountain photo
2. CatalogueItem3D describes image: "snow-capped mountain with pine trees"
3. AutoSnap3DGenerator processes: "Create a 3D model of snow-capped mountain with pine trees"
4. Snap3D API generates 3D mountain model
5. Model appears in scene as interactable object
```

### **Voice-Triggered Pipeline:**
```
1. User says "describe and make 3D"
2. System describes current image: "red sports car in city street"
3. AutoSnap3DGenerator creates: "Create a 3D model of red sports car"
4. 3D car model generated and placed in scene
```

## Console Output Examples
```
🖼️ First describing the texture, then generating 3D model...
📝 Image description received: "a vintage leather jacket with metal buttons"
🔨 Starting image-driven 3D generation with prompt: "Create a 3D model of vintage leather jacket with metal buttons"
📖 Based on image description: "a vintage leather jacket with metal buttons"
✅ Image-driven 3D generation completed successfully: 3D object created
```

## Performance Benefits

- ✅ **On-Demand**: Only generates when user requests
- ✅ **Context-Aware**: 3D models match actual image content
- ✅ **Intelligent**: Smart prompt processing for better results
- ✅ **Flexible**: Multiple trigger methods (voice, tap, custom)
- ✅ **Efficient**: No unnecessary generation on scene load

## Setup Checklist

1. ✅ Update AutoSnap3DGenerator inputs in inspector
2. ✅ Connect ImageDescriptionGenerator reference
3. ✅ Set appropriate prompt prefix
4. ✅ Configure fallback prompt for testing
5. ✅ Integrate with your UI interaction system
6. ✅ Test with sample textures

This new system provides a much more intelligent and user-driven approach to 3D model generation!