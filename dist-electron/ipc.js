"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = void 0;
exports.registerIpcHandlers = registerIpcHandlers;
const electron_1 = require("electron");
const db_1 = require("./db");
exports.IPC_CHANNELS = {
    PRODUCT_LIST: "product:list",
    ORDER_CREATE: "order:create",
};
function registerIpcHandlers() {
    electron_1.ipcMain.handle(exports.IPC_CHANNELS.PRODUCT_LIST, () => {
        return (0, db_1.listProducts)();
    });
    electron_1.ipcMain.handle(exports.IPC_CHANNELS.ORDER_CREATE, (_, payload) => {
        return (0, db_1.createOrder)(payload);
    });
}
