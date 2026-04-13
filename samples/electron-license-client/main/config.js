module.exports = {
    licenseServer: {
        baseUrl: process.env.LM_CLIENT_BASE_URL || "https://license.com.vn",
        apiKey: process.env.LM_CLIENT_API_KEY || "",
        productId: process.env.LM_CLIENT_PRODUCT_ID || "",
        verifyType: process.env.LM_CLIENT_VERIFY_TYPE || "non_envato",
        timeoutMs: Number(process.env.LM_CLIENT_TIMEOUT_MS || 15000),
    },
};
