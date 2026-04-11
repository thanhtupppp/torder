import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { APP_ROUTES } from "../../constants/routes";
import {
  DEFAULT_PERMISSIONS,
  hasPermission,
  type AppPermission,
} from "../permissions";

type GuardedRouteProps = {
  children: ReactNode;
  requiredPermission: AppPermission;
  isAuthenticated?: boolean;
  userPermissions?: AppPermission[];
};

export function GuardedRoute({
  children,
  requiredPermission,
  isAuthenticated = true,
  userPermissions = DEFAULT_PERMISSIONS,
}: GuardedRouteProps) {
  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.sales} replace />;
  }

  if (!hasPermission(userPermissions, requiredPermission)) {
    return (
      <section className="card">
        <h3>Không có quyền truy cập</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          Bạn chưa được cấp quyền cho chức năng này.
        </p>
      </section>
    );
  }

  return <>{children}</>;
}
