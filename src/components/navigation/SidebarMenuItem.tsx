import { NavLink } from "react-router-dom";
import type { SidebarMenuItem as MenuItem } from "../../constants/navigation";

type SidebarMenuItemProps = {
  /** Route path this item navigates to. */
  to: string;
  label: string;
  icon: MenuItem["icon"];
  collapsed?: boolean;
  /** First item of a visual group — renders a separator above. */
  groupStart?: boolean;
  /** Called after navigation — used to collapse the hover-expanded sidebar. */
  onClick?: () => void;
};

export function SidebarMenuItem({
  to,
  label,
  icon: Icon,
  collapsed,
  groupStart,
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
      data-group-start={groupStart ? "true" : undefined}
    >
      <span className="menu-item-icon">
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <span
        className={`menu-item-label${collapsed ? " menu-item-label--hidden" : ""}`}
      >
        {label}
      </span>
    </NavLink>
  );
}
