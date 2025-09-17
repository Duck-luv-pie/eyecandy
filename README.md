# Eye Candy - AR Shopping Experience## Challenges We Faced  
- **Data Access**: Initially we tried scraping Shopify, but it was unreliable and against ToS. Learning to use the Storefront API was key.  
- **3D Quality**: Generating wearable meshes from just one image was tough — some products reconstructed better than others.  
- **Performance**: Getting meshes small enough for smooth playback on Spectacles without losing too much detail was a balancing act.  
- **Anchoring Fit**: Aligning jackets and accessories to body trackers wasn't trivial — scale and occlusion had to be tuned manually.

## � Achievement
**Runner Up Prize Winner** at Snap's AR competition - recognized for innovation in AR commerce and seamless integration of Shopify with Spectacles AR technology.

---

**Built with:** Snap Spectacles, Lens Studio, Shopify Storefront API, Snap3D API, Upper Body Tracking 3D, Voice ML🏆 **Winner of Snap's Runner Up Prize** 🏆

**Eye Candy** reimagines online shopping by blending **commerce and augmented reality**. Transform any Shopify product image into an immersive AR try-on experience using Snap Spectacles.

## 🎬 Demo & Links
- **[YouTube Demo](https://youtu.be/Y8HBG6J3Q5Y)** - See Eye Candy in action
- **[Devpost Project](https://devpost.com/software/eye-candy)** - Full project details and submission

## Inspiration  
We wanted to reimagine how people shop online by blending **commerce and augmented reality**. Shopify already powers countless stores, but the experience is usually confined to a flat web page. At the same time, Snap Spectacles open the door to immersive, hands-free AR experiences. Our inspiration was simple: *what if you could look at a Shopify product image and instantly see yourself wearing it in AR, no clicks or mirrors required?*  

## What We Learned  
- **AR Anchoring**: Explored Snap’s **Upper Body Tracking 3D**, learning how to attach glasses, jackets, and accessories naturally to the user.  
- **APIs over Scraping**: Learned the value of using the **Shopify Storefront API** (instead of brittle scraping) to reliably fetch product data like images and variants.  
- **Single-Image 3D Reconstruction**: Experimented with the **Snap3D API** to convert 2D product photos into lightweight 3D meshes (GLB), optimizing them for real-time rendering.  
- **Hands-Free Interaction**: Leveraged **Voice ML** in Lens Studio to let users say *“next”* or *“try medium”* to cycle through products.  

## How We Built It  
1. **Data Pipeline**  
   - Created a free **Shopify development store** and connected via OAuth to fetch products.  
   - Normalized data through a lightweight backend (Express/FastAPI).  
   - Returned JSON with `title`, `imageUrl`, and generated `glbUrl`.  

2. **2D → 3D Conversion**  
   - Segmented product images to remove backgrounds.  
   - Ran them through a single-view reconstruction model to produce **GLB meshes**.  
   - Decimated meshes to <15k triangles and compressed textures.  

3. **AR Integration**  
   - Imported meshes into **Lens Studio**.  
   - Anchored glasses to **face mesh** and jackets to **torso joints** using **Upper Body Tracking 3D**.  
   - Enabled **speech recognition** for browsing products.  
   - Added first-person and third-person camera toggles for full try-on immersion.  

## Challenges We Faced  
- **Data Access**: Initially we tried scraping Shopify, but it was unreliable and against ToS. Learning to use the Storefront API was key.  
- **3D Quality**: Generating wearable meshes from just one image was tough — some products reconstructed better than others.  
- **Performance**: Getting meshes small enough for smooth playback on Spectacles without losing too much detail was a balancing act.  
- **Anchoring Fit**: Aligning jackets and accessories to body trackers wasn’t trivial — scale and occlusion had to be tuned manually.  