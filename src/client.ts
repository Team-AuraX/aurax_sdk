import type { EventSourceInit } from "eventsource";
import {
  AuraXOptions,
  VtoRequest,
  ImageGenerationRequest,
  ProductDescriptionRequest,
  TaskResponse,
  TaskStatusResponse,
  StreamMessage,
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

  /** 1) Virtual Try-On (async) -> returns { taskId } */
  async vto(body: VtoRequest): Promise<TaskResponse> {
    const res = await fetch(`${this.baseUrl}/api/ai/vto`, {
      method: "POST",
      headers: this.jsonHeaders,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  /** 2) Image Generation (async) -> returns { taskId } */
  async imageGeneration(body: ImageGenerationRequest): Promise<TaskResponse> {
    const res = await fetch(`${this.baseUrl}/api/ai/image-generation`, {
      method: "POST",
      headers: this.jsonHeaders,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  /** 3) Product Description (sync) -> returns text */
  async productDescription(req: ProductDescriptionRequest): Promise<string> {
    const form = new FormData();
    form.append("image", req.image);
    form.append("productType", req.productType);

    const res = await fetch(`${this.baseUrl}/api/ai/product-description`, {
      method: "POST",
      headers: this.authHeaders, // FormData sets its own Content-Type
      body: form,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.text();
  }

  /** 4) Get Task Status (sync) */
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
   * 5) Stream Task Status (SSE). Remember to call `es.close()` when done.
   * Returns the raw EventSource (from `eventsource` package).
   */
  streamTask(
    taskId: string,
    onMessage: (msg: StreamMessage) => void,
    onError?: (err: any) => void,
  ): EventSource {
    const url = `${this.baseUrl}/api/ai/task/${encodeURIComponent(
      taskId,
    )}/stream`;

    // Create a custom fetch function to inject headers.
    const customFetch: typeof fetch = (url, init) => {
      const headers = new Headers(init?.headers);
      for (const [key, value] of Object.entries(this.authHeaders)) {
        headers.set(key, value as string);
      }
      return fetch(url, { ...init, headers });
    };

    // Pass the custom fetch function in the options.
    const options: EventSourceInit = {
      fetch: customFetch,
    };

    const es = new EventSource(url, options);

    es.addEventListener("message", (event: any) => {
      try {
        const parsedData: StreamMessage = JSON.parse(event.data);
        onMessage(parsedData);
      } catch (e) {
        if (onError) {
          onError(new Error(`Failed to parse SSE message data: ${event.data}`));
        }
      }
    });

    es.onerror = (err: any) => {
      if (onError) onError(err);
    };

    return es;
  }

  /** 6) Get Image -> returns Blob */
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
   * Helper: poll a task until it reaches a terminal state.
   * Resolves with final TaskStatusResponse or rejects on timeout.
   */
  async pollTask(
    taskId: string,
    {
      intervalMs = 2000,
      timeoutMs = 5 * 60 * 1000, // 5 min
      isTerminal = (s: string) => ["succeeded", "failed"].includes(s),
    }: {
      intervalMs?: number;
      timeoutMs?: number;
      isTerminal?: (status: string) => boolean;
    } = {},
  ): Promise<TaskStatusResponse> {
    const start = Date.now();
    while (true) {
      const status = await this.getTask(taskId);
      if (status.status && isTerminal(status.status)) return status;
      if (Date.now() - start > timeoutMs) throw new Error("pollTask: timeout");
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
}
