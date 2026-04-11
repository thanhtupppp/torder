import type { SidebarMenuItem as MenuItem } from "../../constants/navigation";
import { SidebarMenuItem } from "./SidebarMenuItem";

type SidebarMenuProps = {
  items: MenuItem[];
  activeId: MenuItem["id"];
  collapsed?: boolean;
  onSelect?: (id: MenuItem["id"]) => void;
};

export function SidebarMenu({ items, activeId, collapsed, onSelect }: SidebarMenuProps) {
  return (
    <nav className="menu">
      {items.map((item) => (
        <SidebarMenuItem
          key={item.id}
          label={item.label}
          icon={item.icon}
          active={item.id === activeId}
          collapsed={collapsed}
          onClick={onSelect ? () => onSelect(item.id) : undefined}
        />
      ))}
    </nav>
  );
}
