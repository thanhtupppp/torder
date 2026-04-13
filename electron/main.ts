import path from "node:path";
import { app, BrowserWindow } from "electron";
import { initDb } from "./db";
import { bootstrapLicense, licenseService, registerIpcHandlers } from "./ipc";

const isDev = process.env.NODE_ENV === "development";
let verifyTimer: NodeJS.Timeout | null = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: "#f4f6fb",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
    return;
  }

  win.loadFile(path.join(__dirname, "../dist/index.html"));
}

function startPeriodicVerify() {
  const intervalMs = Number(
    process.env.LM_CLIENT_VERIFY_INTERVAL_MS || 6 * 60 * 60 * 1000,
  );

  if (verifyTimer) {
    clearInterval(verifyTimer);
  }

  verifyTimer = setInterval(() => {
    void licenseService.verifyPeriodically();
  }, intervalMs);
}

app.whenReady().then(async () => {
  initDb();
  await bootstrapLicense();
  registerIpcHandlers();
  startPeriodicVerify();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (verifyTimer) {
    clearInterval(verifyTimer);
    verifyTimer = null;
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});
