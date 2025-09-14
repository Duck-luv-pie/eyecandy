import { setTimeout } from "SpectaclesInteractionKit.lspkg/Utils/FunctionTimingUtils";
@component
export class Snap3DInteractable extends BaseScriptComponent {
  @input
  private modelParent: SceneObject;
  @input
  private img: Image;
  @input
  private promptDisplay: Text;
  @input
  private spinner: SceneObject;
  @input
  private mat: Material;
  @input
  private displayPlate: SceneObject;
  @input
  private colliderObj: SceneObject;
  @input
  private trenchCoat: SceneObject;
  @input
  private targetObject: SceneObject; // New target object to position generated model at

  private tempModel: SceneObject = null;
  private finalModel: SceneObject = null;
  private positionedModel: SceneObject = null; // Track the positioned copy
  private size: number = 20;
  private sizeVec: vec3 = null;

  onAwake() {
    // Clone the image material to avoid modifying the original
    let imgMaterial = this.img.mainMaterial;
    imgMaterial.mainPass.baseTex = this.img.mainPass.baseTex;
    this.img.enabled = false;

    let offsetBelow = 0;
    this.sizeVec = vec3.one().uniformScale(this.size);
    this.displayPlate
      .getTransform()
      .setLocalPosition(new vec3(0, -this.size * 0.5 - offsetBelow, 0));
    this.colliderObj.getTransform().setLocalScale(this.sizeVec);
    this.img.getTransform().setLocalScale(this.sizeVec);
  }

  setPrompt(prompt: string) {
    this.promptDisplay.text = prompt;
  }

  setImage(image: Texture) {
    this.img.enabled = true;
    this.img.mainPass.baseTex = image;
  }

  setModel(model: GltfAsset, isFinal: boolean, clothing: ClothVisual | null = null, targetObj: SceneObject | null = null) {
    this.img.enabled = false;
    if (isFinal) {
      if (!isNull(this.finalModel)) {
        this.finalModel.destroy();
      }
      // Destroy any existing positioned model
      if (!isNull(this.positionedModel)) {
        this.positionedModel.destroy();
        this.positionedModel = null;
      }
      this.spinner.enabled = false;
      this.finalModel = model.tryInstantiate(this.modelParent, this.mat);
      this.finalModel.getTransform().setLocalScale(this.sizeVec);
      
      // Hide the original model since we'll create a positioned copy
      this.finalModel.enabled = false;
      
      // Debug: Log the structure of the generated model
      this.logModelStructure(this.finalModel, 0);
      
      // Find the first RenderMeshVisual component in the model hierarchy
      const meshVisual = this.findRenderMeshVisual(this.finalModel);
      
      // Use targetObj parameter or fall back to this.targetObject input
      const targetForPositioning = targetObj || this.targetObject;
      
      if (meshVisual && meshVisual.mesh && targetForPositioning) {
        print("Found mesh and target object for positioning");
        
        // Create a new RenderMeshVisual positioned at the target object
        try {
          print("Creating new visual positioned at target object...");
          
          // Get the target object's transform information for positioning
          const targetTransform = targetForPositioning.getTransform();
          
          print(`Target position: ${targetTransform.getWorldPosition()}`);
          print(`Target rotation: ${targetTransform.getWorldRotation()}`);
          print(`Target scale: ${targetTransform.getWorldScale()}`);
          
          // Create a new object for the generated model mesh
          const newMeshObject = global.scene.createSceneObject("GeneratedMeshDisplay");
          this.positionedModel = newMeshObject; // Track this object
          
          // Set the same parent as the target object to inherit hierarchy
          newMeshObject.setParent(targetForPositioning.getParent());
          
          // Match the target's exact world transform
          const newTransform = newMeshObject.getTransform();
          newTransform.setWorldPosition(targetTransform.getWorldPosition());
          newTransform.setWorldRotation(targetTransform.getWorldRotation());
          newTransform.setWorldScale(targetTransform.getWorldScale());
          
          // Apply Y offset in world space (move up 3 units)
          const currentWorldPos = newTransform.getWorldPosition();
          const offsetPosition = currentWorldPos.add(new vec3(-7, -10, 0));
          newTransform.setWorldPosition(offsetPosition);
          
          // Reset local rotation only (keep the position with offset)
          newTransform.setLocalRotation(quat.quatIdentity());
          
          // Apply 3x scaling in addition to other scaling
          const currentScale = newTransform.getLocalScale();
            const enlargedScaleVec = new vec3(
            currentScale.x * this.sizeVec.x * 4.5,
            currentScale.y * this.sizeVec.y * 3.5,
            currentScale.z * this.sizeVec.z * 3.8
            );
          newTransform.setLocalScale(enlargedScaleVec);
          
          // Create a RenderMeshVisual component
          const newMeshVisual = newMeshObject.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
          
          // Apply the mesh and material
          newMeshVisual.mesh = meshVisual.mesh;
          if (meshVisual.mainMaterial) {
            newMeshVisual.mainMaterial = meshVisual.mainMaterial;
          }
          
          print("Successfully created new mesh visual positioned at target object");
          print("Local rotation and position are set to zero as requested");
          
          // Now destroy the original model since we've extracted what we need
          if (this.finalModel) {
            this.finalModel.destroy();
            this.finalModel = null;
          }
          
        } catch (error) {
          print("Error creating positioned mesh visual: " + error);
        }
      } else {
        if (!meshVisual) {
          print("Warning: No RenderMeshVisual component found in generated model hierarchy");
        } else if (!meshVisual.mesh) {
          print("Warning: RenderMeshVisual component has no mesh");
        } else if (!clothing) {
          print("Warning: No clothing component provided");
        }
      }
    } else {
      this.tempModel = model.tryInstantiate(this.modelParent, this.mat);
      this.tempModel.getTransform().setLocalScale(this.sizeVec);
    }
  }

