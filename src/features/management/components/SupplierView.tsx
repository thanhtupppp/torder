import { Plus, X } from "lucide-react";
import { useState } from "react";
import { InventoryGenericView } from "./InventoryShared";

type SupplierViewProps = {
  columns: string[];
};

export function SupplierView({ columns }: SupplierViewProps) {
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  return (
    <>
      <InventoryGenericView
        title="Nhà cung cấp"
        columns={columns}
        actionLabel="Tạo mới"
        searchPlaceholder="Tên nhà cung cấp"
      />

      <button
        type="button"
        className="btn primary inventory-floating-create"
        onClick={() => setShowSupplierModal(true)}
      >
        <Plus size={14} /> Tạo NCC
      </button>

      {showSupplierModal ? (
        <div className="inventory-overlay">
          <section className="inventory-modal card">
            <header className="inventory-modal-header">
              <h3>Tạo NCC</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowSupplierModal(false)}
              >
                <X size={14} />
              </button>
            </header>

            <div className="inventory-modal-body">
              <div className="inventory-modal-grid two-cols">
                <label>
                  <span>Mã NCC</span>
                  <input className="input" />
                </label>
                <label>
                  <span>Tên NCC *</span>
                  <input className="input" />
                </label>
                <label>
                  <span>Email</span>
                  <input className="input" />
                </label>
                <label>
                  <span>Số điện thoại</span>
                  <input className="input" />
                </label>
              </div>

              <label>
                <span>Địa chỉ</span>
                <input className="input" />
              </label>

              <div className="inventory-modal-grid two-cols">
                <label>
                  <span>Khu vực</span>
                  <input className="input" />
                </label>
                <label>
                  <span>Phường xã thị trấn</span>
                  <input className="input" />
                </label>
              </div>

              <label>
                <span>Ghi chú</span>
                <textarea className="input" rows={3} />
              </label>
            </div>

            <footer className="inventory-modal-footer">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setShowSupplierModal(false)}
              >
                Huỷ
              </button>
              <button type="button" className="btn primary">
                Thêm mới cung cấp
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
