import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import type { LicenseStatus } from "../../shared/types";
import { SIDEBAR_MENU_ITEMS, type MenuKey } from "../../constants/navigation";
import { SidebarMenu } from "../navigation/SidebarMenu";
import { AppContent } from "./AppContent";
import { AppHeader } from "./AppHeader";

type MainLayoutProps = PropsWithChildren<{
  headerTitle: string;
  headerSubtitle?: string;
  breadcrumbs?: Array<{ label: string; to?: string }>;
  onSelectMenu?: (id: MenuKey) => void;
  licenseStatus?: LicenseStatus | null;
}>;

export function MainLayout({
  children,
  headerTitle,
  headerSubtitle,
  breadcrumbs,
  onSelectMenu,
  licenseStatus,
}: MainLayoutProps) {
  const [pinnedCollapsed, setPinnedCollapsed] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleResize() {
      const narrow = window.innerWidth <= 1366;
      setPinnedCollapsed(narrow);
      if (narrow) setHoverExpanded(false);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!hoverExpanded) return;
    function handleOutsideClick(e: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        setHoverExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [hoverExpanded]);

  const handleMouseEnter = useCallback(() => {
    if (!pinnedCollapsed) return;
    hoverTimerRef.current = setTimeout(() => setHoverExpanded(true), 100);
  }, [pinnedCollapsed]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    hoverTimerRef.current = setTimeout(() => setHoverExpanded(false), 150);
  }, []);

  const handleSelect = useCallback(
    (id: MenuKey) => {
      if (pinnedCollapsed) setHoverExpanded(false);
      onSelectMenu?.(id);
    },
    [pinnedCollapsed, onSelectMenu],
  );

  function toggleSidebar() {
    setPinnedCollapsed((prev) => !prev);
    setHoverExpanded(false);
  }

  const isCollapsed = pinnedCollapsed && !hoverExpanded;

  const sidebarClass = [
    "sidebar",
    isCollapsed ? "sidebar--collapsed" : "",
    pinnedCollapsed && hoverExpanded ? "sidebar--hover" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="app-shell">
      <aside
        ref={sidebarRef}
        className={sidebarClass}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="sidebar__top">
          <div className="logo">PosiOrder</div>
          <button
            type="button"
            className="sidebar__toggle"
            onClick={(e) => {
              e.stopPropagation();
              toggleSidebar();
            }}
            aria-label={pinnedCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
            title={pinnedCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            {pinnedCollapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <PanelLeftClose size={16} />
            )}
          </button>
        </div>
        <SidebarMenu
          items={SIDEBAR_MENU_ITEMS}
          onSelect={handleSelect}
          collapsed={isCollapsed}
        />
      </aside>
      <AppContent>
        <AppHeader
          title={headerTitle}
          subtitle={headerSubtitle ?? "Quản lý bán hàng tại quầy"}
          breadcrumbs={breadcrumbs}
          licenseStatus={licenseStatus}
        />
        {children}
      </AppContent>
    </div>
  );
}
