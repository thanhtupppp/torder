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
import { useMemo, useRef, useState } from "react";
import "../../styles/components/finance.css";
import { useDismissible } from "../../hooks/useDismissible"; // hook từ OrdersScreen

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterSection = { id: string; label: string; open: boolean };
type DropdownType = "income" | "expense" | "actions" | null;
type ColKey = "id" | "date" | "type" | "amount" | "fund" | "person" | "creator";

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

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_COLUMNS: { key: ColKey; label: string }[] = [
  { key: "id", label: "Mã phiếu" },
  { key: "date", label: "Thời gian" },
  { key: "type", label: "Loại thu chi" },
  { key: "amount", label: "Giá trị" },
  { key: "fund", label: "Quỹ tiền" },
  { key: "person", label: "Người nộp/nhận" },
  { key: "creator", label: "Người tạo phiếu" },
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function createDefaultVisibility(): Record<ColKey, boolean> {
  return Object.fromEntries(
    ALL_COLUMNS.map((col) => [col.key, true]),
  ) as Record<ColKey, boolean>;
}

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount,
  );

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useFinanceFilter() {
  const [filterSections, setFilterSections] = useState(FILTER_SECTIONS_INITIAL);
  const [selectedFunds, setSelectedFunds] = useState<string[]>([]);
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]);
  const [dateFrom] = useState("01/04/2026");
  const [dateTo] = useState("30/04/2026");

  function toggleSection(id: string) {
    setFilterSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, open: !s.open } : s)),
    );
  }

  function toggleFund(fund: string) {
    setSelectedFunds((prev) =>
      prev.includes(fund) ? prev.filter((f) => f !== fund) : [...prev, fund],
    );
  }

  function toggleDocType(dt: string) {
    setSelectedDocTypes((prev) =>
      prev.includes(dt) ? prev.filter((f) => f !== dt) : [...prev, dt],
    );
  }

  return {
    filterSections,
    toggleSection,
    selectedFunds,
    toggleFund,
    selectedDocTypes,
    toggleDocType,
    dateFrom,
    dateTo,
  };
}