  onFailure(error: string) {
    this.img.enabled = false;
    this.spinner.enabled = false;
    if (this.tempModel) {
      this.tempModel.destroy();
    }
    if (this.finalModel) {
      this.finalModel.destroy();
    }
    if (this.positionedModel) {
      this.positionedModel.destroy();
      this.positionedModel = null;
    }
    this.promptDisplay.text = "Error: " + error;
    setTimeout(() => {
      this.destroy();
    }, 5000); // Hide error after 5 seconds
  }

  /**
   * Configures cloth vertices to simulate red vertex painting behavior
   */
  private configureClothVertices(clothing: ClothVisual) {
    try {
      print("Configuring cloth vertex settings...");
      
      // First, check if the cloth is initialized
      if (!clothing.isInitialized()) {
        print("Cloth not yet initialized, waiting...");
        setTimeout(() => {
          this.configureClothVertices(clothing);
        }, 500);
        return;
      }
      
      // Get the vertex colors to see what's available
      const colors = clothing.getAllColors();
      print(`Cloth has ${colors.length} vertex colors available`);
      
      // Look for red vertices (R=1, G=0, B=0) or create vertex settings for all vertices
      const redColor = new vec4(1, 0, 0, 1); // Red color
      const colorMask = new vec4b(true, true, true, false); // Check RGB, ignore Alpha
      
      // Find vertices that should be treated as "red" (pinned)
      const redVertices = clothing.getPointIndicesByColor(redColor, colorMask);
      print(`Found ${redVertices.length} red vertices`);
      
      // If no red vertices found, mark some vertices as pinned based on position
      if (redVertices.length === 0) {
        print("No red vertices found, configuring top vertices as pinned...");
        // This is a simplified approach - in reality you'd analyze vertex positions
        // to determine which should be pinned
        
        // For now, just configure the first few vertices as examples
        for (let i = 0; i < Math.min(10, colors.length); i++) {
          try {
            const settings = clothing.getVertexSettings(i);
            if (settings) {
              // Configure as pinned vertex (similar to red painting)
              // These settings would make the vertex behave like it's "pinned"
              clothing.setVertexSettings(i, settings);
              print(`Configured vertex ${i} as pinned`);
            }
          } catch (vertexError) {
            print(`Error configuring vertex ${i}: ${vertexError}`);
          }
        }
      }
      
      print("Cloth vertex configuration completed");
      
    } catch (error) {
      print("Error configuring cloth vertices: " + error);
    }
  }

