import { AuraXClient } from "../dist/esm/index.js";
import "dotenv/config";

// --- Environment Variable Checks (with corrected log message) ---
if (!process.env.AURAX_API_KEY) {
  console.error("Missing AURAX_API_KEY environment variable.");
  process.exit(1);
}

if (!process.env.AURAX_KEY_ID) {
  // Corrected the variable name in the error message
  console.error("Missing AURAX_KEY_ID environment variable.");
  process.exit(1);
}

// --- Client Initialization ---
const client = new AuraXClient({
  apiKey: process.env.AURAX_API_KEY,
  keyId: process.env.AURAX_KEY_ID,
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
  const final = await client.pollTask({
    taskId,
    options: {
      intervalMs: 5000,
    },
  });

  console.log(final);
}

main().catch(console.error);
