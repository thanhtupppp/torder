import {
  ArrowDownUp,
  ChevronDown,
  EllipsisVertical,
  LayoutGrid,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { useClickOutside } from "../../../hooks/useClickOutside";
import { ACTION_MENU_ITEMS } from "../constants/catalog";
import type { useCatalogFilter } from "../hooks/useCatalogFilter";

type CatalogToolbarProps = {
  filter: ReturnType<typeof useCatalogFilter>;
  onOpenCreate: () => void;
};

export function CatalogToolbar({ filter, onOpenCreate }: CatalogToolbarProps) {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);

  const actionMenuRef = useRef<HTMLDivElement>(null);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside(actionMenuRef, () => setIsActionMenuOpen(false), isActionMenuOpen);
  useClickOutside(columnMenuRef, () => setIsColumnMenuOpen(false), isColumnMenuOpen);

  return (
    <header className="catalog-products-header">
      <h2>Sản phẩm</h2>
      <div className="catalog-products-actions">
        {/* Search */}
        <div className="catalog-search search-box catalog-search--dropdown">
          <Search size={14} />
          <input
            className="input"
            placeholder="Theo mã, tên hàng"
            value={filter.productSearch}
            onChange={(e) => filter.setSearch(e.target.value)}
          />
          <ChevronDown size={14} className="catalog-search-caret" />
        </div>

        {/* Primary action */}
        <button
          type="button"
          className="btn primary catalog-header-btn"
          onClick={onOpenCreate}
        >
          <Plus size={14} /> Thêm
        </button>

        <button type="button" className="btn ghost catalog-header-btn">
          <Upload size={14} /> Nhập file
        </button>
        <button type="button" className="btn ghost catalog-header-btn">
          <Upload size={14} /> Xuất file
        </button>

        {/* Bulk action menu */}
        <div className="catalog-action-menu" ref={actionMenuRef}>
          <button
            type="button"
            className="btn ghost catalog-header-btn catalog-header-btn--action"
            onClick={() => setIsActionMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={isActionMenuOpen}
          >
            <EllipsisVertical size={14} /> Thao tác
          </button>
          {isActionMenuOpen ? (
            <div className="catalog-action-menu__popup" role="menu">
              {ACTION_MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="menuitem"
                    className={`catalog-action-menu__item ${item.danger ? "catalog-action-menu__item--danger" : ""}`}
                    onClick={() => setIsActionMenuOpen(false)}
                  >
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Icon buttons */}
        <div ref={columnMenuRef} style={{ position: "relative" }}>
          <button
            type="button"
            className="btn ghost icon-only catalog-header-icon-btn"
            aria-label="Chế độ hiển thị bảng"
            title="Chế độ hiển thị bảng"
            onClick={() => setIsColumnMenuOpen((prev) => !prev)}
          >
            <LayoutGrid size={14} />
          </button>
          {/* Column picker dropdown placeholder — wired when feature is built */}
        </div>
        <button
          type="button"
          className="btn ghost icon-only catalog-header-icon-btn"
          aria-label="Sắp xếp nâng cao"
          title="Sắp xếp nâng cao"
        >
          <ArrowDownUp size={14} />
        </button>
      </div>
    </header>
  );
}
