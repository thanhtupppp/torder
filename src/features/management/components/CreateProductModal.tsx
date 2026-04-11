import { Check, ImagePlus, Trash2, X } from "lucide-react";
import { CategorySelect } from "../../../components/ui/CategorySelect";
import { UnitSelect } from "../../../components/ui/UnitSelect";
import type { CategoryDto } from "../dtos/catalog";
import { PRODUCT_TYPES } from "../constants/catalog";
import type { useCatalogImage } from "../hooks/useCatalogImage";
import type { useCatalogModal } from "../hooks/useCatalogModal";

type CreateProductModalProps = {
  modal: ReturnType<typeof useCatalogModal>;
  image: ReturnType<typeof useCatalogImage>;
  categories: CategoryDto[];
  isLoading: boolean;
};

/**
 * "Tạo sản phẩm" modal extracted from CatalogScreen.
 *
 * Bug fix: product type and category are now bound to modal.formProductType /
 * modal.formCategory — isolated from the table-level filter state.
 */
export function CreateProductModal({
  modal,
  image,
  categories,
  isLoading,
}: CreateProductModalProps) {
  return (
    <div className="catalog-overlay">
      <section className="catalog-modal catalog-modal-xl card">
        <header className="catalog-modal-header">
          <h3>Tạo sản phẩm</h3>
          {/* ✅ aria-label cho close button */}
          <button
            type="button"
            className="modal-close-btn"
            aria-label="Đóng"
            onClick={modal.closeModal}
          >
            <X size={14} />
          </button>
        </header>

        <div className="catalog-modal-grid">
          {/* ── Left: main form ──────────────────────────────────────────── */}
          <div className="catalog-modal-main">
            <section className="catalog-section panel-primitive">
              <h4>Loại sản phẩm</h4>
              <div className="catalog-type-tabs">
                {PRODUCT_TYPES.map((type) => (
                  <button
                    key={type.key}
                    type="button"
                    className={`catalog-type-tab ${
                      modal.formProductType === type.key ? "active" : ""
                    }`}
                    onClick={() => modal.setFormProductType(type.key)}
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
                  className={`catalog-upload-circle ${
                    image.isDragActive ? "drag-active" : ""
                  }`}
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
                {/* ✅ && thay vì ? : null */}
                {image.imageUrl && (
                  <button
                    type="button"
                    className="btn ghost icon-only"
                    onClick={image.clearImage}
                    aria-label="Xoá ảnh sản phẩm"
                    title="Xoá ảnh"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
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
                    value={modal.formUnit}
                    onChange={modal.setFormUnit}
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

          {/* ── Right: supplemental ──────────────────────────────────────── */}
          <aside className="catalog-modal-side">
            <section className="catalog-section panel-primitive">
              <h4>Thông tin bổ sung</h4>
              <label>
                <span>Danh mục</span>
                <CategorySelect
                  categories={categories}
                  value={modal.formCategory}
                  onChange={modal.setFormCategory}
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
  );
}
