import { AuraXClient } from "../dist/esm/index.js";

const client = new AuraXClient({
  apiKey: process.env.AURAX_API_KEY!,
  keyId: process.env.AURAX_KEY_ID!,
  baseUrl: "http://localhost:4000",
});

async function main() {
  console.log("Requesting product description...");

  // In a real application, you would get this from a file upload
  // or another source. For this example, we create a dummy file.
  const dummyImageContent = Buffer.from("this is a fake image");
  const imageFile = new File([dummyImageContent], "dummy-garment.jpg", {
    type: "image/jpeg",
  });

  try {
    const description = await client.productDescription({
      image: imageFile,
      productType: "GARMENT",
    });

    console.log("Generated Product Description:");
    console.log(description);
  } catch (error) {
    console.error("Failed to get product description:", error);
  }
}

main().catch(console.error);
