const statusEl = document.getElementById("status");
const rawEl = document.getElementById("raw");

const clientNameEl = document.getElementById("clientName");
const licenseCodeEl = document.getElementById("licenseCode");

function setStatus(ok, message) {
    statusEl.className = ok ? "ok" : "err";
    statusEl.textContent = message;
}

function setRaw(payload) {
    rawEl.textContent = JSON.stringify(payload, null, 2);
}

function getPayload(withLicenseCode = false) {
    const clientName = clientNameEl.value.trim();

    if (!clientName) {
        throw new Error("Client name is required");
    }

    if (!withLicenseCode) {
        return { clientName };
    }

    const licenseCode = licenseCodeEl.value.trim();

    if (!licenseCode) {
        throw new Error("License code is required for activation");
    }

    return { clientName, licenseCode };
}

async function run(action, fn) {
    try {
        const result = await fn();
        setStatus(!!result.ok, `${action}: ${result.message || "done"}`);
        setRaw(result);
    } catch (error) {
        setStatus(false, `${action}: ${error.message}`);
        setRaw({ ok: false, message: error.message });
    }
}

document.getElementById("btnActivate").addEventListener("click", () => {
    run("Activate", () => window.licenseApi.activate(getPayload(true)));
});

document.getElementById("btnVerify").addEventListener("click", () => {
    run("Verify", () => window.licenseApi.verify(getPayload(false)));
});

document.getElementById("btnDeactivate").addEventListener("click", () => {
    run("Deactivate", () => window.licenseApi.deactivate(getPayload(false)));
});

document.getElementById("btnCheckLocal").addEventListener("click", () => {
    run("Local check", () => window.licenseApi.hasLocalLicense());
});
