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
  type: string;
  cost: string;
  vat: string;
  price: string;
  stock: string;
  categoryId?: string;
};
