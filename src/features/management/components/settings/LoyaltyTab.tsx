import { SettingToggle } from "./SettingControls";

export function LoyaltyTab() {
  return (
    <div className="settings-screen__tab settings-screen__tab--fade-in">
      <div className="settings-screen__content-header">
        <h2>Tích điểm & Khuyến mãi</h2>
        <p>Cấu hình chương trình khách hàng thân thiết.</p>
      </div>

      <div className="settings-screen__panel">
        <div className="settings-screen__panel-header">
          <h3>Quy tắc tích/tiêu điểm</h3>
        </div>
        <div className="settings-screen__panel-body">
          <div className="settings-screen__inline-input-row">
            <span className="settings-screen__inline-label">
              Tỷ lệ tích điểm:
            </span>
            <input
              className="input settings-screen__w-100"
              defaultValue="10000"
            />
            <span>VNĐ =</span>
            <input className="input settings-screen__w-60" defaultValue="1" />
            <span>Điểm</span>
          </div>
          <div className="settings-screen__inline-input-row">
            <span className="settings-screen__inline-label">
              Tỷ lệ quy đổi:
            </span>
            <input className="input settings-screen__w-60" defaultValue="1" />
            <span>Điểm =</span>
            <input
              className="input settings-screen__w-100"
              defaultValue="100"
            />
            <span>VNĐ</span>
          </div>

          <div className="settings-screen__divider"></div>

          <SettingToggle
            label="Cho phép thanh toán bằng điểm"
            description="Hiển thị phương thức Tích Điểm ở cửa sổ thanh toán."
            checked
            onChange={() => {}}
          />

          <div className="settings-screen__actions settings-screen__actions--end">
            <button type="button" className="btn primary">
              Cập nhật quy tắc
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
