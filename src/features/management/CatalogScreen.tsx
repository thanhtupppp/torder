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
import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { CategorySelect } from "../../components/ui/CategorySelect";
import { UnitSelect } from "../../components/ui/UnitSelect";
import type { UnitOption } from "../../constants/units";
import { ProductTable } from "./components/ProductTable";
import type { ProductDto } from "./dtos/catalog";
import { useCatalogMocks } from "./hooks/useCatalogMocks";

type CatalogTab = "products" | "categories" | "addons" | "notes";
type ProductType = "goods" | "service" | "combo" | "ingredient";
type CatalogModal = "create-product" | "edit-category" | null;

type ProductColumn = {
  key: string;
  label: string;
};

const TOP_TABS: Array<{ key: CatalogTab; label: string }> = [
  { key: "products", label: "Sản phẩm" },
  { key: "categories", label: "Danh mục" },
  { key: "addons", label: "Món thêm" },
  { key: "notes", label: "Ghi chú món" },
];

const PRODUCT_TYPES: Array<{ key: ProductType; label: string }> = [
  { key: "goods", label: "Hàng hoá" },
  { key: "service", label: "Dịch vụ" },
  { key: "combo", label: "Combo" },
  { key: "ingredient", label: "Hàng chưa nguyên liệu" },
];

