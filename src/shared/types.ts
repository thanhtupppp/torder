/**
 * Shared domain types used by the renderer (src/).
 *
 * NOTE: electron/types.ts intentionally duplicates Product, AppApi, and
 * CreateOrderPayload because tsconfig.electron.json compiles only the
 * electron/ directory (CommonJS, rootDir=electron) and cannot import from
 * src/. Keep both files in sync when these types change.
 */

export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
};

export type CreateOrderPayload = {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  note?: string;
};

export type LicenseResult = {
  ok: boolean;
  httpCode: number;
  message: string;
  data: Record<string, unknown>;
  hasLocalLicense?: boolean;
  licenseDataStored?: boolean;
};

export type LicenseStatus = {
  active: boolean;
  checkedAt: string | null;
  reason: string;
  graceRemainingDays: number | null;
};

export type AppGuardStatus = {
  canUseApp: boolean;
  reason: string;
  checkedAt: string | null;
};

export type SetupState = {
  isCompleted: boolean;
  hasAdmin: boolean;
  hasStoreInfo: boolean;
  hasLocalLicense: boolean;
};

export type CompleteInitialSetupPayload = {
  adminName: string;
  adminPhone: string;
  adminPin: string;
  adminPassword: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  storeWifi: string;
};

export type AppApi = {
  product: {
    list: () => Promise<Product[]>;
  };
  order: {
    create: (payload: CreateOrderPayload) => Promise<{ orderId: number }>;
  };
  license: {
    activate: (payload: {
      licenseCode: string;
      clientName: string;
    }) => Promise<LicenseResult>;
    verify: (payload: { clientName: string }) => Promise<LicenseResult>;
    deactivate: (payload: { clientName: string }) => Promise<LicenseResult>;
    hasLocalLicense: () => Promise<{ ok: true; hasLocalLicense: boolean }>;
    status: () => Promise<LicenseStatus>;
  };
  appGuard: {
    status: () => Promise<AppGuardStatus>;
  };
  setup: {
    getState: () => Promise<SetupState>;
    complete: (payload: CompleteInitialSetupPayload) => Promise<{ ok: true }>;
  };
  auth: {
    login: (payload: { phone: string; password: string }) => Promise<
      | {
          ok: true;
          message: string;
          user: {
            userId: string;
            displayName: string;
            role: "admin" | "manager" | "cashier";
            permissions: string[];
            isAuthenticated: true;
          };
        }
      | {
          ok: false;
          message: string;
        }
    >;
  };
};
