import type { ComponentType } from "react";
import { GuardedRoute } from "./GuardedRoute";
import { getCurrentSession } from "../auth/session";
import { PERMISSIONS } from "../permissions";

type WithAuthOptions = {
  fallbackPermission?: keyof typeof PERMISSIONS;
};

export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options?: WithAuthOptions,
) {
  return function WithAuthComponent(props: P) {
    const session = getCurrentSession();
    const fallbackPermission = options?.fallbackPermission ?? "APP_ACCESS";

    return (
      <GuardedRoute
        requiredPermission={PERMISSIONS[fallbackPermission]}
        isAuthenticated={session.isAuthenticated}
        userPermissions={session.permissions}
      >
        <WrappedComponent {...props} />
      </GuardedRoute>
    );
  };
}
