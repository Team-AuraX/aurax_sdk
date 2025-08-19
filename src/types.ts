export type ProductType =
  | "GARMENT"
  | "DRESS"
  | "OUTFIT"
  | "FOOTWEAR"
  | "BAG"
  | "JEWELLERY"
  | "EYEWEAR"
  | "BEAUTY"
  | "OTHER";

export interface VtoRequest {
  personImage: string; // base64
  garmentImage: string; // base64
  productType: ProductType;
  garmentStrength: 1 | 2 | 3;
  maskBase64?: string;
  prompt?: string;
  runWithPrompt?: boolean;
}

export interface ImageGenerationRequest {
  prompt: string;
  productType: ProductType;
  maskBase64?: string;
  width?: number; // default 1024, max 2048
  height?: number; // default 1024, max 2048
}

export interface ProductDescriptionRequest {
  image: File | Blob;
  productType: ProductType;
}

export interface TaskResponse {
  taskId: string;
  status?: string;
  resultUrl?: string;
  [k: string]: unknown;
}

export type TaskStatus =
  | "queued"
  | "processing"
  | "succeeded"
  | "failed"
  | string;

export interface TaskStatusResponse {
  taskId: string;
  status: TaskStatus;
  result?: any;
  error?: string;
  [k: string]: unknown;
}

export interface AuraXOptions {
  apiKey: string;
  keyId: string;
  baseUrl?: string; // default "https://api.aurax.ai"
}

export interface StreamMessage {
  type: "progress" | "status" | "result" | "error" | string;
  data?: unknown;
  status?: TaskStatus;
  [k: string]: unknown;
}

export interface SSEMessageEvent {
  data: string;
  lastEventId?: string;
}
