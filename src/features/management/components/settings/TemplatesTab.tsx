import { FileText } from "lucide-react";
import { useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const TEMPLATE_TYPES = [
  "Mẫu hóa đơn K80",
  "Mẫu hóa đơn K58",
  "Mẫu tem dán trà sữa (50x30)",
] as const;

type TemplateType = (typeof TEMPLATE_TYPES)[number];

// ── Component ─────────────────────────────────────────────────────────────────

export function TemplatesTab() {
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>(
    TEMPLATE_TYPES[0],
  );

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
            {TEMPLATE_TYPES.map((template) => (
              <button
                key={template}
                type="button"
                className={`btn ghost settings-screen__template-btn ${
                  activeTemplate === template
                    ? "settings-screen__template-btn--active"
                    : ""
                }`}
                onClick={() => setActiveTemplate(template)}
              >
                {template}
              </button>
            ))}
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
