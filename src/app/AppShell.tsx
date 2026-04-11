import { Suspense } from "react";
import { Outlet, useMatches } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { useSidebarMenu } from "../components/navigation/useSidebarMenu";
import type { RouteHandle } from "./routeMeta";

type MatchWithHandle = {
  handle?: RouteHandle;
};

export function AppShell() {
  const { activeMenuId, activeMenu, setActiveMenuId } = useSidebarMenu();
  const matches = useMatches() as MatchWithHandle[];

  const currentHandle = [...matches]
    .reverse()
    .find((match) => match.handle?.meta)?.handle;

  const headerTitle =
    currentHandle?.meta.title ?? activeMenu?.label ?? "PosiOrder";

  const headerSubtitle =
    currentHandle?.meta.breadcrumb.map((item) => item.label).join(" / ") ??
    "Quản lý bán hàng tại quầy";

  return (
    <MainLayout
      activeMenuId={activeMenuId}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
      breadcrumbs={currentHandle?.meta.breadcrumb}
      onSelectMenu={setActiveMenuId}
    >
      <Suspense fallback={<div className="card">Đang tải...</div>}>
        <Outlet />
      </Suspense>
    </MainLayout>
  );
}
