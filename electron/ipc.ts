import { ipcMain } from "electron";
import {
  authenticateEmployee,
  completeInitialSetup,
  createEmployee,
  createOrder,
  deleteEmployee,
  getInitialSetupState,
  listEmployees,
  listProducts,
  updateEmployee,
} from "./db";
import { LicenseService } from "./licenseService";
import type {
  CompleteInitialSetupPayload,
  CreateEmployeePayload,
  CreateOrderPayload,
  UpdateEmployeePayload,
} from "./types";

export const IPC_CHANNELS = {
  PRODUCT_LIST: "product:list",
  ORDER_CREATE: "order:create",
  LICENSE_ACTIVATE: "license:activate",
  LICENSE_VERIFY: "license:verify",
  LICENSE_DEACTIVATE: "license:deactivate",
  LICENSE_HAS_LOCAL: "license:hasLocalLicense",
  LICENSE_STATUS: "license:status",
  APP_GUARD_STATUS: "app:guardStatus",
  SETUP_GET_STATE: "setup:getState",
  SETUP_COMPLETE: "setup:complete",
  AUTH_LOGIN: "auth:login",
  EMPLOYEE_LIST: "employee:list",
  EMPLOYEE_CREATE: "employee:create",
  EMPLOYEE_UPDATE: "employee:update",
  EMPLOYEE_DELETE: "employee:delete",
} as const;

export const licenseService = new LicenseService();

export async function bootstrapLicense() {
  await licenseService.autoVerifyOnStart();
}

export function registerIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.PRODUCT_LIST, () => {
    return listProducts();
  });

  ipcMain.handle(
    IPC_CHANNELS.ORDER_CREATE,
    (_, payload: CreateOrderPayload) => {
      return createOrder(payload);
    },
  );

  ipcMain.handle(IPC_CHANNELS.LICENSE_ACTIVATE, async (_, payload) => {
    try {
      return await licenseService.activate(payload);
    } catch (error) {
      return {
        ok: false,
        httpCode: 0,
        message: error instanceof Error ? error.message : "Unknown error",
        data: {},
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.LICENSE_VERIFY, async (_, payload) => {
    try {
      return await licenseService.verify(payload);
    } catch (error) {
      return {
        ok: false,
        httpCode: 0,
        message: error instanceof Error ? error.message : "Unknown error",
        data: {},
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.LICENSE_DEACTIVATE, async (_, payload) => {
    try {
      return await licenseService.deactivate(payload);
    } catch (error) {
      return {
        ok: false,
        httpCode: 0,
        message: error instanceof Error ? error.message : "Unknown error",
        data: {},
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.LICENSE_HAS_LOCAL, () => {
    return {
      ok: true as const,
      hasLocalLicense: licenseService.hasLocalLicense(),
    };
  });

  ipcMain.handle(IPC_CHANNELS.LICENSE_STATUS, () => {
    return licenseService.getStatus();
  });

  ipcMain.handle(IPC_CHANNELS.APP_GUARD_STATUS, () => {
    const status = licenseService.getStatus();
    return {
      canUseApp: status.active,
      reason: status.reason,
      checkedAt: status.checkedAt,
    };
  });

  ipcMain.handle(IPC_CHANNELS.SETUP_GET_STATE, () => {
    const setup = getInitialSetupState();
    return {
      ...setup,
      hasLocalLicense: licenseService.hasLocalLicense(),
    };
  });

  ipcMain.handle(
    IPC_CHANNELS.SETUP_COMPLETE,
    (_, payload: CompleteInitialSetupPayload) => {
      completeInitialSetup(payload);
      return { ok: true as const };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.AUTH_LOGIN,
    (_, payload: { phone: string; password: string }) => {
      const auth = authenticateEmployee(payload.phone, payload.password);
      if (!auth) {
        return {
          ok: false as const,
          message: "Số điện thoại hoặc mật khẩu không đúng.",
        };
      }
      return {
        ok: true as const,
        message: "Đăng nhập thành công",
        user: auth,
      };
    },
  );

  ipcMain.handle(IPC_CHANNELS.EMPLOYEE_LIST, () => {
    return listEmployees();
  });

  ipcMain.handle(
    IPC_CHANNELS.EMPLOYEE_CREATE,
    (_, payload: CreateEmployeePayload) => {
      const employeeId = createEmployee(payload);
      return { ok: true as const, employeeId: String(employeeId) };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.EMPLOYEE_UPDATE,
    (_, payload: UpdateEmployeePayload) => {
      updateEmployee(payload);
      return { ok: true as const };
    },
  );

  ipcMain.handle(IPC_CHANNELS.EMPLOYEE_DELETE, (_, payload: { id: string }) => {
    deleteEmployee(payload.id);
    return { ok: true as const };
  });
}
