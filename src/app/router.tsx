import {
  Navigate,
  createBrowserRouter,
  type RouteObject,
} from "react-router-dom";
import { APP_ROUTES } from "../constants/routes";
import { managementRoutes } from "../features/management/routes";
import { salesRoutes } from "../features/sales/routes";
import { AppShell } from "./AppShell";
import { RouteErrorElement } from "./RouteErrorElement";

const appChildRoutes: RouteObject[] = [...salesRoutes, ...managementRoutes];

const routeConfig: RouteObject[] = [
  {
    path: APP_ROUTES.sales,
    element: <AppShell />,
    errorElement: <RouteErrorElement />,
    children: appChildRoutes,
  },
  {
    path: "*",
    element: <Navigate to={APP_ROUTES.sales} replace />,
  },
];

export const router = createBrowserRouter(routeConfig);
