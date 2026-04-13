const os = require("node:os");
const Store = require("electron-store");
const { encryptJson, decryptJson } = require("./cryptoUtil");
const { licenseServer } = require("./config");

const store = new Store({
    name: "license-secure-store",
    clearInvalidConfig: true,
});

class LicenseService {
    constructor() {
        this.baseUrl = licenseServer.baseUrl.replace(/\/$/, "");
        this.apiKey = licenseServer.apiKey;
        this.productId = licenseServer.productId;
        this.verifyType = licenseServer.verifyType;
        this.timeoutMs = licenseServer.timeoutMs;
    }

    ensureConfig() {
        if (!this.baseUrl || !this.apiKey || !this.productId) {
            throw new Error("Missing LM config: baseUrl/apiKey/productId");
        }
    }

    machineId() {
        return `${os.hostname()}|${os.platform()}|${os.arch()}`;
    }

    appUrl() {
        return `electron://${os.hostname()}`;
    }

    appIp() {
        return "127.0.0.1";
    }

    defaultHeaders() {
        return {
            "Content-Type": "application/json",
            "X-API-KEY": this.apiKey,
            "X-API-URL": this.appUrl(),
            "X-API-IP": this.appIp(),
            "X-API-LANGUAGE": "en",
        };
    }

    async post(path, body) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}${path}`, {
                method: "POST",
                headers: this.defaultHeaders(),
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            const json = await response.json().catch(() => ({}));

            return {
                ok: response.ok && !!json?.is_active,
                httpCode: response.status,
                message: json?.message || "Unknown response",
                data: json,
            };
        } finally {
            clearTimeout(timeout);
        }
    }

    getStoredLicenseData(clientName) {
        const encryptedBlob = store.get("licenseBlob");
        if (!encryptedBlob) return null;

        const decrypted = decryptJson(
            encryptedBlob,
            this.machineId(),
            this.productId,
        );

        if (decrypted.clientName !== clientName) {
            return null;
        }

        return decrypted.licenseData;
    }

    saveLicenseData(clientName, licenseData) {
        const blob = encryptJson(
            {
                clientName,
                licenseData,
                savedAt: new Date().toISOString(),
            },
            this.machineId(),
            this.productId,
        );

        store.set("licenseBlob", blob);
    }

    clearLicense() {
        store.delete("licenseBlob");
    }

    async activate({ licenseCode, clientName }) {
        this.ensureConfig();

        const result = await this.post("/api/external/license/activate", {
            verify_type: this.verifyType,
            product_id: this.productId,
            license_code: licenseCode,
            client_name: clientName,
        });

        if (!result.ok) return result;

        const licenseData =
            result.data?.lic_response ||
            result.data?.data?.license_data ||
            null;

        if (!licenseData) {
            return {
                ok: false,
                httpCode: result.httpCode,
                message: "Activation succeeded but no license_data returned",
                data: result.data,
            };
        }

        this.saveLicenseData(clientName, licenseData);

        return {
            ...result,
            licenseDataStored: true,
        };
    }

    async verify({ clientName }) {
        this.ensureConfig();

        const licenseData = this.getStoredLicenseData(clientName);

        if (!licenseData) {
            return {
                ok: false,
                httpCode: 0,
                message: "No local license found for this client",
                data: {},
            };
        }

        return this.post("/api/external/license/verify", {
            product_id: this.productId,
            license_data: licenseData,
            client_name: clientName,
        });
    }

    async deactivate({ clientName }) {
        this.ensureConfig();

        const licenseData = this.getStoredLicenseData(clientName);

        if (!licenseData) {
            return {
                ok: false,
                httpCode: 0,
                message: "No local license found for this client",
                data: {},
            };
        }

        const result = await this.post("/api/external/license/deactivate", {
            product_id: this.productId,
            license_data: licenseData,
            client_name: clientName,
        });

        if (result.ok) {
            this.clearLicense();
        }

        return result;
    }

    hasLocalLicense() {
        return !!store.get("licenseBlob");
    }
}

module.exports = {
    LicenseService,
};
