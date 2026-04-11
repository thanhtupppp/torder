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
          <h3>Quy trình bán hàng &amp; Tạo đơn</h3>
        </div>
        <SettingToggle
          label="Bắt buộc Mở ca / Kết ca"
          description="Yêu cầu nhân viên thu ngân thực hiện mở ca để bắt đầu làm việc và kết ca khi kết thúc."
          checked={salesSettings.staffRequired}
          onChange={(v) => onSalesToggle("staffRequired", v)}
        />
        <SettingToggle
          label="Bán lúc hết tồn kho"
          description="Cho phép giao dịch khi hệ thống báo số lượng tồn kho = 0."
          checked={salesSettings.allowNegativeStock}
          onChange={(v) => onSalesToggle("allowNegativeStock", v)}
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
          <h3>Thanh toán &amp; Xử lý</h3>
        </div>
        <SettingToggle
          label="Thanh toán nhanh"
          description="Bỏ qua cửa sổ xác nhận chi tiết tiền khách đưa, hoàn tất ngay đơn hàng."
          checked={salesSettings.fastCheckout}
          onChange={(v) => onSalesToggle("fastCheckout", v)}
        />
        <SettingToggle
          label="Tự động in hóa đơn"
          description="Tự động đẩy lệnh in hóa đơn khi thanh toán thành công."
          checked={salesSettings.autoPrint}
          onChange={(v) => onSalesToggle("autoPrint", v)}
        />
        <SettingToggle
          label="Tự động đánh dấu Hoàn Thành"
          description="Đơn sẽ tự động Hoàn Thành ngay khi thanh toán."
          checked={salesSettings.autoFinish}
          onChange={(v) => onSalesToggle("autoFinish", v)}
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
          onChange={(v) => onSalesToggle("showImages", v)}
        />
        <SettingToggle
          label="Cảnh báo chênh lệch giá"
          description="Báo động màn hình nếu thay đổi giá thủ công thấp hơn giá vốn."
          checked={salesSettings.showConfirmDialog}
          onChange={(v) => onSalesToggle("showConfirmDialog", v)}
        />
      </div>
    </div>
  );
}
