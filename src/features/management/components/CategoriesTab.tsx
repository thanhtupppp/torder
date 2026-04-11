import { Grip, Plus } from "lucide-react";
import type { CategoryDto } from "../dtos/catalog";

type CategoriesTabProps = {
  categories: CategoryDto[];
  isLoading: boolean;
  /** Called when user clicks "Tạo danh mục" — opens modal in create mode. */
  onCreateCategory: () => void;
  /** Called when user clicks the grip handle on a row — opens modal in edit mode. */
  onEditCategory: (categoryName: string) => void;
};

export function CategoriesTab({
  categories,
  isLoading,
  onCreateCategory,
  onEditCategory,
}: CategoriesTabProps) {
  return (
    <section className="catalog-categories card">
      {/* ── 3-state render ────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="catalog-categories-list">
          {Array.from({ length: 4 }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} className="catalog-category-item panel-primitive skeleton" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="catalog-empty-categories panel-primitive">
          <p>Chưa có danh mục nào.</p>
          <p className="muted">Bạn có thể tạo danh mục mới để bắt đầu.</p>
        </div>
      ) : (
        <div className="catalog-categories-list">
          {categories.map((row) => (
            <article
              key={row.name}
              className="catalog-category-item panel-primitive"
            >
              <div className="catalog-category-left">
                <div className="catalog-category-thumb" />
                <div>
                  <h3>{row.name}</h3>
                  <p>{row.productCount} sản phẩm</p>
                </div>
              </div>
              <button
                type="button"
                className="catalog-category-sort"
                aria-label={`Chỉnh sửa ${row.name}`}
                onClick={() => onEditCategory(row.name)}
              >
                <Grip size={16} />
              </button>
            </article>
          ))}
        </div>
      )}

      <button
        type="button"
        className="btn primary catalog-add-category"
        onClick={onCreateCategory}
      >
        <Plus size={14} /> Tạo danh mục
      </button>
    </section>
  );
}
