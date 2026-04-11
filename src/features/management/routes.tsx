import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { createRouteHandle, ROUTE_META_BY_MENU } from "../../app/routeMeta";
import { withPermission } from "../../app/guards/withPermission";
import { MENU_KEYS, type MenuKey } from "../../constants/navigation";
import { APP_ROUTES } from "../../constants/routes";

const ComingSoonScreen = lazy(() =>
  import("../common/ComingSoonScreen").then((module) => ({
    default: module.ComingSoonScreen,
  })),
);

const OrdersScreen = lazy(() =>
  import("./OrdersScreen").then((module) => ({
    default: module.OrdersScreen,
  })),
);

const CustomersScreen = lazy(() =>
  import("./CustomersScreen").then((module) => ({
    default: module.CustomersScreen,
  })),
);

const FinanceScreen = lazy(() =>
  import("./FinanceScreen").then((module) => ({
    default: module.FinanceScreen,
  })),
);

const CatalogScreen = lazy(() =>
  import("./CatalogScreen").then((module) => ({
    default: module.CatalogScreen,
  })),
);

const SettingsScreen = lazy(() =>
  import("./SettingsScreen").then((module) => ({
    default: module.default,
  })),
);

const InventoryScreen = lazy(() =>
  import("./InventoryScreen").then((module) => ({
    default: module.InventoryScreen,
  })),
);

const ReportsScreen = lazy(() =>
  import("./ReportsScreen").then((module) => ({
    default: module.ReportsScreen,
  })),
);

const TablesScreen = lazy(() =>
  import("./TablesScreen").then((module) => ({
    default: module.TablesScreen,
  })),
);

const EmployeesScreen = lazy(() =>
  import("./EmployeesScreen").then((module) => ({
    default: module.EmployeesScreen,
  })),
);

type ManagementRouteConfig = {
  menuKey: MenuKey;
  path: string;
  title: string;
};

const SCREEN_BY_MENU_KEY: Partial<Record<MenuKey, typeof ComingSoonScreen>> = {
  [MENU_KEYS.TABLES]: TablesScreen,
  [MENU_KEYS.ORDERS]: OrdersScreen,
  [MENU_KEYS.CUSTOMERS]: CustomersScreen,
  [MENU_KEYS.FINANCE]: FinanceScreen,
  [MENU_KEYS.CATALOG]: CatalogScreen,
  [MENU_KEYS.INVENTORY]: InventoryScreen,
  [MENU_KEYS.REPORTS]: ReportsScreen,
  [MENU_KEYS.EMPLOYEES]: EmployeesScreen,
  [MENU_KEYS.SETTINGS]: SettingsScreen,
};

const managementConfigs: ManagementRouteConfig[] = [
  {
    menuKey: MENU_KEYS.TABLES,
    path: APP_ROUTES.tables,
    title: "Quản lý bàn",
  },
  {
    menuKey: MENU_KEYS.CATALOG,
    path: APP_ROUTES.catalog,
    title: "Danh mục",
  },
  {
    menuKey: MENU_KEYS.ORDERS,
    path: APP_ROUTES.orders,
    title: "Đơn hàng",
  },
  {
    menuKey: MENU_KEYS.INVENTORY,
    path: APP_ROUTES.inventory,
    title: "Kho",
  },
  {
    menuKey: MENU_KEYS.REPORTS,
    path: APP_ROUTES.reports,
    title: "Báo cáo",
  },
  {
    menuKey: MENU_KEYS.CUSTOMERS,
    path: APP_ROUTES.customers,
    title: "Khách hàng",
  },
  {
    menuKey: MENU_KEYS.FINANCE,
    path: APP_ROUTES.finance,
    title: "Thu chi",
  },
  {
    menuKey: MENU_KEYS.EMPLOYEES,
    path: APP_ROUTES.employees,
    title: "Nhân viên",
  },
  {
    menuKey: MENU_KEYS.SETTINGS,
    path: APP_ROUTES.settings,
    title: "Cài đặt",
  },
];

export const managementRoutes: RouteObject[] = managementConfigs.map(
  ({ menuKey, path, title }) => {
    const ScreenComponent = SCREEN_BY_MENU_KEY[menuKey] ?? ComingSoonScreen;

    const ProtectedScreen = withPermission(ScreenComponent, {
      permission: ROUTE_META_BY_MENU[menuKey].permission,
    });

    return {
      path: path.slice(1),
      handle: createRouteHandle(menuKey),
      element: <ProtectedScreen title={title} />,
    };
  },
);
