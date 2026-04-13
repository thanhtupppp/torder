import { Suspense, useCallback, useEffect, useState } from "react";
import { Outlet, useLocation, useMatches, useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { useSidebarMenu } from "../components/navigation/useSidebarMenu";
import { APP_ROUTES } from "../constants/routes";
import type { AppGuardStatus, LicenseStatus } from "../shared/types";
import type { RouteHandle } from "./routeMeta";

type MatchWithHandle = {
  handle?: RouteHandle;
};

export function AppShell() {
  const { activeMenu, setActiveMenuId } = useSidebarMenu();
  const matches = useMatches() as MatchWithHandle[];
  const location = useLocation();
  const navigate = useNavigate();

  const [guard, setGuard] = useState<AppGuardStatus | null>(null);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(
    null,
  );
  const [isCheckingGuard, setIsCheckingGuard] = useState(true);

  const refreshGuard = useCallback(async () => {
    const guardApi = window.appApi?.appGuard;
    const licenseApi = window.appApi?.license;

    if (!guardApi?.status || !licenseApi?.status) {
      setGuard({
        canUseApp: true,
        reason: "API_UNAVAILABLE",
        checkedAt: new Date().toISOString(),
      });
      setLicenseStatus({
        active: false,
        reason: "API_UNAVAILABLE",
        checkedAt: new Date().toISOString(),
        graceRemainingDays: null,
      });
      return;
    }

    const [guardStatus, license] = await Promise.all([
      guardApi.status(),
      licenseApi.status(),
    ]);

    setGuard(guardStatus);
    setLicenseStatus(license);

    if (!guardStatus.canUseApp && location.pathname !== APP_ROUTES.settings) {
      navigate(APP_ROUTES.settings, { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    void refreshGuard().finally(() => setIsCheckingGuard(false));
  }, [refreshGuard]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refreshGuard();
    }, 15000);

    return () => window.clearInterval(id);
  }, [refreshGuard]);

  useEffect(() => {
    const listener = () => {
      void refreshGuard();
    };
    window.addEventListener(
      "license-status-changed",
      listener as EventListener,
    );
    return () =>
      window.removeEventListener(
        "license-status-changed",
        listener as EventListener,
      );
  }, [refreshGuard]);

  const currentHandle = [...matches]
    .reverse()
    .find((match) => match.handle?.meta)?.handle;

  const headerTitle =
    currentHandle?.meta.title ?? activeMenu?.label ?? "PosiOrder";

  const headerSubtitle =
    currentHandle?.meta.breadcrumb.map((item) => item.label).join(" / ") ??
    "Quản lý bán hàng tại quầy";

  const showLockMessage = !isCheckingGuard && guard && !guard.canUseApp;

  return (
    <MainLayout
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
      breadcrumbs={currentHandle?.meta.breadcrumb}
      onSelectMenu={setActiveMenuId}
      licenseStatus={licenseStatus}
    >
      {showLockMessage && location.pathname !== APP_ROUTES.settings ? (
        <div className="card" role="alert">
          <h3>Ứng dụng chưa được kích hoạt</h3>
          <p>
            Vui lòng vào Cài đặt {">"} Thông tin cửa hàng để nhập key kích hoạt.
          </p>
          <p style={{ color: "#64748b", marginTop: 8 }}>
            Lý do: {guard.reason}
          </p>
        </div>
      ) : (
        <Suspense fallback={<div className="card">Đang tải...</div>}>
          <Outlet />
        </Suspense>
      )}
    </MainLayout>
  );
}