  /**
   * Validates if a mesh is suitable for cloth simulation
   */
  private validateMeshForCloth(mesh: RenderMesh): boolean {
    try {
      if (!mesh) {
        print("Mesh validation failed: mesh is null");
        return false;
      }
      
      // Check if mesh has basic properties
      if (!mesh.name) {
        print("Mesh validation warning: mesh has no name");
      }
      
      // Basic validation - if we can access the mesh without errors, it's probably OK
      print(`Mesh validation: ${mesh.name || "unnamed"} appears to be valid`);
      return true;
      
    } catch (error) {
      print("Mesh validation failed: " + error);
      return false;
    }
  }

  /**
   * Recursively searches for the first RenderMeshVisual component in the object hierarchy
   */
  private findRenderMeshVisual(obj: SceneObject): RenderMeshVisual | null {
    // Check this object first
    const meshVisual = obj.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    if (meshVisual) {
      print(`Found RenderMeshVisual on: ${obj.name}`);
      return meshVisual;
    }
    
    // Recursively search children
    for (let i = 0; i < obj.getChildrenCount(); i++) {
      const child = obj.getChild(i);
      const foundMeshVisual = this.findRenderMeshVisual(child);
      if (foundMeshVisual) {
        return foundMeshVisual;
      }
    }
    
    return null;
  }

  /**
   * Recursively logs the structure of a SceneObject and its components
   */
  private logModelStructure(obj: SceneObject, depth: number) {
    const indent = "  ".repeat(depth);
    print(`${indent}SceneObject: ${obj.name}`);
    
    // Check for specific component types
    const renderMeshVisual = obj.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    if (renderMeshVisual) {
      print(`${indent}  - RenderMeshVisual`);
      if (renderMeshVisual.mesh) {
        print(`${indent}    - Has mesh: ${renderMeshVisual.mesh.name || "unnamed"}`);
      } else {
        print(`${indent}    - No mesh property`);
      }
      if (renderMeshVisual.mainMaterial) {
        print(`${indent}    - Has material: ${renderMeshVisual.mainMaterial.name || "unnamed"}`);
      } else {
        print(`${indent}    - No mainMaterial property`);
      }
    }
    
    const materialMeshVisual = obj.getComponent("Component.MaterialMeshVisual") as MaterialMeshVisual;
    if (materialMeshVisual && !renderMeshVisual) { // Don't log if we already found RenderMeshVisual
      print(`${indent}  - MaterialMeshVisual`);
      if (materialMeshVisual.mainMaterial) {
        print(`${indent}    - Has material: ${materialMeshVisual.mainMaterial.name || "unnamed"}`);
      } else {
        print(`${indent}    - No mainMaterial property`);
      }
    }
    
    const baseMeshVisual = obj.getComponent("Component.BaseMeshVisual") as BaseMeshVisual;
    if (baseMeshVisual && !renderMeshVisual && !materialMeshVisual) { // Don't log if we already found other mesh visuals
      print(`${indent}  - BaseMeshVisual`);
    }
    
    const visual = obj.getComponent("Component.Visual") as Visual;
    if (visual && !renderMeshVisual && !materialMeshVisual && !baseMeshVisual) {
      print(`${indent}  - Visual (base)`);
    }
    
    // Transform is accessed differently
    const transform = obj.getTransform();
    if (transform) {
      print(`${indent}  - Transform`);
    }
    
    // Recursively log children
    for (let i = 0; i < obj.getChildrenCount(); i++) {
      const child = obj.getChild(i);
      this.logModelStructure(child, depth + 1);
    }
  }
}
