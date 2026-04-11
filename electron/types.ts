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
