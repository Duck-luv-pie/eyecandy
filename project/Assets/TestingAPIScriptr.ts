@component
export class TestingAPIScript extends BaseScriptComponent {

    @input
    remoteServiceModule: RemoteServiceModule;

    @input
    apiEndpoint: string = "https://your-api-endpoint.com"; // Replace with your actual API endpoint

    @input
    apiKey: string = ""; // Your API key if needed

    onAwake() {
        this.displayProducts();
    }

    async displayProducts() {
        try {
            // Use RemoteServiceModule for HTTP requests in Lens Studio
            const request = RemoteApiRequest.create();
            request.endpoint = `${this.apiEndpoint}/products?store=shirtsfordemos.myshopify.com&limit=6`;
            request.parameters = {
                "Content-Type": "application/json"
            };

            // Add headers if needed
            if (this.apiKey) {
                request.parameters["Authorization"] = `Bearer ${this.apiKey}`;
            }

            const response = await this.performRequest(request);

            if (response && response.products) {
                const items = response.products;

                // Display each product in AR
                items.forEach((product: any, index: number) => {
                    print(`Product ${index + 1}: ${product.title}`);
                    print(`Image: ${product.imageUrl}`);

                    // You can now:
                    // - Display product images in 3D space
                    // - Show product titles as text
                    // - Create interactive buttons for each product
                    // - Get similar products when user taps a product
                });
            }
        } catch (error) {
            print(`Error fetching products: ${error}`);
        }
    }

    async showSimilarProducts(productId: string) {
        try {
            const request = RemoteApiRequest.create();
            request.endpoint = `${this.apiEndpoint}/similar-products`;
            request.parameters = {
                "Content-Type": "application/json"
            };

            if (this.apiKey) {
                request.parameters["Authorization"] = `Bearer ${this.apiKey}`;
            }

            const requestBody = {
                keyword: "snowboard",
                productId: productId,
                intent: "RELATED",
                perStore: 3,
                maxStores: 2
            };

            request.body = JSON.stringify(requestBody);

            const response = await this.performRequest(request);

            if (response && response.candidates) {
                // Display similar products from multiple stores
                response.candidates.forEach((store: any) => {
                    print(`Store: ${store.store}`);
                    store.items.forEach((item: any) => {
                        print(`Similar: ${item.title} - ${item.imageUrl}`);
                    });
                });
            }
        } catch (error) {
            print(`Error fetching similar products: ${error}`);
        }
    }

    private performRequest(request: RemoteApiRequest): Promise<any> {
        return new Promise((resolve, reject) => {
            this.remoteServiceModule.performApiRequest(
                request,
                (response: RemoteApiResponse) => {
                    try {
                        const data = JSON.parse(response.body);
                        resolve(data);
                    } catch (parseError) {
                        reject(`Failed to parse response: ${parseError}`);
                    }
                }
            );
        });
    }
}