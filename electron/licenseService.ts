import crypto from "node:crypto";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import type { LicensePayload, LicenseResult } from "./types";

type LicenseServerConfig = {
  baseUrl: string;
  apiKey: string;
  productId: string;
  verifyType: string;
  timeoutMs: number;
  graceDays: number;
};

type EncryptedBlob = {
  iv: string;
  tag: string;
  data: string;
};

type StoredLicense = {
  clientName: string;
  licenseData: unknown;
  savedAt: string;
  lastVerifiedAt?: string | null;
};

export type LicenseStatus = {
  active: boolean;
  checkedAt: string | null;
  reason: string;
  graceRemainingDays: number | null;
};

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

const licenseServer: LicenseServerConfig = {
  baseUrl: process.env.LM_CLIENT_BASE_URL || "https://license.com.vn",
  apiKey: process.env.LM_CLIENT_API_KEY || "",
  productId: process.env.LM_CLIENT_PRODUCT_ID || "",
  verifyType: process.env.LM_CLIENT_VERIFY_TYPE || "non_envato",
  timeoutMs: Number(process.env.LM_CLIENT_TIMEOUT_MS || 15000),
  graceDays: Number(process.env.LM_CLIENT_GRACE_DAYS || 3),
};

function machineFingerprint(): string {
  const interfaces = os.networkInterfaces();
  const macs = Object.values(interfaces)
    .flat()
    .filter((i): i is NonNullable<typeof i> => Boolean(i))
    .filter((i) => !i.internal && i.mac && i.mac !== "00:00:00:00:00:00")
    .map((i) => i.mac)
    .sort()
    .join("|");

  const base = [
    os.hostname(),
    os.platform(),
    os.release(),
    os.arch(),
    os.cpus()?.[0]?.model || "",
    process.env.COMPUTERNAME || "",
    macs,
  ].join("||");

  return crypto.createHash("sha256").update(base).digest("hex");
}

function buildKey(machineId: string, productId: string) {
  return crypto
    .createHash("sha256")
    .update(`lm:${machineId}:${productId}`)
    .digest();
}

function encryptJson(
  payload: StoredLicense,
  machineId: string,
  productId: string,
): EncryptedBlob {
  const key = buildKey(machineId, productId);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv);

  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  };
}

function decryptJson(
  blob: EncryptedBlob,
  machineId: string,
  productId: string,
): StoredLicense {
  const key = buildKey(machineId, productId);
  const iv = Buffer.from(blob.iv, "base64");
  const tag = Buffer.from(blob.tag, "base64");
  const encrypted = Buffer.from(blob.data, "base64");

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8")) as StoredLicense;
}

export class LicenseService {
  private readonly storagePath: string;
  private status: LicenseStatus = {
    active: false,
    checkedAt: null,
    reason: "UNINITIALIZED",
    graceRemainingDays: null,
  };

  constructor() {
    this.storagePath = path.join(
      app.getPath("userData"),
      "license.secure.json",
    );
  }

  private machineId() {
    return machineFingerprint();
  }

  private ensureConfig() {
    if (
      !licenseServer.baseUrl ||
      !licenseServer.apiKey ||
      !licenseServer.productId
    ) {
      throw new Error("Missing LM config: baseUrl/apiKey/productId");
    }
  }

  private appUrl() {
    return `electron://${os.hostname()}`;
  }

  private appIp() {
    return "127.0.0.1";
  }

  private defaultHeaders() {
    return {
      "Content-Type": "application/json",
      "X-API-KEY": licenseServer.apiKey,
      "X-API-URL": this.appUrl(),
      "X-API-IP": this.appIp(),
      "X-API-LANGUAGE": "en",
    };
  }

  private setStatus(
    active: boolean,
    reason: string,
    graceRemainingDays: number | null = null,
  ) {
    this.status = {
      active,
      checkedAt: new Date().toISOString(),
      reason,
      graceRemainingDays,
    };
  }

  getStatus() {
    return this.status;
  }

  private getGraceRemainingDays(lastVerifiedAt?: string | null) {
    if (!lastVerifiedAt) return 0;

    const verifiedAt = new Date(lastVerifiedAt).getTime();
    if (!Number.isFinite(verifiedAt)) return 0;

    const now = Date.now();
    const graceMs = licenseServer.graceDays * 24 * 60 * 60 * 1000;
    const remainingMs = graceMs - (now - verifiedAt);

    if (remainingMs <= 0) return 0;
    return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  }

  private withinGracePeriod(lastVerifiedAt?: string | null) {
    return this.getGraceRemainingDays(lastVerifiedAt) > 0;
  }

