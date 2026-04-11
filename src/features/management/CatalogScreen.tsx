import {
  ArrowDownUp,
  ArrowRightLeft,
  BadgeCheck,
  Check,
  ChevronDown,
  EllipsisVertical,
  Grip,
  ImagePlus,
  LayoutGrid,
  Lock,
  Percent,
  Plus,
  ScanLine,
  Search,
  Star,
  StarOff,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CategorySelect } from "../../components/ui/CategorySelect";
import { UnitSelect } from "../../components/ui/UnitSelect";
import type { UnitOption } from "../../constants/units";
import { ProductTable } from "./components/ProductTable";
import { useCatalogFilter } from "./hooks/useCatalogFilter";
import { useCatalogImage } from "./hooks/useCatalogImage";
import { useCatalogMocks } from "./hooks/useCatalogMocks";
import { useCatalogModal } from "./hooks/useCatalogModal";

// ── Constants ────────────────────────────────────────────────────────────────

const TOP_TABS = [
  { key: "products", label: "Sản phẩm" },
  { key: "categories", label: "Danh mục" },
  { key: "addons", label: "Món thêm" },
  { key: "notes", label: "Ghi chú món" },
] as const;

const PRODUCT_TYPES = [
  { key: "goods", label: "Hàng hoá" },
  { key: "service", label: "Dịch vụ" },
  { key: "combo", label: "Combo" },
  { key: "ingredient", label: "Hàng chưa nguyên liệu" },
] as const;

const PRODUCT_COLUMNS = [
  { key: "code", label: "Mã hàng" },
  { key: "name", label: "Tên hàng" },
  { key: "barcode", label: "Barcode" },
  { key: "unit", label: "ĐVT" },
  { key: "group", label: "Nhóm hàng" },
  { key: "type", label: "Loại hàng" },
  { key: "cost", label: "Giá vốn" },
  { key: "vat", label: "VAT" },
  { key: "price", label: "Giá bán" },
  { key: "stock", label: "Tồn kho" },
  { key: "minStock", label: "Định mức tồn ít nhất" },
  { key: "maxStock", label: "Định mức tồn cao nhất" },
];

const DEFAULT_VISIBLE_COLUMNS = new Set([
  "code",
  "name",
  "barcode",
  "unit",
  "type",
  "cost",
  "vat",
  "price",
  "stock",
]);

