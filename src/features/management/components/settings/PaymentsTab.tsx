import type { PaymentSettings } from "../../settings/types";
import { SettingToggle } from "./SettingControls";

type PaymentsTabProps = {
  paymentSettings: PaymentSettings;
  onPaymentToggle: (key: keyof PaymentSettings, value: boolean) => void;
};

export function PaymentsTab({
  paymentSettings,
  onPaymentToggle,
}: PaymentsTabProps) {
  return (
    <div className="settings-screen__tab settings-screen__tab--fade-in">
      <div className="settings-screen__content-header">
        <h2>Phương thức thanh toán</h2>
        <p>
          Cấu hình các loại phương thức được phép sử dụng khi thu ngân tính
          tiền.
        </p>
      </div>

      <div className="settings-screen__panel">
        <div className="settings-screen__panel-header">
          <h3>Danh sách cho phép</h3>
        </div>
        <SettingToggle
          label="Tiền mặt"
          checked={paymentSettings.cash}
          onChange={(e) => onPaymentToggle("cash", e.target.checked)}
        />
        <SettingToggle
          label="Chuyển khoản (VietQR)"
          checked={paymentSettings.transfer}
          onChange={(e) => onPaymentToggle("transfer", e.target.checked)}
        />
        <SettingToggle
          label="Quẹt thẻ"
          checked={paymentSettings.card}
          onChange={(e) => onPaymentToggle("card", e.target.checked)}
        />
        <SettingToggle
          label="Ví điện tử"
          checked={paymentSettings.wallet}
          onChange={(e) => onPaymentToggle("wallet", e.target.checked)}
        />
        <SettingToggle
          label="Thanh toán bằng Điểm"
          checked={paymentSettings.point}
          onChange={(e) => onPaymentToggle("point", e.target.checked)}
        />
      </div>
    </div>
  );
}