  private async post(
    pathName: string,
    body: Record<string, unknown>,
  ): Promise<LicenseResult> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      licenseServer.timeoutMs,
    );

    try {
      const response = await fetch(
        `${licenseServer.baseUrl.replace(/\/$/, "")}${pathName}`,
        {
          method: "POST",
          headers: this.defaultHeaders(),
          body: JSON.stringify(body),
          signal: controller.signal,
        },
      );

      const json = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;

      return {
        ok: response.ok && Boolean(json?.is_active),
        httpCode: response.status,
        message: (json?.message as string) || "Unknown response",
        data: json,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private readLocal(): StoredLicense | null {
    if (!fs.existsSync(this.storagePath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(this.storagePath, "utf-8");
      const blob = JSON.parse(raw) as EncryptedBlob;
      return decryptJson(blob, this.machineId(), licenseServer.productId);
    } catch {
      return null;
    }
  }

  private saveLocal(payload: StoredLicense) {
    const blob = encryptJson(
      payload,
      this.machineId(),
      licenseServer.productId,
    );
    fs.writeFileSync(this.storagePath, JSON.stringify(blob, null, 2), "utf-8");
  }

  private clearLocal() {
    if (fs.existsSync(this.storagePath)) {
      fs.unlinkSync(this.storagePath);
    }
  }

  private async verifyStoredLicense() {
    this.ensureConfig();

    const local = this.readLocal();
    if (!local) {
      this.setStatus(false, "NO_LOCAL_LICENSE");
      return this.status;
    }

    try {
      const result = await this.post("/api/external/license/verify", {
        product_id: licenseServer.productId,
        license_data: local.licenseData,
        client_name: local.clientName,
      });

      if (result.ok) {
        this.saveLocal({ ...local, lastVerifiedAt: new Date().toISOString() });
        this.setStatus(true, "ACTIVE");
      } else {
        this.clearLocal();
        this.setStatus(false, result.message || "VERIFY_FAILED");
      }

      return this.status;
    } catch (error) {
      if (this.withinGracePeriod(local.lastVerifiedAt)) {
        this.setStatus(
          true,
          "OFFLINE_GRACE",
          this.getGraceRemainingDays(local.lastVerifiedAt),
        );
        return this.status;
      }

      this.setStatus(
        false,
        error instanceof Error ? error.message : "VERIFY_NETWORK_ERROR",
      );
      return this.status;
    }
  }

  async autoVerifyOnStart() {
    try {
      return await this.verifyStoredLicense();
    } catch (error) {
      this.setStatus(
        false,
        error instanceof Error ? error.message : "STARTUP_VERIFY_ERROR",
      );
      return this.status;
    }
  }

  async verifyPeriodically() {
    return this.verifyStoredLicense();
  }

  async activate({
    licenseCode,
    clientName,
  }: Required<Pick<LicensePayload, "licenseCode">> &
    Pick<LicensePayload, "clientName">): Promise<LicenseResult> {
    this.ensureConfig();

    const result = await this.post("/api/external/license/activate", {
      verify_type: licenseServer.verifyType,
      product_id: licenseServer.productId,
      license_code: licenseCode,
      client_name: clientName,
    });

    if (!result.ok) {
      this.setStatus(false, result.message || "ACTIVATE_FAILED");
      return result;
    }

    const licenseData =
      result.data?.lic_response ||
      (result.data?.data as Record<string, unknown> | undefined)
        ?.license_data ||
      null;

    if (!licenseData) {
      this.setStatus(false, "MISSING_LICENSE_DATA");
      return {
        ok: false,
        httpCode: result.httpCode,
        message: "Activation succeeded but no license_data returned",
        data: result.data,
      };
    }

    this.saveLocal({
      clientName,
      licenseData,
      savedAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
    });
    this.setStatus(true, "ACTIVE");

    return {
      ...result,
      licenseDataStored: true,
    };
  }

  async verify({
    clientName,
  }: Pick<LicensePayload, "clientName">): Promise<LicenseResult> {
    this.ensureConfig();

    const local = this.readLocal();
    if (!local || local.clientName !== clientName) {
      this.setStatus(false, "NO_LOCAL_LICENSE");
      return {
        ok: false,
        httpCode: 0,
        message: "No local license found for this client",
        data: {},
      };
    }

    try {
      const result = await this.post("/api/external/license/verify", {
        product_id: licenseServer.productId,
        license_data: local.licenseData,
        client_name: clientName,
      });

      if (result.ok) {
        this.saveLocal({ ...local, lastVerifiedAt: new Date().toISOString() });
        this.setStatus(true, "ACTIVE");
      } else {
        this.setStatus(false, result.message || "VERIFY_FAILED");
      }

      return result;
    } catch (error) {
      if (this.withinGracePeriod(local.lastVerifiedAt)) {
        const remainingDays = this.getGraceRemainingDays(local.lastVerifiedAt);
        this.setStatus(true, "OFFLINE_GRACE", remainingDays);
        return {
          ok: true,
          httpCode: 0,
          message: `Network unavailable - running in offline grace period (${remainingDays} day(s) left)`,
          data: {},
        };
      }

      this.setStatus(false, "VERIFY_NETWORK_ERROR");
      return {
        ok: false,
        httpCode: 0,
        message:
          error instanceof Error
            ? error.message
            : "Network unavailable when verifying",
        data: {},
      };
    }
  }

  async deactivate({
    clientName,
  }: Pick<LicensePayload, "clientName">): Promise<LicenseResult> {
    this.ensureConfig();

    const local = this.readLocal();
    if (!local || local.clientName !== clientName) {
      this.setStatus(false, "NO_LOCAL_LICENSE");
      return {
        ok: false,
        httpCode: 0,
        message: "No local license found for this client",
        data: {},
      };
    }

    const result = await this.post("/api/external/license/deactivate", {
      product_id: licenseServer.productId,
      license_data: local.licenseData,
      client_name: clientName,
    });

    if (result.ok) {
      this.clearLocal();
      this.setStatus(false, "DEACTIVATED");
    } else {
      this.setStatus(true, "ACTIVE");
    }

    return result;
  }

  hasLocalLicense() {
    return this.readLocal() !== null;
  }
}
