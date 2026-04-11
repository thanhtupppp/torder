import { ipcMain } from "electron";
import { createOrder, listProducts } from "./db";
import type { CreateOrderPayload } from "./types";

export const IPC_CHANNELS = {
  PRODUCT_LIST: "product:list",
  ORDER_CREATE: "order:create",
} as const;

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
}
