import type { SalesSettings } from "../../settings/types";
import { SettingAction, SettingToggle } from "./SettingControls";

type SalesTabProps = {
  salesSettings: SalesSettings;
  onSalesToggle: (key: keyof SalesSettings, value: boolean) => void;
};

export function SalesTab({ salesSettings, onSalesToggle }: SalesTabProps) {
  return (
    <div className="settings-screen__tab settings-screen__tab--fade-in">
      <div className="settings-screen__content-header">
        <h2>Môi trường Bán hàng</h2>
        <p>
          Tuỳ chỉnh các chức năng tạo đơn và quy trình xử lý tại quầy Thu ngân.
        </p>
      </div>

      <div className="settings-screen__panel">
        <div className="settings-screen__panel-header">
          <h3>Quy trình bán hàng & Tạo đơn</h3>
        </div>
        <SettingToggle
          label="Bắt buộc Mở ca / Kết ca"
          description="Yêu cầu nhân viên thu ngân thực hiện mở ca để bắt đầu làm việc và kết ca khi kết thúc."
          checked={salesSettings.staffRequired}
          onChange={(e) => onSalesToggle("staffRequired", e.target.checked)}
        />
        <SettingToggle
          label="Bán lúc hết tồn kho"
          description="Cho phép giao dịch khi hệ thống báo số lượng tồn kho = 0."
          checked={salesSettings.allowNegativeStock}
          onChange={(e) =>
            onSalesToggle("allowNegativeStock", e.target.checked)
          }
        />
        <SettingAction
          label="Cách tính Thuế (VAT)"
          description="Định nghĩa cách tính thuế trước hay sau khi giảm giá."
          buttonText="Cài đặt Thuế"
          onClick={() => alert("Mở Modal thiết lập thuế")}
        />
      </div>

      <div className="settings-screen__panel settings-screen__stack-gap-lg">
        <div className="settings-screen__panel-header">
          <h3>Thanh toán & Xử lý</h3>
        </div>
        <SettingToggle
          label="Thanh toán nhanh"
          description="Bỏ qua cửa sổ xác nhận chi tiết tiền khách đưa, hoàn tất ngay đơn hàng."
          checked={salesSettings.fastCheckout}
          onChange={(e) => onSalesToggle("fastCheckout", e.target.checked)}
        />
        <SettingToggle
          label="Tự động in hóa đơn"
          description="Tự động đẩy lệnh in hóa đơn khi thanh toán thành công."
          checked={salesSettings.autoPrint}
          onChange={(e) => onSalesToggle("autoPrint", e.target.checked)}
        />
        <SettingToggle
          label="Tự động đánh dấu Hoàn Thành"
          description="Đơn sẽ tự động Hoàn Thành ngay khi thanh toán."
          checked={salesSettings.autoFinish}
          onChange={(e) => onSalesToggle("autoFinish", e.target.checked)}
        />
      </div>

      <div className="settings-screen__panel settings-screen__stack-gap-lg">
        <div className="settings-screen__panel-header">
          <h3>Giao diện (POS)</h3>
        </div>
        <SettingToggle
          label="Hiển thị ảnh sản phẩm"
          description="Tuỳ chỉnh giao diện hiển thị dạng ảnh hoặc dạng danh sách."
          checked={salesSettings.showImages}
          onChange={(e) => onSalesToggle("showImages", e.target.checked)}
        />
        <SettingToggle
          label="Cảnh báo chênh lệch giá"
          description="Báo động màn hình nếu thay đổi giá thủ công thấp hơn giá vốn."
          checked={salesSettings.showConfirmDialog}
          onChange={(e) => onSalesToggle("showConfirmDialog", e.target.checked)}
        />
      </div>
    </div>
  );
}
