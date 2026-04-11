import { InventoryGenericView } from "./InventoryShared";

type StockViewProps = {
  columns: string[];
};

export function StockView({ columns }: StockViewProps) {
  return <InventoryGenericView title="Kho hàng" columns={columns} />;
}
