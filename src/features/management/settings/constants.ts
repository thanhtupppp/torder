import {
  ShoppingCart,
  CreditCard,
  Printer,
  FileText,
  Store,
  Bell,
  MonitorSmartphone,
  RefreshCcw,
  Gift,
} from "lucide-react";
import type { SettingMenuItem } from "./types";

export const SETTINGS_MENU: SettingMenuItem[] = [
  { key: "storeInfo", label: "Thông tin cửa hàng", icon: Store },
  { key: "sales", label: "Bán hàng", icon: ShoppingCart },
  { key: "payments", label: "Thanh toán", icon: CreditCard },
  { key: "printers", label: "Máy in", icon: Printer },
  { key: "templates", label: "Mẫu in", icon: FileText },
  { key: "devices", label: "Thiết bị", icon: MonitorSmartphone },
  { key: "loyalty", label: "Tích điểm", icon: Gift },
  { key: "sync", label: "Đồng bộ", icon: RefreshCcw },
  { key: "notifications", label: "Thông báo", icon: Bell },
];
