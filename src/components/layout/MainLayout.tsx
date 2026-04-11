import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { SIDEBAR_MENU_ITEMS, type MenuKey } from "../../constants/navigation";
import { SidebarMenu } from "../navigation/SidebarMenu";
import { AppContent } from "./AppContent";
import { AppHeader } from "./AppHeader";

type MainLayoutProps = PropsWithChildren<{
  activeMenuId: MenuKey;
  headerTitle: string;
  headerSubtitle?: string;
  breadcrumbs?: Array<{
    label: string;
    to?: string;
  }>;
  onSelectMenu?: (id: MenuKey) => void;
}>;

export function MainLayout({
  children,
  activeMenuId,
  headerTitle,
  headerSubtitle,
  breadcrumbs,
  onSelectMenu,
}: MainLayoutProps) {
  // Whether sidebar is "pinned closed" (collapsed icon-strip mode)
  const [pinnedCollapsed, setPinnedCollapsed] = useState(false);
  // Whether it's temporarily opened by hovering
  const [hoverExpanded, setHoverExpanded] = useState(false);

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  // Auto-collapse on small screens
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

  // Click outside to close hover-expanded sidebar
  useEffect(() => {
    if (!hoverExpanded) return;
    function handleOutsideClick(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setHoverExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [hoverExpanded]);

  // ── Hover handlers ─────────────────────────────
  function handleMouseEnter() {
    if (!pinnedCollapsed) return; // already pinned open, no hover needed
    hoverTimerRef.current = setTimeout(() => setHoverExpanded(true), 100);
  }

  function handleMouseLeave() {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setTimeout(() => setHoverExpanded(false), 150);
  }

  // ── Menu select ────────────────────────────────
  function handleSelect(id: MenuKey) {
    if (pinnedCollapsed) setHoverExpanded(false);
    onSelectMenu?.(id);
  }

  // ── Toggle button ──────────────────────────────
  function toggleSidebar() {
    setPinnedCollapsed((prev) => !prev);
    setHoverExpanded(false);
  }

  // ── Derived sidebar class ──────────────────────
  // Sidebar is fixed-position always. Width is controlled by CSS class:
  //  - no class       → 220px (pinned open)
  //  - --collapsed    → 60px (pinned closed)
  //  - --hover        → 220px over collapsed (overlay, no layout shift)
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
          activeId={activeMenuId}
          onSelect={handleSelect}
          collapsed={isCollapsed}
        />
      </aside>
      <AppContent>
        <AppHeader
          title={headerTitle}
          subtitle={headerSubtitle ?? "Quản lý bán hàng tại quầy"}
          breadcrumbs={breadcrumbs}
        />
        {children}
      </AppContent>
    </div>
  );
}
