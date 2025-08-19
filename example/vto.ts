import { AuraXClient } from "../dist/esm/index.js";
import "dotenv/config";

if (!process.env.AURAX_API_KEY) {
  console.error(
    "Missing AURAX_API_KEY environment variable, ",
    process.env.AURAX_API_KEY,
  );
  process.exit(1);
}

if (!process.env.AURAX_KEY_ID) {
  console.error(
    "Missing AURAX_KEY_ID environment variable, ",
    process.env.AURAX_API_KEY,
  );
  process.exit(1);
}

const client = new AuraXClient({
  apiKey: process.env.AURAX_API_KEY || "aurax_4WD91WMnbjL2pVKxZweHd8z5X2vqgdO_",
  keyId: process.env.AURAX_KEY_ID || "21f4aa29-be34-4cf9-882c-6187be05b266",
  baseUrl: "http://localhost:4000",
});

async function main() {
  const { taskId } = await client.vto({
    personImage: "base64-person",
    garmentImage: "base64-garment",
    productType: "GARMENT",
    garmentStrength: 2,
  });

  console.log(taskId);

  const final = await client.pollTask(taskId);
  console.log(final);
}

main();
