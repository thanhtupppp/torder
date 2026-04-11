import { useState } from "react";
import type { UnitOption } from "../../../constants/units";
import type { ProductType } from "../constants/catalog";

export type CatalogModal = "create-product" | "edit-category" | null;

/**
 * Manages modal open/close state AND the isolated form fields for
 * "Create Product" and "Edit/Create Category" modals.
 *
 * - `openEditCategory()`     — opens modal in **create** mode (no pre-fill)
 * - `openEditCategory(name)` — opens modal in **edit** mode (pre-fills name)
 */
export function useCatalogModal() {
  const [activeModal, setActiveModal] = useState<CatalogModal>(null);

  // ── Product form ──────────────────────────────────────────────────────────
  const [formProductType, setFormProductType] = useState<ProductType>("goods");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formUnit, setFormUnit] = useState<UnitOption | "">("");

  // ── Category form ─────────────────────────────────────────────────────────
  /** Undefined = create mode, defined = edit mode. */
  const [editingCategoryName, setEditingCategoryName] = useState<
    string | undefined
  >(undefined);

  // ── Helpers ───────────────────────────────────────────────────────────────
  // ✅ Single reset function — thêm field mới chỉ sửa 1 chỗ
  function resetProductForm() {
    setFormProductType("goods");
    setFormCategory("");
    setFormUnit("");
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  function openCreateProduct() {
    resetProductForm();
    setActiveModal("create-product");
  }

  /** @param categoryName — pass to enter edit mode, omit for create mode. */
  function openEditCategory(categoryName?: string) {
    setEditingCategoryName(categoryName);
    setActiveModal("edit-category");
  }

  function closeModal() {
    setActiveModal(null);
    resetProductForm();
    setEditingCategoryName(undefined);
  }

  return {
    activeModal,
    openCreateProduct,
    openEditCategory,
    closeModal,
    // Product form
    formProductType,
    setFormProductType,
    formCategory,
    setFormCategory,
    formUnit,
    setFormUnit,
    // Category form
    editingCategoryName,
  };
}
