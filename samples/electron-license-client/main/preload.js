const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("licenseApi", {
    activate: (payload) => ipcRenderer.invoke("license:activate", payload),
    verify: (payload) => ipcRenderer.invoke("license:verify", payload),
    deactivate: (payload) => ipcRenderer.invoke("license:deactivate", payload),
    hasLocalLicense: () => ipcRenderer.invoke("license:hasLocalLicense"),
});
