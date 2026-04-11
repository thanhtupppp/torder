import { MENU_KEYS, type MenuKey } from "../constants/navigation";
import { PERMISSIONS, type AppPermission } from "./permissions";

export type RouteMeta = {
  title: string;
  permission: AppPermission;
  breadcrumb: Array<{
    label: string;
    to?: string;
  }>;
};

export const ROUTE_META_BY_MENU: Record<MenuKey, RouteMeta> = {
  [MENU_KEYS.SALES]: {
    title: "Màn hình bán hàng",
    permission: PERMISSIONS.SALES_ACCESS,
    breadcrumb: [{ label: "Bán hàng" }],
  },
  [MENU_KEYS.TABLES]: {
    title: "Quản lý bàn",
    permission: PERMISSIONS.TABLES_ACCESS,
    breadcrumb: [{ label: "Vận hành" }, { label: "Quản lý bàn" }],
  },
  [MENU_KEYS.CATALOG]: {
    title: "Danh mục",
    permission: PERMISSIONS.CATALOG_ACCESS,
    breadcrumb: [{ label: "Vận hành" }, { label: "Danh mục" }],
  },
  [MENU_KEYS.ORDERS]: {
    title: "Đơn hàng",
    permission: PERMISSIONS.ORDERS_ACCESS,
    breadcrumb: [{ label: "Vận hành" }, { label: "Đơn hàng" }],
  },
  [MENU_KEYS.INVENTORY]: {
    title: "Kho",
    permission: PERMISSIONS.INVENTORY_ACCESS,
    breadcrumb: [{ label: "Vận hành" }, { label: "Kho" }],
  },
  [MENU_KEYS.REPORTS]: {
    title: "Báo cáo",
    permission: PERMISSIONS.REPORTS_ACCESS,
    breadcrumb: [{ label: "Phân tích" }, { label: "Báo cáo" }],
  },
  [MENU_KEYS.CUSTOMERS]: {
    title: "Khách hàng",
    permission: PERMISSIONS.CUSTOMERS_ACCESS,
    breadcrumb: [{ label: "Quản lý" }, { label: "Khách hàng" }],
  },
  [MENU_KEYS.FINANCE]: {
    title: "Thu chi",
    permission: PERMISSIONS.FINANCE_ACCESS,
    breadcrumb: [{ label: "Quản lý" }, { label: "Thu chi" }],
  },
  [MENU_KEYS.EMPLOYEES]: {
    title: "Nhân viên",
    permission: PERMISSIONS.EMPLOYEES_ACCESS,
    breadcrumb: [{ label: "Quản lý" }, { label: "Nhân viên" }],
  },
  [MENU_KEYS.SETTINGS]: {
    title: "Cài đặt",
    permission: PERMISSIONS.SETTINGS_ACCESS,
    breadcrumb: [{ label: "Hệ thống" }, { label: "Cài đặt" }],
  },
};

export type RouteHandle<TLoaderData = unknown> = {
  menuKey: MenuKey;
  meta: RouteMeta;
  loaderDataKey?: keyof TLoaderData & string;
};

export function createRouteHandle<TLoaderData = unknown>(
  menuKey: MenuKey,
  options?: {
    loaderDataKey?: keyof TLoaderData & string;
  },
): RouteHandle<TLoaderData> {
  return {
    menuKey,
    meta: ROUTE_META_BY_MENU[menuKey],
    loaderDataKey: options?.loaderDataKey,
  };
}
