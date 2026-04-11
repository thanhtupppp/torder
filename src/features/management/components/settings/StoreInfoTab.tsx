import { Store } from "lucide-react";
import type { StoreInfo } from "../../settings/types";

// ── Constants ─────────────────────────────────────────────────────────────────

type FieldConfig = {
  key: keyof StoreInfo;
  label: string;
  type?: string;
  required?: boolean;
};

const STORE_FIELDS: FieldConfig[][] = [
  // Row 1 — 2 cols
  [
    { key: "name", label: "Tên cửa hàng", required: true },
    { key: "phone", label: "Số điện thoại", required: true },
  ],
  // Row 2 — full width
  [{ key: "address", label: "Địa chỉ", required: true }],
  // Row 3 — 2 cols
  [
    { key: "email", label: "Email", type: "email" },
    { key: "wifi", label: "Thông tin WiFi (In trên bill)" },
  ],
];

// ── Component ─────────────────────────────────────────────────────────────────

type StoreInfoTabProps = {
  storeInfo: StoreInfo;
  onStoreInfoChange: (key: keyof StoreInfo, value: string) => void;
};

export function StoreInfoTab({
  storeInfo,
  onStoreInfoChange,
}: StoreInfoTabProps) {
  return (
    <div className="settings-screen__tab settings-screen__tab--fade-in">
      <div className="settings-screen__content-header">
        <h2>Thông tin cửa hàng</h2>
        <p>
          Thiết lập thông tin cơ bản dùng để hiển thị trên hóa đơn và hệ thống.
        </p>
      </div>

      <div className="settings-screen__panel">
        <div className="settings-screen__panel-header">
          <h3>Cơ bản</h3>
        </div>
        <div className="settings-screen__panel-body">
          {STORE_FIELDS.map((row) => (
            <div
              key={row.map((f) => f.key).join("-")}
              className={
                row.length > 1
                  ? "settings-screen__grid settings-screen__grid--two"
                  : undefined
              }
            >
              {row.map(({ key, label, type = "text", required }) => (
                <div key={key} className="settings-screen__field">
                  {/* ✅ htmlFor + id — click label focuses input */}
                  <label
                    htmlFor={`store-${key}`}
                    className="settings-screen__label"
                  >
                    {label}
                    {required && " *"}
                  </label>
                  <input
                    id={`store-${key}`}
                    type={type}
                    className="input"
                    value={storeInfo[key]}
                    onChange={(e) => onStoreInfoChange(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          ))}

          <div className="settings-screen__divider-top settings-screen__actions settings-screen__actions--end">
            <button type="button" className="btn primary">
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>

      <div className="settings-screen__panel settings-screen__stack-gap-lg">
        <div className="settings-screen__panel-header">
          <h3>Logo cửa hàng</h3>
        </div>
        <div className="settings-screen__logo-row">
          <div className="settings-screen__logo-box">
            <Store
              size={32}
              className="settings-screen__icon settings-screen__icon--muted"
            />
          </div>
          <div>
            <p className="settings-screen__help-text">
              Khuyên dùng ảnh vuông 500x500px, định dạng PNG/JPG. Max 5MB.
            </p>
            <button type="button" className="btn">
              Tải ảnh lên
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
