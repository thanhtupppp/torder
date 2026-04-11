import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SIDEBAR_MENU_ITEMS, type MenuKey } from "../../constants/navigation";
import { APP_ROUTES, ROUTE_TO_MENU } from "../../constants/routes";

export function useSidebarMenu() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeMenuId = useMemo<MenuKey>(() => {
    return ROUTE_TO_MENU[location.pathname] ?? "sales";
  }, [location.pathname]);

  const activeMenu = useMemo(
    () => SIDEBAR_MENU_ITEMS.find((item) => item.id === activeMenuId),
    [activeMenuId],
  );

  function setActiveMenuId(menuId: MenuKey) {
    navigate(APP_ROUTES[menuId]);
  }

  return {
    menuItems: SIDEBAR_MENU_ITEMS,
    activeMenuId,
    activeMenu,
    setActiveMenuId,
  };
}
