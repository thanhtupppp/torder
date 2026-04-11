import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Clock,
  Columns3,
  Download,
  FileText,
  Settings2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import "../../styles/components/finance.css";

// ---------- Types ----------
type FilterSection = {
  id: string;
  label: string;
  open: boolean;
};

type DropdownType = "income" | "expense" | "actions" | null;

type ColKey = "id" | "date" | "type" | "amount" | "fund" | "person" | "creator";

const ALL_COLUMNS: { key: ColKey; label: string }[] = [
  { key: "id",      label: "Mã phiếu" },
  { key: "date",    label: "Thời gian" },
  { key: "type",    label: "Loại thu chi" },
  { key: "amount",  label: "Giá trị" },
  { key: "fund",    label: "Quỹ tiền" },
  { key: "person",  label: "Người nộp/nhận" },
  { key: "creator", label: "Người tạo phiếu" },
];

type TransferForm = {
  voucherId: string;
  time: string;
  sender: string;
  fromAccount: string;
  toAccount: string;
  amount: string;
  note: string;
  accounting: boolean;
};

// ---------- Mock Data ----------
const MOCK_RECORDS = [
  {
    id: "PT001",
    date: "11/04/2026 10:30",
    type: "income" as const,
    category: "Thu tiền khách hàng",
    amount: 5000000,
    fund: "Tiền mặt",
    person: "Nguyễn Văn A",
    creator: "Admin",
    status: "completed",
  },
  {
    id: "PC001",
    date: "11/04/2026 09:15",
    type: "expense" as const,
    category: "Thanh toán nguyên liệu",
    amount: 1200000,
    fund: "Ngân hàng",
    person: "Nhà cung cấp đá",
    creator: "Admin",
    status: "completed",
  },
];

const PAYMENT_METHODS = ["Tiền mặt", "Chuyển khoản", "Quẹt thẻ", "Ví điện tử"];

const FILTER_SECTIONS_INITIAL: FilterSection[] = [
  { id: "fund", label: "Quỹ tiền", open: true },
  { id: "time", label: "Thời gian", open: true },
  { id: "doctype", label: "Loại chứng từ", open: true },
  { id: "category", label: "Loại thu chi", open: true },
  { id: "creator", label: "Người tạo", open: true },
  { id: "accounting", label: "Hạch toán kết quả kinh doanh", open: true },
  { id: "target", label: "Đối tượng nộp/nhận", open: true },
];