const ACTION_MENU_ITEMS: Array<{
  key: string;
  label: string;
  icon: typeof Trash2;
  danger?: boolean;
}> = [
  { key: "delete", label: "Xóa sản phẩm", icon: Trash2, danger: true },
  { key: "barcode", label: "In mã vạch", icon: ScanLine },
  { key: "change-vat", label: "Thay đổi tỷ lệ thuế", icon: Percent },
  { key: "move-category", label: "Chuyển nhóm hàng", icon: ArrowRightLeft },
  { key: "enable-sale", label: "Cho phép kinh doanh", icon: BadgeCheck },
  { key: "disable-sale", label: "Ngừng kinh doanh", icon: Lock },
  { key: "favorite", label: "Sản phẩm yêu thích", icon: Star },
  { key: "unfavorite", label: "Ngừng yêu thích", icon: StarOff },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function CatalogScreen() {
  const { categories, products, isLoading } = useCatalogMocks();

  // ── Custom hooks ──────────────────────────────────────────────────────────
  const filter = useCatalogFilter(products);
  const modal = useCatalogModal();
  const image = useCatalogImage();

  // ── Local UI state (toolbar menus + form state) ───────────────────────────
  const [productUnit, setProductUnit] = useState<UnitOption | "">("");
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  // Column visibility — static for now; add useState + toggleColumnVisibility when the
  // column-picker dropdown UI (LayoutGrid button) is implemented.
  const visibleColumns = useMemo(
    () => PRODUCT_COLUMNS.filter((col) => DEFAULT_VISIBLE_COLUMNS.has(col.key)),
    [],
  );

  const actionMenuRef = useRef<HTMLDivElement>(null);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  // Click-outside + Escape to close toolbar menus
  useEffect(() => {
    if (!isActionMenuOpen && !isColumnMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (actionMenuRef.current && !actionMenuRef.current.contains(target)) {
        setIsActionMenuOpen(false);
      }
      if (columnMenuRef.current && !columnMenuRef.current.contains(target)) {
        setIsColumnMenuOpen(false);
      }
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsActionMenuOpen(false);
        setIsColumnMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isActionMenuOpen, isColumnMenuOpen]);

  function handleOpenCreateProduct() {
    image.clearImage();
    setProductUnit("");
    modal.openCreateProduct();
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="catalog-page">
      <header className="catalog-top-tabs">
        {TOP_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`catalog-top-tab ${filter.activeTab === tab.key ? "active" : ""}`}
            onClick={() => filter.setTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </header>

      {filter.activeTab === "products" ? (
        <section className="catalog-products card">
          <header className="catalog-products-header">
            <h2>Sản phẩm</h2>
            <div className="catalog-products-actions">
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
              <button
                type="button"
                className="btn primary catalog-header-btn"
                onClick={handleOpenCreateProduct}
              >
                <Plus size={14} /> Thêm
              </button>
              <button type="button" className="btn ghost catalog-header-btn">
                <Upload size={14} /> Nhập file
              </button>
              <button type="button" className="btn ghost catalog-header-btn">
                <Upload size={14} /> Xuất file
              </button>
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
              <button
                type="button"
                className="btn ghost icon-only catalog-header-icon-btn"
                aria-label="Chế độ hiển thị bảng"
                title="Chế độ hiển thị bảng"
              >
                <LayoutGrid size={14} />
              </button>
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

          <div className="catalog-products-layout">
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
                {[
                  "Tất cả",
                  "Luôn âm kho",
                  "Vượt định mức tồn",
                  "Còn hàng trong kho",
                  "Hết hàng trong kho",
                ].map((label, index) => (
                  <label key={label} className="catalog-check-row">
                    <input
                      type="radio"
                      name="stock-state"
                      defaultChecked={index === 0}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <div className="catalog-filter-group">
                <h3>Bán trực tiếp</h3>
                {[
                  "Tất cả",
                  "Được bán trực tiếp",
                  "Không được bán trực tiếp",
                ].map((label, index) => (
                  <label key={label} className="catalog-check-row">
                    <input
                      type="radio"
                      name="direct-sale"
                      defaultChecked={index === 0}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </aside>

            <ProductTable
              products={filter.pagedRows}
              columns={visibleColumns}
              page={filter.page}
              pageSize={filter.pageSize}
              total={filter.totalRows}
              onPageChange={filter.setPage}
            />
          </div>
        </section>
      ) : null}

      {filter.activeTab === "categories" ? (
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
                  onClick={modal.openEditCategory}
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
            onClick={modal.openEditCategory}
          >
            <Plus size={14} /> Tạo danh mục
          </button>
        </section>
      ) : null}

      {filter.activeTab === "addons" ? (
        <section className="catalog-placeholder card">
          Màn Món thêm sẽ được dựng tiếp theo thiết kế.
        </section>
      ) : null}

      {filter.activeTab === "notes" ? (
        <section className="catalog-placeholder card">
          Màn Ghi chú món sẽ được dựng tiếp theo thiết kế.
        </section>
      ) : null}

      {/* ── Create Product Modal ─────────────────────────────────────────── */}
      {modal.activeModal === "create-product" ? (
        <div className="catalog-overlay">
          <section className="catalog-modal catalog-modal-xl card">
            <header className="catalog-modal-header">
              <h3>Tạo sản phẩm</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={modal.closeModal}
              >
                <X size={14} />
              </button>
            </header>

            <div className="catalog-modal-grid">
              <div className="catalog-modal-main">
                <section className="catalog-section panel-primitive">
                  <h4>Loại sản phẩm</h4>
                  <div className="catalog-type-tabs">
                    {PRODUCT_TYPES.map((type) => (
                      <button
                        key={type.key}
                        type="button"
                        className={`catalog-type-tab ${filter.productType === type.key ? "active" : ""}`}
                        onClick={() => filter.setProductType(type.key)}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="catalog-section panel-primitive">
                  <h4>Thông tin chung</h4>
                  <div className="catalog-form-row">
                    <input
                      ref={image.imageInputRef}
                      type="file"
                      accept="image/*"
                      className="catalog-image-input"
                      onChange={image.handleChange}
                    />
                    <button
                      type="button"
                      className={`catalog-upload-circle ${image.isDragActive ? "drag-active" : ""}`}
                      onClick={image.triggerPicker}
                      onDragOver={image.handleDragOver}
                      onDragLeave={image.handleDragLeave}
                      onDrop={image.handleDrop}
                      aria-label="Chọn ảnh sản phẩm"
                      title="Chọn hoặc kéo thả ảnh sản phẩm"
                    >
                      {image.imageUrl ? (
                        <img src={image.imageUrl} alt="Ảnh sản phẩm" />
                      ) : (
                        <ImagePlus size={18} />
                      )}
                    </button>
                    <label className="full-width">
                      <span>Tên sản phẩm *</span>
                      <input className="input" />
                    </label>
                    {image.imageUrl ? (
                      <button
                        type="button"
                        className="btn ghost icon-only"
                        onClick={image.clearImage}
                        aria-label="Xoá ảnh sản phẩm"
                        title="Xoá ảnh"
                      >
                        <Trash2 size={12} />
                      </button>
                    ) : null}
                  </div>
                  <div className="catalog-form-grid three-cols">
                    <label>
                      <span>Mã sản phẩm</span>
                      <input className="input" />
                    </label>
                    <label>
                      <span>Barcode</span>
                      <input className="input" />
                    </label>
                    <label>
                      <span>Đơn vị tính</span>
                      <UnitSelect
                        value={productUnit}
                        onChange={setProductUnit}
                      />
                    </label>
                  </div>
                </section>

                <section className="catalog-section panel-primitive">
                  <h4>Giá bán &amp; thuế</h4>
                  <div className="catalog-form-grid two-cols">
                    <label>
                      <span>Giá bán *</span>
                      <input className="input" defaultValue="0" />
                    </label>
                    <label>
                      <span>Giá vốn</span>
                      <input className="input" defaultValue="0" />
                    </label>
                  </div>
                  <label className="catalog-check-inline">
                    <input type="checkbox" />
                    <span>Thuế VAT</span>
                  </label>
                </section>
              </div>

              <aside className="catalog-modal-side">
                <section className="catalog-section panel-primitive">
                  <h4>Thông tin bổ sung</h4>
                  <label>
                    <span>Danh mục</span>
                    <CategorySelect
                      categories={categories}
                      value={filter.productCategory}
                      onChange={filter.setCategory}
                      disabled={isLoading}
                    />
                  </label>
                  <label>
                    <span>Ghi chú</span>
                    <textarea className="input" rows={3} />
                  </label>
                </section>

                <section className="catalog-section panel-primitive">
                  <h4>Trạng thái</h4>
                  <label className="catalog-check-inline">
                    <input type="checkbox" defaultChecked />
                    <span>Cho phép bán</span>
                  </label>
                  <label className="catalog-check-inline">
                    <input type="checkbox" defaultChecked />
                    <span>Hiển thị trong đặt hàng</span>
                  </label>
                </section>
              </aside>
            </div>

            <footer className="catalog-modal-footer">
              <button type="button" className="btn primary">
                <Check size={14} /> Thêm sản phẩm
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {/* ── Edit Category Modal ──────────────────────────────────────────── */}
      {modal.activeModal === "edit-category" ? (
        <div className="catalog-overlay">
          <section className="catalog-modal card">
            <header className="catalog-modal-header">
              <h3>Sửa danh mục</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={modal.closeModal}
              >
                <X size={14} />
              </button>
            </header>

            <div className="catalog-category-edit">
              <div className="catalog-upload-circle small" />
              <label>
                <span>Tên danh mục *</span>
                <input className="input" defaultValue="Ăn vặt" />
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
                {filter.filteredRows.slice(0, 4).map((row) => (
                  <tr key={`mini-${row.code}`}>
                    <td>{row.code}</td>
                    <td>{row.name}</td>
                    <td>{row.unit || "-"}</td>
                    <td>
                      <button type="button" className="btn ghost icon-only">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <footer className="catalog-modal-footer between">
              <button type="button" className="btn ghost">
                Xoá
              </button>
              <button type="button" className="btn primary">
                Cập nhật
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
