import { useState } from "react";
import type { UnitOption } from "../../../constants/units";
import type { ProductType } from "../constants/catalog";

export type CatalogModal = "create-product" | "edit-category" | null;

/**
 * Manages modal open/close state AND the isolated form fields for
 * "Create Product" and "Edit/Create Category" modals.
 *
 * - `openEditCategory()` — opens modal in **create** mode (no pre-fill)
 * - `openEditCategory(name)` — opens modal in **edit** mode (pre-fills name)
 */
export function useCatalogModal() {
  const [activeModal, setActiveModal] = useState<CatalogModal>(null);

  // ── Product form state (does NOT affect table filters) ────────────────────
  const [formProductType, setFormProductType] = useState<ProductType>("goods");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formUnit, setFormUnit] = useState<UnitOption | "">("");

  // ── Category form state ───────────────────────────────────────────────────
  /** The name of the category being edited, or undefined when creating new. */
  const [editingCategoryName, setEditingCategoryName] = useState<
    string | undefined
  >(undefined);

  // ── Actions ───────────────────────────────────────────────────────────────
  function openCreateProduct() {
    setFormProductType("goods");
    setFormCategory("");
    setFormUnit("");
    setActiveModal("create-product");
  }

  /**
   * @param categoryName — pass to enter edit mode, omit for create mode.
   */
  function openEditCategory(categoryName?: string) {
    setEditingCategoryName(categoryName);
    setActiveModal("edit-category");
  }

  function closeModal() {
    setActiveModal(null);
    // Reset all form state on close
    setFormProductType("goods");
    setFormCategory("");
    setFormUnit("");
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
