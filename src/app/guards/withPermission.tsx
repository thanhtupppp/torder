import type { ComponentType } from "react";
import { getCurrentSession } from "../auth/session";
import type { AppPermission } from "../permissions";
import { GuardedRoute } from "./GuardedRoute";
import { withAuth } from "./withAuth";

type WithPermissionOptions = {
  permission: AppPermission;
};

export function withPermission<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithPermissionOptions,
) {
  const { permission } = options;

  function PermissionProtectedComponent(props: P) {
    const session = getCurrentSession();

    return (
      <GuardedRoute
        requiredPermission={permission}
        isAuthenticated={session.isAuthenticated}
        userPermissions={session.permissions}
      >
        <WrappedComponent {...props} />
      </GuardedRoute>
    );
  }

  return withAuth(PermissionProtectedComponent);
}
