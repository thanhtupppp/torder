import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
  INITIAL_CUSTOMER_DISPLAY,
  INITIAL_PAYMENT_SETTINGS,
  INITIAL_SALES_SETTINGS,
  INITIAL_STORE_INFO,
} from "./settings/initialState";
import type {
  CustomerDisplayConfig,
  PaymentSettings,
  SalesSettings,
  SettingTab,
  StoreInfo,
} from "./settings/types";
import type { LicenseResult } from "../../shared/types";

function useCustomerDisplay() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<CustomerDisplayConfig>(
    INITIAL_CUSTOMER_DISPLAY,
  );

  const updateConfig = useCallback(
    <K extends keyof CustomerDisplayConfig>(
      key: K,
      value: CustomerDisplayConfig[K],
    ) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  return {
    isOpen,
    open: useCallback(() => setIsOpen(true), []),
    close: useCallback(() => setIsOpen(false), []),
    config,
    updateConfig,
  };
}

export function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<SettingTab>(INITIAL_ACTIVE_TAB);

  const customerDisplay = useCustomerDisplay();

  const [salesSettings, setSalesSettings] = useState<SalesSettings>(
    INITIAL_SALES_SETTINGS,
  );
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(
    INITIAL_PAYMENT_SETTINGS,
  );
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(INITIAL_STORE_INFO);

  const [licenseCode, setLicenseCode] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [hasLocalLicense, setHasLocalLicense] = useState(false);
  const [lastLicenseResult, setLastLicenseResult] =
    useState<LicenseResult | null>(null);

  useEffect(() => {
    const licenseApi = window.appApi?.license;
    if (!licenseApi?.hasLocalLicense) {
      setHasLocalLicense(false);
      return;
    }

    void licenseApi
      .hasLocalLicense()
      .then((res) => setHasLocalLicense(res.hasLocalLicense))
      .catch(() => setHasLocalLicense(false));
  }, []);

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

  const activateLicense = useCallback(async () => {
    const licenseApi = window.appApi?.license;
    if (!licenseApi?.activate || !licenseApi?.hasLocalLicense) {
      setLastLicenseResult({
        ok: false,
        httpCode: 0,
        message: "License API chưa sẵn sàng. Vui lòng khởi động lại ứng dụng.",
        data: {},
      });
      return;
    }

    setIsActivating(true);
    try {
      const res = await licenseApi.activate({
        licenseCode: licenseCode.trim(),
        clientName: storeInfo.name.trim(),
      });
      setLastLicenseResult(res);
      const local = await licenseApi.hasLocalLicense();
      setHasLocalLicense(local.hasLocalLicense);
      window.dispatchEvent(new CustomEvent("license-status-changed"));
    } finally {
      setIsActivating(false);
    }
  }, [licenseCode, storeInfo.name]);

  const verifyLicense = useCallback(async () => {
    const licenseApi = window.appApi?.license;
    if (!licenseApi?.verify || !licenseApi?.hasLocalLicense) {
      setLastLicenseResult({
        ok: false,
        httpCode: 0,
        message: "License API chưa sẵn sàng. Vui lòng khởi động lại ứng dụng.",
        data: {},
      });
      return;
    }

    setIsVerifying(true);
    try {
      const res = await licenseApi.verify({
        clientName: storeInfo.name.trim(),
      });
      setLastLicenseResult(res);
      const local = await licenseApi.hasLocalLicense();
      setHasLocalLicense(local.hasLocalLicense);
      window.dispatchEvent(new CustomEvent("license-status-changed"));
    } finally {
      setIsVerifying(false);
    }
  }, [storeInfo.name]);

  const deactivateLicense = useCallback(async () => {
    const licenseApi = window.appApi?.license;
    if (!licenseApi?.deactivate || !licenseApi?.hasLocalLicense) {
      setLastLicenseResult({
        ok: false,
        httpCode: 0,
        message: "License API chưa sẵn sàng. Vui lòng khởi động lại ứng dụng.",
        data: {},
      });
      return;
    }

    setIsDeactivating(true);
    try {
      const res = await licenseApi.deactivate({
        clientName: storeInfo.name.trim(),
      });
      setLastLicenseResult(res);
      const local = await licenseApi.hasLocalLicense();
      setHasLocalLicense(local.hasLocalLicense);
      window.dispatchEvent(new CustomEvent("license-status-changed"));
    } finally {
      setIsDeactivating(false);
    }
  }, [storeInfo.name]);

  const TAB_CONTENT = useMemo<Partial<Record<SettingTab, ReactNode>>>(
    () => ({
      storeInfo: (
        <StoreInfoTab
          storeInfo={storeInfo}
          onStoreInfoChange={updateStoreInfo}
          licenseCode={licenseCode}
          onLicenseCodeChange={setLicenseCode}
          isActivating={isActivating}
          isVerifying={isVerifying}
          isDeactivating={isDeactivating}
          hasLocalLicense={hasLocalLicense}
          lastLicenseResult={lastLicenseResult}
          onActivate={activateLicense}
          onVerify={verifyLicense}
          onDeactivate={deactivateLicense}
        />
      ),
      sales: (
        <SalesTab
          salesSettings={salesSettings}
          onSalesToggle={updateSalesSetting}
        />
      ),
      payments: (
        <PaymentsTab
          paymentSettings={paymentSettings}
          onPaymentToggle={updatePaymentSetting}
        />
      ),
      printers: <PrintersTab />,
      templates: <TemplatesTab />,
      devices: (
        <DevicesTab onOpenCustomerDisplayConfig={customerDisplay.open} />
      ),
      loyalty: <LoyaltyTab />,
      sync: <SyncTab />,
      notifications: <NotificationsTab />,
    }),
    [
      storeInfo,
      updateStoreInfo,
      licenseCode,
      isActivating,
      isVerifying,
      isDeactivating,
      hasLocalLicense,
      lastLicenseResult,
      activateLicense,
      verifyLicense,
      deactivateLicense,
      salesSettings,
      updateSalesSetting,
      paymentSettings,
      updatePaymentSetting,
      customerDisplay.open,
    ],
  );

  return (
    <div className="settings-screen">
      <nav className="settings-screen__sidebar" aria-label="Điều hướng cài đặt">
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
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActiveTab(menu.key)}
              >
                <Icon size={18} aria-hidden="true" />
                {menu.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="settings-screen__content">
        {TAB_CONTENT[activeTab] ?? null}
      </main>

      <CustomerDisplayModal
        isOpen={customerDisplay.isOpen}
        config={customerDisplay.config}
        onConfigChange={customerDisplay.updateConfig}
        onClose={customerDisplay.close}
      />
    </div>
  );
}
