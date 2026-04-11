import type { LucideIcon } from "lucide-react";

export type SettingTab =
  | "sales"
  | "payments"
  | "printers"
  | "templates"
  | "devices"
  | "sync"
  | "storeInfo"
  | "loyalty"
  | "notifications";

export type SalesSettings = {
  allowNegativeStock: boolean;
  showImages: boolean;
  showConfirmDialog: boolean;
  staffRequired: boolean;
  fastCheckout: boolean;
  autoPrint: boolean;
  autoFinish: boolean;
};

export type PaymentSettings = {
  cash: boolean;
  transfer: boolean;
  card: boolean;
  wallet: boolean;
  point: boolean;
};

export type StoreInfo = {
  name: string;
  address: string;
  phone: string;
  email: string;
  wifi: string;
};

export type SettingMenuItem = {
  key: SettingTab;
  label: string;
  icon: LucideIcon;
};
