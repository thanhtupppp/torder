// ── Shared ────────────────────────────────────────────────────────────────────

export type InventoryTab =
  | "stock"
  | "logs"
  | "audit"
  | "imports"
  | "exports"
  | "suppliers"
  | "transfer";

// ── DTOs ──────────────────────────────────────────────────────────────────────

export type InventoryStockDto = {
  id: string;
  code: string;
  name: string;
  quantity: number;
  cost: number;
  price: number;
  // TODO: narrow to union when all statuses are confirmed
  status: "active" | "inactive" | "out_of_stock" | string;
};

export type InventoryAuditDto = {
  id: string;
  code: string;
  createdAt: string;
  balancedAt?: string;
  status: "draft" | "balanced" | "cancelled" | string;
  relativeQty: number;
  totalActual: number;
  totalAudit: number;
  valueDiff: number;
  qtyIncrease: number;
  qtyDecrease: number;
  note?: string;
};

export type SupplierDto = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};
