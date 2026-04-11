import {
  ArrowUpDown,
  CalendarDays,
  ChevronDown,
  Columns3,
  Download,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type StatusKey =
  | "pending"
  | "processing"
  | "completed"
  | "cancelled"
  | "returned";

type StatusFilter = {
  key: StatusKey;
  label: string;
  count: number;
  color: "blue" | "amber" | "green" | "red" | "cyan";
  checked: boolean;
};

const DATE_QUICK_RANGES = [
  "Hôm nay",
  "Hôm qua",
  "Tuần này",
  "Tuần trước",
  "7 ngày qua",
  "30 ngày qua",
  "Quý này",
  "Quý trước",
  "Tháng này",
  "Tháng trước",
  "Năm nay",
  "Năm trước",
];

const INITIAL_STATUS_FILTERS: StatusFilter[] = [
  {
    key: "pending",
    label: "Chờ xác nhận",
    count: 0,
    color: "blue",
    checked: true,
  },
  {
    key: "processing",
    label: "Đang xử lý",
    count: 0,
    color: "amber",
    checked: true,
  },
  {
    key: "completed",
    label: "Hoàn thành",
    count: 0,
    color: "green",
    checked: true,
  },
  { key: "cancelled", label: "Đã huỷ", count: 0, color: "red", checked: false },
  {
    key: "returned",
    label: "Trả hàng",
    count: 0,
    color: "cyan",
    checked: true,
  },
];

const EXPORT_STATUS = [
  { label: "Chưa xuất", count: 0, color: "amber" },
  { label: "Đã xuất", count: 0, color: "blue" },
  { label: "Đã phát hành", count: 0, color: "green" },
  { label: "Lỗi", count: 0, color: "red" },
] as const;

const TABLE_COLUMNS = [
  "Thông tin đơn hàng",
  "Thời gian",
  "Trạng thái",
  "Khách hàng",
  "Tổng doanh thu",
  "Phương thức thanh toán",
  "Hoá đơn điện tử",
  "Thanh toán",
  "SL Khách",
  "Giao hàng",
] as const;

type TableColumn = (typeof TABLE_COLUMNS)[number];

function createColumnsVisibility(value: boolean): Record<TableColumn, boolean> {
  return Object.fromEntries(
    TABLE_COLUMNS.map((column) => [column, value]),
  ) as Record<TableColumn, boolean>;
}

type SortDirection = "asc" | "desc";
type SortState = {
  column: TableColumn;
  direction: SortDirection;
} | null;

export function OrdersScreen() {
  const [statuses, setStatuses] = useState(INITIAL_STATUS_FILTERS);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [invoiceCode, setInvoiceCode] = useState("");
  const [sortState, setSortState] = useState<SortState>(null);
  const [dateOverlayAlign, setDateOverlayAlign] = useState<"right" | "left">(
    "right",
  );

  const filterPanelRef = useRef<HTMLElement>(null);
  const dateOverlayRef = useRef<HTMLDivElement>(null);
  const dateTriggerRef = useRef<HTMLButtonElement>(null);
  const columnTriggerRef = useRef<HTMLButtonElement>(null);
  const columnPopoverRef = useRef<HTMLDivElement>(null);

  const [visibleColumns, setVisibleColumns] = useState<
    Record<TableColumn, boolean>
  >(() => createColumnsVisibility(true));

  const selectedColumnCount = useMemo(
    () => TABLE_COLUMNS.filter((column) => visibleColumns[column]).length,
    [visibleColumns],
  );

  const displayedColumns = useMemo(
    () => TABLE_COLUMNS.filter((column) => visibleColumns[column]),
    [visibleColumns],
  );

  useEffect(() => {
    if (!showDatePicker) return;

    function updateDateOverlayAlign() {
      if (!filterPanelRef.current || !dateOverlayRef.current) return;

      const panelRect = filterPanelRef.current.getBoundingClientRect();
      const overlayWidth = dateOverlayRef.current.offsetWidth || 725;
      const gap = 12;
      const rightSpace = window.innerWidth - panelRect.right;
      const leftSpace = panelRect.left;

      const canOpenRight = rightSpace >= overlayWidth + gap;
      const canOpenLeft = leftSpace >= overlayWidth + gap;

      if (canOpenRight) {
        setDateOverlayAlign("right");
      } else if (canOpenLeft) {
        setDateOverlayAlign("left");
      } else {
        setDateOverlayAlign(rightSpace >= leftSpace ? "right" : "left");
      }
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInsideOverlay = dateOverlayRef.current?.contains(target);
      const clickedTrigger = dateTriggerRef.current?.contains(target);

      if (!clickedInsideOverlay && !clickedTrigger) {
        setShowDatePicker(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowDatePicker(false);
      }
    }

    updateDateOverlayAlign();
    window.addEventListener("resize", updateDateOverlayAlign);
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", updateDateOverlayAlign);
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showDatePicker]);

  useEffect(() => {
    if (!showColumnSelector) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInsidePopover = columnPopoverRef.current?.contains(target);
      const clickedTrigger = columnTriggerRef.current?.contains(target);

      if (!clickedInsidePopover && !clickedTrigger) {
        setShowColumnSelector(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowColumnSelector(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showColumnSelector]);

  function toggleStatus(key: StatusKey) {
    setStatuses((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, checked: !item.checked } : item,
      ),
    );
  }

  function toggleSort(column: TableColumn) {
    setSortState((prev) => {
      if (!prev || prev.column !== column) {
        return { column, direction: "asc" };
      }

      if (prev.direction === "asc") {
        return { column, direction: "desc" };
      }

      return null;
    });
  }

  function toggleColumnVisibility(column: TableColumn) {
    setVisibleColumns((prev) => {
      const currentlyVisible = Object.values(prev).filter(Boolean).length;
      const isCurrentColumnVisible = prev[column];

      if (isCurrentColumnVisible && currentlyVisible <= 1) {
        return prev;
      }

      return {
        ...prev,
        [column]: !prev[column],
      };
    });
  }

  function showAllColumns() {
    setVisibleColumns(createColumnsVisibility(true));
  }

  function hideAllColumns() {
    const firstColumn = TABLE_COLUMNS[0];
    setVisibleColumns(
      TABLE_COLUMNS.reduce(
        (acc, column) => {
          acc[column] = column === firstColumn;
          return acc;
        },
        {} as Record<TableColumn, boolean>,
      ),
    );
  }

  function resetColumnsDefault() {
    setVisibleColumns(createColumnsVisibility(true));
  }

  return (
    <div className="invoice-page">
      <section className="invoice-layout">
        <aside className="invoice-filter-panel card" ref={filterPanelRef}>
          <h2 className="invoice-screen-title">Hoá đơn</h2>

          <div className="invoice-filter-group panel-primitive">
            <button
              type="button"
              className="invoice-filter-group-header"
              onClick={() => setShowDatePicker((prev) => !prev)}
            >
              <span>Thời gian</span>
              <ChevronDown
                size={14}
                className={showDatePicker ? "rotate-0" : "rotate-180"}
              />
            </button>
            <button
              type="button"
              className="invoice-date-trigger"
              ref={dateTriggerRef}
              onClick={() => setShowDatePicker((prev) => !prev)}
            >
              <CalendarDays size={14} />
              <span>Từ ngày</span>
              <span>-</span>
              <span>Đến ngày</span>
            </button>
          </div>

          <div className="invoice-filter-group panel-primitive">
            <h3>Trạng thái</h3>
            <div className="invoice-checkbox-list">
              {statuses.map((status) => (
                <label
                  key={status.key}
                  className={`invoice-check ${status.color}`}
                >
                  <input
                    type="checkbox"
                    checked={status.checked}
                    onChange={() => toggleStatus(status.key)}
                  />
                  <span>
                    {status.label} ({status.count})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="invoice-filter-group panel-primitive">
            <h3>Người tạo</h3>
            <button type="button" className="invoice-select-trigger">
              <span>Tất cả</span>
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="invoice-filter-group panel-primitive">
            <h3>Người bán</h3>
            <button type="button" className="invoice-select-trigger">
              <span>Tất cả</span>
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="invoice-filter-group panel-primitive">
            <h3>Xuất HĐĐT</h3>
            <div className="invoice-checkbox-list">
              {EXPORT_STATUS.map((item) => (
                <label
                  key={item.label}
                  className={`invoice-check ${item.color}`}
                >
                  <input type="checkbox" />
                  <span>
                    {item.label} ({item.count})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="invoice-filter-group panel-primitive">
            <h3>Phương thức thanh toán</h3>
            <button type="button" className="invoice-select-trigger">
              <span>Tất cả</span>
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="invoice-filter-group panel-primitive">
            <h3>Khu vực</h3>
            <button type="button" className="invoice-select-trigger">
              <span>Khu vực</span>
              <ChevronDown size={14} />
            </button>
            <button type="button" className="invoice-select-trigger">
              <span>Bàn</span>
              <ChevronDown size={14} />
            </button>
          </div>

          {showDatePicker ? (
            <div
              ref={dateOverlayRef}
              className={`invoice-date-overlay panel-primitive ${dateOverlayAlign === "left" ? "align-left" : "align-right"}`}
            >
              <div className="invoice-date-ranges">
                {DATE_QUICK_RANGES.map((range) => (
                  <button
                    key={range}
                    type="button"
                    className="invoice-date-range-item"
                  >
                    {range}
                  </button>
                ))}
              </div>
              <div className="invoice-calendar-columns">
                <div className="invoice-calendar-month">
                  <h4>2026 Năm Tháng 4</h4>
                  <div className="invoice-weekday-row">
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                  <div className="invoice-day-grid">
                    {Array.from({ length: 35 }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={idx === 11 ? "active" : ""}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="invoice-calendar-month">
                  <h4>2026 Năm Tháng 5</h4>
                  <div className="invoice-weekday-row">
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                  <div className="invoice-day-grid">
                    {Array.from({ length: 35 }).map((_, idx) => (
                      <button key={idx} type="button">
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </aside>

        <section className="invoice-main card">
          <div className="invoice-toolbar">
            <div className="invoice-search-wrap search-box">
              <Search size={14} />
              <input
                className="input"
                value={invoiceCode}
                onChange={(event) => setInvoiceCode(event.target.value)}
                placeholder="Theo mã hoá đơn"
              />
            </div>
            <div className="invoice-toolbar-actions">
              <button type="button" className="btn ghost">
                <Download size={14} /> Xuất file
              </button>
              <button type="button" className="btn ghost">
                <X size={14} /> Gộp đơn
              </button>
              <button
                type="button"
                ref={columnTriggerRef}
                className="btn ghost"
                onClick={() => setShowColumnSelector((prev) => !prev)}
              >
                <Columns3 size={14} />
              </button>
            </div>
          </div>

          <div className="invoice-table-wrap panel-primitive">
            <table className="invoice-table">
              <thead>
                <tr>
                  {displayedColumns.map((column) => {
                    const isActive = sortState?.column === column;
                    const directionLabel = isActive
                      ? sortState?.direction === "asc"
                        ? "tăng dần"
                        : "giảm dần"
                      : "chưa sắp xếp";

                    return (
                      <th key={column}>
                        <button
                          type="button"
                          className={`invoice-th-btn ${isActive ? "active" : ""}`}
                          onClick={() => toggleSort(column)}
                          aria-label={`Sắp xếp cột ${column}, trạng thái ${directionLabel}`}
                          title={`Sắp xếp: ${directionLabel}`}
                        >
                          <span>{column}</span>
                          <ArrowUpDown size={13} />
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={Math.max(displayedColumns.length, 1)}
                    className="invoice-empty-state"
                  >
                    <p>Không có dữ liệu</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <footer className="invoice-summary-footer">
            <p>
              Tổng doanh thu trả <span>0</span>
            </p>
            <p>
              Tổng doanh thu chờ xác nhận <span>0</span>
            </p>
            <p>
              Tổng doanh thu đang xử lý <span>0</span>
            </p>
          </footer>

          {showColumnSelector ? (
            <div
              ref={columnPopoverRef}
              className="invoice-columns-popover panel-primitive"
            >
              <header>
                <strong>Chọn cột hiển thị</strong>
                <small>{selectedColumnCount} cột</small>
              </header>
              <div className="invoice-columns-actions">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={showAllColumns}
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={hideAllColumns}
                >
                  Bỏ chọn tất cả
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={resetColumnsDefault}
                >
                  Mặc định
                </button>
              </div>
              <div className="invoice-columns-grid">
                {TABLE_COLUMNS.map((column) => {
                  const isChecked = visibleColumns[column];
                  const disableUncheck = isChecked && selectedColumnCount <= 1;

                  return (
                    <label key={column} className="invoice-check blue">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={disableUncheck}
                        onChange={() => toggleColumnVisibility(column)}
                      />
                      <span>{column}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>
      </section>
    </div>
  );
}
