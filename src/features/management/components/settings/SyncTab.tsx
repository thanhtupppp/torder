import { RefreshCcw } from "lucide-react";
import { SettingToggle } from "./SettingControls";

export function SyncTab() {
  return (
    <div className="settings-screen__tab settings-screen__tab--fade-in">
      <div className="settings-screen__content-header">
        <h2>Đồng bộ dữ liệu</h2>
        <p>Quản lý việc gửi nhận dữ liệu với máy chủ trung tâm.</p>
      </div>

      <div className="settings-screen__panel">
        <div className="settings-screen__panel-header">
          <h3>Tự động sao lưu</h3>
        </div>
        <SettingToggle
          label="Đồng bộ hóa đơn lên Cloud"
          description="Ngay sau khi đơn hàng thanh toán, hệ thống đẩy data lên máy chủ."
          checked
          onChange={() => {}}
        />
        <SettingToggle
          label="Tự động cập nhật Tồn kho"
          description="Làm mới số lượng hàng hóa từ các lệnh xuất/nhập của chi nhánh khác."
          checked
          onChange={() => {}}
        />
        <div className="settings-screen__sync-action-row">
          <button
            type="button"
            className="btn border settings-screen__btn-inline-icon"
          >
            <RefreshCcw size={16} /> Đồng bộ thủ công ngay
          </button>
        </div>
      </div>
    </div>
  );
}
