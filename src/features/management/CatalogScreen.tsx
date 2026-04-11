import { useCallback, useMemo, type ReactNode } from "react";
import { CatalogFilters } from "./components/CatalogFilters";
import { CatalogToolbar } from "./components/CatalogToolbar";
import { CategoriesTab } from "./components/CategoriesTab";
import { CreateProductModal } from "./components/CreateProductModal";
import { EditCategoryModal } from "./components/EditCategoryModal";
import { ProductTable } from "./components/ProductTable";
import {
  DEFAULT_VISIBLE_COLUMNS,
  PRODUCT_COLUMNS,
  TOP_TABS,
  type CatalogTab,
} from "./constants/catalog";
import { useCatalogFilter } from "./hooks/useCatalogFilter";
import { useCatalogImage } from "./hooks/useCatalogImage";
import { useCatalogMocks } from "./hooks/useCatalogMocks";
import { useCatalogModal } from "./hooks/useCatalogModal";

function ComingSoonTab({ label }: { label: string }) {
  return (
    <section className="catalog-placeholder card">
      {label} sẽ được dựng tiếp theo thiết kế.
    </section>
  );
}

export function CatalogScreen() {
  const { categories, products, isLoading } = useCatalogMocks();
  const filter = useCatalogFilter(products);
  const modal = useCatalogModal();
  const image = useCatalogImage();

  const visibleColumns = useMemo(
    () => PRODUCT_COLUMNS.filter((col) => DEFAULT_VISIBLE_COLUMNS.has(col.key)),
    [],
  );

  const handleOpenCreate = useCallback(() => {
    image.clearImage();
    modal.openCreateProduct();
  }, [image, modal]);

  const TAB_CONTENT = useMemo<Record<CatalogTab, ReactNode>>(
    () => ({
      products: (
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
      ),
      categories: (
        <CategoriesTab
          categories={categories}
          isLoading={isLoading}
          onCreateCategory={modal.openEditCategory}
          onEditCategory={modal.openEditCategory}
        />
      ),
      addons: <ComingSoonTab label="Món thêm" />,
      notes: <ComingSoonTab label="Ghi chú món" />,
    }),
    [filter, handleOpenCreate, visibleColumns, categories, isLoading, modal],
  );

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

      {TAB_CONTENT[filter.activeTab]}

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
