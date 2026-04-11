import { MENU_KEYS, type MenuKey } from "./navigation";

export const APP_ROUTES: Record<MenuKey, string> = {
  [MENU_KEYS.SALES]: "/",
  [MENU_KEYS.TABLES]: "/tables",
  [MENU_KEYS.CATALOG]: "/catalog",
  [MENU_KEYS.ORDERS]: "/orders",
  [MENU_KEYS.INVENTORY]: "/inventory",
  [MENU_KEYS.REPORTS]: "/reports",
  [MENU_KEYS.CUSTOMERS]: "/customers",
  [MENU_KEYS.FINANCE]: "/finance",
  [MENU_KEYS.EMPLOYEES]: "/employees",
  [MENU_KEYS.SETTINGS]: "/settings",
};

export const ROUTE_TO_MENU = Object.entries(APP_ROUTES).reduce(
  (acc, [menuKey, path]) => {
    acc[path] = menuKey as MenuKey;
    return acc;
  },
  {} as Record<string, MenuKey>,
);
