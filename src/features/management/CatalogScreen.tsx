import { Grip, Plus } from "lucide-react";
import { useMemo } from "react";
import { CatalogFilters } from "./components/CatalogFilters";
import { CatalogToolbar } from "./components/CatalogToolbar";
import { CreateProductModal } from "./components/CreateProductModal";
import { EditCategoryModal } from "./components/EditCategoryModal";
import { ProductTable } from "./components/ProductTable";
import {
  DEFAULT_VISIBLE_COLUMNS,
  PRODUCT_COLUMNS,
  TOP_TABS,
} from "./constants/catalog";
import { useCatalogFilter } from "./hooks/useCatalogFilter";
import { useCatalogImage } from "./hooks/useCatalogImage";
import { useCatalogMocks } from "./hooks/useCatalogMocks";
import { useCatalogModal } from "./hooks/useCatalogModal";

export function CatalogScreen() {
  const { categories, products, isLoading } = useCatalogMocks();
  const filter = useCatalogFilter(products);
  const modal = useCatalogModal();
  const image = useCatalogImage();

  const visibleColumns = useMemo(
    () => PRODUCT_COLUMNS.filter((col) => DEFAULT_VISIBLE_COLUMNS.has(col.key)),
    [],
  );

  function handleOpenCreate() {
    image.clearImage();
    modal.openCreateProduct();
  }

  return (
    <div className="catalog-page">
      {/* ── Top tab bar ──────────────────────────────────────────────────── */}
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

      {/* ── Products tab ─────────────────────────────────────────────────── */}
      {filter.activeTab === "products" ? (
        <section className="catalog-products card">
          <CatalogToolbar filter={filter} onOpenCreate={handleOpenCreate} />
          <div className="catalog-products-layout">
            <CatalogFilters filter={filter} />
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

      {/* ── Categories tab ───────────────────────────────────────────────── */}
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

      {/* ── Addons tab ───────────────────────────────────────────────────── */}
      {filter.activeTab === "addons" ? (
        <section className="catalog-placeholder card">
          Màn Món thêm sẽ được dựng tiếp theo thiết kế.
        </section>
      ) : null}

      {/* ── Notes tab ────────────────────────────────────────────────────── */}
      {filter.activeTab === "notes" ? (
        <section className="catalog-placeholder card">
          Màn Ghi chú món sẽ được dựng tiếp theo thiết kế.
        </section>
      ) : null}

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {modal.activeModal === "create-product" ? (
        <CreateProductModal
          modal={modal}
          image={image}
          categories={categories}
          isLoading={isLoading}
        />
      ) : null}

      {modal.activeModal === "edit-category" ? (
        <EditCategoryModal modal={modal} filteredRows={filter.filteredRows} />
      ) : null}
    </div>
  );
}
