const crypto = require("node:crypto");

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

function buildKey(machineId, productId) {
    return crypto
        .createHash("sha256")
        .update(`lm:${machineId}:${productId}`)
        .digest();
}

function encryptJson(payload, machineId, productId) {
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

function decryptJson(blob, machineId, productId) {
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
    return JSON.parse(decrypted.toString("utf8"));
}

module.exports = {
    encryptJson,
    decryptJson,
};
