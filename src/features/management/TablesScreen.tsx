import { Plus, Search, MoreVertical, UserRound, X, LayoutTemplate } from "lucide-react";
import { useState } from "react";
import "../../styles/components/tables.css";

const MOCK_AREAS = [
  { id: "all", name: "Tất cả bàn" },
  { id: "indoor", name: "Trong nhà" },
  { id: "outdoor", name: "Ngoài sân" },
  { id: "vip", name: "Phòng VIP" },
];

type TableStatus = "empty" | "occupied" | "ordered";

const MOCK_TABLES = [
  { id: "t1", name: "Bàn 1", areaId: "indoor", capacity: 4, status: "occupied" as TableStatus },
  { id: "t2", name: "Bàn 2", areaId: "indoor", capacity: 4, status: "empty" as TableStatus },
  { id: "t3", name: "Bàn 3", areaId: "indoor", capacity: 2, status: "empty" as TableStatus },
  { id: "t4", name: "Bàn 4", areaId: "outdoor", capacity: 6, status: "ordered" as TableStatus },
  { id: "t5", name: "Bàn 5", areaId: "outdoor", capacity: 6, status: "empty" as TableStatus },
  { id: "t6", name: "VIP 1", areaId: "vip", capacity: 10, status: "occupied" as TableStatus },
];

type ModalType = "add-area" | "add-table" | null;

export function TablesScreen() {
  const [activeArea, setActiveArea] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  
  const displayedTables = MOCK_TABLES.filter(t => {
    if (activeArea !== "all" && t.areaId !== activeArea) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="tables-page">
      <header className="tables-header-row">
        <h1 className="tables-page-title">Quản lý bàn</h1>
        <div className="tables-header-actions">
           <button 
             type="button" 
             className="btn primary"
             onClick={() => setActiveModal("add-area")}
           >
             <Plus size={14} /> Thêm khu vực
           </button>
        </div>
      </header>

      <section className="tables-body card">
        <div className="tables-tabs-wrap">
          <div className="tables-tabs">
            {MOCK_AREAS.map(area => (
              <button
                key={area.id}
                type="button"
                className={`tables-tab ${activeArea === area.id ? "active" : ""}`}
                onClick={() => setActiveArea(area.id)}
              >
                {area.name}
              </button>
            ))}
          </div>
        </div>

        <div className="tables-toolbar">
          <div className="tables-search search-box">
            <Search size={14} />
            <input
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm bàn"
            />
          </div>

          <div className="tables-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => setActiveModal("add-table")}
            >
              <Plus size={14} /> Thêm bàn
            </button>
          </div>
        </div>

        <div className="tables-grid-wrap panel-primitive">
          {displayedTables.length > 0 ? (
            <div className="tables-grid">
              {displayedTables.map(table => (
                <div key={table.id} className={`table-card status-${table.status}`}>
                   <header className="table-card-header">
                     <span className="table-card-name">{table.name}</span>
                     <button type="button" className="btn ghost icon-only btn-more">
                       <MoreVertical size={16} />
                     </button>
                   </header>
                   <div className="table-card-body">
                      <div className="table-info">
                        <UserRound size={14} />
                        <span>{table.capacity} người</span>
                      </div>
                      <div className="table-status-badge">
                        {table.status === "empty" && "Bàn trống"}
                        {table.status === "occupied" && "Đang phục vụ"}
                        {table.status === "ordered" && "Đã đặt trước"}
                      </div>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="tables-empty">
               <LayoutTemplate size={48} className="tables-empty-icon" />
               <p>Không có bàn nào trong khu vực này</p>
            </div>
          )}
        </div>
      </section>

      {/* Add Area Modal */}
      {activeModal === "add-area" && (
        <div className="tables-overlay">
          <section className="tables-modal card">
            <header className="tables-modal-header">
              <h3>Thêm khu vực mới</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={14} />
              </button>
            </header>
            <div className="tables-form-grid">
              <label className="full-width">
                <span>Tên khu vực</span>
                <input className="input" placeholder="Nhập tên khu vực" autoFocus />
              </label>
              <label className="full-width">
                <span>Ghi chú</span>
                <textarea className="input note" rows={3} placeholder="Ghi chú thêm" />
              </label>
            </div>
            <footer className="tables-modal-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setActiveModal(null)}
              >
                Huỷ
              </button>
              <button type="button" className="btn primary">
                Lưu
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* Add Table Modal */}
      {activeModal === "add-table" && (
        <div className="tables-overlay">
          <section className="tables-modal card">
            <header className="tables-modal-header">
              <h3>Thêm bàn mơí</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={14} />
              </button>
            </header>
            <div className="tables-form-grid">
              <label className="full-width">
                <span>Tên bàn</span>
                <input className="input" placeholder="Nhập tên bàn (VD: Bàn 1)" autoFocus />
              </label>
              <label>
                <span>Khu vực</span>
                <select className="input">
                  {MOCK_AREAS.filter(a => a.id !== "all").map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Sức chứa (người)</span>
                <input type="number" className="input" placeholder="4" defaultValue={4} />
              </label>
            </div>
            <footer className="tables-modal-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setActiveModal(null)}
              >
                Huỷ
              </button>
              <button type="button" className="btn primary">
                Lưu
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
