import { ChevronDown, Plus, Search, SlidersHorizontal } from "lucide-react";

type SummaryCardsProps = {
  labels: string[];
};

export function SummaryCards({ labels }: SummaryCardsProps) {
  return (
    <div className="inventory-summary-grid">
      {labels.map((label) => (
        <article key={label} className="inventory-summary-card panel-primitive">
          <h4>{label}</h4>
          <p>0</p>
        </article>
      ))}
    </div>
  );
}

type InventoryTableProps = {
  columns: string[];
};

export function InventoryTable({ columns }: InventoryTableProps) {
  return (
    <div className="inventory-table-wrap panel-primitive">
      <table className="inventory-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={columns.length} className="inventory-empty-state">
              Không có dữ liệu
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

type InventoryGenericViewProps = {
  title: string;
  showLeftFilter?: boolean;
  columns: string[];
  searchPlaceholder?: string;
  actionLabel?: string;
  filterSections?: Array<{ title: string; options: string[] }>;
};

export function InventoryGenericView({
  title,
  showLeftFilter,
  columns,
  searchPlaceholder = "Tìm theo mã hoặc tên",
  actionLabel,
  filterSections = [],
}: InventoryGenericViewProps) {
  return (
    <section className="inventory-view card">
      <header className="inventory-view-header">
        <h3>{title}</h3>
      </header>

      <SummaryCards
        labels={
          showLeftFilter
            ? ["Tổng phiếu", "Tổng sản phẩm", "Tổng số lượng", "Tổng giá trị"]
            : ["Tổng mục", "Cần xử lý", "Tổng giá trị"]
        }
      />

      <div className={`inventory-body ${showLeftFilter ? "has-filter" : ""}`}>
        {showLeftFilter ? (
          <aside className="inventory-filter panel-primitive">
            {filterSections.map((section) => (
              <section key={section.title} className="inventory-filter-section">
                <header>
                  <span>{section.title}</span>
                  <ChevronDown size={13} />
                </header>
                <div className="inventory-filter-list">
                  {section.options.map((option, idx) => (
                    <label key={option} className="inventory-check-row">
                      <input type="checkbox" defaultChecked={idx === 0} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </aside>
        ) : null}

        <div className="inventory-main-table">
          <div className="inventory-toolbar">
            <div className="inventory-search search-box">
              <Search size={14} />
              <input className="input" placeholder={searchPlaceholder} />
            </div>
            <div className="inventory-toolbar-actions">
              <button type="button" className="btn ghost">
                <SlidersHorizontal size={14} /> Bộ lọc
              </button>
              {actionLabel ? (
                <button type="button" className="btn primary">
                  <Plus size={14} /> {actionLabel}
                </button>
              ) : null}
            </div>
          </div>
          <InventoryTable columns={columns} />
        </div>
      </div>
    </section>
  );
}
