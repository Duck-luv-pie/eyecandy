// @input Asset.InternetModule internetModule

import { Config } from "./config";

@component
export class ImageDescriptionGenerator extends BaseScriptComponent {
  @ui.separator
  @ui.label("Image Description using Gemini API")
  @input
  private loadingSpinner: SceneObject;
  @input
  private internetModule: InternetModule;
  
  private geminiApiKey: string = Config.GEMINI_API_KEY;
  private geminiEndpoint: string = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  onAwake() {
    if (this.loadingSpinner) {
      this.loadingSpinner.enabled = false;
    }
  }

  /**
   * Public method to get description of a provided texture
   */
  public describeImage(texture: Texture): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!texture) {
        const error = "No texture provided to describe";
        print("ImageDescriptionGenerator: " + error);
        reject(error);
        return;
      }

      this.analyzeImageWithGemini(texture)
        .then((description) => {
          print("ImageDescriptionGenerator: " + description);
          resolve(description);
        })
        .catch((error) => {
          const errorMsg = "Failed to describe image: " + error;
          print("ImageDescriptionGenerator: " + errorMsg);
          reject(errorMsg);
        });
    });
  }

  /**
   * Analyzes the image using Gemini Vision API
   */
  private analyzeImageWithGemini(texture: Texture): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.loadingSpinner) {
        this.loadingSpinner.enabled = true;
      }

      // Convert texture to base64 first, then make API call
      this.textureToBase64(texture)
        .then((imageData) => {
          // Prepare the Gemini API request
          const requestBody = {
            contents: [{
              parts: [
                {
                  text: "Describe this clothing image in detail so that it can be accurately recreatable from visualization."
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: imageData
                  }
                }
              ]
            }]
          };

          // Configure the API request using Spectacles InternetModule
          const request = RemoteServiceHttpRequest.create();
          request.url = this.geminiEndpoint + "?key=" + this.geminiApiKey;
          request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post;
          request.setHeader("Content-Type", "application/json");
          request.body = JSON.stringify(requestBody);

          print("ImageDescriptionGenerator: Sending request to Gemini API...");

          // Send the request using InternetModule
          this.internetModule.performHttpRequest(request, (response) => {
            if (this.loadingSpinner) {
              this.loadingSpinner.enabled = false;
            }

            try {
              if (response.statusCode === 200) {
                const responseData = JSON.parse(response.body);
                
                if (responseData.candidates && 
                    responseData.candidates.length > 0 && 
                    responseData.candidates[0].content &&
                    responseData.candidates[0].content.parts &&
                    responseData.candidates[0].content.parts.length > 0) {
                  
                  const description = responseData.candidates[0].content.parts[0].text;
                  print("ImageDescriptionGenerator: Successfully received description");
                  resolve(description);
                } else {
                  throw new Error("Invalid response format from Gemini API");
                }
              } else {
                throw new Error("HTTP Error " + response.statusCode + ": " + response.body);
              }
            } catch (parseError) {
              reject("Failed to parse Gemini response: " + parseError);
            }
          });
        })
        .catch((error) => {
          if (this.loadingSpinner) {
            this.loadingSpinner.enabled = false;
          }
          reject("Error converting texture: " + error);
        });
    });
  }

  /**
   * Converts a texture to base64 string using Spectacles Base64 API
   */
  private textureToBase64(texture: Texture): Promise<string> {
    return new Promise((resolve, reject) => {
      print("ImageDescriptionGenerator: Converting texture to base64...");
      
      Base64.encodeTextureAsync(
        texture,
        (base64String) => {
          print("ImageDescriptionGenerator: Successfully converted texture to base64");
          resolve(base64String);
        },
        () => {
          const error = "Failed to encode texture to base64";
          print("ImageDescriptionGenerator: " + error);
          reject(error);
        },
        CompressionQuality.HighQuality,
        EncodingType.Jpg
      );
    });
  }

  /**
   * Manual trigger for testing with provided texture
   */
  public testDescribeImage(texture: Texture) {
    this.describeImage(texture)
      .then((description) => {
        print("Image Description Result: " + description);
      })
      .catch((error) => {
        print("Image Description Error: " + error);
      });
  }
}