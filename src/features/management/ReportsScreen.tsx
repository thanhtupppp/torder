import { CalendarDays, Check, Copy, Download, Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ReportTabKey =
  | "overview"
  | "endOfDay"
  | "orders"
  | "tables"
  | "products"
  | "inventory"
  | "customers"
  | "suppliers"
  | "shifts"
  | "vat"
  | "finance";

type ReportTab = {
  key: ReportTabKey;
  label: string;
};

type EndOfDaySection = {
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
};

const REPORT_TABS: ReportTab[] = [
  { key: "overview", label: "Tổng quan" },
  { key: "endOfDay", label: "Cuối ngày" },
  { key: "orders", label: "Đơn hàng" },
  { key: "tables", label: "Phòng bàn" },
  { key: "products", label: "Sản phẩm" },
  { key: "inventory", label: "Tồn kho" },
  { key: "customers", label: "Khách hàng" },
  { key: "suppliers", label: "Nhà cung cấp" },
  { key: "shifts", label: "Ca làm việc" },
  { key: "vat", label: "Thuế VAT" },
  { key: "finance", label: "Tài chính" },
];

const TIME_FILTERS = ["Hôm nay", "Tháng này", "Tháng trước"] as const;

const FILTER_QUICK_OPTIONS = [
  "Hôm nay",
  "Hôm qua",
  "Tuần này",
  "Tuần trước",
  "7 ngày qua",
  "30 ngày qua",
  "Tháng này",
  "Tháng trước",
  "Quý này",
  "Quý trước",
  "Năm nay",
  "Năm trước",
] as const;

const KPI_BY_TAB: Record<ReportTabKey, { label: string; value: string }[]> = {
  overview: [
    { label: "Doanh thu", value: "0" },
    { label: "Đơn hàng", value: "0" },
    { label: "Số lượng khách", value: "0" },
    { label: "Lợi nhuận", value: "0" },
  ],
  endOfDay: [
    { label: "Tổng thu", value: "0" },
    { label: "Tổng chi", value: "0" },
    { label: "Số đơn hàng", value: "0" },
    { label: "Doanh thu thuần", value: "0" },
  ],
  orders: [
    { label: "Tổng đơn", value: "0" },
    { label: "Hoàn thành", value: "0" },
    { label: "Đã hủy", value: "0" },
    { label: "Lợi nhuận", value: "0" },
  ],
  tables: [
    { label: "Số bàn phục vụ", value: "0" },
    { label: "Công suất trung bình", value: "0%" },
    { label: "Thời gian phục vụ TB", value: "0p" },
    { label: "Doanh thu theo bàn", value: "0" },
  ],
  products: [
    { label: "Món bán chạy", value: "0" },
    { label: "Sản phẩm bán", value: "0" },
    { label: "Doanh thu", value: "0" },
    { label: "Biên lợi nhuận", value: "0%" },
  ],
  inventory: [
    { label: "Tồn đầu kỳ", value: "0" },
    { label: "Nhập", value: "0" },
    { label: "Xuất", value: "0" },
    { label: "Tồn cuối kỳ", value: "0" },
  ],
  customers: [
    { label: "Khách hàng mới", value: "0" },
    { label: "Khách quay lại", value: "0" },
    { label: "Doanh thu", value: "0" },
    { label: "Giá trị TB", value: "0" },
  ],
  suppliers: [
    { label: "Đơn nhập", value: "0" },
    { label: "Giá trị nhập", value: "0" },
    { label: "Công nợ", value: "0" },
    { label: "Nhà cung cấp", value: "0" },
  ],
  shifts: [
    { label: "Số ca", value: "0" },
    { label: "Doanh thu/ca", value: "0" },
    { label: "Nộp quỹ", value: "0" },
    { label: "Chênh lệch", value: "0" },
  ],
  vat: [
    { label: "Doanh thu chịu thuế", value: "0" },
    { label: "VAT đầu ra", value: "0" },
    { label: "VAT đầu vào", value: "0" },
    { label: "VAT phải nộp", value: "0" },
  ],
  finance: [
    { label: "Doanh thu thuần", value: "0" },
    { label: "Giá vốn", value: "0" },
    { label: "Chi phí", value: "0" },
    { label: "Lợi nhuận", value: "0" },
  ],
};

const TABLE_HEADERS_BY_TAB: Record<ReportTabKey, string[]> = {
  overview: ["Thời gian", "Doanh thu", "Đơn hàng", "Lợi nhuận"],
  endOfDay: ["Ngày", "Thu", "Chi", "Chênh lệch"],
  orders: ["Mã đơn", "Thời gian", "Trạng thái", "Tổng tiền"],
  tables: ["Phòng/Bàn", "Số lượt", "Doanh thu", "Thời gian TB"],
  products: ["Sản phẩm", "Số lượng", "Doanh thu", "Lợi nhuận"],
  inventory: ["Mặt hàng", "Tồn đầu", "Nhập/Xuất", "Tồn cuối"],
  customers: ["Khách hàng", "Số đơn", "Doanh thu", "Giá trị TB"],
  suppliers: ["Nhà cung cấp", "Số phiếu", "Giá trị", "Công nợ"],
  shifts: ["Ca", "Nhân viên", "Doanh thu", "Chênh lệch"],
  vat: ["Kỳ", "Doanh thu", "Thuế suất", "VAT"],
  finance: ["Khoản mục", "Kế hoạch", "Thực tế", "Chênh lệch"],
};

const ORDER_PROFIT_HEADERS = [
  "Thời gian",
  "Tổng tiền",
  "Giảm giá",
  "Doanh thu",
  "Giá trị trả",
  "Doanh thu thuần",
  "Tổng giá vốn",
  "Lãi thuần gộp",
];

const TABLE_REPORT_HEADERS = [
  "Phòng/bàn",
  "SL khách",
  "SL đơn bán",
  "Tổng tiền hàng",
  "Giảm giá HĐ",
  "VAT",
  "Doanh thu",
];

const PRODUCT_REPORT_HEADERS = [
  "Mã SP",
  "Tên sản phẩm",
  "SL bán",
  "Doanh thu",
  "SL trả",
  "Giá trị trả",
  "Doanh thu thuần",
  "Giá vốn",
  "Lợi nhuận",
  "Tỷ suất",
];

const INVENTORY_REPORT_HEADERS = [
  "Mã SP",
  "Tên sản phẩm",
  "SL Tồn đầu kỳ",
  "Giá trị đầu kỳ",
  "SL Nhập",
  "Giá trị Nhập",
  "SL Xuất",
  "Giá trị Xuất",
  "SL Tồn cuối kỳ",
  "Giá trị Tồn cuối kỳ",
];

const CUSTOMER_REPORT_HEADERS = [
  "Mã KH",
  "Khách hàng",
  "Tổng tiền",
  "Giảm giá",
  "Doanh thu",
  "Giá trị trả",
  "Doanh thu thuần",
  "Tổng giá vốn",
  "Lợi nhuận gộp",
];

const VAT_REPORT_HEADERS = [
  "Thời gian",
  "Tổng hóa đơn",
  "Doanh thu chưa có VAT",
  "Thuế VAT",
];

const FINANCE_REPORT_ROWS = [
  "Doanh thu bán hàng: Doanh thu chưa có bao gồm giảm giá (1)",
  "Giảm giá doanh thu (2 = 2.1 + 2.2)",
  "Chiết khấu hóa đơn (2.1)",
  "Giá trị hàng trả lại (2.2)",
  "Doanh thu thuần, doanh thu đã bao gồm giảm giá: (3 = 1 - 2)",
  "Giá vốn hàng bán (4)",
  "Lợi nhuận gộp về bán hàng (5 = 3 - 4)",
  "Chi phí, dịch vụ phát sinh (6)",
  "Lợi nhuận từ hoạt động kinh doanh (7 = 5 - 6)",
  "Thu nhập khác đầu vào do các thu và thu khác liên quan hàng (8)",
  "Lợi nhuận thuần (9 = 7 + 8)",
];

const SUPPLIER_REPORT_HEADERS = [
  "Mã NCC",
  "Tên NCC",
  "SĐT",
  "Nợ đầu",
  "Tổng nhập",
  "Tổng thanh toán",
  "Nợ cuối",
];

const END_OF_DAY_SECTIONS: EndOfDaySection[] = [
  {
    title: "Tổng kết Thu Chi",
    headers: ["Khoản Thu Chi", "Số tiền"],
    rows: [
      ["Tổng thu", 0],
      ["Tổng chi", 0],
      ["Thu - Chi", 0],
    ],
  },
  {
    title: "Phương thức thanh toán",
    headers: ["Phương thức", "Doanh thu"],
    rows: [
      ["Tiền mặt", 0],
      ["Chuyển khoản", 0],
      ["Quẹt thẻ", 0],
      ["Ví điện tử", 0],
    ],
  },
  {
    title: "Bán hàng",
    headers: ["Số đơn hàng", "Giảm giá", "Doanh thu"],
    rows: [[0, 0, 0]],
  },
  {
    title: "Đơn đang xử lý",
    headers: ["Số đơn hàng", "Số lượng khách", "Doanh thu"],
    rows: [[0, 0, 0]],
  },
  {
    title: "Danh sách sản phẩm đã bán",
    headers: ["Số lượng", "Giá trị bán"],
    rows: [[0, 0]],
  },
  {
    title: "Trả hàng",
    headers: ["Số đơn trả", "Doanh thu trả"],
    rows: [[0, 0]],
  },
  {
    title: "Đơn hàng hủy",
    headers: ["Số đơn hủy", "Doanh thu hủy"],
    rows: [[0, 0]],
  },
];

function isNumericValue(value: string | number) {
  return typeof value === "number";
}

function renderValue(value: string | number) {
  if (isNumericValue(value)) {
    return value.toLocaleString("vi-VN");
  }

  return value;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(input: string) {
  if (!input) return "";
  const [year, month, day] = input.split("-");
  if (!year || !month || !day) return input;
  return `${day}/${month}/${year}`;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfWeek(date: Date) {
  const next = startOfWeek(date);
  next.setDate(next.getDate() + 6);
  next.setHours(23, 59, 59, 999);
  return next;
}

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

function endOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0);
}

function resolveQuickRange(option: (typeof FILTER_QUICK_OPTIONS)[number]) {
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);

  const endToday = new Date(now);
  endToday.setHours(23, 59, 59, 999);

  switch (option) {
    case "Hôm nay":
      return { from: startToday, to: endToday };
    case "Hôm qua": {
      const d = new Date(startToday);
      d.setDate(d.getDate() - 1);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      return { from: d, to: end };
    }
    case "Tuần này":
      return { from: startOfWeek(now), to: endOfWeek(now) };
    case "Tuần trước": {
      const prev = new Date(now);
      prev.setDate(prev.getDate() - 7);
      return { from: startOfWeek(prev), to: endOfWeek(prev) };
    }
    case "7 ngày qua": {
      const from = new Date(startToday);
      from.setDate(from.getDate() - 6);
      return { from, to: endToday };
    }
    case "30 ngày qua": {
      const from = new Date(startToday);
      from.setDate(from.getDate() - 29);
      return { from, to: endToday };
    }
    case "Tháng này":
      return {
        from: startOfMonth(now.getFullYear(), now.getMonth()),
        to: endOfMonth(now.getFullYear(), now.getMonth()),
      };
    case "Tháng trước": {
      const month = now.getMonth() - 1;
      const year = month < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const normalizedMonth = month < 0 ? 11 : month;
      return {
        from: startOfMonth(year, normalizedMonth),
        to: endOfMonth(year, normalizedMonth),
      };
    }
    case "Quý này": {
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      return {
        from: startOfMonth(now.getFullYear(), quarterStart),
        to: endOfMonth(now.getFullYear(), quarterStart + 2),
      };
    }
    case "Quý trước": {
      const currentQuarterStart = Math.floor(now.getMonth() / 3) * 3;
      const prevQuarterStart = currentQuarterStart - 3;
      const year =
        prevQuarterStart < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const month =
        prevQuarterStart < 0 ? prevQuarterStart + 12 : prevQuarterStart;
      return {
        from: startOfMonth(year, month),
        to: endOfMonth(year, month + 2),
      };
    }
    case "Năm nay":
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: new Date(now.getFullYear(), 11, 31),
      };
    case "Năm trước":
      return {
        from: new Date(now.getFullYear() - 1, 0, 1),
        to: new Date(now.getFullYear() - 1, 11, 31),
      };
    default:
      return { from: startToday, to: endToday };
  }
}

