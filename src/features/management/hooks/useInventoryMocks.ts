import { useEffect, useState } from "react";
import type {
  InventoryAuditDto,
  InventoryStockDto,
  SupplierDto,
} from "../dtos/inventory";

type UseInventoryMocksResult = {
  stockItems: InventoryStockDto[];
  auditItems: InventoryAuditDto[];
  suppliers: SupplierDto[];
  isLoading: boolean;
};

export function useInventoryMocks(): UseInventoryMocksResult {
  const [stockItems, setStockItems] = useState<InventoryStockDto[]>([]);
  const [auditItems, setAuditItems] = useState<InventoryAuditDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Placeholder loader: keep empty for now.
    // Later replace with real fetch functions.
    setStockItems([]);
    setAuditItems([]);
    setSuppliers([]);
    setIsLoading(false);
  }, []);

  return {
    stockItems,
    auditItems,
    suppliers,
    isLoading,
  };
}
