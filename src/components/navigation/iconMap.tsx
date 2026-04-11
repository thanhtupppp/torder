import {
  Boxes,
  ChartColumn,
  ClipboardList,
  Receipt,
  Settings,
  Warehouse,
  Wallet,
  Users,
  UserCog,
  UtensilsCrossed,
} from "lucide-react";
import type { ReactNode } from "react";
import type { SidebarMenuItem } from "../../constants/navigation";

type MenuIconKey = SidebarMenuItem["icon"];

const iconProps = {
  size: 20,
  strokeWidth: 1.8,
};

export const iconMap: Record<MenuIconKey, ReactNode> = {
  receipt:   <Receipt {...iconProps} />,
  table:     <UtensilsCrossed {...iconProps} />,
  box:       <Boxes {...iconProps} />,
  clipboard: <ClipboardList {...iconProps} />,
  warehouse: <Warehouse {...iconProps} />,
  chart:     <ChartColumn {...iconProps} />,
  settings:  <Settings {...iconProps} />,
  wallet:    <Wallet {...iconProps} />,
  users:     <Users {...iconProps} />,
  "user-cog": <UserCog {...iconProps} />,
};
