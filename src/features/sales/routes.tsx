import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { GuardedRoute } from "../../app/guards/GuardedRoute";
import { createRouteHandle, ROUTE_META_BY_MENU } from "../../app/routeMeta";
import { MENU_KEYS } from "../../constants/navigation";
import { APP_ROUTES } from "../../constants/routes";
import { salesLoader } from "./salesLoader";

const SalesScreen = lazy(() =>
  import("./SalesScreen").then((module) => ({
    default: module.SalesScreen,
  })),
);

export const salesRoutes: RouteObject[] = [
  {
    index: true,
    loader: salesLoader,
    handle: createRouteHandle(MENU_KEYS.SALES),
    element: (
      <GuardedRoute
        requiredPermission={ROUTE_META_BY_MENU[MENU_KEYS.SALES].permission}
      >
        <SalesScreen />
      </GuardedRoute>
    ),
  },
];

export const salesPath = APP_ROUTES.sales;
