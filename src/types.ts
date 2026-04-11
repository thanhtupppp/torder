export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
  note?: string;
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
