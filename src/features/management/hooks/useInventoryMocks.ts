import { useState } from "react";
import type {
  InventoryAuditDto,
  InventoryStockDto,
  SupplierDto,
} from "../dtos/inventory";

type InventoryMocksState = {
  stockItems: InventoryStockDto[];
  auditItems: InventoryAuditDto[];
  suppliers: SupplierDto[];
  isLoading: boolean;
};

// Khi có fetch thật: thay bằng async function + setState một lần duy nhất
const INITIAL_STATE: InventoryMocksState = {
  stockItems: [],
  auditItems: [],
  suppliers: [],
  isLoading: false,
};

export function useInventoryMocks(): InventoryMocksState {
  const [state] = useState<InventoryMocksState>(INITIAL_STATE);
  return state;
}
