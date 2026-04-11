import { InventoryGenericView } from "./InventoryShared";

type AuditViewProps = {
  title: string;
  columns: string[];
};

export function AuditView({ title, columns }: AuditViewProps) {
  return (
    <InventoryGenericView
      title={title}
      showLeftFilter
      columns={columns}
      actionLabel={
        title === "Số nhập" || title === "Số xuất" ? "Tạo mới" : undefined
      }
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
