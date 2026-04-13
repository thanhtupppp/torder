import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { getCurrentSession } from "./app/auth/session";
import { FirstRunSetupScreen } from "./features/setup/FirstRunSetupScreen";
import { LoginScreen } from "./features/setup/LoginScreen";
import type { SetupState } from "./shared/types";

export function App() {
  const [setupState, setSetupState] = useState<SetupState | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshSetupState() {
    const setupApi = window.appApi?.setup;
    const licenseApi = window.appApi?.license;

    if (!setupApi?.getState || !licenseApi?.hasLocalLicense) {
      setSetupState({
        isCompleted: true,
        hasAdmin: true,
        hasStoreInfo: true,
        hasLocalLicense: true,
      });
      setLoading(false);
      return;
    }

    const [state, local] = await Promise.all([
      setupApi.getState(),
      licenseApi.hasLocalLicense(),
    ]);

    setSetupState({
      ...state,
      hasLocalLicense: local.hasLocalLicense,
    });
    setLoading(false);
  }

  useEffect(() => {
    void refreshSetupState();
  }, []);

  if (loading || !setupState) {
    return <div className="card">Đang tải hệ thống...</div>;
  }

  const shouldShowFirstRun =
    !setupState.isCompleted ||
    !setupState.hasAdmin ||
    !setupState.hasStoreInfo ||
    !setupState.hasLocalLicense;

  if (shouldShowFirstRun) {
    return <FirstRunSetupScreen onCompleted={refreshSetupState} />;
  }

  const session = getCurrentSession();
  if (!session.isAuthenticated) {
    return <LoginScreen />;
  }

  return <RouterProvider router={router} />;
}
