export type InventoryTab =
  | "stock"
  | "logs"
  | "audit"
  | "imports"
  | "exports"
  | "suppliers"
  | "transfer";

export type InventoryStockDto = {
  id: string;
  code: string;
  name: string;
  quantity: number;
  cost: number;
  price: number;
  status: string;
};

export type InventoryAuditDto = {
  id: string;
  code: string;
  status: string;
  createdAt: string;
};

export type SupplierDto = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};
