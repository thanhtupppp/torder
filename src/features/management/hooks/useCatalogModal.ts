import { useState } from "react";
import type { UnitOption } from "../../../constants/units";
import type { ProductType } from "../constants/catalog";

export type CatalogModal = "create-product" | "edit-category" | null;

/**
 * Manages modal open/close state AND the isolated form fields
 * for the "Create Product" modal.
 *
 * Keeping form state here (separate from useCatalogFilter) prevents
 * the table-level productType / productCategory filters from being
 * accidentally mutated when the user interacts with modal inputs.
 */
export function useCatalogModal() {
  const [activeModal, setActiveModal] = useState<CatalogModal>(null);

  // ── Isolated form state (does NOT affect table filters) ───────────────────
  const [formProductType, setFormProductType] = useState<ProductType>("goods");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formUnit, setFormUnit] = useState<UnitOption | "">("");

  // ── Actions ───────────────────────────────────────────────────────────────
  function openCreateProduct() {
    // Reset form to clean defaults every time the modal opens
    setFormProductType("goods");
    setFormCategory("");
    setFormUnit("");
    setActiveModal("create-product");
  }

  function openEditCategory() {
    setActiveModal("edit-category");
  }

  function closeModal() {
    setActiveModal(null);
    // Reset form fields on close so stale data doesn't linger
    setFormProductType("goods");
    setFormCategory("");
    setFormUnit("");
  }

  return {
    activeModal,
    openCreateProduct,
    openEditCategory,
    closeModal,
    // Form fields — only used by CreateProductModal
    formProductType,
    setFormProductType,
    formCategory,
    setFormCategory,
    formUnit,
    setFormUnit,
  };
}
