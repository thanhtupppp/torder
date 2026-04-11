export const PERMISSIONS = {
  APP_ACCESS: "app:access",
  SALES_ACCESS: "sales:access",
  TABLES_ACCESS: "tables:access",
  CATALOG_ACCESS: "catalog:access",
  ORDERS_ACCESS: "orders:access",
  INVENTORY_ACCESS: "inventory:access",
  REPORTS_ACCESS: "reports:access",
  FINANCE_ACCESS: "finance:access",
  CUSTOMERS_ACCESS: "customers:access",
  EMPLOYEES_ACCESS: "employees:access",
  SETTINGS_ACCESS: "settings:access",
} as const;

export type AppPermission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const DEFAULT_PERMISSIONS: AppPermission[] = [
  PERMISSIONS.APP_ACCESS,
  PERMISSIONS.SALES_ACCESS,
  PERMISSIONS.TABLES_ACCESS,
  PERMISSIONS.CATALOG_ACCESS,
  PERMISSIONS.ORDERS_ACCESS,
  PERMISSIONS.INVENTORY_ACCESS,
  PERMISSIONS.REPORTS_ACCESS,
  PERMISSIONS.FINANCE_ACCESS,
  PERMISSIONS.CUSTOMERS_ACCESS,
  PERMISSIONS.EMPLOYEES_ACCESS,
  PERMISSIONS.SETTINGS_ACCESS,
];

export function hasPermission(
  userPermissions: AppPermission[],
  requiredPermission: AppPermission,
) {
  return userPermissions.includes(requiredPermission);
}
