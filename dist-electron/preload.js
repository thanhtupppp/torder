"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const ipc_1 = require("./ipc");
const api = {
    product: {
        list: () => electron_1.ipcRenderer.invoke(ipc_1.IPC_CHANNELS.PRODUCT_LIST),
    },
    order: {
        create: (payload) => electron_1.ipcRenderer.invoke(ipc_1.IPC_CHANNELS.ORDER_CREATE, payload),
    },
};
electron_1.contextBridge.exposeInMainWorld("appApi", api);
