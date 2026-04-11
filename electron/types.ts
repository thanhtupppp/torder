// NOTE: Product, AppApi, and CreateOrderPayload are intentionally duplicated
// from src/shared/types.ts. tsconfig.electron.json compiles only the electron/
// directory (CommonJS, rootDir=electron) and cannot import from src/.
// Keep in sync with src/shared/types.ts when these types change.

export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
};

export type OrderItem = {
  productId: string;
  quantity: number;
};

export type CreateOrderPayload = {
  items: OrderItem[];
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
