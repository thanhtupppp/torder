import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { AuditView } from "./components/AuditView";
import { InventoryGenericView } from "./components/InventoryShared";
import { SupplierView } from "./components/SupplierView";
import type { InventoryTab } from "./dtos/inventory";
import { useInventoryMocks } from "./hooks/useInventoryMocks";
import { useEffect } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const INVENTORY_TABS: Array<{ key: InventoryTab; label: string }> = [
  { key: "stock", label: "Kho hàng" },
  { key: "logs", label: "Nhật ký kho" },
  { key: "audit", label: "Kiểm kho" },
  { key: "imports", label: "Số nhập" },
  { key: "exports", label: "Số xuất" },
  { key: "suppliers", label: "Nhà CC" },
  { key: "transfer", label: "Chuyển kho" },
];

// ✅ Derive từ INVENTORY_TABS — không duplicate
const TAB_SET = new Set(INVENTORY_TABS.map((t) => t.key));

const EMPTY_COLUMNS_BY_TAB: Record<InventoryTab, string[]> = {
  stock: [
    "Mã hàng",
    "Tên sản phẩm",
    "Tồn kho",
    "Giá vốn",
    "Giá bán",
    "Tổng giá vốn",
    "Tổng giá bán",
    "Trạng thái",
  ],
  logs: [
    "Mã SP",
    "Tên sản phẩm",
    "Mã phiếu",
    "Giá trị",
    "Số lượng",
    "Tồn kho sau thay đổi",
    "Thời gian",
  ],
  audit: [
    "Mã",
    "Thời gian",
    "Trạng thái",
    "Ngày cân bằng",
    "SL tương đối",
    "Tổng thực tế",
    "Tổng kiểm kê",
    "Tổng giá trị lệch",
    "SL tăng",
    "SL giảm",
    "Ghi chú",
  ],
  imports: [
    "Mã",
    "Ngày nhập",
    "Ngày tạo",
    "Trạng thái",
    "Tổng giá trị",
    "Đã trả",
    "Công nợ",
    "Nhà cung cấp",
  ],
  exports: [
    "Mã",
    "Thời gian",
    "Trạng thái",
    "Tổng giá trị",
    "Lý do xuất",
    "Ghi chú",
  ],
  suppliers: [
    "Tên NCC",
    "Số điện thoại",
    "Email",
    "Nợ cần trả",
    "Tổng nhập",
    "Số lượng đơn nhập",
  ],
  transfer: [
    "Mã phiếu",
    "Kho xuất",
    "Kho nhập",
    "Trạng thái",
    "Tổng số lượng",
    "Thời gian",
  ],
};

// ── Screen ────────────────────────────────────────────────────────────────────

export function InventoryScreen() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab: InventoryTab = useMemo(() => {
    const param = searchParams.get("tab");
    return param && TAB_SET.has(param as InventoryTab)
      ? (param as InventoryTab)
      : "stock";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chỉ tính 1 lần khi mount

  const [activeTab, setActiveTab] = useState<InventoryTab>(initialTab);
  const { stockItems, auditItems, suppliers } = useInventoryMocks();

  const currentColumns = useMemo(
    () => EMPTY_COLUMNS_BY_TAB[activeTab],
    [activeTab],
  );

  // ✅ Lookup thay cho 7 ternary
  const TAB_CONTENT = useMemo<Record<InventoryTab, ReactNode>>(
    () => ({
      stock: <InventoryGenericView title="Kho hàng" columns={currentColumns} />,
      audit: <AuditView title="Kiểm kho" columns={currentColumns} />,
      imports: <AuditView title="Số nhập" columns={currentColumns} showAction />,
      exports: <AuditView title="Số xuất" columns={currentColumns} showAction />,
      suppliers: <SupplierView columns={currentColumns} />,
      logs: (
        <InventoryGenericView title="Nhật ký kho" columns={currentColumns} />
      ),
      transfer: (
        <InventoryGenericView title="Chuyển kho" columns={currentColumns} />
      ),
    }),
    [currentColumns],
  );

  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    if (activeTab !== "stock") {
      next.set("tab", activeTab);
    } else {
      next.delete("tab");
    }

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  return (
    <div className="inventory-page">
      <header className="inventory-tabs">
        {INVENTORY_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`inventory-tab ${activeTab === tab.key ? "active" : ""}`}
            aria-current={activeTab === tab.key ? "page" : undefined}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </header>

      {TAB_CONTENT[activeTab]}

      <div className="inventory-data-trace" aria-hidden>
        {stockItems.length + auditItems.length + suppliers.length}
      </div>
    </div>
  );
}
