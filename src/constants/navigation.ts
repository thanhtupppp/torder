export const MENU_KEYS = {
  SALES: "sales",
  TABLES: "tables",
  CATALOG: "catalog",
  ORDERS: "orders",
  INVENTORY: "inventory",
  REPORTS: "reports",
  FINANCE: "finance",
  CUSTOMERS: "customers",
  EMPLOYEES: "employees",
  SETTINGS: "settings",
} as const;

export type MenuKey = (typeof MENU_KEYS)[keyof typeof MENU_KEYS];

export type SidebarMenuItem = {
  id: MenuKey;
  label: string;
  icon: string;
};

export const SIDEBAR_MENU_ITEMS: SidebarMenuItem[] = [
  { id: MENU_KEYS.SALES, label: "Màn hình bán hàng", icon: "receipt" },
  { id: MENU_KEYS.TABLES, label: "Quản lý bàn", icon: "table" },
  { id: MENU_KEYS.CATALOG, label: "Danh mục", icon: "box" },
  { id: MENU_KEYS.ORDERS, label: "Đơn hàng", icon: "clipboard" },
  { id: MENU_KEYS.INVENTORY, label: "Kho", icon: "warehouse" },
  { id: MENU_KEYS.REPORTS, label: "Báo cáo", icon: "chart" },
  { id: MENU_KEYS.CUSTOMERS, label: "Khách hàng", icon: "users" },
  { id: MENU_KEYS.FINANCE, label: "Thu chi", icon: "wallet" },
  { id: MENU_KEYS.EMPLOYEES, label: "Nhân viên", icon: "user-cog" },
  { id: MENU_KEYS.SETTINGS, label: "Cài đặt", icon: "settings" },
];
