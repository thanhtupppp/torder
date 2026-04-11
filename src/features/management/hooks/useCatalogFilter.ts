import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ProductDto } from "../dtos/catalog";

export type CatalogTab = "products" | "categories" | "addons" | "notes";
export type ProductType = "goods" | "service" | "combo" | "ingredient";

const PAGE_SIZE = 20;
const EMPTY: ProductDto[] = [];

/**
 * Manages product filtering, pagination, and URL-param sync for the
 * CatalogScreen. Encapsulates all derived state so the screen component
 * only deals with layout and UI events.
 */
export function useCatalogFilter(products: ProductDto[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Initialise from URL ────────────────────────────────────────────────────
  const tabFromQuery = searchParams.get("tab");
  const initialTab: CatalogTab =
    tabFromQuery === "categories" ||
    tabFromQuery === "addons" ||
    tabFromQuery === "notes"
      ? tabFromQuery
      : "products";

  const [activeTab, setActiveTab] = useState<CatalogTab>(initialTab);
  const [productSearch, setProductSearch] = useState(
    searchParams.get("keyword") ?? "",
  );
  const [productType, setProductType] = useState<ProductType>("goods");
  const [productCategory, setProductCategory] = useState(
    searchParams.get("category") ?? "",
  );
  const [page, setPage] = useState(() => {
    const parsed = Number(searchParams.get("page") ?? "1");
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  });

  // ── Derived ────────────────────────────────────────────────────────────────
  const filteredRows = useMemo(
    () =>
      (products.length ? products : EMPTY).filter((row) => {
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
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  const pagedRows = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page, totalPages]);

  // ── Effects ────────────────────────────────────────────────────────────────
  // Clamp page when total pages shrinks
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Sync state → URL search params
  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    if (activeTab !== "products") next.set("tab", activeTab);
    else next.delete("tab");

    if (page > 1) next.set("page", String(page));
    else next.delete("page");

    if (productSearch.trim()) next.set("keyword", productSearch.trim());
    else next.delete("keyword");

    if (productCategory) next.set("category", productCategory);
    else next.delete("category");

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [
    activeTab,
    page,
    productSearch,
    productCategory,
    searchParams,
    setSearchParams,
  ]);

  // ── Actions ────────────────────────────────────────────────────────────────
  function setTab(tab: CatalogTab) {
    setActiveTab(tab);
    if (tab !== "products") setPage(1);
  }

  function setSearch(value: string) {
    setProductSearch(value);
    setPage(1);
  }

  function setCategory(value: string) {
    setProductCategory(value);
    setPage(1);
  }

  return {
    activeTab,
    setTab,
    productSearch,
    setSearch,
    productType,
    setProductType,
    productCategory,
    setCategory,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    filteredRows,
    pagedRows,
    totalRows,
    totalPages,
  };
}
