import { AuraXClient, StreamMessage } from "../dist/esm/index.js";
const client = new AuraXClient({
  apiKey: process.env.AURAX_API_KEY!,
  keyId: process.env.AURAX_KEY_ID!,
  baseUrl: "http://localhost:4000",
});

async function main() {
  console.log("Starting a task to demonstrate streaming...");
  const { taskId } = await client.vto({
    personImage: "base64-person-for-streaming",
    garmentImage: "base64-garment-for-streaming",
    productType: "GARMENT",
    garmentStrength: 1,
  });
  console.log(`Task created: ${taskId}`);
  console.log("\n--- Starting SSE Stream ---");
  const stream = client.streamTask(
    taskId,
    (message: StreamMessage) => {
      console.log(`[${message.type?.toUpperCase()}]`, message); // Close the connection once the task is done
      if (["succeeded", "failed"].includes(message.status as string)) {
        console.log("\n--- Stream Closed ---");
        stream.close();
      }
    },
    (error: any) => {
      console.error("SSE Error:", error);
      stream.close();
    },
  ); // Keep the script running until the stream is closed.

  // In a real app, you might handle this differently.
  process.on("beforeExit", () => {
    if (stream.readyState !== 2) {
      console.log("\nClosing stream before exit...");
      stream.close();
    }
  });
}

main().catch(console.error);
