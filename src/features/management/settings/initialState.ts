import type {
  CustomerDisplayConfig,
  PaymentSettings,
  SalesSettings,
  SettingTab,
  StoreInfo,
} from "./types";

export const INITIAL_ACTIVE_TAB: SettingTab = "storeInfo";

export const INITIAL_CUSTOMER_DISPLAY: CustomerDisplayConfig = {
  text: "Cảm ơn bạn đã mua hàng!",
  website: "Website: posorder.vn",
  showOrderInfo: true,
};

export const INITIAL_SALES_SETTINGS: SalesSettings = {
  allowNegativeStock: true,
  showImages: true,
  showConfirmDialog: false,
  staffRequired: true,
  fastCheckout: false,
  autoPrint: true,
  autoFinish: true,
};

export const INITIAL_PAYMENT_SETTINGS: PaymentSettings = {
  cash: true,
  transfer: true,
  card: true,
  wallet: true,
  point: false,
};

export const INITIAL_STORE_INFO: StoreInfo = {
  name: "PosiOrder Coffee",
  address: "123 Đường ABC, Phường X, Quận Y, TP. HCM",
  phone: "0901234567",
  email: "contact@posiorder.vn",
  wifi: "PosiOrder_Free / 12345678",
};