export function ReportsScreen() {
  const [activeTab, setActiveTab] = useState<ReportTabKey>("overview");
  const [timeFilter, setTimeFilter] = useState<string>("Hôm nay");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedQuickFilter, setSelectedQuickFilter] =
    useState<(typeof FILTER_QUICK_OPTIONS)[number]>("Hôm nay");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isRangeCopied, setIsRangeCopied] = useState(false);

  const kpis = useMemo(() => KPI_BY_TAB[activeTab], [activeTab]);
  const headers = useMemo(() => TABLE_HEADERS_BY_TAB[activeTab], [activeTab]);

  const displayTimeChips = useMemo(() => {
    if (TIME_FILTERS.includes(timeFilter as (typeof TIME_FILTERS)[number])) {
      return [...TIME_FILTERS];
    }

    return [...TIME_FILTERS, timeFilter] as string[];
  }, [timeFilter]);

  const appliedRangeText = useMemo(() => {
    if (!fromDate || !toDate) return "";
    return `${formatDisplayDate(fromDate)} - ${formatDisplayDate(toDate)}`;
  }, [fromDate, toDate]);

  useEffect(() => {
    applyQuickFilter("Hôm nay");
  }, []);

  function applyQuickFilter(option: (typeof FILTER_QUICK_OPTIONS)[number]) {
    const range = resolveQuickRange(option);
    setSelectedQuickFilter(option);
    setFromDate(formatDateInput(range.from));
    setToDate(formatDateInput(range.to));
  }

  function resetFilters() {
    applyQuickFilter("Hôm nay");
    setTimeFilter("Hôm nay");
  }

  function applyFilters() {
    if (fromDate && toDate) {
      setTimeFilter(selectedQuickFilter);
    }

    setIsFilterOpen(false);
  }

  async function copyAppliedRange() {
    if (!appliedRangeText) return;

    try {
      await navigator.clipboard.writeText(appliedRangeText);
      setIsRangeCopied(true);
      window.setTimeout(() => setIsRangeCopied(false), 1500);
    } catch {
      setIsRangeCopied(false);
    }
  }

  return (
    <div className="reports-screen">
      <div className="reports-screen__header">
        <div>
          <h2>Báo cáo</h2>
          <p>Theo dõi hiệu suất kinh doanh theo từng nhóm dữ liệu.</p>
        </div>
        <div className="reports-screen__actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter size={14} /> Bộ lọc
          </button>
          <button type="button" className="btn primary">
            <Download size={14} /> Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="reports-screen__tabbar card">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`reports-screen__tab ${activeTab === tab.key ? "reports-screen__tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="reports-screen__toolbar card">
        <div className="reports-screen__time-filters">
          {displayTimeChips.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`reports-screen__time-chip ${timeFilter === filter ? "reports-screen__time-chip--active" : ""}`}
              onClick={() => {
                setTimeFilter(filter);
                if (
                  FILTER_QUICK_OPTIONS.includes(
                    filter as (typeof FILTER_QUICK_OPTIONS)[number],
                  )
                ) {
                  applyQuickFilter(
                    filter as (typeof FILTER_QUICK_OPTIONS)[number],
                  );
                }
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="reports-screen__applied-range">
          <CalendarDays size={14} />
          <span className="reports-screen__applied-range-label">
            Khoảng áp dụng:
          </span>
          <strong>{appliedRangeText || "--/--/---- - --/--/----"}</strong>
          <button
            type="button"
            className="reports-screen__copy-range-btn"
            onClick={copyAppliedRange}
            disabled={!appliedRangeText}
            title="Copy khoảng ngày"
            aria-label="Copy khoảng ngày"
          >
            {isRangeCopied ? <Check size={13} /> : <Copy size={13} />}
            {isRangeCopied ? "Đã copy" : "Copy"}
          </button>
        </div>
      </div>

      <div className="reports-screen__kpis">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="reports-screen__kpi card">
            <p>{kpi.label}</p>
            <h3>{kpi.value}</h3>
          </article>
        ))}
      </div>

      {activeTab === "endOfDay" ? (
        <section className="reports-screen__panel card">
          <div className="reports-screen__endday-head">
            <span>Ngày lập: 09/04/2026 22:42</span>
            <h3>BÁO CÁO CUỐI NGÀY</h3>
          </div>

          <div className="reports-screen__endday-wrap">
            {END_OF_DAY_SECTIONS.map((section) => (
              <table
                key={section.title}
                className="reports-screen__endday-table"
              >
                <thead>
                  <tr>
                    <th
                      colSpan={section.headers.length}
                      className="reports-screen__endday-title"
                    >
                      {section.title}
                    </th>
                  </tr>
                  <tr>
                    {section.headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row, rowIndex) => (
                    <tr key={`${section.title}-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`${section.title}-${rowIndex}-${cellIndex}`}
                          className={
                            isNumericValue(cell)
                              ? "reports-screen__endday-value-cell"
                              : undefined
                          }
                        >
                          {renderValue(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>
        </section>
      ) : activeTab === "orders" ? (
        <section className="reports-screen__panel card">
          <div className="reports-screen__endday-head">
            <span>Ngày lập: 09/04/2026 22:42</span>
            <h3>BÁO CÁO LỢI NHUẬN</h3>
            <small className="reports-screen__report-range">
              Từ ngày: 09/04/2026 - 09/04/2026
            </small>
          </div>

          <div className="reports-screen__table-wrap">
            <table className="reports-screen__table reports-screen__orders-table">
              <thead>
                <tr>
                  {ORDER_PROFIT_HEADERS.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={ORDER_PROFIT_HEADERS.length}
                    className="reports-screen__empty"
                  >
                    Không có dữ liệu.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : activeTab === "tables" ? (
        <section className="reports-screen__panel card">
          <div className="reports-screen__endday-head">
            <span>Ngày lập: 09/04/2026 22:42</span>
            <h3>BÁO CÁO PHÒNG/BÀN</h3>
            <small className="reports-screen__report-range">
              Từ ngày: 09/04/2026 - 09/04/2026
            </small>
          </div>

          <div className="reports-screen__table-wrap">
            <table className="reports-screen__table reports-screen__orders-table">
              <thead>
                <tr>
                  {TABLE_REPORT_HEADERS.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={TABLE_REPORT_HEADERS.length}
                    className="reports-screen__empty"
                  >
                    Không có dữ liệu.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : activeTab === "products" ? (
        <section className="reports-screen__panel card">
          <div className="reports-screen__endday-head">
            <span>Ngày lập: 09/04/2026 22:42</span>
            <h3>BÁO CÁO LỢI NHUẬN THEO HÀNG HÓA</h3>
            <small className="reports-screen__report-range">
              Từ ngày: 09/04/2026 - 09/04/2026
            </small>
          </div>

          <div className="reports-screen__table-wrap">
            <table className="reports-screen__table reports-screen__orders-table">
              <thead>
                <tr>
                  {PRODUCT_REPORT_HEADERS.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={PRODUCT_REPORT_HEADERS.length}
                    className="reports-screen__empty"
                  >
                    Không có dữ liệu.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : activeTab === "inventory" ? (
        <section className="reports-screen__panel card">
          <div className="reports-screen__endday-head">
            <span>Ngày lập: 09/04/2026 22:42</span>
            <h3>BÁO CÁO TỒN KHO THEO HÀNG HÓA</h3>
            <small className="reports-screen__report-range">
              Từ ngày: 01/04/2026 - 09/04/2026
            </small>
          </div>

          <div className="reports-screen__table-wrap">
            <table className="reports-screen__table reports-screen__orders-table">
              <thead>
                <tr>
                  {INVENTORY_REPORT_HEADERS.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={INVENTORY_REPORT_HEADERS.length}
                    className="reports-screen__empty"
                  >
                    Không có dữ liệu.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : activeTab === "customers" ? (
        <section className="reports-screen__panel card">
          <div className="reports-screen__endday-head">
            <span>Ngày lập: 09/04/2026 22:42</span>
            <h3>BÁO CÁO LỢI NHUẬN THEO KHÁCH HÀNG</h3>
            <small className="reports-screen__report-range">
              Từ ngày: 09/04/2026 - 09/04/2026
            </small>
          </div>

          <div className="reports-screen__table-wrap">
            <table className="reports-screen__table reports-screen__orders-table">
              <thead>
                <tr>
                  {CUSTOMER_REPORT_HEADERS.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={CUSTOMER_REPORT_HEADERS.length}
                    className="reports-screen__empty"
                  >
                    Không có dữ liệu.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : activeTab === "suppliers" ? (
        <section className="reports-screen__panel card">
          <div className="reports-screen__endday-head">
            <span>Ngày lập: 09/04/2026 22:42</span>
            <h3>BÁO CÁO CÔNG NỢ THEO NHÀ CUNG CẤP</h3>
            <small className="reports-screen__report-range">
              Từ ngày: 01/04/2026 - 09/04/2026
            </small>
          </div>

          <div className="reports-screen__table-wrap">
            <table className="reports-screen__table reports-screen__orders-table">
              <thead>
                <tr>
                  {SUPPLIER_REPORT_HEADERS.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={SUPPLIER_REPORT_HEADERS.length}
                    className="reports-screen__empty"
                  >
                    Không có dữ liệu.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : activeTab === "vat" ? (
        <section className="reports-screen__panel card">
          <div className="reports-screen__endday-head">
            <span>Ngày lập: 09/04/2026 22:42</span>
            <h3>BÁO CÁO VAT BÁN HÀNG</h3>
            <small className="reports-screen__report-range">
              Từ ngày: 09/04/2026 - 09/04/2026
            </small>
          </div>

          <div className="reports-screen__table-wrap">
            <table className="reports-screen__table reports-screen__orders-table">
              <thead>
                <tr>
                  {VAT_REPORT_HEADERS.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={VAT_REPORT_HEADERS.length}
                    className="reports-screen__empty"
                  >
                    Không có dữ liệu.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : activeTab === "finance" ? (
        <section className="reports-screen__panel card">
          <div className="reports-screen__endday-head">
            <span>Ngày lập: 09/04/2026 22:42</span>
            <h3>BÁO CÁO TÀI CHÍNH</h3>
          </div>

          <div className="reports-screen__table-wrap">
            <table className="reports-screen__table reports-screen__orders-table">
              <thead>
                <tr>
                  <th colSpan={2}>Báo cáo hoạt động kinh doanh</th>
                </tr>
              </thead>
              <tbody>
                {FINANCE_REPORT_ROWS.map((row) => (
                  <tr key={row}>
                    <td>{row}</td>
                    <td className="reports-screen__endday-value-cell">0</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="reports-screen__panel card">
          <div className="reports-screen__table-wrap">
            <table className="reports-screen__table">
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={headers.length}
                    className="reports-screen__empty"
                  >
                    Chưa có dữ liệu trong khoảng thời gian đã chọn.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isFilterOpen ? (
        <div className="reports-filter-overlay" role="presentation">
          <section
            className="reports-filter-drawer"
            aria-label="Bộ lọc báo cáo"
          >
            <header className="reports-filter-drawer__header">
              <h3>Lọc theo</h3>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setIsFilterOpen(false)}
                aria-label="Đóng bộ lọc"
              >
                ✕
              </button>
            </header>

            <div className="reports-filter-drawer__body">
              <h4>Thời gian</h4>
              <div className="reports-filter-drawer__quick-grid">
                {FILTER_QUICK_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`reports-filter-drawer__quick-btn ${selectedQuickFilter === option ? "reports-filter-drawer__quick-btn--active" : ""}`}
                    onClick={() => applyQuickFilter(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="reports-filter-drawer__date-row">
                <label className="reports-filter-drawer__date-field">
                  <span>Từ ngày</span>
                  <input
                    type="date"
                    className="input"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                  />
                </label>
                <label className="reports-filter-drawer__date-field">
                  <span>Đến ngày</span>
                  <input
                    type="date"
                    className="input"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                  />
                </label>
              </div>
            </div>

            <footer className="reports-filter-drawer__footer">
              <button type="button" className="btn" onClick={resetFilters}>
                Thiết lập lại
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={applyFilters}
              >
                Lọc
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