// ---------- Component ----------
export function FinanceScreen() {
  const [filterSections, setFilterSections] = useState(FILTER_SECTIONS_INITIAL);
  const [search, setSearch] = useState("");
  const [dropdown, setDropdown] = useState<DropdownType>(null);
  const [selectedFunds, setSelectedFunds] = useState<string[]>([]);
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]);
  const [dateFrom] = useState("01/04/2026");
  const [dateTo] = useState("30/04/2026");
  const dropdownRef = useRef<HTMLDivElement>(null); // kept for potential future use
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [actionsModal, setActionsModal] = useState<"payment-accounts" | "expense-categories" | null>(null);
  const [showColPanel, setShowColPanel] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<ColKey, boolean>>({
    id: true, date: true, type: true, amount: true,
    fund: true, person: true, creator: true,
  });
  const toggleCol = (key: ColKey) =>
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }));
  const visibleCount = Object.values(visibleCols).filter(Boolean).length;
  const [transferForm, setTransferForm] = useState<TransferForm>({
    voucherId: "",
    time: new Date().toLocaleString("vi-VN", { hour12: false }).slice(0, 16).replace(",", ""),
    sender: "Chủ cửa hàng",
    fromAccount: "",
    toAccount: "",
    amount: "",
    note: "",
    accounting: true,
  });

  const toggleSection = (id: string) => {
    setFilterSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, open: !s.open } : s))
    );
  };

  const toggleFund = (fund: string) => {
    setSelectedFunds((prev) =>
      prev.includes(fund) ? prev.filter((f) => f !== fund) : [...prev, fund]
    );
  };

  const toggleDocType = (dt: string) => {
    setSelectedDocTypes((prev) =>
      prev.includes(dt) ? prev.filter((f) => f !== dt) : [...prev, dt]
    );
  };

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const totalIncome = MOCK_RECORDS.filter((r) => r.type === "income").reduce(
    (s, r) => s + r.amount,
    0
  );
  const totalExpense = MOCK_RECORDS.filter((r) => r.type === "expense").reduce(
    (s, r) => s + r.amount,
    0
  );
  const opening = 0;
  const closing = opening + totalIncome - totalExpense;

  const displayedRecords = MOCK_RECORDS.filter((r) => {
    // Search by voucher id
    if (search && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
    // Filter by fund
    if (selectedFunds.length > 0 && !selectedFunds.includes(r.fund)) return false;
    // Filter by doc type (map type key to label)
    if (selectedDocTypes.length > 0) {
      const label = r.type === "income" ? "Phiếu thu" : "Phiếu chi";
      if (!selectedDocTypes.includes(label)) return false;
    }
    return true;
  });

  const handleDropdownSelect = (method: string, type: DropdownType) => {
    console.log("Create", type, "with method:", method);
    setDropdown(null);
  };

  return (
    <div className="fc-layout" onClick={() => { setDropdown(null); setShowColPanel(false); }}>
      {/* ===== LEFT SIDEBAR FILTERS ===== */}
      <aside className="fc-sidebar">
        {filterSections.map((section) => (
          <div key={section.id} className="fc-filter-section">
            <button
              type="button"
              className="fc-filter-section-header"
              onClick={() => toggleSection(section.id)}
            >
              <span>{section.label}</span>
              {section.open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {section.open && (
              <div className="fc-filter-body">
                {section.id === "fund" && (
                  <div className="fc-checkbox-list">
                    {["Tiền mặt", "Ngân hàng", "Ví điện tử"].map((f) => (
                      <label key={f} className="fc-checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedFunds.includes(f)}
                          onChange={() => toggleFund(f)}
                        />
                        <span>{f}</span>
                      </label>
                    ))}
                  </div>
                )}
                {section.id === "time" && (
                  <div className="fc-date-range">
                    <div className="fc-date-input">
                      <span className="fc-date-icon">📅</span>
                      <span>{dateFrom} → {dateTo}</span>
                    </div>
                  </div>
                )}
                {section.id === "doctype" && (
                  <div className="fc-checkbox-list">
                    {["Phiếu thu", "Phiếu chi", "Phiếu chuyển tiền"].map((dt) => (
                      <label key={dt} className="fc-checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedDocTypes.includes(dt)}
                          onChange={() => toggleDocType(dt)}
                        />
                        <span>{dt}</span>
                      </label>
                    ))}
                  </div>
                )}
                {(section.id === "category" || section.id === "creator" || section.id === "accounting") && (
                  <select className="fc-select">
                    <option>Tất cả</option>
                  </select>
                )}
                {section.id === "target" && (
                  <div className="fc-filter-col">
                    <select className="fc-select">
                      <option>Tất cả</option>
                    </select>
                    <input
                      type="text"
                      className="fc-input"
                      placeholder="Tên người nộp/nhận"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="fc-content">
        {/* Toolbar */}
        <div className="fc-toolbar">
          <h1 className="fc-title">Thu chi</h1>
          <div className="fc-toolbar-right">
            {/* Search */}
            <div className="fc-search-wrap">
              <input
                className="fc-search-input"
                placeholder="Theo mã phiếu"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <ChevronDown size={14} className="fc-search-icon" />
            </div>

            {/* Phiếu thu dropdown */}
            <div className="fc-dropdown-wrap" ref={dropdownRef}>
              <button
                type="button"
                className="fc-btn fc-btn-income"
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdown(dropdown === "income" ? null : "income");
                }}
              >
                <TrendingUp size={14} />
                <span>Phiếu thu</span>
                <ChevronDown size={14} />
              </button>
              {dropdown === "income" && (
                <div className="fc-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className="fc-dropdown-item"
                      onClick={() => handleDropdownSelect(m, "income")}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Phiếu chi dropdown */}
            <div className="fc-dropdown-wrap">
              <button
                type="button"
                className="fc-btn fc-btn-expense"
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdown(dropdown === "expense" ? null : "expense");
                }}
              >
                <TrendingDown size={14} />
                <span>Phiếu chi</span>
                <ChevronDown size={14} />
              </button>
              {dropdown === "expense" && (
                <div className="fc-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className="fc-dropdown-item"
                      onClick={() => handleDropdownSelect(m, "expense")}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="fc-btn fc-btn-secondary"
              onClick={(e) => { e.stopPropagation(); setShowTransferModal(true); }}
            >
              <ArrowUpDown size={14} />
              <span>Chuyển tiền</span>
            </button>
            <button type="button" className="fc-btn fc-btn-secondary">
              <Download size={14} />
              <span>Xuất file</span>
            </button>
            {/* Thao tác dropdown */}
            <div className="fc-dropdown-wrap">
              <button
                type="button"
                className="fc-btn fc-btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdown(dropdown === "actions" ? null : "actions");
                }}
              >
                <Settings2 size={14} />
                <span>Thao tác</span>
                <ChevronDown size={14} />
              </button>
              {dropdown === "actions" && (
                <div className="fc-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="fc-dropdown-item"
                    onClick={() => {
                      setDropdown(null);
                      setActionsModal("payment-accounts");
                    }}
                  >
                    Tài khoản thanh toán
                  </button>
                  <button
                    type="button"
                    className="fc-dropdown-item"
                    onClick={() => {
                      setDropdown(null);
                      setActionsModal("expense-categories");
                    }}
                  >
                    Loại thu chi
                  </button>
                </div>
              )}
            </div>
            {/* Column visibility panel */}
            <div className="fc-dropdown-wrap fc-col-panel-wrap">
              <button
                type="button"
                className={`fc-btn fc-btn-icon${showColPanel ? " active" : ""}`}
                title="Hiển thị cột"
                onClick={(e) => { e.stopPropagation(); setShowColPanel((v) => !v); }}
              >
                <Columns3 size={16} />
              </button>
              {showColPanel && (
                <div
                  className="fc-col-panel"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="fc-col-panel-header">
                    <span>Hiển thị cột</span>
                    <span className="fc-col-panel-count">{visibleCount}/{ALL_COLUMNS.length}</span>
                  </div>
                  <div className="fc-col-panel-grid">
                    {ALL_COLUMNS.map((col) => (
                      <label key={col.key} className="fc-col-panel-item">
                        <input
                          type="checkbox"
                          checked={visibleCols[col.key]}
                          onChange={() => toggleCol(col.key)}
                        />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="fc-col-panel-footer">
                    <button
                      type="button"
                      className="fc-col-panel-reset"
                      onClick={() =>
                        setVisibleCols({ id:true,date:true,type:true,amount:true,fund:true,person:true,creator:true })
                      }
                    >
                      Đặt lại
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="fc-stats-row">
          <div className="fc-stat-card">
            <div className="fc-stat-label">Quỹ đầu kỳ</div>
            <div className="fc-stat-value neutral">{opening.toLocaleString("vi-VN")}</div>
          </div>
          <div className="fc-stat-card">
            <div className="fc-stat-label">Tổng thu</div>
            <div className="fc-stat-value income">{totalIncome.toLocaleString("vi-VN")}</div>
          </div>
          <div className="fc-stat-card">
            <div className="fc-stat-label">Tổng chi</div>
            <div className="fc-stat-value expense">{totalExpense.toLocaleString("vi-VN")}</div>
          </div>
          <div className="fc-stat-card">
            <div className="fc-stat-label">Tồn quỹ</div>
            <div className="fc-stat-value closing">{closing.toLocaleString("vi-VN")}</div>
          </div>
        </div>

        {/* Table */}
        <div className="fc-table-wrap">
          <table className="fc-table">
            <thead>
              <tr>
                <th className="fc-th-check">
                  <input type="checkbox" />
                </th>
                {visibleCols.id && <th><div className="fc-th-content">Mã phiếu <ArrowUpDown size={12} /></div></th>}
                {visibleCols.date && <th><div className="fc-th-content">Thời gian <ArrowUpDown size={12} /></div></th>}
                {visibleCols.type && <th><div className="fc-th-content">Loại thu chi <ArrowUpDown size={12} /></div></th>}
                {visibleCols.amount && <th><div className="fc-th-content">Giá trị <ArrowUpDown size={12} /></div></th>}
                {visibleCols.fund && <th><div className="fc-th-content">Quỹ tiền <ArrowUpDown size={12} /></div></th>}
                {visibleCols.person && <th><div className="fc-th-content">Người nộp/nhận <ArrowUpDown size={12} /></div></th>}
                {visibleCols.creator && <th><div className="fc-th-content">Người tạo phiếu <ArrowUpDown size={12} /></div></th>}
              </tr>
            </thead>
            <tbody>
              {displayedRecords.length > 0 ? (
                displayedRecords.map((r) => (
                  <tr key={r.id} className="fc-tr">
                    <td className="fc-td-check">
                      <input type="checkbox" />
                    </td>
                    {visibleCols.id && <td><span className="fc-doc-id">{r.id}</span></td>}
                    {visibleCols.date && <td className="fc-td-muted">{r.date}</td>}
                    {visibleCols.type && (
                      <td>
                        <span className={`fc-badge ${r.type}`}>
                          {r.type === "income" ? "Phiếu thu" : "Phiếu chi"}
                        </span>
                      </td>
                    )}
                    {visibleCols.amount && (
                      <td className={`fc-amount ${r.type}`}>
                        {r.type === "income" ? "+" : "-"}
                        {formatMoney(r.amount)}
                      </td>
                    )}
                    {visibleCols.fund && (
                      <td className="fc-td-muted">
                        <div className="fc-fund-cell">
                          <Wallet size={13} />
                          <span>{r.fund}</span>
                        </div>
                      </td>
                    )}
                    {visibleCols.person && <td className="fc-td-muted">{r.person}</td>}
                    {visibleCols.creator && <td className="fc-td-muted">{r.creator}</td>}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={1 + Object.values(visibleCols).filter(Boolean).length} className="fc-empty">
                    <FileText size={32} className="fc-empty-icon" />
                    <p>Không có dữ liệu</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== TRANSFER MONEY MODAL ===== */}
      {showTransferModal && (
        <div
          className="fc-overlay"
          onClick={() => setShowTransferModal(false)}
        >
          <div
            className="fc-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="fc-modal-header">
              <h2 className="fc-modal-title">Thêm phiếu chuyển tiền</h2>
              <button
                type="button"
                className="fc-modal-close"
                onClick={() => setShowTransferModal(false)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="fc-modal-body">
              {/* Row 1: Mã phiếu + Thời gian */}
              <div className="fc-modal-row">
                <div className="fc-modal-field">
                  <label className="fc-modal-label">Mã phiếu</label>
                  <input
                    type="text"
                    className="fc-modal-input"
                    placeholder="Tự động"
                    value={transferForm.voucherId}
                    onChange={(e) =>
                      setTransferForm((f) => ({ ...f, voucherId: e.target.value }))
                    }
                  />
                </div>
                <div className="fc-modal-field">
                  <label className="fc-modal-label">Thời gian</label>
                  <div className="fc-modal-input-icon-wrap">
                    <Clock size={14} className="fc-modal-input-icon" />
                    <input
                      type="text"
                      className="fc-modal-input with-icon"
                      value={transferForm.time}
                      onChange={(e) =>
                        setTransferForm((f) => ({ ...f, time: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Người chuyển (full width) */}
              <div className="fc-modal-field">
                <label className="fc-modal-label">Người chuyển</label>
                <div className="fc-modal-select-wrap">
                  <select
                    className="fc-modal-select"
                    value={transferForm.sender}
                    onChange={(e) =>
                      setTransferForm((f) => ({ ...f, sender: e.target.value }))
                    }
                  >
                    <option>Chủ cửa hàng</option>
                    <option>Admin</option>
                    <option>Nhân viên</option>
                  </select>
                  <ChevronDown size={14} className="fc-modal-select-icon" />
                </div>
              </div>

              {/* Row 3: Tài khoản chuyển + Tài khoản nhận */}
              <div className="fc-modal-row">
                <div className="fc-modal-field">
                  <label className="fc-modal-label">Tài khoản chuyển</label>
                  <div className="fc-modal-select-wrap">
                    <select
                      className="fc-modal-select"
                      value={transferForm.fromAccount}
                      onChange={(e) =>
                        setTransferForm((f) => ({ ...f, fromAccount: e.target.value }))
                      }
                    >
                      <option value=""></option>
                      <option>Tiền mặt</option>
                      <option>Ngân hàng</option>
                      <option>Ví điện tử</option>
                    </select>
                    <ChevronDown size={14} className="fc-modal-select-icon" />
                  </div>
                </div>
                <div className="fc-modal-field">
                  <label className="fc-modal-label">Tài khoản nhận</label>
                  <div className="fc-modal-select-wrap">
                    <select
                      className="fc-modal-select"
                      value={transferForm.toAccount}
                      onChange={(e) =>
                        setTransferForm((f) => ({ ...f, toAccount: e.target.value }))
                      }
                    >
                      <option value=""></option>
                      <option>Tiền mặt</option>
                      <option>Ngân hàng</option>
                      <option>Ví điện tử</option>
                    </select>
                    <ChevronDown size={14} className="fc-modal-select-icon" />
                  </div>
                </div>
              </div>

              {/* Row 4: Số tiền (full width) */}
              <div className="fc-modal-field">
                <label className="fc-modal-label">Số tiền</label>
                <input
                  type="number"
                  className="fc-modal-input"
                  placeholder=""
                  value={transferForm.amount}
                  onChange={(e) =>
                    setTransferForm((f) => ({ ...f, amount: e.target.value }))
                  }
                />
              </div>

              {/* Row 5: Ghi chú (full width) */}
              <div className="fc-modal-field">
                <label className="fc-modal-label">Ghi chú</label>
                <input
                  type="text"
                  className="fc-modal-input"
                  value={transferForm.note}
                  onChange={(e) =>
                    setTransferForm((f) => ({ ...f, note: e.target.value }))
                  }
                />
              </div>

              {/* Accounting checkbox */}
              <label className="fc-modal-checkbox-row">
                <input
                  type="checkbox"
                  checked={transferForm.accounting}
                  onChange={(e) =>
                    setTransferForm((f) => ({ ...f, accounting: e.target.checked }))
                  }
                />
                <span>Hạch toán vào kết quả hoạt động kinh doanh</span>
              </label>
            </div>

            {/* Footer */}
            <div className="fc-modal-footer">
              <button
                type="button"
                className="fc-btn fc-btn-secondary"
                onClick={() => setShowTransferModal(false)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="fc-btn fc-btn-income"
                onClick={() => {
                  console.log("Tạo mới phiếu chuyển tiền", transferForm);
                  setShowTransferModal(false);
                }}
              >
                Tạo mới
              </button>
              <button
                type="button"
                className="fc-btn fc-btn-income"
                onClick={() => {
                  console.log("Tạo và in phiếu chuyển tiền", transferForm);
                  setShowTransferModal(false);
                }}
              >
                Tạo và in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ACTIONS: TÀI KHOẢN THANH TOÁN MODAL ===== */}
      {actionsModal === "payment-accounts" && (
        <div className="fc-overlay" onClick={() => setActionsModal(null)}>
          <div className="fc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fc-modal-header">
              <h2 className="fc-modal-title">Tài khoản thanh toán</h2>
              <button type="button" className="fc-modal-close" onClick={() => setActionsModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="fc-modal-body">
              <div className="fc-actions-table-wrap">
                <table className="fc-actions-table">
                  <thead>
                    <tr>
                      <th>Tên tài khoản</th>
                      <th>Loại</th>
                      <th>Số dư hiện tại</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Tiền mặt</td>
                      <td>Tiền mặt</td>
                      <td className="fc-amount income">0 đ</td>
                      <td><span className="fc-badge income">Hoạt động</span></td>
                    </tr>
                    <tr>
                      <td>Ngân hàng</td>
                      <td>Ngân hàng</td>
                      <td className="fc-amount income">0 đ</td>
                      <td><span className="fc-badge income">Hoạt động</span></td>
                    </tr>
                    <tr>
                      <td>Ví điện tử</td>
                      <td>Ví điện tử</td>
                      <td className="fc-amount income">0 đ</td>
                      <td><span className="fc-badge income">Hoạt động</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="fc-modal-footer">
              <button type="button" className="fc-btn fc-btn-income">
                + Thêm tài khoản
              </button>
              <button type="button" className="fc-btn fc-btn-secondary" onClick={() => setActionsModal(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ACTIONS: LOẠI THU CHI MODAL ===== */}
      {actionsModal === "expense-categories" && (
        <div className="fc-overlay" onClick={() => setActionsModal(null)}>
          <div className="fc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fc-modal-header">
              <h2 className="fc-modal-title">Loại thu chi</h2>
              <button type="button" className="fc-modal-close" onClick={() => setActionsModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="fc-modal-body">
              <div className="fc-actions-table-wrap">
                <table className="fc-actions-table">
                  <thead>
                    <tr>
                      <th>Tên loại</th>
                      <th>Phân loại</th>
                      <th>Mô tả</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Thu tiền khách hàng</td>
                      <td><span className="fc-badge income">Thu</span></td>
                      <td className="fc-td-muted">—</td>
                    </tr>
                    <tr>
                      <td>Chi mua nguyên liệu</td>
                      <td><span className="fc-badge expense">Chi</span></td>
                      <td className="fc-td-muted">—</td>
                    </tr>
                    <tr>
                      <td>Chi trả nhân viên</td>
                      <td><span className="fc-badge expense">Chi</span></td>
                      <td className="fc-td-muted">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="fc-modal-footer">
              <button type="button" className="fc-btn fc-btn-income">
                + Thêm loại
              </button>
              <button type="button" className="fc-btn fc-btn-secondary" onClick={() => setActionsModal(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
