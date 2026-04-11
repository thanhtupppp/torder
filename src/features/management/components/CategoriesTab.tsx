import { Grip, Plus } from "lucide-react";
import type { CategoryDto } from "../dtos/catalog";

type CategoriesTabProps = {
  categories: CategoryDto[];
  isLoading: boolean;
  onEditCategory: () => void;
};

export function CategoriesTab({
  categories,
  isLoading,
  onEditCategory,
}: CategoriesTabProps) {
  return (
    <section className="catalog-categories card">
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
              onClick={onEditCategory}
            >
              <Grip size={16} />
            </button>
          </article>
        ))}
      </div>

      {!isLoading && categories.length === 0 ? (
        <div className="catalog-empty-categories panel-primitive">
          <p>Chưa có danh mục nào.</p>
          <p className="muted">Bạn có thể tạo danh mục mới để bắt đầu.</p>
        </div>
      ) : null}

      <button
        type="button"
        className="btn primary catalog-add-category"
        onClick={onEditCategory}
      >
        <Plus size={14} /> Tạo danh mục
      </button>
    </section>
  );
}
