import {
  Receipt,
  LayoutGrid,
  Box,
  ClipboardList,
  Warehouse,
  BarChart2,
  Users,
  Wallet,
  UserCog,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  icon: LucideIcon;
  /** ✅ First item of a visual group — CSS renders a separator above it */
  groupStart?: boolean;
};

export const SIDEBAR_MENU_ITEMS: SidebarMenuItem[] = [
  { id: MENU_KEYS.SALES, label: "Màn hình bán hàng", icon: Receipt },
  { id: MENU_KEYS.TABLES, label: "Quản lý bàn", icon: LayoutGrid, groupStart: true },
  { id: MENU_KEYS.CATALOG, label: "Danh mục", icon: Box },
  { id: MENU_KEYS.ORDERS, label: "Đơn hàng", icon: ClipboardList },
  { id: MENU_KEYS.INVENTORY, label: "Kho", icon: Warehouse },
  { id: MENU_KEYS.REPORTS, label: "Báo cáo", icon: BarChart2, groupStart: true },
  { id: MENU_KEYS.CUSTOMERS, label: "Khách hàng", icon: Users, groupStart: true },
  { id: MENU_KEYS.FINANCE, label: "Thu chi", icon: Wallet },
  { id: MENU_KEYS.EMPLOYEES, label: "Nhân viên", icon: UserCog },
  { id: MENU_KEYS.SETTINGS, label: "Cài đặt", icon: Settings, groupStart: true },
];
