const { ipcMain } = require("electron");

function registerLicenseIpc(licenseService) {
    ipcMain.handle("license:activate", async (_event, payload) => {
        try {
            return await licenseService.activate(payload);
        } catch (error) {
            return {
                ok: false,
                httpCode: 0,
                message: error.message,
                data: {},
            };
        }
    });

    ipcMain.handle("license:verify", async (_event, payload) => {
        try {
            return await licenseService.verify(payload);
        } catch (error) {
            return {
                ok: false,
                httpCode: 0,
                message: error.message,
                data: {},
            };
        }
    });

    ipcMain.handle("license:deactivate", async (_event, payload) => {
        try {
            return await licenseService.deactivate(payload);
        } catch (error) {
            return {
                ok: false,
                httpCode: 0,
                message: error.message,
                data: {},
            };
        }
    });

    ipcMain.handle("license:hasLocalLicense", () => {
        return { ok: true, hasLocalLicense: licenseService.hasLocalLicense() };
    });
}

module.exports = {
    registerLicenseIpc,
};
