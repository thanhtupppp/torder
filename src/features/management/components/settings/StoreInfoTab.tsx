import { Store } from "lucide-react";
import type { StoreInfo } from "../../settings/types";

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
          <div className="settings-screen__grid settings-screen__grid--two">
            <div className="settings-screen__field">
              <label className="settings-screen__label">Tên cửa hàng *</label>
              <input
                type="text"
                className="input"
                value={storeInfo.name}
                onChange={(e) => onStoreInfoChange("name", e.target.value)}
              />
            </div>
            <div className="settings-screen__field">
              <label className="settings-screen__label">Số điện thoại *</label>
              <input
                type="text"
                className="input"
                value={storeInfo.phone}
                onChange={(e) => onStoreInfoChange("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="settings-screen__field">
            <label className="settings-screen__label">Địa chỉ *</label>
            <input
              type="text"
              className="input"
              value={storeInfo.address}
              onChange={(e) => onStoreInfoChange("address", e.target.value)}
            />
          </div>

          <div className="settings-screen__grid settings-screen__grid--two">
            <div className="settings-screen__field">
              <label className="settings-screen__label">Email</label>
              <input
                type="email"
                className="input"
                value={storeInfo.email}
                onChange={(e) => onStoreInfoChange("email", e.target.value)}
              />
            </div>
            <div className="settings-screen__field">
              <label className="settings-screen__label">
                Thông tin WiFi (In trên bill)
              </label>
              <input
                type="text"
                className="input"
                value={storeInfo.wifi}
                onChange={(e) => onStoreInfoChange("wifi", e.target.value)}
              />
            </div>
          </div>

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
