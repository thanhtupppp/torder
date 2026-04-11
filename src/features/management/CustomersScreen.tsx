import { Calendar, Plus, Search, Upload, UserRound, X } from "lucide-react";
import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type CustomerTab = "customers" | "groups";
type ModalType = "add-customer" | "add-group" | null;

// ── Constants ─────────────────────────────────────────────────────────────────

const CUSTOMER_TABS: Array<{
  key: CustomerTab;
  label: string;
  heading: string;
}> = [
  { key: "customers", label: "Khách hàng", heading: "Danh sách khách hàng" },
  {
    key: "groups",
    label: "Nhóm khách hàng",
    heading: "Danh sách nhóm khách hàng",
  },
];

// ✅ Explicit mapping tab → modal — không dùng ternary inline
const TAB_ADD_MODAL: Record<CustomerTab, ModalType> = {
  customers: "add-customer",
  groups: "add-group",
};

const CUSTOMER_COLUMNS = [
  "Tên khách hàng",
  "Số điện thoại",
  "Doanh thu",
  "Ghi nợ",
  "Đơn hàng",
  "Nhóm KH",
  "Tích điểm",
] as const;

// ── Screen ────────────────────────────────────────────────────────────────────

export function CustomersScreen() {
  const [activeTab, setActiveTab] = useState<CustomerTab>("customers");
  const [search, setSearch] = useState("");
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const activeTabMeta = CUSTOMER_TABS.find((t) => t.key === activeTab)!;

  return (
    <div className="customers-page">
      <header className="customers-header-row">
        <h1 className="customers-page-title">Khách hàng</h1>
        <div className="customers-tabs">
          {CUSTOMER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`customers-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <section className="customers-body card">
        {/* ✅ Heading derive từ tab meta — không ternary */}
        <h2>{activeTabMeta.heading}</h2>

        <div className="customers-toolbar">
          <div className="customers-search search-box">
            <Search size={14} />
            <input
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm"
            />
          </div>

          <div className="customers-actions">
            <button
              type="button"
              className="btn primary customers-action-btn"
              onClick={() => setActiveModal(TAB_ADD_MODAL[activeTab])}
            >
              <Plus size={14} /> Thêm
            </button>
            <button type="button" className="btn ghost customers-action-btn">
              <Upload size={14} /> Nhập file
            </button>
            <button type="button" className="btn ghost customers-action-btn">
              <Upload size={14} /> Xuất file
            </button>
          </div>
        </div>

        <div className="customers-stats-row">
          {(["Doanh thu", "Ghi nợ", "Đơn hàng"] as const).map((label) => (
            <div key={label} className="customers-stat-card panel-primitive">
              <strong>{label}</strong>
              <p>0</p>
            </div>
          ))}
        </div>

        <div className="customers-table-wrap panel-primitive">
          <table className="customers-table">
            <thead>
              <tr>
                {CUSTOMER_COLUMNS.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={CUSTOMER_COLUMNS.length}
                  className="customers-empty"
                >
                  Không có dữ liệu
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== MODAL: THÊM NHÓM KHÁCH HÀNG ===== */}
      {activeModal === "add-group" && (
        <div className="customers-overlay">
          <section className="customers-modal card">
            <header className="customers-modal-header">
              <h3>Tạo nhóm khách hàng</h3>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Đóng"
                onClick={() => setActiveModal(null)}
              >
                <X size={14} />
              </button>
            </header>

            <div className="customers-modal-avatar">
              <div className="customers-avatar-circle">
                <UserRound size={26} />
              </div>
            </div>

            <div className="customers-form-grid">
              <label>
                <span>Tên nhóm</span>
                <input className="input" placeholder="Tên nhóm khách hàng" />
              </label>
              <label>
                <span>Điểm giá</span>
                <input className="input" placeholder="VD" />
              </label>
              <label className="full-width">
                <span>Ghi chú</span>
                <input className="input" placeholder="Ghi chú" />
              </label>
              <label>
                <span>Điều kiện</span>
                <input className="input" placeholder="Doanh thu" />
              </label>
              <label>
                <span>Giá trị</span>
                <input className="input" placeholder="0" />
              </label>
            </div>

            <div className="customers-modal-switch">
              <label>
                <input type="checkbox" />
                <span>Tự động thực hiện nâng hạ nhóm</span>
              </label>
            </div>

            <footer className="customers-modal-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setActiveModal(null)}
              >
                Huỷ
              </button>
              <button type="button" className="btn primary">
                Thêm
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* ===== MODAL: THÊM KHÁCH HÀNG ===== */}
      {activeModal === "add-customer" && (
        <div className="customers-overlay">
          <section className="customers-modal customers-modal-lg card">
            <header className="customers-modal-header">
              <h3>Tạo khách hàng</h3>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Đóng"
                onClick={() => setActiveModal(null)}
              >
                <X size={14} />
              </button>
            </header>

            <div className="customers-modal-avatar">
              <div className="customers-avatar-circle">
                <UserRound size={26} />
              </div>
            </div>

            <div className="customers-form-grid two-cols">
              <label>
                <span>Mã khách hàng</span>
                <input
                  className="input"
                  value="Tự động tạo"
                  readOnly
                  disabled
                  aria-label="Mã khách hàng được hệ thống tự động tạo"
                />
              </label>
              <label>
                <span>Tên khách hàng</span>
                <input className="input" />
              </label>
              <label>
                <span>Email</span>
                <input className="input" />
              </label>
              <label>
                <span>Số điện thoại</span>
                <input className="input" />
              </label>
              <label className="full-width">
                <span>Ngày sinh</span>
                <div className="customers-inline-row">
                  <input className="input" placeholder="dd/mm/yyyy" />
                  <button
                    type="button"
                    className="btn ghost icon-only"
                    aria-label="Chọn ngày"
                  >
                    <Calendar size={14} />
                  </button>
                </div>
              </label>
              <label className="full-width">
                <span>Địa chỉ</span>
                <input className="input" />
              </label>
              <label className="full-width">
                <span>Nhóm KH</span>
                <select className="input">
                  <option>Chọn</option>
                </select>
              </label>
              <label className="full-width">
                <span>Mã số thuế</span>
                <input className="input" />
              </label>
              <label className="full-width">
                <span>Loại hoá đơn mua</span>
                <input className="input" />
              </label>
              <label className="full-width">
                <span>Ghi chú</span>
                <textarea className="input note" rows={4} />
              </label>
            </div>

            <footer className="customers-modal-actions">
              <button type="button" className="btn primary">
                Thêm khách hàng
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
