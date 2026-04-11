import { Printer } from "lucide-react";
import { SettingToggle } from "./SettingControls";

export function PrintersTab() {
  return (
    <div className="settings-screen__tab settings-screen__tab--fade-in">
      <div className="settings-screen__content-header settings-screen__header-row">
        <div>
          <h2>Máy in (Printers)</h2>
          <p>Kết nối máy in qua LAN, Bluetooth hoặc cáp USB.</p>
        </div>
        <button type="button" className="btn primary">
          Thêm máy in
        </button>
      </div>

      <div className="settings-screen__panel">
        <div className="settings-screen__panel-header">
          <h3>Danh sách máy in đang kết nối</h3>
        </div>
        <div className="settings-screen__panel-body">
          <div className="settings-screen__printer-item">
            <div className="settings-screen__printer-left">
              <div className="settings-screen__printer-dot">
                <Printer size={20} className="settings-screen__icon--success" />
              </div>
              <div>
                <h4 className="settings-screen__printer-title">
                  Máy in quầy Thu ngân (XPrinter 80)
                </h4>
                <p className="settings-screen__printer-sub">
                  Kết nối: USB • Vai trò: In hóa đơn
                </p>
              </div>
            </div>
            <button type="button" className="btn ghost">
              Cấu hình
            </button>
          </div>
        </div>
      </div>

      <div className="settings-screen__panel settings-screen__stack-gap-lg">
        <div className="settings-screen__panel-header">
          <h3>Cấu hình luồng in tự động</h3>
        </div>
        <SettingToggle
          label="Bật in hóa đơn thanh toán"
          description="Tự động đẩy lệnh in bill khi thanh toán xong"
          checked
          onChange={() => {}}
        />
        <SettingToggle
          label="Bật in tem món"
          description="Cắt tách bill in theo số lượng món vào máy in tem nhãn."
          checked={false}
          onChange={() => {}}
        />
        <SettingToggle
          label="Bật in bếp"
          description="Đẩy lệnh in xuống máy in khu vực bếp."
          checked
          onChange={() => {}}
        />
      </div>
    </div>
  );
}
