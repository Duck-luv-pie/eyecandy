# CatalogueItem3D + Image Description Integration Guide

## Overview
The `CatalogueItem3D` script now includes built-in image description functionality that triggers when catalogue items are selected, instead of running automatically on awake.

## What Changed

### **New Inputs Added:**
- **Image Description Generator**: Reference to an ImageDescriptionGenerator component
- **Enable Image Description**: Boolean toggle to enable/disable the feature

### **New Behavior:**
- When a catalogue item is pressed, if it has a texture, AI description is automatically triggered
- Descriptions are logged to console with item context
- Extensible callback methods for custom behavior

## Setup Instructions

### 1. **Create ImageDescriptionGenerator Object**
1. Create a SceneObject called `ImageDescriber`
2. Add `ImageDescriptionGenerator` script component
3. Configure the Internet Module input

### 2. **Configure CatalogueItem3D Objects**
For each catalogue item:
1. Set **Image Description Generator** to reference the `ImageDescriber` object
2. Check **Enable Image Description** if you want automatic descriptions
3. Ensure the catalogue item has a valid texture loaded

### 3. **Usage Flow**
```
User taps catalogue item
↓
CatalogueItem3D.onItemPressed() executes
↓
If texture exists + description enabled
↓
ImageDescriptionGenerator.describeImage(texture) called
↓
AI description returned and logged
↓
onImageDescriptionReceived() callback triggered
```

## Console Output Example
```
=== CATALOGUE ITEM PRESSED ===
Item Name: Mountain Landscape
Item ID: 42
Item Category: Nature
🖼️ Texture: Available, URL: https://example.com/mountain.jpg
📊 Has Texture: true
✅ TEXTURE AVAILABLE FOR RETURN:
🔍 Starting AI image description...
🤖 Describing image for item: Mountain Landscape
ImageDescriptionGenerator: Converting texture to base64...
ImageDescriptionGenerator: Successfully converted texture to base64
ImageDescriptionGenerator: Sending request to Gemini API...
ImageDescriptionGenerator: This image shows a breathtaking mountain landscape with snow-capped peaks...
🎯 AI Description for "Mountain Landscape": This image shows a breathtaking mountain landscape...
✅ "Mountain Landscape" Description: This image shows a breathtaking mountain landscape...
```

## Customization Options

### **Extend Description Behavior**
Override the callback methods in a derived class:

```typescript
@component
export class CustomCatalogueItem3D extends CatalogueItem3D {
  @input
  private voiceSynthesis: VoiceSynthesis;
  @input
  private descriptionDisplay: Text;

  protected onImageDescriptionReceived(description: string): void {
    // Custom behavior
    if (this.descriptionDisplay) {
      this.descriptionDisplay.text = description;
    }
    
    if (this.voiceSynthesis) {
      this.voiceSynthesis.speak(`${this.getItemData().name}: ${description}`);
    }
    
    // Call parent for default logging
    super.onImageDescriptionReceived(description);
  }
}
```

### **Manual Triggering**
You can also trigger descriptions programmatically:

```typescript
// From another script
const catalogueItem = sceneObject.getComponent("CatalogueItem3D");
catalogueItem.triggerImageDescription();
```

### **Conditional Descriptions**
Control when descriptions happen:

```typescript
// Only describe certain categories
if (this.itemData.category === "Artwork") {
  this.triggerImageDescription();
}
```

## Integration Benefits

- ✅ **Context-Aware**: Descriptions include item name and metadata
- ✅ **User-Driven**: Only describes when user interacts with items
- ✅ **Efficient**: No unnecessary API calls on scene load
- ✅ **Extensible**: Easy to customize behavior for different item types
- ✅ **Error Handling**: Graceful handling of missing textures or API failures

## Performance Considerations

- **On-Demand**: API calls only happen when user taps items
- **Texture Validation**: Checks for valid textures before making API calls
- **Toggle Control**: Can disable descriptions globally or per-item
- **Async Processing**: Non-blocking AI requests with proper callbacks

This integration provides a seamless way to get AI-powered descriptions of catalogue items exactly when users are interested in them!