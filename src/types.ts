import type { Product } from "./shared/types";

// Re-export shared types — source of truth is src/shared/types.ts
export type { Product, CreateOrderPayload, AppApi } from "./shared/types";

// Renderer-specific types
export type CartItem = {
  product: Product;
  quantity: number;
  note?: string;
};
