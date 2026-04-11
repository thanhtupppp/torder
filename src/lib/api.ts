import type { AppApi, CreateOrderPayload, Product } from "../types";

const MOCK_PRODUCTS: Product[] = [
  { id: "cf001", name: "Cà phê sữa", price: 29000, category: "Đồ uống" },
  { id: "cf002", name: "Bạc xỉu", price: 32000, category: "Đồ uống" },
  { id: "fd001", name: "Bánh mì trứng", price: 25000, category: "Món ăn" },
  { id: "fd002", name: "Mì xào bò", price: 55000, category: "Món ăn" },
];

const browserFallbackApi: AppApi = {
  product: {
    async list() {
      return MOCK_PRODUCTS;
    },
  },
  order: {
    async create(payload: CreateOrderPayload) {
      void payload;
      return { orderId: Date.now() };
    },
  },
};

export function getAppApi(): AppApi {
  if (typeof window !== "undefined" && window.appApi) {
    return window.appApi;
  }

  return browserFallbackApi;
}
