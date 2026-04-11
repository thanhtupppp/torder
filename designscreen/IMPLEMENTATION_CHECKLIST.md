# Mapping: Folder thiết kế -> Route -> Component checklist

Mục tiêu: triển khai màn hình theo đúng mẫu `designscreen/` và giữ đồng nhất style system trong `src/styles`.

## 0) Nguyên tắc triển khai chung

- Reuse primitives trong `src/styles/components/*` trước khi tạo class mới.
- Mỗi màn hình phải đi theo skeleton:
  - `AppHeader`
  - vùng `toolbar/search/filter`
  - `card/panel/list/table/form` theo module
- Không hardcode màu/spacing/motion; dùng token/theme.

---

## 1) Mapping theo module hiện tại (khớp route đang có)

| Folder thiết kế            | Route hiện tại      | Feature file đề xuất                         | Components cần build                                                                               |
| -------------------------- | ------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `designscreen/sales`       | `/`                 | `src/features/sales/SalesScreen.tsx`         | `SalesToolbar`, `CategoryTabs`, `ProductGrid`, `ProductCard`, `OrderPanel`, `OrderSummary`         |
| `designscreen/quản lý bàn` | `/tables`           | `src/features/tables/TablesScreen.tsx`       | `TableFilterBar`, `TableStatusLegend`, `TableGrid`, `TableCard`, `TableActionSheet`                |
| `designscreen/sản phẩm`    | `/catalog`          | `src/features/catalog/CatalogScreen.tsx`     | `CatalogToolbar`, `CatalogTabs`, `ProductTable`, `ProductFormModal`, `CategoryTree`                |
| `designscreen/hoá đơn`     | `/orders`           | `src/features/orders/OrdersScreen.tsx`       | `OrderFilterBar`, `OrderTable`, `OrderDetailDrawer`, `PaymentStatusChip`                           |
| `designscreen/kho hàng`    | `/inventory`        | `src/features/inventory/InventoryScreen.tsx` | `InventoryToolbar`, `StockTable`, `StockAdjustmentModal`, `ImportExportPanel`                      |
| `designscreen/báo cáo`     | `/reports`          | `src/features/reports/ReportsScreen.tsx`     | `ReportFilterBar`, `KpiCards`, `ChartPanel`, `TopProductsTable`, `ExportActions`                   |
| `designscreen/thu chi`     | `/promotions` (tạm) | `src/features/finance/FinanceScreen.tsx`     | `FinanceTabs`, `IncomeExpenseTable`, `CashbookPanel`, `TransactionForm`                            |
| `designscreen/cài đặt`     | `/settings`         | `src/features/settings/SettingsScreen.tsx`   | `SettingsNav`, `SettingsSection`, `StoreConfigForm`, `PrinterConfigPanel`, `UsersPermissionsTable` |

> Ghi chú: Route `/promotions` hiện đang dùng key `PROMOTIONS`, nhưng theo bộ design thì nội dung gần với `thu chi`. Có thể đổi tên module/key ở Phase 2.

---

## 2) Mapping mở rộng theo bộ design (chưa có route trong menu hiện tại)

| Folder thiết kế           | Route đề xuất (Phase 2) | Feature file đề xuất                         | Components cần build                                                           |
| ------------------------- | ----------------------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| `designscreen/khách hàng` | `/customers`            | `src/features/customers/CustomersScreen.tsx` | `CustomerToolbar`, `CustomerTable`, `CustomerDetailPanel`, `CustomerFormModal` |
| `designscreen/nhân viên`  | `/staff`                | `src/features/staff/StaffScreen.tsx`         | `StaffToolbar`, `StaffTable`, `ShiftCalendar`, `RolePermissionPanel`           |

---

## 3) Checklist implementation theo tuần tự (khuyên làm)

## Phase A — Core operations

- [x] A1. `/tables` (quản lý bàn)
- [ ] A2. `/orders` (hoá đơn)
- [ ] A3. `/catalog` (sản phẩm)
- [ ] A4. `/inventory` (kho hàng)

## Phase B — Management + analytics

- [ ] B1. `/reports` (báo cáo)
- [ ] B2. `/settings` (cài đặt)
- [x] B3. `/finance` (thu chi) - Thay thế cho /promotions tạm

## Phase C — Route expansion

- [x] C1. Thêm menu key + route `/customers`
- [ ] C2. Thêm menu key + route `/staff`
- [ ] C3. Quyết định giữ hay đổi `PROMOTIONS` thành `FINANCE`

---

## 4) Checklist kỹ thuật cho mỗi màn hình

- [ ] Tạo `src/features/<module>/<Module>Screen.tsx`
- [ ] Tạo `src/features/<module>/routes.tsx`
- [ ] Đăng ký route vào router chính
- [ ] Gắn menu key + label + icon (nếu là module mới)
- [ ] Dùng style primitives hiện có (`buttons`, `cards`, `forms`, `tabs`, `chips`, `search`, `panels`, `toggles`, `product-card`, `order-panel`)
- [ ] Chỉ thêm CSS mới khi component có khả năng tái sử dụng
- [ ] Lint + build pass
- [ ] So sánh trực quan với ảnh trong folder design tương ứng

---

## 5) Định nghĩa hoàn thành (Definition of Done)

Một màn hình được coi là hoàn thành khi:

- [ ] Khớp bố cục chính (header/toolbar/content/sidebar/panel)
- [ ] Đúng hierarchy typography và spacing token
- [ ] Đủ trạng thái tương tác: hover/active/focus-visible/disabled
- [ ] Hoạt động ở cả light/dark mode
- [ ] Không tạo duplicate style trái với system hiện tại
- [ ] `npm run lint` và `npm run build` pass

---

## 6) Gợi ý tạo nhanh structure feature mới

```text
src/features/<module>/
  <Module>Screen.tsx
  routes.tsx
  components/
    <Module>Toolbar.tsx
    <Module>Table.tsx
    <Module>Panel.tsx
```

Khi cần CSS mới, thêm vào `src/styles/components/<module>.css` và import ở `src/styles/global.css`.
