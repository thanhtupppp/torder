import { InventoryGenericView } from "./InventoryShared";

type AuditViewProps = {
  title: string;
  columns: string[];
  /** Show "Tạo mới" action button — pass for imports/exports tabs. */
  showAction?: boolean;
};

export function AuditView({ title, columns, showAction }: AuditViewProps) {
  return (
    <InventoryGenericView
      title={title}
      showLeftFilter
      columns={columns}
      actionLabel={showAction ? "Tạo mới" : undefined}
      filterSections={[
        { title: "Thời gian", options: ["Tuần này", "Tháng này"] },
        {
          title: "Trạng thái",
          options: ["Tất cả", "Hoàn thành", "Đang xử lý"],
        },
        { title: "Người tạo", options: ["Tất cả"] },
      ]}
    />
  );
}
