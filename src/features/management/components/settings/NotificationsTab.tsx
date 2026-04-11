import { SettingToggle } from "./SettingControls";

export function NotificationsTab() {
  return (
    <div className="settings-screen__tab settings-screen__tab--fade-in">
      <div className="settings-screen__content-header">
        <h2>Thông báo hệ thống</h2>
        <p>Các cảnh báo popup hoặc chuông báo từ ứng dụng.</p>
      </div>

      <div className="settings-screen__panel">
        <div className="settings-screen__panel-header">
          <h3>Kênh thông báo</h3>
        </div>
        <SettingToggle
          label="Âm thanh khi có đơn hàng mới"
          description="Phát âm thanh báo hiệu khi nền tảng đổ đơn về."
          checked
          onChange={() => {}}
        />
        <SettingToggle
          label="Cảnh báo tồn kho thấp"
          description="Hiện popup màu đỏ khi nguyên liệu dưới mức an toàn."
          checked
          onChange={() => {}}
        />
      </div>
    </div>
  );
}
