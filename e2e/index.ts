import "dotenv/config";

async function main() {
  console.log("🚀 STARTING E2E TESTS...\n");

  console.log("--- 1. Running VTO Example ---");
  import("./vto.js");
  console.log("--- VTO Example Finished ---\n");

  console.log("--- 2. Running Image Generation Example ---");
  import("./image-generation.js");
  console.log("--- Image Generation Example Finished ---\n");

  console.log("--- 3. Running Product Description Example ---");
  import("./product-description.js");
  console.log("--- Product Description Example Finished ---\n");

  console.log("✅ All examples finished successfully.");
}

main().catch((err) => {
  console.error("❌ E2E TESTS FAILED:", err);
  process.exit(1);
});
