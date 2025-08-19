import { AuraXClient } from "../dist/esm/index.js";

const client = new AuraXClient({
  apiKey: process.env.AURAX_API_KEY!,
  keyId: process.env.AURAX_KEY_ID!,
  baseUrl: "http://localhost:4000",
});

async function main() {
  console.log("Requesting image generation...");
  const { taskId } = await client.imageGeneration({
    prompt:
      "A futuristic sneaker, neon blue and silver, on a white background.",
    productType: "FOOTWEAR",
    width: 1024,
    height: 1024,
  });
  console.log(`Task created: ${taskId}`);

  console.log("Polling for result...");
  const final = await client.pollTask(taskId);

  if (final.status === "succeeded" && final.result?.imageId) {
    console.log("Image generation succeeded!");
    console.log("Result:", final.result);
    // In a real app, you would now use client.getImage(final.result.imageId)
    // to fetch the image blob.
  } else {
    console.error("Task failed or finished without an imageId.");
    console.error("Final status:", final);
  }
}

main().catch(console.error);
