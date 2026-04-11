import { type ChangeEvent, type DragEvent, useRef, useState } from "react";

/**
 * Manages product image state: URL preview, drag-active flag, file-input ref,
 * and all related event handlers. Can be reset via `clearImage()`.
 */
export function useCatalogImage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  function loadImage(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function triggerPicker() {
    imageInputRef.current?.click();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) loadImage(file);
  }

  function handleDragOver(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragActive(true);
  }

  // ✅ dragLeave không có default behavior cần cancel
  function handleDragLeave() {
    setIsDragActive(false);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) loadImage(file);
  }

  function clearImage() {
    setImageUrl(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  return {
    imageUrl,
    isDragActive,
    imageInputRef,
    triggerPicker,
    handleChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearImage,
  };
}
