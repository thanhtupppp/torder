import { useCallback, useState } from "react";
import { CustomerDisplayModal } from "./components/settings/CustomerDisplayModal";
import { DevicesTab } from "./components/settings/DevicesTab";
import { LoyaltyTab } from "./components/settings/LoyaltyTab";
import { NotificationsTab } from "./components/settings/NotificationsTab";
import { PaymentsTab } from "./components/settings/PaymentsTab";
import { PrintersTab } from "./components/settings/PrintersTab";
import { SalesTab } from "./components/settings/SalesTab";
import { StoreInfoTab } from "./components/settings/StoreInfoTab";
import { SyncTab } from "./components/settings/SyncTab";
import { TemplatesTab } from "./components/settings/TemplatesTab";
import { SETTINGS_MENU } from "./settings/constants";
import {
  INITIAL_ACTIVE_TAB,
  INITIAL_CUSTOMER_DISPLAY_TEXT,
  INITIAL_CUSTOMER_DISPLAY_WEBSITE,
  INITIAL_PAYMENT_SETTINGS,
  INITIAL_SALES_SETTINGS,
  INITIAL_SHOW_ORDER_INFO,
  INITIAL_STORE_INFO,
} from "./settings/initialState";
import type {
  PaymentSettings,
  SalesSettings,
  SettingTab,
  StoreInfo,
} from "./settings/types";

export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<SettingTab>(INITIAL_ACTIVE_TAB);
  const [isCustomerDisplayConfigOpen, setIsCustomerDisplayConfigOpen] =
    useState(false);

  const [customerDisplayText, setCustomerDisplayText] = useState(
    INITIAL_CUSTOMER_DISPLAY_TEXT,
  );
  const [customerDisplayWebsite, setCustomerDisplayWebsite] = useState(
    INITIAL_CUSTOMER_DISPLAY_WEBSITE,
  );
  const [showOrderInfo, setShowOrderInfo] = useState(INITIAL_SHOW_ORDER_INFO);

  const [salesSettings, setSalesSettings] = useState<SalesSettings>(
    INITIAL_SALES_SETTINGS,
  );

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(
    INITIAL_PAYMENT_SETTINGS,
  );

  const [storeInfo, setStoreInfo] = useState<StoreInfo>(INITIAL_STORE_INFO);

  const updateSalesSetting = useCallback(
    <K extends keyof SalesSettings>(key: K, value: SalesSettings[K]) => {
      setSalesSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updatePaymentSetting = useCallback(
    <K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) => {
      setPaymentSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updateStoreInfo = useCallback(
    <K extends keyof StoreInfo>(key: K, value: StoreInfo[K]) => {
      setStoreInfo((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  return (
    <div className="settings-screen">
      <nav className="settings-screen__sidebar">
        <h2 className="settings-screen__sidebar-title">Cài đặt</h2>
        <div className="settings-screen__menu">
          {SETTINGS_MENU.map((menu) => {
            const Icon = menu.icon;
            const isActive = activeTab === menu.key;

            return (
              <button
                key={menu.key}
                type="button"
                className={`settings-screen__menu-item ${
                  isActive ? "settings-screen__menu-item--active" : ""
                }`}
                onClick={() => setActiveTab(menu.key)}
              >
                <Icon size={18} />
                {menu.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="settings-screen__content">
        {activeTab === "storeInfo" ? (
          <StoreInfoTab
            storeInfo={storeInfo}
            onStoreInfoChange={updateStoreInfo}
          />
        ) : null}

        {activeTab === "sales" ? (
          <SalesTab
            salesSettings={salesSettings}
            onSalesToggle={updateSalesSetting}
          />
        ) : null}

        {activeTab === "payments" ? (
          <PaymentsTab
            paymentSettings={paymentSettings}
            onPaymentToggle={updatePaymentSetting}
          />
        ) : null}

        {activeTab === "printers" ? <PrintersTab /> : null}

        {activeTab === "templates" ? <TemplatesTab /> : null}

        {activeTab === "devices" ? (
          <DevicesTab
            onOpenCustomerDisplayConfig={() =>
              setIsCustomerDisplayConfigOpen(true)
            }
          />
        ) : null}

        {activeTab === "loyalty" ? <LoyaltyTab /> : null}

        {activeTab === "sync" ? <SyncTab /> : null}

        {activeTab === "notifications" ? <NotificationsTab /> : null}
      </main>

      <CustomerDisplayModal
        isOpen={isCustomerDisplayConfigOpen}
        customerDisplayText={customerDisplayText}
        setCustomerDisplayText={setCustomerDisplayText}
        customerDisplayWebsite={customerDisplayWebsite}
        setCustomerDisplayWebsite={setCustomerDisplayWebsite}
        showOrderInfo={showOrderInfo}
        setShowOrderInfo={setShowOrderInfo}
        onClose={() => setIsCustomerDisplayConfigOpen(false)}
      />
    </div>
  );
}
