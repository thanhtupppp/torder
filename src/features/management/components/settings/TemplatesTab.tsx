import { FileText } from "lucide-react";

export function TemplatesTab() {
  return (
    <div className="settings-screen__tab settings-screen__tab--fade-in">
      <div className="settings-screen__content-header">
        <h2>Mẫu in (Templates)</h2>
        <p>
          Tuỳ chỉnh nội dung hiển thị trên hóa đơn, tem pha chế hoặc tem gửi đồ.
        </p>
      </div>

      <div className="settings-screen__panel settings-screen__template-layout">
        <div className="settings-screen__template-sidebar">
          <h3 className="settings-screen__template-title">Loại mẫu in</h3>
          <div className="settings-screen__template-buttons">
            <button
              className="btn ghost settings-screen__template-btn settings-screen__template-btn--active"
              type="button"
            >
              Mẫu hóa đơn K80
            </button>
            <button
              className="btn ghost settings-screen__template-btn"
              type="button"
            >
              Mẫu hóa đơn K58
            </button>
            <button
              className="btn ghost settings-screen__template-btn"
              type="button"
            >
              Mẫu tem dán trà sữa (50x30)
            </button>
          </div>
        </div>
        <div className="settings-screen__template-preview">
          <FileText size={48} className="settings-screen__icon--faint" />
          <p className="settings-screen__help-text">
            Màn hình thiết kế trực quan đang tải...
          </p>
        </div>
      </div>
    </div>
  );
}
