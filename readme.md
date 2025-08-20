# AuraX SDK



<div align="center">

![npm version](https://img.shields.io/npm/v/aurax.svg) • [![CI/CD](https://github.com/Team-AuraX/aurax_sdk/actions/workflows/ci.yaml/badge.svg)](https://github.com/Team-AuraX/aurax_sdk/actions/workflows/ci.yaml) • [Website](https://aurax.co.in) • [Documentation](https://studio.aurax.co.in/developer/docs)

</div>

> 🚀 **AI-Powered Fashion Technology SDK** - Integrate virtual try-on, AI image generation, and smart product descriptions into your applications.

## ✨ Features

- **🎯 Virtual Try-On**: Realistic garment fitting using advanced computer vision
- **🎨 AI Image Generation**: Create high-quality product images from text descriptions
- **📝 Product Descriptions**: Generate compelling product descriptions from images
- **⚡ Real-time Streaming**: Live updates for long-running tasks
- **🔄 Flexible Polling**: Built-in polling utilities with timeout handling
- **🛡️ Type Safety**: Full TypeScript support with comprehensive type definitions
- **🚨 Error Handling**: Robust error handling with specific exception types
- **📦 ESM Ready**: Modern ES modules support for Node.js 18+

## 🚀 Quick Start

### Installation

```bash
npm install aurax
# or
yarn add aurax
# or
pnpm add aurax
```

### Basic Setup

```typescript
import { AuraXClient } from "aurax/dist/esm/index.js";

const client = new AuraXClient({
  apiKey: process.env.AURAX_API_KEY!,
  keyId: process.env.AURAX_KEY_ID!,
  baseUrl: "https://backend.aurax.co.in" // optional
});
```

### Environment Variables

Create a `.env` file in your project root:

```env
AURAX_API_KEY=your_api_key_here
AURAX_KEY_ID=your_key_id_here
```

## 📖 Usage Examples

### Virtual Try-On

Transform fashion e-commerce with realistic virtual try-on experiences:

```typescript
// Start a virtual try-on task
const { taskId } = await client.vto({
  personImage: personBase64, // base64 encoded person image
  garmentImage: garmentBase64, // base64 encoded garment image
  productType: "GARMENT",
  garmentStrength: 2, // 1-3, higher = more garment prominence
  maskBase64: null, // optional: custom mask for precise fitting
  prompt: null, // optional: text prompt for enhanced results
  runWithPrompt: false
});

// Stream real-time updates
const eventSource = client.streamTask(taskId, {
  onMessage: (message) => {
    console.log(`Status: ${message.status}`);
    if (message.status === 'COMPLETED') {
      console.log('Try-on result:', message.output);
      eventSource.close(); // Important: close the connection
    }
  },
  onHeartbeat: (data) => {
    console.log(`Connection alive at ${new Date(data.timestamp)}`);
  },
  onError: (error) => {
    console.error('Stream error:', error);
    eventSource.close();
  }
});
```

### AI Image Generation

Create stunning product images from text descriptions:

```typescript
// Generate a product image
const { taskId } = await client.imageGeneration({
  prompt: "A futuristic sneaker, neon blue and silver, studio lighting",
  productType: "FOOTWEAR",
  width: 1024,
  height: 1024,
  maskBase64: null // optional: for inpainting specific areas
});

// Poll for completion (alternative to streaming)
const result = await client.pollTask({
  taskId,
  options: {
    intervalMs: 2000, // check every 2 seconds
    timeoutMs: 300000 // 5 minute timeout
  }
});

if (result.status === 'COMPLETED') {
  console.log('Generated image URL:', result.output);

  // Download the generated image
  const imageBlob = await client.getImage(result.output.imageId);
  // Use the blob as needed (save to file, display in UI, etc.)
}
```

### Product Description Generation

Generate compelling product descriptions instantly:

```typescript
// This is a synchronous operation - returns immediately
const description = await client.productDescription({
  image: imageFile, // File or Blob object
  productType: "GARMENT"
});

console.log('Generated description:', description);
// Output: "This elegant cotton blend shirt features a classic collar design..."
```

### Advanced Usage with Error Handling

```typescript
import {
  AuthenticationError,
  BadRequestError,
  NotFoundError,
  TimeoutError,
  NetworkError
} from 'aurax';

try {
  const { taskId } = await client.vto({
    personImage: personBase64,
    garmentImage: garmentBase64,
    productType: "DRESS",
    garmentStrength: 3
  });

  const result = await client.pollTask({ taskId });

  if (result.status === 'COMPLETED') {
    // Success - process the result
    const imageBlob = await client.getImage(result.output.imageId);
    // Handle successful result
  } else if (result.status === 'FAILED') {
    console.error('Task failed:', result.errorMessages);
  }

} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API credentials - check your API key and key ID');
  } else if (error instanceof BadRequestError) {
    console.error('Invalid request parameters:', error.message);
  } else if (error instanceof TimeoutError) {
    console.error('Request timed out - try increasing timeout or check server status');
  } else if (error instanceof NetworkError) {
    console.error('Network connection failed - check your internet connection');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## 🎯 Supported Product Types

The SDK supports a wide range of fashion categories:

| Product Type | Description | Use Cases |
|-------------|-------------|-----------|
| `GARMENT` | General clothing items | T-shirts, blouses, shirts |
| `DRESS` | Dresses and gowns | Formal wear, casual dresses |
| `OUTFIT` | Complete outfit sets | Coordinated clothing sets |
| `FOOTWEAR` | Shoes and footwear | Sneakers, boots, heels |
| `BAG` | Bags and accessories | Handbags, backpacks |
| `JEWELLERY` | Jewelry items | Necklaces, rings, earrings |
| `EYEWEAR` | Glasses and sunglasses | Prescription glasses, shades |
| `BEAUTY` | Beauty and cosmetic products | Makeup, skincare |
| `OTHER` | Miscellaneous fashion items | Any other fashion products |

## 🛠️ API Reference

### Core Methods

#### `vto(request: VtoRequest): Promise<TaskResponse>`
Initiates a virtual try-on task.

**Parameters:**
- `personImage` (string): Base64 encoded person image
- `garmentImage` (string): Base64 encoded garment image
- `productType` (ProductType): Type of product being tried on
- `garmentStrength` (1|2|3): Garment prominence (1=subtle, 3=prominent)
- `maskBase64?` (string): Optional custom mask for precise fitting
- `prompt?` (string): Optional text prompt for enhanced results
- `runWithPrompt?` (boolean): Whether to use prompt enhancement

#### `imageGeneration(request: ImageGenerationRequest): Promise<TaskResponse>`
Generates product images from text descriptions.

**Parameters:**
- `prompt` (string): Text description of desired image
- `productType` (ProductType): Type of product to generate
- `width?` (number): Image width in pixels (default: 1024, max: 2048)
- `height?` (number): Image height in pixels (default: 1024, max: 2048)
- `maskBase64?` (string): Optional mask for inpainting

#### `productDescription(request: ProductDescriptionRequest): Promise<string>`
Generates product descriptions from images (synchronous).

**Parameters:**
- `image` (File | Blob): Image file to analyze
- `productType` (ProductType): Type of product in image

### Utility Methods

#### `getTask(taskId: string): Promise<TaskStatusResponse>`
Retrieves the current status of a task.

#### `streamTask(taskId: string, callbacks: StreamCallbacks): EventSource`
Streams real-time task updates via Server-Sent Events.

#### `pollTask({ taskId, options? }): Promise<TaskStatusResponse>`
Polls a task until completion with configurable intervals and timeout.

#### `getImage(imageId: string): Promise<Blob>`
Downloads an image as a Blob object.

### Types and Interfaces

```typescript
interface VtoRequest {
  personImage: string;
  garmentImage: string;
  productType: ProductType;
  garmentStrength: 1 | 2 | 3;
  maskBase64?: string | null;
  prompt?: string | null;
  runWithPrompt?: boolean;
}

interface TaskStatusResponse {
  id: string;
  status: 'IN_QUEUE' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  output?: any;
  errorMessages?: string;
}

interface StreamCallbacks {
  onMessage: (msg: StreamMessage) => void;
  onHeartbeat?: (data: HeartbeatData) => void;
  onError?: (err: any) => void;
}
```

## 🚨 Error Handling

The SDK provides specific error types for different failure scenarios:

- **`AuthenticationError`**: Invalid API credentials
- **`BadRequestError`**: Invalid request parameters
- **`NotFoundError`**: Resource not found (task, image, etc.)
- **`TimeoutError`**: Request timeout (from polling utilities)
- **`NetworkError`**: Network connectivity issues
- **`APIError`**: General API errors (5xx responses, etc.)

## 🔧 Configuration

### Client Options

```typescript
interface AuraXOptions {
  apiKey: string;          // Your AuraX API key
  keyId: string;           // Your AuraX key ID
  baseUrl?: string;        // API base URL (default: https://backend.aurax.co.in)
}
```

### Polling Options

```typescript
interface PollOptions {
  intervalMs?: number;     // Polling interval in milliseconds (default: 2000)
  timeoutMs?: number;      // Total timeout in milliseconds (default: 300000)
}
```

## 🌟 Advanced Examples

### Complete Virtual Try-On Workflow

```typescript
import fs from 'fs';
import { AuraXClient } from "aurax/dist/esm/index.js";

async function completeVtoWorkflow() {
  const client = new AuraXClient({
    apiKey: process.env.AURAX_API_KEY!,
    keyId: process.env.AURAX_KEY_ID!
  });

  try {
    // Convert images to base64
    const personImage = fs.readFileSync('person.jpg', 'base64');
    const garmentImage = fs.readFileSync('garment.jpg', 'base64');

    // Start VTO task
    const { taskId } = await client.vto({
      personImage,
      garmentImage,
      productType: "DRESS",
      garmentStrength: 2
    });

    console.log(`🚀 VTO task started: ${taskId}`);

    // Stream updates with progress tracking
    return new Promise((resolve, reject) => {
      const eventSource = client.streamTask(taskId, {
        onMessage: async (message) => {
          console.log(`📊 Status: ${message.status}`);

          if (message.status === 'COMPLETED') {
            console.log('✅ VTO completed successfully!');

            // Download the result image
            const imageBlob = await client.getImage(message.output.imageId);

            // Save to file
            const arrayBuffer = await imageBlob.arrayBuffer();
            fs.writeFileSync('vto_result.jpg', Buffer.from(arrayBuffer));

            console.log('💾 Result saved as vto_result.jpg');
            eventSource.close();
            resolve(message.output);

          } else if (message.status === 'FAILED') {
            console.error('❌ VTO failed:', message.errorMessage);
            eventSource.close();
            reject(new Error(message.errorMessage?.join(', ') || 'Task failed'));
          }
        },

        onHeartbeat: (data) => {
          console.log(`💓 Heartbeat: ${new Date(data.timestamp).toLocaleTimeString()}`);
        },

        onError: (error) => {
          console.error('🚨 Stream error:', error);
          eventSource.close();
          reject(error);
        }
      });
    });

  } catch (error) {
    console.error('💥 Workflow failed:', error);
    throw error;
  }
}

// Run the workflow
completeVtoWorkflow()
  .then(() => console.log('🎉 Workflow completed!'))
  .catch(console.error);
```

### Batch Image Generation

```typescript
async function batchImageGeneration(prompts: string[]) {
  const client = new AuraXClient({
    apiKey: process.env.AURAX_API_KEY!,
    keyId: process.env.AURAX_KEY_ID!
  });

  const tasks = await Promise.all(
    prompts.map(prompt =>
      client.imageGeneration({
        prompt,
        productType: "GARMENT",
        width: 512,
        height: 512
      })
    )
  );

  console.log(`🎨 Started ${tasks.length} image generation tasks`);

  // Poll all tasks concurrently
  const results = await Promise.all(
    tasks.map(({ taskId }) =>
      client.pollTask({
        taskId,
        options: { intervalMs: 3000 }
      })
    )
  );

  // Download successful images
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'COMPLETED') {
      const blob = await client.getImage(result.output.imageId);
      const buffer = Buffer.from(await blob.arrayBuffer());
      fs.writeFileSync(`generated_${i}.jpg`, buffer);
      console.log(`✅ Generated image ${i} saved`);
    }
  }
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Team-AuraX/aurax_sdk
cd aurax_sdk

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run examples
pnpm test:e2e  # some error will come rn, so then run:
node dist-test/index.js # change backend url. im running it locally, but you need to run it in prod :)
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 **Documentation**: [https://studio.aurax.co.in/developer/docs/sdk](https://studio.aurax.co.in/developer/docs/sdk)
- 📧 **Email Support**: himanshu@aurax.co.in
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Team-AuraX/aurax_sdk/issues)

---

<div align="center">

**Made with ❤️ by the AuraX Team**

</div>
