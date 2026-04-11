import { SettingAction, SettingToggle } from "./SettingControls";

type DevicesTabProps = {
  onOpenCustomerDisplayConfig: () => void;
};

export function DevicesTab({ onOpenCustomerDisplayConfig }: DevicesTabProps) {
  return (
    <div className="settings-screen__tab settings-screen__tab--fade-in">
      <div className="settings-screen__content-header">
        <h2>Thiết bị ngoại vi</h2>
        <p>
          Cấu hình kết nối phần cứng như cân điện tử, màn hình phụ, ngăn kéo
          tiền.
        </p>
      </div>

      <div className="settings-screen__panel">
        <div className="settings-screen__panel-header">
          <h3>Ngăn kéo đựng tiền</h3>
        </div>
        <SettingToggle
          label="Tự động mở khi thanh toán Tiền mặt"
          description="Gửi lệnh kích hoạt ngăn kéo tiền khi hoàn thành giao dịch tiền mặt."
          checked
          onChange={() => {}}
        />
      </div>

      <div className="settings-screen__panel settings-screen__stack-gap-lg">
        <div className="settings-screen__panel-header">
          <h3>Màn hình phụ</h3>
        </div>
        <SettingToggle
          label="Bật hiển thị cho khách hàng"
          description="Kết nối với màn hình phụ để khách theo dõi giỏ hàng."
          checked={false}
          onChange={() => {}}
        />
        <SettingAction
          label="Mẫu màn hình phụ"
          description="Thiết kế giao diện hiển thị bảng giá, logo và lời chào riêng."
          buttonText="Thiết kế Giao diện"
          onClick={onOpenCustomerDisplayConfig}
        />
      </div>
    </div>
  );
}
