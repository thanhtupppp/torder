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
};

contextBridge.exposeInMainWorld("appApi", api);
