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
  maskBase64?: string | null;
  prompt?: string | null;
  runWithPrompt?: boolean;
}

export interface ImageGenerationRequest {
  prompt: string;
  productType: ProductType;
  maskBase64?: string | null;
  width?: number; // default 1024, max 2048
  height?: number; // default 1024, max 2048
}

export interface ProductDescriptionRequest {
  image: File | Blob;
  productType: ProductType;
}

export interface TaskResponse {
  taskId: string;
}

export type TaskStatus =
  | "IN_QUEUE"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | string;

export interface TaskStatusResponse {
  id: string;
  status: TaskStatus;
  output?: string;
  errorMessages?: string;
}

export interface AuraXOptions {
  apiKey: string;
  keyId: string;
  baseUrl?: string; // default "https://api.aurax.ai"
}

export interface StreamMessage {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  output: any | null;
  errorMessage: string[] | null;
}

export interface HeartbeatData {
  timestamp: number;
}

export interface StreamCallbacks {
  /** Handles new task status updates. */
  onMessage: (msg: StreamMessage) => void;
  /** Handles heartbeat events to indicate the connection is alive. */
  onHeartbeat?: (data: HeartbeatData) => void;
  /** Handles any connection or parsing errors. */
  onError?: (err: any) => void;
}