function useTransferForm() {
  const [form, setForm] = useState<TransferForm>({
    voucherId: "",
    time: new Date()
      .toLocaleString("vi-VN", { hour12: false })
      .slice(0, 16)
      .replace(",", ""),
    sender: "Chủ cửa hàng",
    fromAccount: "",
    toAccount: "",
    amount: "",
    note: "",
    accounting: true,
  });

  function update<K extends keyof TransferForm>(
    key: K,
    value: TransferForm[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return { form, update };
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function FinanceScreen() {
  const filter = useFinanceFilter();
  const transfer = useTransferForm();

  const [search, setSearch] = useState("");
  const [dropdown, setDropdown] = useState<DropdownType>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [actionsModal, setActionsModal] = useState<
    "payment-accounts" | "expense-categories" | null
  >(null);
  const [showColPanel, setShowColPanel] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<ColKey, boolean>>(
    createDefaultVisibility,
  );

  const colPanelRef = useRef<HTMLDivElement>(null);
  const colTriggerRef = useRef<HTMLButtonElement>(null);
  const dropdownIncomeRef = useRef<HTMLDivElement>(null);
  const dropdownExpenseRef = useRef<HTMLDivElement>(null);
  const dropdownActionsRef = useRef<HTMLDivElement>(null);

  // ✅ useDismissible thay cho onClick bubble trên root
  useDismissible(showColPanel, () => setShowColPanel(false), [
    colPanelRef,
    colTriggerRef,
  ]);
  useDismissible(dropdown !== null, () => setDropdown(null), [
    dropdownIncomeRef,
    dropdownExpenseRef,
    dropdownActionsRef,
  ]);

  const visibleCount = useMemo(
    () => Object.values(visibleCols).filter(Boolean).length,
    [visibleCols],
  );

  const displayedRecords = useMemo(
    () =>
      MOCK_RECORDS.filter((r) => {
        if (search && !r.id.toLowerCase().includes(search.toLowerCase()))
          return false;
        if (
          filter.selectedFunds.length > 0 &&
          !filter.selectedFunds.includes(r.fund)
        )
          return false;
        if (filter.selectedDocTypes.length > 0) {
          const label = r.type === "income" ? "Phiếu thu" : "Phiếu chi";
          if (!filter.selectedDocTypes.includes(label)) return false;
        }
        return true;
      }),
    [search, filter.selectedFunds, filter.selectedDocTypes],
  );

  const totalIncome = useMemo(
    () =>
      MOCK_RECORDS.filter((r) => r.type === "income").reduce(
        (s, r) => s + r.amount,
        0,
      ),
    [],
  );
  const totalExpense = useMemo(
    () =>
      MOCK_RECORDS.filter((r) => r.type === "expense").reduce(
        (s, r) => s + r.amount,
        0,
      ),
    [],
  );
  const opening = 0;
  const closing = opening + totalIncome - totalExpense;

  function toggleCol(key: ColKey) {
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleDropdownSelect(method: string, type: DropdownType) {
    console.log("Create", type, "with method:", method);
    setDropdown(null);
  }

  return (
    <div className="fc-layout">
      {/* ===== LEFT SIDEBAR ===== */}
      <aside className="fc-sidebar">
        {filter.filterSections.map((section) => (
          <div key={section.id} className="fc-filter-section">
            <button
              type="button"
              className="fc-filter-section-header"
              onClick={() => filter.toggleSection(section.id)}
            >
              <span>{section.label}</span>
              {section.open ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>

            {section.open && (
              <div className="fc-filter-body">
                {section.id === "fund" && (
                  <div className="fc-checkbox-list">
                    {["Tiền mặt", "Ngân hàng", "Ví điện tử"].map((f) => (
                      <label key={f} className="fc-checkbox-item">
                        <input
                          type="checkbox"
                          checked={filter.selectedFunds.includes(f)}
                          onChange={() => filter.toggleFund(f)}
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
                      <span>
                        {filter.dateFrom} → {filter.dateTo}
                      </span>
                    </div>
                  </div>
                )}
                {section.id === "doctype" && (
                  <div className="fc-checkbox-list">
                    {["Phiếu thu", "Phiếu chi", "Phiếu chuyển tiền"].map(
                      (dt) => (
                        <label key={dt} className="fc-checkbox-item">
                          <input
                            type="checkbox"
                            checked={filter.selectedDocTypes.includes(dt)}
                            onChange={() => filter.toggleDocType(dt)}
                          />
                          <span>{dt}</span>
                        </label>
                      ),
                    )}
                  </div>
                )}
                {(section.id === "category" ||
                  section.id === "creator" ||
                  section.id === "accounting") && (
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
        <div className="fc-toolbar">
          <h1 className="fc-title">Thu chi</h1>
          <div className="fc-toolbar-right">
            <div className="fc-search-wrap">
              <input
                className="fc-search-input"
                placeholder="Theo mã phiếu"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <ChevronDown size={14} className="fc-search-icon" />
            </div>

            {/* Phiếu thu */}
            <div className="fc-dropdown-wrap" ref={dropdownIncomeRef}>
              <button
                type="button"
                className="fc-btn fc-btn-income"
                onClick={() =>
                  setDropdown(dropdown === "income" ? null : "income")
                }
              >
                <TrendingUp size={14} />
                <span>Phiếu thu</span>
                <ChevronDown size={14} />
              </button>
              {dropdown === "income" && (
                <div className="fc-dropdown-menu">
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

            {/* Phiếu chi */}
            <div className="fc-dropdown-wrap" ref={dropdownExpenseRef}>
              <button
                type="button"
                className="fc-btn fc-btn-expense"
                onClick={() =>
                  setDropdown(dropdown === "expense" ? null : "expense")
                }
              >
                <TrendingDown size={14} />
                <span>Phiếu chi</span>
                <ChevronDown size={14} />
              </button>
              {dropdown === "expense" && (
                <div className="fc-dropdown-menu">
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
              onClick={() => setShowTransferModal(true)}
            >
              <ArrowUpDown size={14} />
              <span>Chuyển tiền</span>
            </button>

            <button type="button" className="fc-btn fc-btn-secondary">
              <Download size={14} />
              <span>Xuất file</span>
            </button>

            {/* Thao tác */}
            <div className="fc-dropdown-wrap" ref={dropdownActionsRef}>
              <button
                type="button"
                className="fc-btn fc-btn-secondary"
                onClick={() =>
                  setDropdown(dropdown === "actions" ? null : "actions")
                }
              >
                <Settings2 size={14} />
                <span>Thao tác</span>
                <ChevronDown size={14} />
              </button>
              {dropdown === "actions" && (
                <div className="fc-dropdown-menu">
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

            {/* Column visibility */}
            <div className="fc-dropdown-wrap fc-col-panel-wrap">
              <button
                type="button"
                ref={colTriggerRef}
                className={`fc-btn fc-btn-icon${showColPanel ? " active" : ""}`}
                aria-label="Hiển thị cột"
                onClick={() => setShowColPanel((v) => !v)}
              >
                <Columns3 size={16} />
              </button>
              {showColPanel && (
                <div className="fc-col-panel" ref={colPanelRef}>
                  <div className="fc-col-panel-header">
                    <span>Hiển thị cột</span>
                    <span className="fc-col-panel-count">
                      {visibleCount}/{ALL_COLUMNS.length}
                    </span>
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
                    {/* ✅ Dùng createDefaultVisibility thay vì hardcode object */}
                    <button
                      type="button"
                      className="fc-col-panel-reset"
                      onClick={() => setVisibleCols(createDefaultVisibility())}
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
          {[
            { label: "Quỹ đầu kỳ", value: opening, cls: "neutral" },
            { label: "Tổng thu", value: totalIncome, cls: "income" },
            { label: "Tổng chi", value: totalExpense, cls: "expense" },
            { label: "Tồn quỹ", value: closing, cls: "closing" },
          ].map(({ label, value, cls }) => (
            <div key={label} className="fc-stat-card">
              <div className="fc-stat-label">{label}</div>
              <div className={`fc-stat-value ${cls}`}>
                {value.toLocaleString("vi-VN")}
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="fc-table-wrap">
          <table className="fc-table">
            <thead>
              <tr>
                <th className="fc-th-check">
                  <input type="checkbox" />
                </th>
                {ALL_COLUMNS.filter((col) => visibleCols[col.key]).map(
                  (col) => (
                    <th key={col.key}>
                      <div className="fc-th-content">
                        {col.label} <ArrowUpDown size={12} />
                      </div>
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {displayedRecords.length > 0 ? (
                displayedRecords.map((r) => (
                  <tr key={r.id} className="fc-tr">
                    <td className="fc-td-check">
                      <input type="checkbox" />
                    </td>
                    {visibleCols.id && (
                      <td>
                        <span className="fc-doc-id">{r.id}</span>
                      </td>
                    )}
                    {visibleCols.date && (
                      <td className="fc-td-muted">{r.date}</td>
                    )}
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
                    {visibleCols.person && (
                      <td className="fc-td-muted">{r.person}</td>
                    )}
                    {visibleCols.creator && (
                      <td className="fc-td-muted">{r.creator}</td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={1 + visibleCount} className="fc-empty">
                    <FileText size={32} className="fc-empty-icon" />
                    <p>Không có dữ liệu</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== TRANSFER MODAL ===== */}
      {showTransferModal && (
        <div className="fc-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="fc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fc-modal-header">
              <h2 className="fc-modal-title">Thêm phiếu chuyển tiền</h2>
              <button
                type="button"
                className="fc-modal-close"
                aria-label="Đóng"
                onClick={() => setShowTransferModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="fc-modal-body">
              <div className="fc-modal-row">
                <div className="fc-modal-field">
                  <label className="fc-modal-label">Mã phiếu</label>
                  <input
                    type="text"
                    className="fc-modal-input"
                    placeholder="Tự động"
                    value={transfer.form.voucherId}
                    onChange={(e) =>
                      transfer.update("voucherId", e.target.value)
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
                      value={transfer.form.time}
                      onChange={(e) => transfer.update("time", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="fc-modal-field">
                <label className="fc-modal-label">Người chuyển</label>
                <div className="fc-modal-select-wrap">
                  <select
                    className="fc-modal-select"
                    value={transfer.form.sender}
                    onChange={(e) => transfer.update("sender", e.target.value)}
                  >
                    <option>Chủ cửa hàng</option>
                    <option>Admin</option>
                    <option>Nhân viên</option>
                  </select>
                  <ChevronDown size={14} className="fc-modal-select-icon" />
                </div>
              </div>

              <div className="fc-modal-row">
                {(["fromAccount", "toAccount"] as const).map((field) => (
                  <div key={field} className="fc-modal-field">
                    <label className="fc-modal-label">
                      {field === "fromAccount"
                        ? "Tài khoản chuyển"
                        : "Tài khoản nhận"}
                    </label>
                    <div className="fc-modal-select-wrap">
                      <select
                        className="fc-modal-select"
                        value={transfer.form[field]}
                        onChange={(e) => transfer.update(field, e.target.value)}
                      >
                        <option value=""></option>
                        <option>Tiền mặt</option>
                        <option>Ngân hàng</option>
                        <option>Ví điện tử</option>
                      </select>
                      <ChevronDown size={14} className="fc-modal-select-icon" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="fc-modal-field">
                <label className="fc-modal-label">Số tiền</label>
                <input
                  type="number"
                  className="fc-modal-input"
                  value={transfer.form.amount}
                  onChange={(e) => transfer.update("amount", e.target.value)}
                />
              </div>

              <div className="fc-modal-field">
                <label className="fc-modal-label">Ghi chú</label>
                <input
                  type="text"
                  className="fc-modal-input"
                  value={transfer.form.note}
                  onChange={(e) => transfer.update("note", e.target.value)}
                />
              </div>

              <label className="fc-modal-checkbox-row">
                <input
                  type="checkbox"
                  checked={transfer.form.accounting}
                  onChange={(e) =>
                    transfer.update("accounting", e.target.checked)
                  }
                />
                <span>Hạch toán vào kết quả hoạt động kinh doanh</span>
              </label>
            </div>
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
                  console.log("Tạo mới", transfer.form);
                  setShowTransferModal(false);
                }}
              >
                Tạo mới
              </button>
              <button
                type="button"
                className="fc-btn fc-btn-income"
                onClick={() => {
                  console.log("Tạo và in", transfer.form);
                  setShowTransferModal(false);
                }}
              >
                Tạo và in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ACTIONS MODALS ===== */}
      {actionsModal === "payment-accounts" && (
        <div className="fc-overlay" onClick={() => setActionsModal(null)}>
          <div className="fc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fc-modal-header">
              <h2 className="fc-modal-title">Tài khoản thanh toán</h2>
              <button
                type="button"
                className="fc-modal-close"
                aria-label="Đóng"
                onClick={() => setActionsModal(null)}
              >
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
                    {["Tiền mặt", "Ngân hàng", "Ví điện tử"].map((acc) => (
                      <tr key={acc}>
                        <td>{acc}</td>
                        <td>{acc}</td>
                        <td className="fc-amount income">0 đ</td>
                        <td>
                          <span className="fc-badge income">Hoạt động</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="fc-modal-footer">
              <button type="button" className="fc-btn fc-btn-income">
                + Thêm tài khoản
              </button>
              <button
                type="button"
                className="fc-btn fc-btn-secondary"
                onClick={() => setActionsModal(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {actionsModal === "expense-categories" && (
        <div className="fc-overlay" onClick={() => setActionsModal(null)}>
          <div className="fc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fc-modal-header">
              <h2 className="fc-modal-title">Loại thu chi</h2>
              <button
                type="button"
                className="fc-modal-close"
                aria-label="Đóng"
                onClick={() => setActionsModal(null)}
              >
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
                      <td>
                        <span className="fc-badge income">Thu</span>
                      </td>
                      <td className="fc-td-muted">—</td>
                    </tr>
                    <tr>
                      <td>Chi mua nguyên liệu</td>
                      <td>
                        <span className="fc-badge expense">Chi</span>
                      </td>
                      <td className="fc-td-muted">—</td>
                    </tr>
                    <tr>
                      <td>Chi trả nhân viên</td>
                      <td>
                        <span className="fc-badge expense">Chi</span>
                      </td>
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
              <button
                type="button"
                className="fc-btn fc-btn-secondary"
                onClick={() => setActionsModal(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
