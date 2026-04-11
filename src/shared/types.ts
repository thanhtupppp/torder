/**
 * Shared domain types used by the renderer (src/).
 *
 * NOTE: electron/types.ts intentionally duplicates Product, AppApi, and
 * CreateOrderPayload because tsconfig.electron.json compiles only the
 * electron/ directory (CommonJS, rootDir=electron) and cannot import from
 * src/. Keep both files in sync when these types change.
 */

export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
};

export type CreateOrderPayload = {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  note?: string;
};

export type AppApi = {
  product: {
    list: () => Promise<Product[]>;
  };
  order: {
    create: (payload: CreateOrderPayload) => Promise<{ orderId: number }>;
  };
};
