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

/**
 * A wrapper function that uses the streaming client but returns a Promise.
 * This lets you 'await' the final result while still seeing live updates.
 * @param {string} taskId
 * @returns {Promise<any>} A promise that resolves with the final task result.
 */
function getFinalTaskResultFromStream(taskId) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️  Starting to stream updates for task: ${taskId}`);

    const eventSource = client.streamTask(taskId, {
      // This function is called every time the task status changes.
      onMessage: (message) => {
        console.log(
          `   [UPDATE] Status: ${message.status ? message.status : "HEARTBEAT"}`,
        );

        // Check if the task has reached a terminal state
        if (message.status === "COMPLETED") {
          console.log("✅ Task completed successfully!");
          eventSource.close(); // IMPORTANT: Close the connection
          resolve(message); // Resolve the promise with the final message
        } else if (["FAILED", "CANCELLED"].includes(message.status)) {
          console.error(`❌ Task ended with status: ${message.status}`);
          eventSource.close(); // IMPORTANT: Close the connection
          reject(message); // Reject the promise
        }
      },

      // This function is called for keep-alive messages.
      onHeartbeat: (heartbeat) => {
        console.log(
          `   [HEARTBEAT] Connection is alive at ${new Date(heartbeat.timestamp).toLocaleTimeString()}`,
        );
      },

      // This function handles any connection errors.
      onError: (error) => {
        console.error("Stream connection error:", error);
        eventSource.close(); // Close connection on error
        reject(error);
      },
    });
  });
}

async function main() {
  try {
    // 1. Start the VTO task
    const { taskId } = await client.vto({
      personImage: "base64-person", // Replace with actual base64 data
      garmentImage: "base64-garment", // Replace with actual base64 data
      productType: "GARMENT",
      garmentStrength: 2,
    });

    // 2. Stream the result and wait for it to finish
    const finalResult = await getFinalTaskResultFromStream(taskId);

    // 3. Log the final output
    console.log("\n--- Final Task Output ---");
    console.log(JSON.stringify(finalResult.output, null, 2));
  } catch (error) {
    console.error("\n--- An error occurred during the process ---");
    console.error(error);
  }
}

main();