const PRODUCT_COLUMNS: ProductColumn[] = [
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

const EMPTY_PRODUCTS: ProductDto[] = [];

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

export function CatalogScreen() {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromQuery = searchParams.get("tab");
  const initialTab: CatalogTab =
    tabFromQuery === "categories" ||
    tabFromQuery === "addons" ||
    tabFromQuery === "notes"
      ? tabFromQuery
      : "products";

  const [activeTab, setActiveTab] = useState<CatalogTab>(initialTab);
  const [activeModal, setActiveModal] = useState<CatalogModal>(null);
  const [productSearch, setProductSearch] = useState(
    searchParams.get("keyword") ?? "",
  );
  const [productType, setProductType] = useState<ProductType>("goods");
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [isImageDragActive, setIsImageDragActive] = useState(false);
  const [productUnit, setProductUnit] = useState<UnitOption | "">("");
  const [productCategory, setProductCategory] = useState(
    searchParams.get("category") ?? "",
  );
  const [productPage, setProductPage] = useState(() => {
    const parsed = Number(searchParams.get("page") ?? "1");
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  });
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<Set<string>>(
    () => new Set(DEFAULT_VISIBLE_COLUMNS),
  );
  const productPageSize = 20;
  const productImageInputRef = useRef<HTMLInputElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const { categories, products, isLoading } = useCatalogMocks();

  const filteredRows = useMemo(
    () =>
      (products.length ? products : EMPTY_PRODUCTS).filter((row) => {
        const keywordMatch =
          row.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          row.code.toLowerCase().includes(productSearch.toLowerCase());

        const categoryMatch =
          productCategory.length === 0 || row.categoryId === productCategory;

        return keywordMatch && categoryMatch;
      }),
    [products, productSearch, productCategory],
  );

  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / productPageSize));

  const visibleColumns = useMemo(
    () => PRODUCT_COLUMNS.filter((column) => visibleColumnKeys.has(column.key)),
    [visibleColumnKeys],
  );

  const pagedRows = useMemo(() => {
    const safePage = Math.min(productPage, totalPages);
    const start = (safePage - 1) * productPageSize;
    return filteredRows.slice(start, start + productPageSize);
  }, [filteredRows, productPage, productPageSize, totalPages]);

  useEffect(() => {
    if (productPage > totalPages) {
      setProductPage(totalPages);
    }
  }, [productPage, totalPages]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    if (activeTab !== "products") {
      next.set("tab", activeTab);
    } else {
      next.delete("tab");
    }

    if (productPage > 1) {
      next.set("page", String(productPage));
    } else {
      next.delete("page");
    }

    if (productSearch.trim()) {
      next.set("keyword", productSearch.trim());
    } else {
      next.delete("keyword");
    }

    if (productCategory) {
      next.set("category", productCategory);
    } else {
      next.delete("category");
    }

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [
    activeTab,
    productPage,
    productSearch,
    productCategory,
    searchParams,
    setSearchParams,
  ]);

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

  function openCreateProductModal() {
    setProductImageUrl(null);
    setProductUnit("");
    setProductCategory("");
    setProductPage(1);
    setActiveModal("create-product");
  }

  function triggerProductImagePicker() {
    productImageInputRef.current?.click();
  }

  function loadProductImage(file: File) {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setProductImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleProductImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    loadProductImage(file);
  }

  function handleProductImageDragOver(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsImageDragActive(true);
  }

  function handleProductImageDragLeave(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsImageDragActive(false);
  }

  function handleProductImageDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsImageDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    loadProductImage(file);
  }

  function clearProductImage() {
    setProductImageUrl(null);
    if (productImageInputRef.current) {
      productImageInputRef.current.value = "";
    }
  }

  function toggleColumnVisibility(columnKey: string) {
    setVisibleColumnKeys((prev) => {
      const next = new Set(prev);

      if (next.has(columnKey)) {
        if (next.size === 1) {
          return prev;
        }
        next.delete(columnKey);
      } else {
        next.add(columnKey);
      }

      return next;
    });
  }

  return (
    <div className="catalog-page">
      <header className="catalog-top-tabs">
        {TOP_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`catalog-top-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key !== "products") {
                setProductPage(1);
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </header>

      {activeTab === "products" ? (
        <section className="catalog-products card">
          <header className="catalog-products-header">
            <h2>Sản phẩm</h2>
            <div className="catalog-products-actions">
              <div className="catalog-search search-box catalog-search--dropdown">
                <Search size={14} />
                <input
                  className="input"
                  placeholder="Theo mã, tên hàng"
                  value={productSearch}
                  onChange={(event) => {
                    setProductSearch(event.target.value);
                    setProductPage(1);
                  }}
                />
                <ChevronDown size={14} className="catalog-search-caret" />
              </div>
              <button
                type="button"
                className="btn primary catalog-header-btn"
                onClick={openCreateProductModal}
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
                      checked={productType === type.key}
                      onChange={() => setProductType(type.key)}
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
              products={pagedRows}
              columns={PRODUCT_COLUMNS}
              page={productPage}
              pageSize={productPageSize}
              total={totalRows}
              onPageChange={setProductPage}
            />
          </div>
        </section>
      ) : null}

      {activeTab === "categories" ? (
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
                  onClick={() => setActiveModal("edit-category")}
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
            onClick={() => setActiveModal("edit-category")}
          >
            <Plus size={14} /> Tạo danh mục
          </button>
        </section>
      ) : null}

      {activeTab === "addons" ? (
        <section className="catalog-placeholder card">
          Màn Món thêm sẽ được dựng tiếp theo thiết kế.
        </section>
      ) : null}

      {activeTab === "notes" ? (
        <section className="catalog-placeholder card">
          Màn Ghi chú món sẽ được dựng tiếp theo thiết kế.
        </section>
      ) : null}

      {activeModal === "create-product" ? (
        <div className="catalog-overlay">
          <section className="catalog-modal catalog-modal-xl card">
            <header className="catalog-modal-header">
              <h3>Tạo sản phẩm</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveModal(null)}
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
                        className={`catalog-type-tab ${productType === type.key ? "active" : ""}`}
                        onClick={() => setProductType(type.key)}
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
                      ref={productImageInputRef}
                      type="file"
                      accept="image/*"
                      className="catalog-image-input"
                      onChange={handleProductImageChange}
                    />
                    <button
                      type="button"
                      className={`catalog-upload-circle ${isImageDragActive ? "drag-active" : ""}`}
                      onClick={triggerProductImagePicker}
                      onDragOver={handleProductImageDragOver}
                      onDragLeave={handleProductImageDragLeave}
                      onDrop={handleProductImageDrop}
                      aria-label="Chọn ảnh sản phẩm"
                      title="Chọn hoặc kéo thả ảnh sản phẩm"
                    >
                      {productImageUrl ? (
                        <img src={productImageUrl} alt="Ảnh sản phẩm" />
                      ) : (
                        <ImagePlus size={18} />
                      )}
                    </button>
                    <label className="full-width">
                      <span>Tên sản phẩm *</span>
                      <input className="input" />
                    </label>
                    {productImageUrl ? (
                      <button
                        type="button"
                        className="btn ghost icon-only"
                        onClick={clearProductImage}
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
                  <h4>Giá bán & thuế</h4>
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
                      value={productCategory}
                      onChange={(value) => {
                        setProductCategory(value);
                        setProductPage(1);
                      }}
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

      {activeModal === "edit-category" ? (
        <div className="catalog-overlay">
          <section className="catalog-modal card">
            <header className="catalog-modal-header">
              <h3>Sửa danh mục</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveModal(null)}
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
                {filteredRows.slice(0, 4).map((row) => (
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
