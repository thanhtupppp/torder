import type { ProductType } from "../constants/catalog";

export type CategoryDto = {
  id: string;
  name: string;
  productCount: number;
};

export type ProductDto = {
  id: string;
  code: string;
  name: string;
  barcode: string;
  unit: string;
  type: ProductType; // ✅ reuse union type
  cost: number; // ✅ số — không phải string
  vat: number; // phần trăm, VD: 10 = 10%
  price: number; // ✅ số
  stock: number; // ✅ số
  categoryId?: string;
};
