import type { PaymentSettings } from "../../settings/types";
import { SettingToggle } from "./SettingControls";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAYMENT_METHODS: Array<{ key: keyof PaymentSettings; label: string }> = [
  { key: "cash", label: "Tiền mặt" },
  { key: "transfer", label: "Chuyển khoản (VietQR)" },
  { key: "card", label: "Quẹt thẻ" },
  { key: "wallet", label: "Ví điện tử" },
  { key: "point", label: "Thanh toán bằng Điểm" },
];

// ── Component ─────────────────────────────────────────────────────────────────

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
        {/* ✅ Data-driven — thêm method chỉ cần 1 object trong PAYMENT_METHODS */}
        {PAYMENT_METHODS.map(({ key, label }) => (
          <SettingToggle
            key={key}
            label={label}
            checked={paymentSettings[key]}
            onChange={(v) => onPaymentToggle(key, v)}
          />
        ))}
      </div>
    </div>
  );
}
