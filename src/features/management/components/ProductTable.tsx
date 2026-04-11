import type { ProductColumn } from "../constants/catalog";
import type { ProductDto } from "../dtos/catalog";

type ProductTableProps = {
  products: ProductDto[];
  columns: ProductColumn[]; // ✅ type-safe
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
    onPageChange?.(Math.min(Math.max(1, next), totalPages));
  }

  return (
    <div className="catalog-table-wrap panel-primitive">
      <table className="catalog-table">
        {/* ✅ Bỏ colgroup hardcode — dùng CSS width trên th */}
        <thead>
          <tr>
            <th style={{ width: 36 }} />
            <th style={{ width: 34 }} />
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? (
            products.map((row) => (
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
            ))
          ) : (
            <tr>
              <td colSpan={2 + columns.length} className="catalog-empty">
                Không có dữ liệu
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <footer className="catalog-table-footer">
        <span>Tổng: {total}</span>
        <div className="catalog-footer-paging">
          {/* ✅ Prev + Next button đúng label */}
          <button
            type="button"
            className="btn ghost"
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
            disabled={page <= 1}
            aria-label="Trang trước"
          >
            ‹
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            className="btn ghost"
            onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            aria-label="Trang sau"
          >
            ›
          </button>
          <span>Nhảy tới</span>
          <input
            className="input"
            key={page} // reset input khi page thay đổi từ ngoài
            defaultValue={page}
            onBlur={(e) => handleJumpPage(e.target.value)}
          />
        </div>
      </footer>
    </div>
  );
}
