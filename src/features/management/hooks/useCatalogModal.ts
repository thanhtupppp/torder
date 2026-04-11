import { useState } from "react";

export type CatalogModal = "create-product" | "edit-category" | null;

/**
 * Manages which overlay modal is open in the CatalogScreen.
 * Keeps modal state decoupled from filter and image state.
 */
export function useCatalogModal() {
  const [activeModal, setActiveModal] = useState<CatalogModal>(null);

  function openCreateProduct() {
    setActiveModal("create-product");
  }

  function openEditCategory() {
    setActiveModal("edit-category");
  }

  function closeModal() {
    setActiveModal(null);
  }

  return {
    activeModal,
    openCreateProduct,
    openEditCategory,
    closeModal,
  };
}
