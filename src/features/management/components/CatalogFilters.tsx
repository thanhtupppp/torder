import { ChevronDown } from "lucide-react";
import { PRODUCT_TYPES } from "../constants/catalog";
import type { useCatalogFilter } from "../hooks/useCatalogFilter";

// ── Constants ─────────────────────────────────────────────────────────────────

const STOCK_STATE_OPTIONS = [
  "Tất cả",
  "Luôn âm kho",
  "Vượt định mức tồn",
  "Còn hàng trong kho",
  "Hết hàng trong kho",
] as const;

const DIRECT_SALE_OPTIONS = [
  "Tất cả",
  "Được bán trực tiếp",
  "Không được bán trực tiếp",
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

type CatalogFiltersProps = {
  filter: ReturnType<typeof useCatalogFilter>;
};

export function CatalogFilters({ filter }: CatalogFiltersProps) {
  return (
    <aside className="catalog-filters panel-primitive">
      <div className="catalog-filter-group">
        <h3>Loại hàng</h3>
        {PRODUCT_TYPES.map((type) => (
          <label key={type.key} className="catalog-check-row">
            <input
              type="radio"
              checked={filter.productType === type.key}
              onChange={() => filter.setProductType(type.key)}
            />
            <span>{type.label}</span>
          </label>
        ))}
      </div>

      <div className="catalog-filter-group">
        <h3>Nhóm hàng</h3>
        <button type="button" className="catalog-filter-select">
          <span>Tất cả</span>
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="catalog-filter-group">
        <h3>Tồn kho</h3>
        {STOCK_STATE_OPTIONS.map((label) => (
          <label key={label} className="catalog-check-row">
            <input
              type="radio"
              name="stock-state"
              // ✅ "Tất cả" rõ ràng hơn index === 0
              defaultChecked={label === "Tất cả"}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div className="catalog-filter-group">
        <h3>Bán trực tiếp</h3>
        {DIRECT_SALE_OPTIONS.map((label) => (
          <label key={label} className="catalog-check-row">
            <input
              type="radio"
              name="direct-sale"
              defaultChecked={label === "Tất cả"}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </aside>
  );
}
