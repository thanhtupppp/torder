import { NavLink } from "react-router-dom";
import { iconMap } from "./iconMap";
import type { SidebarMenuItem as MenuItem } from "../../constants/navigation";

type SidebarMenuItemProps = {
  /** Route path this item navigates to. */
  to: string;
  label: string;
  icon: MenuItem["icon"];
  collapsed?: boolean;
  /** Called after navigation — used to collapse the hover-expanded sidebar. */
  onClick?: () => void;
};

export function SidebarMenuItem({
  to,
  label,
  icon,
  collapsed,
  onClick,
}: SidebarMenuItemProps) {
  return (
    <NavLink
      to={to}
      // "end" prevents "/" from matching every route as active
      end={to === "/"}
      className={({ isActive }) => `menu-item${isActive ? " active" : ""}`}
      onClick={onClick}
      aria-label={label}
      title={collapsed ? label : undefined}
    >
      <span className="menu-item-icon">{iconMap[icon] ?? null}</span>
      <span
        className={`menu-item-label${collapsed ? " menu-item-label--hidden" : ""}`}
      >
        {label}
      </span>
    </NavLink>
  );
}
