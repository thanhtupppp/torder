import { Trash2, X } from "lucide-react";
import type { ProductDto } from "../dtos/catalog";
import type { useCatalogModal } from "../hooks/useCatalogModal";

type EditCategoryModalProps = {
  modal: ReturnType<typeof useCatalogModal>;
  /** Preview rows to display in the category product list. */
  filteredRows: ProductDto[];
};

export function EditCategoryModal({
  modal,
  filteredRows,
}: EditCategoryModalProps) {
  const isEditMode = modal.editingCategoryName !== undefined;

  return (
    <div className="catalog-overlay">
      <section className="catalog-modal card">
        <header className="catalog-modal-header">
          <h3>{isEditMode ? "Sửa danh mục" : "Tạo danh mục"}</h3>
          <button
            type="button"
            className="modal-close-btn"
            aria-label="Đóng"
            onClick={modal.closeModal}
          >
            <X size={14} />
          </button>
        </header>

        <div className="catalog-category-edit">
          <div className="catalog-upload-circle small" />
          <label>
            <span>Tên danh mục *</span>
            <input
              className="input"
              defaultValue={modal.editingCategoryName ?? ""}
              placeholder="Tên danh mục"
            />
          </label>
          <label className="catalog-check-inline">
            <input type="checkbox" defaultChecked />
            <span>Hiển thị trong đặt hàng</span>
          </label>
          <label>
            <span>Danh sách sản phẩm</span>
            <input className="input" placeholder="Tìm kiếm" />
          </label>
        </div>

        <table className="catalog-mini-table">
          <thead>
            <tr>
              <th>Mã hàng</th>
              <th>Sản phẩm</th>
              <th>Đơn vị tính</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.slice(0, 4).map((row) => (
              // ✅ prefix thừa — row.code đã unique trong list này
              <tr key={row.code}>
                <td>{row.code}</td>
                <td>{row.name}</td>
                <td>{row.unit || "-"}</td>
                <td>
                  {/* ✅ aria-label cho icon-only button */}
                  <button
                    type="button"
                    className="btn ghost icon-only"
                    aria-label={`Xoá ${row.name} khỏi danh mục`}
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="catalog-modal-footer between">
          {isEditMode ? (
            <button type="button" className="btn ghost">
              Xoá
            </button>
          ) : (
            <span />
          )}
          <button type="button" className="btn primary">
            {isEditMode ? "Cập nhật" : "Tạo danh mục"}
          </button>
        </footer>
      </section>
    </div>
  );
}
