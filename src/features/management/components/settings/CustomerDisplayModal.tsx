import { Store } from "lucide-react";
import type { CustomerDisplayConfig } from "../../settings/types";
import { SettingToggle } from "./SettingControls";

type CustomerDisplayModalProps = {
  isOpen: boolean;
  config: CustomerDisplayConfig;
  onConfigChange: <K extends keyof CustomerDisplayConfig>(
    key: K,
    value: CustomerDisplayConfig[K],
  ) => void;
  onClose: () => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function CustomerDisplayModal({
  isOpen,
  config,
  onConfigChange,
  onClose,
}: CustomerDisplayModalProps) {
  if (!isOpen) return null;

  return (
    <div className="settings-screen__overlay">
      <div className="settings-screen__modal settings-screen__modal--customer-display card">
        <header className="settings-screen__modal-header settings-screen__modal-header--row">
          <div className="settings-screen__modal-head-text">
            <h3>Cài đặt màn hình phụ</h3>
            <p>Tuỳ chỉnh giao diện màn hình thứ 2 cho khách hàng.</p>
          </div>
          <button
            type="button"
            className="settings-screen__close-btn"
            aria-label="Đóng"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        <div className="settings-screen__customer-modal-grid">
          {/* ── Form ──────────────────────────────────────────────────────── */}
          <div className="settings-screen__customer-modal-form">
            <div className="settings-screen__form-section">
              <h4 className="settings-screen__heading-4">Màn hình chờ</h4>
              <label className="settings-screen__field">
                <span className="settings-screen__label">Câu chào</span>
                <input
                  className="input"
                  value={config.text}
                  onChange={(e) => onConfigChange("text", e.target.value)}
                />
              </label>
              <label className="settings-screen__field settings-screen__stack-gap-md">
                <span className="settings-screen__label">Website / Footer</span>
                <input
                  className="input"
                  value={config.website}
                  onChange={(e) => onConfigChange("website", e.target.value)}
                />
              </label>
              <div className="settings-screen__upload-box settings-screen__stack-gap-lg">
                <p className="settings-screen__help-text">
                  Tải lên video nền / logo cửa hàng chạy khi không có giao dịch.
                </p>
                <button type="button" className="btn border">
                  Tải lên Banner / Video
                </button>
              </div>
            </div>

            <div className="settings-screen__form-section settings-screen__stack-gap-lg">
              <h4 className="settings-screen__heading-4">
                Màn hình thông tin hóa đơn
              </h4>
              {/* ✅ point-free — SettingToggle emit boolean trực tiếp */}
              <SettingToggle
                label="Hiển thị khung Đơn hàng"
                description="Hiện các món trong giỏ hàng để khách kiểm tra"
                checked={config.showOrderInfo}
                onChange={(v) => onConfigChange("showOrderInfo", v)}
              />
            </div>
          </div>

          {/* ── Preview ───────────────────────────────────────────────────── */}
          <div className="settings-screen__customer-modal-preview">
            <h4 className="settings-screen__preview-title">
              Xem trước thiết bị thật
            </h4>
            <div className="settings-screen__tablet-mock">
              <div className="settings-screen__tablet-screen">
                {/* ✅ && thay vì ? : null */}
                {config.showOrderInfo && (
                  <div className="settings-screen__tablet-order-panel">
                    <h5>Hóa đơn bán hàng</h5>
                    <div className="settings-screen__tablet-order-list">
                      <div className="settings-screen__tablet-order-item">
                        <span>1x Cà phê sữa</span>
                        <span>35.000đ</span>
                      </div>
                      <div className="settings-screen__tablet-order-item">
                        <span>2x Trà đào cam sả</span>
                        <span>90.000đ</span>
                      </div>
                      <div className="settings-screen__tablet-order-item">
                        <span>1x Bánh mì thập cẩm</span>
                        <span>25.000đ</span>
                      </div>
                    </div>
                    <div className="settings-screen__tablet-order-total">
                      <span>Tổng tiền:</span>
                      <span className="settings-screen__text-primary">
                        150.000đ
                      </span>
                    </div>
                  </div>
                )}

                <div className="settings-screen__tablet-right">
                  <div className="settings-screen__tablet-right-content">
                    <div className="settings-screen__tablet-store-icon-wrap">
                      <Store size={40} color="white" />
                    </div>
                    <h2>POSIORDER</h2>
                    <p>{config.text}</p>
                    <div className="settings-screen__tablet-footer">
                      {config.website}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="settings-screen__modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Huỷ
          </button>
          <button type="button" className="btn primary" onClick={onClose}>
            Lưu Giao Diện
          </button>
        </footer>
      </div>
    </div>
  );
}
