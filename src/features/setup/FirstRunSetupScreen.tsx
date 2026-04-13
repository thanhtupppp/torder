import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../constants/routes";
import type { LicenseResult } from "../../shared/types";

type Step = 1 | 2 | 3;

type Props = {
  onCompleted: () => Promise<void>;
};

const PHONE_REGEX = /^(\+84|0)(3|5|7|8|9)\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePin(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}

function validatePassword(password: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

export function FirstRunSetupScreen({ onCompleted }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  const [licenseCode, setLicenseCode] = useState("");
  const [storeNameForLicense, setStoreNameForLicense] = useState("");
  const [licenseResult, setLicenseResult] = useState<LicenseResult | null>(
    null,
  );
  const [licenseActivated, setLicenseActivated] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const [adminName, setAdminName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [storeWifi, setStoreWifi] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canGoStep2 = licenseActivated;
  const canGoStep3 = Boolean(
    adminName.trim() &&
    PHONE_REGEX.test(adminPhone.trim()) &&
    validatePin(adminPin.trim()) &&
    validatePassword(adminPassword.trim()),
  );
  const canFinish = Boolean(
    storeName.trim() &&
    storeAddress.trim() &&
    PHONE_REGEX.test(storePhone.trim()) &&
    (!storeEmail.trim() || EMAIL_REGEX.test(storeEmail.trim())),
  );

  const progressText = useMemo(() => {
    if (step === 1) return "Bước 1/3: Kích hoạt bản quyền";
    if (step === 2) return "Bước 2/3: Tạo tài khoản quản trị";
    return "Bước 3/3: Thông tin cửa hàng";
  }, [step]);

  async function handleActivate() {
    if (!licenseCode.trim() || !storeNameForLicense.trim()) {
      setLicenseResult({
        ok: false,
        httpCode: 0,
        message: "Vui lòng nhập mã kích hoạt và tên khách hàng.",
        data: {},
      });
      return;
    }

    const api = window.appApi?.license;
    if (!api?.activate) {
      setLicenseResult({
        ok: false,
        httpCode: 0,
        message: "License API chưa sẵn sàng. Vui lòng khởi động lại ứng dụng.",
        data: {},
      });
      return;
    }

    setIsActivating(true);
    try {
      const res = await api.activate({
        licenseCode: licenseCode.trim(),
        clientName: storeNameForLicense.trim(),
      });
      setLicenseResult(res);
      setLicenseActivated(Boolean(res.ok));
      if (res.ok && !storeName.trim()) {
        setStoreName(storeNameForLicense.trim());
      }
      window.dispatchEvent(new CustomEvent("license-status-changed"));
    } finally {
      setIsActivating(false);
    }
  }

  async function handleFinish() {
    const setupApi = window.appApi?.setup;
    if (!setupApi?.complete) {
      setSaveError("Setup API chưa sẵn sàng. Vui lòng khởi động lại ứng dụng.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await setupApi.complete({
        adminName: adminName.trim(),
        adminPhone: adminPhone.trim(),
        adminPin: adminPin.trim(),
        adminPassword: adminPassword.trim(),
        storeName: storeName.trim(),
        storeAddress: storeAddress.trim(),
        storePhone: storePhone.trim(),
        storeEmail: storeEmail.trim(),
        storeWifi: storeWifi.trim(),
      });

      await onCompleted();
      navigate(APP_ROUTES.sales, { replace: true });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể hoàn tất thiết lập.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="settings-screen"
      style={{ maxWidth: 980, margin: "0 auto", paddingTop: 24 }}
    >
      <aside className="settings-screen__sidebar">
        <h2 className="settings-screen__sidebar-title">Thiết lập ban đầu</h2>
        <div className="settings-screen__menu">
          {[1, 2, 3].map((num) => {
            const isActive = step === num;
            const done = step > num;
            return (
              <button
                key={num}
                type="button"
                className={`settings-screen__menu-item ${isActive ? "settings-screen__menu-item--active" : ""}`}
                disabled={!done && num !== step}
                onClick={() => (done ? setStep(num as Step) : undefined)}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    display: "inline-grid",
                    placeItems: "center",
                    background: done
                      ? "#16a34a"
                      : isActive
                        ? "#2563eb"
                        : "#cbd5e1",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {num}
                </span>
                {num === 1 && "Kích hoạt bản quyền"}
                {num === 2 && "Tạo admin"}
                {num === 3 && "Thông tin cửa hàng"}
              </button>
            );
          })}
        </div>
      </aside>

      <main className="settings-screen__content">
        <section className="settings-screen__panel settings-screen__tab settings-screen__tab--fade-in">
          <div className="settings-screen__panel-header">
            <h3>{progressText}</h3>
          </div>
          <div className="settings-screen__panel-body">
            {step === 1 && (
              <>
                <div className="settings-screen__field">
                  <label className="settings-screen__label">
                    Tên khách hàng / cửa hàng
                  </label>
                  <input
                    value={storeNameForLicense}
                    onChange={(e) => setStoreNameForLicense(e.target.value)}
                    placeholder="Ví dụ: Quán Cà Phê Mộc"
                  />
                </div>

                <div className="settings-screen__field">
                  <label className="settings-screen__label">Mã kích hoạt</label>
                  <input
                    value={licenseCode}
                    onChange={(e) => setLicenseCode(e.target.value)}
                    placeholder="Nhập key kích hoạt"
                  />
                </div>

                <div className="settings-screen__actions">
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={handleActivate}
                    disabled={isActivating}
                  >
                    {isActivating ? "Đang kích hoạt..." : "Kích hoạt"}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    disabled={!canGoStep2}
                    onClick={() => setStep(2)}
                  >
                    Tiếp tục
                  </button>
                </div>

                {licenseResult && (
                  <p
                    className="settings-screen__help-text"
                    style={{ color: licenseResult.ok ? "#166534" : "#b91c1c" }}
                  >
                    {licenseResult.message}
                  </p>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <div className="settings-screen__grid settings-screen__grid--two">
                  <div className="settings-screen__field">
                    <label className="settings-screen__label">
                      Họ tên quản trị viên
                    </label>
                    <input
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                    />
                  </div>
                  <div className="settings-screen__field">
                    <label className="settings-screen__label">
                      Số điện thoại
                    </label>
                    <input
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      placeholder="0xxxxxxxxx"
                    />
                    {adminPhone.trim() &&
                      !PHONE_REGEX.test(adminPhone.trim()) && (
                        <p
                          className="settings-screen__help-text"
                          style={{ color: "#b91c1c" }}
                        >
                          Số điện thoại không hợp lệ (định dạng VN).
                        </p>
                      )}
                  </div>
                  <div className="settings-screen__field">
                    <label className="settings-screen__label">
                      PIN đăng nhập (4-8 số)
                    </label>
                    <input
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      type="password"
                    />
                    {adminPin.trim() && !validatePin(adminPin.trim()) && (
                      <p
                        className="settings-screen__help-text"
                        style={{ color: "#b91c1c" }}
                      >
                        PIN phải gồm 4 đến 8 chữ số.
                      </p>
                    )}
                  </div>
                  <div className="settings-screen__field">
                    <label className="settings-screen__label">
                      Mật khẩu admin
                    </label>
                    <input
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      type="password"
                    />
                    {adminPassword.trim() &&
                      !validatePassword(adminPassword.trim()) && (
                        <p
                          className="settings-screen__help-text"
                          style={{ color: "#b91c1c" }}
                        >
                          Mật khẩu tối thiểu 8 ký tự, gồm chữ và số.
                        </p>
                      )}
                  </div>
                </div>

                <div className="settings-screen__actions">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setStep(1)}
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={!canGoStep3}
                    onClick={() => setStep(3)}
                  >
                    Tiếp tục
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="settings-screen__grid settings-screen__grid--two">
                  <div className="settings-screen__field">
                    <label className="settings-screen__label">
                      Tên cửa hàng
                    </label>
                    <input
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                    />
                  </div>
                  <div className="settings-screen__field">
                    <label className="settings-screen__label">
                      Số điện thoại cửa hàng
                    </label>
                    <input
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="0xxxxxxxxx"
                    />
                    {storePhone.trim() &&
                      !PHONE_REGEX.test(storePhone.trim()) && (
                        <p
                          className="settings-screen__help-text"
                          style={{ color: "#b91c1c" }}
                        >
                          Số điện thoại cửa hàng không hợp lệ.
                        </p>
                      )}
                  </div>
                  <div
                    className="settings-screen__field"
                    style={{ gridColumn: "1 / -1" }}
                  >
                    <label className="settings-screen__label">Địa chỉ</label>
                    <input
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                    />
                  </div>
                  <div className="settings-screen__field">
                    <label className="settings-screen__label">Email</label>
                    <input
                      value={storeEmail}
                      onChange={(e) => setStoreEmail(e.target.value)}
                      placeholder="email@domain.com"
                    />
                    {storeEmail.trim() &&
                      !EMAIL_REGEX.test(storeEmail.trim()) && (
                        <p
                          className="settings-screen__help-text"
                          style={{ color: "#b91c1c" }}
                        >
                          Email không đúng định dạng.
                        </p>
                      )}
                  </div>
                  <div className="settings-screen__field">
                    <label className="settings-screen__label">Wifi</label>
                    <input
                      value={storeWifi}
                      onChange={(e) => setStoreWifi(e.target.value)}
                    />
                  </div>
                </div>

                {saveError && (
                  <p
                    className="settings-screen__help-text"
                    style={{ color: "#b91c1c" }}
                  >
                    {saveError}
                  </p>
                )}

                <div className="settings-screen__actions">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setStep(2)}
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={!canFinish || isSaving}
                    onClick={handleFinish}
                  >
                    {isSaving ? "Đang lưu..." : "Hoàn tất thiết lập"}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
