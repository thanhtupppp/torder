import type { ProductDto } from "../dtos/catalog";

type ProductTableProps = {
  products: ProductDto[];
  columns: Array<{ key: string; label: string }>;
  page: number;
  pageSize: number;
  total: number;
  onPageChange?: (page: number) => void;
};

export function ProductTable({
  products,
  columns,
  page,
  pageSize,
  total,
  onPageChange,
}: ProductTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function handleJumpPage(value: string) {
    const next = Number(value);
    if (!Number.isFinite(next)) return;
    const safePage = Math.min(Math.max(1, next), totalPages);
    onPageChange?.(safePage);
  }

  return (
    <div className="catalog-table-wrap panel-primitive">
      <table className="catalog-table">
        <colgroup>
          <col style={{ width: 36 }} />
          <col style={{ width: 34 }} />
          <col style={{ width: 150 }} />
          <col style={{ width: 260 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 120 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 72 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 72 }} />
        </colgroup>
        <thead>
          <tr>
            <th />
            <th />
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((row) => (
            <tr key={row.id}>
              <td>
                <input type="checkbox" />
              </td>
              <td>☆</td>
              <td>{row.code}</td>
              <td className="catalog-link-cell">{row.name}</td>
              <td>{row.barcode}</td>
              <td>{row.unit}</td>
              <td>{row.type}</td>
              <td>{row.cost}</td>
              <td>{row.vat}</td>
              <td>{row.price}</td>
              <td className="catalog-stock-warn">{row.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <footer className="catalog-table-footer">
        <span>Tổng: {total}</span>
        <div className="catalog-footer-paging">
          <button
            type="button"
            className="btn ghost"
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            {page}
          </button>
          <span>Nhảy tới</span>
          <input
            className="input"
            defaultValue={page}
            onBlur={(event) => handleJumpPage(event.target.value)}
          />
        </div>
      </footer>
    </div>
  );
}
