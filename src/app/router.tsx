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
import { LoginScreen } from "../features/setup/LoginScreen";

const appChildRoutes: RouteObject[] = [...salesRoutes, ...managementRoutes];

const routeConfig: RouteObject[] = [
  {
    path: "/login",
    element: <LoginScreen />,
  },
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
