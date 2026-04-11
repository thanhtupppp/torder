import { iconMap } from "./iconMap";
import type { SidebarMenuItem as MenuItem } from "../../constants/navigation";

type SidebarMenuItemProps = {
  label: string;
  icon: MenuItem["icon"];
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
};

export function SidebarMenuItem({
  label,
  icon,
  active,
  collapsed,
  onClick,
}: SidebarMenuItemProps) {
  return (
    <button
      type="button"
      className={`menu-item${active ? " active" : ""}`}
      onClick={onClick}
      aria-label={label}
      title={collapsed ? label : undefined}
    >
      <span className="menu-item-icon">{iconMap[icon] ?? null}</span>
      <span className={`menu-item-label${collapsed ? " menu-item-label--hidden" : ""}`}>
        {label}
      </span>
    </button>
  );
}
