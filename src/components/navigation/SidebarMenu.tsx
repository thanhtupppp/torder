import type { SidebarMenuItem as MenuItem } from "../../constants/navigation";
import { APP_ROUTES } from "../../constants/routes";
import { SidebarMenuItem } from "./SidebarMenuItem";

type SidebarMenuProps = {
  items: MenuItem[];
  collapsed?: boolean;
  /** Called after navigation — used by MainLayout to collapse the hover sidebar. */
  onSelect?: (id: MenuItem["id"]) => void;
};

export function SidebarMenu({ items, collapsed, onSelect }: SidebarMenuProps) {
  return (
    <nav className="menu">
      {items.map((item) => (
        <SidebarMenuItem
          key={item.id}
          to={APP_ROUTES[item.id]}
          label={item.label}
          icon={item.icon}
          collapsed={collapsed}
          onClick={onSelect ? () => onSelect(item.id) : undefined}
        />
      ))}
    </nav>
  );
}
