import type { EventSourceInit } from "eventsource";
import { EventSource } from "eventsource";
import {
  AuraXOptions,
  VtoRequest,
  ImageGenerationRequest,
  ProductDescriptionRequest,
  TaskResponse,
  TaskStatusResponse,
  StreamMessage,
  StreamCallbacks,
  HeartbeatData,
} from "./types.js";

/**
 * ESM-only client for Node 18+. Uses global fetch/FormData/Blob.
 */
export class AuraXClient {
  private baseUrl: string;
  private apiKey: string;
  private keyId: string;

  constructor(options: AuraXOptions) {
    this.baseUrl = options.baseUrl ?? "https://backend.aurax.co.in";
    this.apiKey = options.apiKey;
    this.keyId = options.keyId;

    if (!this.apiKey || !this.keyId) {
      throw new Error("API key and key ID are required");
    }
  }

  private get jsonHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey,
      "x-key-id": this.keyId,
    };
  }

  private get authHeaders(): HeadersInit {
    return {
      "x-api-key": this.apiKey,
      "x-key-id": this.keyId,
    };
  }

  /**
   * Virtual Try-On (async)
   *
   * @param personImage: base64 encoded person image
   * @param garmentImage: base64 encoded garment image
   * @param productType: product type
   * @param garmentStrength(= 2): garment strength
   * @param maskBase64(= null): base64 encoded mask image
   * @param prompt(= null): prompt for image generation
   * @param runWithPrompt(= false): run with prompt
   *
   * @returns { taskId }
   */
  async vto({
    personImage,
    garmentImage,
    productType,
    garmentStrength = 2,
    maskBase64 = null,
    prompt = null,
    runWithPrompt = false,
  }: VtoRequest): Promise<TaskResponse> {
    const payload: VtoRequest = {
      personImage,
      garmentImage,
      productType,
      garmentStrength,
      ...(maskBase64 && { maskBase64 }),
      ...(prompt && { prompt }),
      ...(runWithPrompt && { runWithPrompt }),
    };

    const res = await fetch(`${this.baseUrl}/api/ai/vto`, {
      method: "POST",
      headers: this.jsonHeaders,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  /**
   * Image Generation (async)
   *
   * @param prompt: prompt for image generation
   * @param productType: product type
   * @param maskBase64(= null): base64 encoded mask image
   * @param width(= 1024): width of the generated image
   * @param height(= 1024): height of the generated image
   *
   * @returns { taskId }
   * */
  async imageGeneration({
    prompt,
    productType,
    maskBase64 = null,
    width = 1024,
    height = 1024,
  }: ImageGenerationRequest): Promise<TaskResponse> {
    const payload = {
      prompt,
      productType,
      // Conditionally add the maskBase64 property
      ...(maskBase64 && { maskBase64 }),
      width,
      height,
    };

    const res = await fetch(`${this.baseUrl}/api/ai/image-generation`, {
      method: "POST",
      headers: this.jsonHeaders,
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  /**
   * Product Description (sync)
   *
   * @param image: image file
   * @param productType: product type
   *
   * @returns text of product description
   * */
  async productDescription({
    image,
    productType,
  }: ProductDescriptionRequest): Promise<string> {
    const form = new FormData();
    form.append("image", image);
    form.append("productType", productType);

    const res = await fetch(`${this.baseUrl}/api/ai/product-description`, {
      method: "POST",
      headers: this.authHeaders, // FormData sets its own Content-Type
      body: form,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.text();
  }

  /**
   * Get Task Status (sync)
   *
   * @param taskId - The ID of the task to get status for.
   *
   * @returns The status of the task.
   */
  async getTask(taskId: string): Promise<TaskStatusResponse> {
    const res = await fetch(
      `${this.baseUrl}/api/ai/task/${encodeURIComponent(taskId)}`,
      {
        method: "GET",
        headers: this.authHeaders,
      },
    );
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  /**
   * Stream Task Status (SSE).
   * @important Remember to call `es.close()` when you're done.
   *
   * @param taskId - The ID of the task to stream.
   * @param callbacks - Callbacks for handling messages and errors.
   *
   * @returns The raw EventSource object.
   */
  streamTask(taskId: string, callbacks: StreamCallbacks): EventSource {
    const url = `${this.baseUrl}/api/ai/task/${encodeURIComponent(
      taskId,
    )}/stream`;

    const customFetch: typeof fetch = (url, init) => {
      const headers = new Headers(init?.headers);
      for (const [key, value] of Object.entries(this.authHeaders)) {
        headers.set(key, value as string);
      }
      return fetch(url, { ...init, headers });
    };

    const options: EventSourceInit = {
      fetch: customFetch,
    };

    const es = new EventSource(url, options);

    es.addEventListener("message", (event: MessageEvent) => {
      try {
        const parsedData: StreamMessage = JSON.parse(event.data);
        callbacks.onMessage(parsedData);
      } catch (e) {
        if (callbacks.onError) {
          callbacks.onError(
            new Error(`Failed to parse SSE message data: ${event.data}`),
          );
        }
      }
    });

    es.addEventListener("heartbeat", (event: MessageEvent) => {
      if (callbacks.onHeartbeat) {
        try {
          const parsedData: HeartbeatData = JSON.parse(event.data);
          callbacks.onHeartbeat(parsedData);
        } catch (e) {
          if (callbacks.onError) {
            callbacks.onError(
              new Error(`Failed to parse heartbeat data: ${event.data}`),
            );
          }
        }
      }
    });

    es.onerror = (err: any) => {
      if (callbacks.onError) {
        callbacks.onError(err);
      }
      es.close();
    };

    return es;
  }

  /**
   * Get Image
   *
   * @param imageId - The ID of the image to retrieve.
   *
   * @returns Blob
   */
  async getImage(imageId: string): Promise<Blob> {
    const res = await fetch(
      `${this.baseUrl}/images/${encodeURIComponent(imageId)}`,
      {
        method: "GET",
        headers: this.authHeaders,
      },
    );
    if (!res.ok) throw new Error(await res.text());
    return res.blob();
  }

  /**
   * @Helper: poll a task until it reaches a terminal state.
   * Resolves with final TaskStatusResponse or rejects on timeout.
   *
   * @param taskId - The ID of the task to poll.
   * @param options - Options for polling.
   * @type options: intervalMs ( 2000 ) - The interval in milliseconds between polls.
   * @type options: timeoutMs ( 5 * 60 * 1000 ) - The timeout in milliseconds.
   *
   * @returns Promise<TaskStatusResponse>
   */
  async pollTask({
    taskId,
    options: {
      intervalMs = 2000,
      timeoutMs = 5 * 60 * 1000, // 5 min
    } = {},
  }: {
    taskId: string;
    options?: {
      intervalMs?: number;
      timeoutMs?: number;
    };
  }): Promise<TaskStatusResponse> {
    const start = Date.now();
    while (true) {
      const status = await this.getTask(taskId);
      console.log(`Task (${taskId}) Status:`, status.status);
      if (status.status === "COMPLETED" || status.status === "FAILED") {
        return status;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
      if (Date.now() - start > timeoutMs) throw new Error("pollTask: timeout");
    }
  }
}
