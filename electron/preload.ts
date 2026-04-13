import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "./ipc";
import type { AppApi, CreateOrderPayload } from "./types";

const api: AppApi = {
  product: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.PRODUCT_LIST),
  },
  order: {
    create: (payload: CreateOrderPayload) =>
      ipcRenderer.invoke(IPC_CHANNELS.ORDER_CREATE, payload),
  },
  license: {
    activate: (payload) =>
      ipcRenderer.invoke(IPC_CHANNELS.LICENSE_ACTIVATE, payload),
    verify: (payload) =>
      ipcRenderer.invoke(IPC_CHANNELS.LICENSE_VERIFY, payload),
    deactivate: (payload) =>
      ipcRenderer.invoke(IPC_CHANNELS.LICENSE_DEACTIVATE, payload),
    hasLocalLicense: () => ipcRenderer.invoke(IPC_CHANNELS.LICENSE_HAS_LOCAL),
    status: () => ipcRenderer.invoke(IPC_CHANNELS.LICENSE_STATUS),
  },
  appGuard: {
    status: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GUARD_STATUS),
  },
  setup: {
    getState: () => ipcRenderer.invoke(IPC_CHANNELS.SETUP_GET_STATE),
    complete: (payload) =>
      ipcRenderer.invoke(IPC_CHANNELS.SETUP_COMPLETE, payload),
  },
  auth: {
    login: (payload) => ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGIN, payload),
  },
  employee: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.EMPLOYEE_LIST),
    create: (payload) => ipcRenderer.invoke(IPC_CHANNELS.EMPLOYEE_CREATE, payload),
    update: (payload) => ipcRenderer.invoke(IPC_CHANNELS.EMPLOYEE_UPDATE, payload),
    remove: (payload) => ipcRenderer.invoke(IPC_CHANNELS.EMPLOYEE_DELETE, payload),
  },
};

contextBridge.exposeInMainWorld("appApi", api);
