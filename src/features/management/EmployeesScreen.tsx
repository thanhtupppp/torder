import {
  AlertCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import "../../styles/components/employees.css";

// ─── Types ────────────────────────────────────────────────────────────────────
type EmployeeTab = "employees" | "roles";

type Employee = {
  id: string;
  name: string;
  phone: string;
  role: string;
  branch: string;
  createdAt: string;
  avatar?: string;
};

type Role = {
  id: string;
  name: string;
  description: string;
  employeeCount: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const TOP_TABS: Array<{ key: EmployeeTab; label: string }> = [
  { key: "employees", label: "Nhân viên" },
  { key: "roles", label: "Vai trò" },
];

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "NV001",
    name: "Chủ cửa hàng",
    phone: "0339395029",
    role: "CHỦ CỬA HÀNG",
    branch: "Coffee MHOL",
    createdAt: "09/04/2026",
  },
];

const MOCK_ROLES: Role[] = [
  {
    id: "R001",
    name: "CHỦ CỬA HÀNG",
    description: "Toàn quyền quản lý cửa hàng",
    employeeCount: 1,
  },
];

const PERMISSION_GROUPS = [
  {
    key: "sales",
    title: "Bán hàng",
    permissions: [
      "Tạo đơn",
      "Thay đổi giá bán",
      "Thanh toán đơn hàng",
      "Giảm giá hóa đơn",
      "Cho phép xoá sản phẩm",
      "Tạm tính",
      "Chọn nhân viên hoàn thành đơn",
    ],
  },
  {
    key: "orders",
    title: "Đơn hàng",
    permissions: [
      "Xem danh sách",
      "Sửa thông tin đơn hàng",
      "Nhân viên chỉ được xem đơn hàng của mình",
      "Xuất hoá đơn",
      "Huỷ đơn hàng",
      "Xuất file excel",
      "Trả hàng",
      "Tách đơn",
      "Gộp đơn",
    ],
  },
  {
    key: "products",
    title: "Sản phẩm",
    permissions: [
      "Xem danh sách",
      "Thêm, chỉnh sửa, xoá",
      "Xem giá vốn",
      "Sửa giá vốn",
      "Xuất file excel",
    ],
  },
  {
    key: "tables",
    title: "Phòng bàn",
    permissions: ["Xem danh sách phòng bàn", "Chỉnh sửa phòng bàn"],
  },
  {
    key: "reports",
    title: "Báo cáo",
    permissions: [
      "Xem báo cáo",
      "Báo cáo sản phẩm",
      "Báo cáo đơn hàng",
      "Báo cáo khách hàng",
      "Báo cáo nhân viên",
      "Báo cáo kết ca",
      "Báo cáo thuế VAT",
      "Xem báo cáo cuối ngày",
      "Xem báo cáo tài chính",
    ],
  },
  {
    key: "customers",
    title: "Khách hàng",
    permissions: ["Xem danh sách", "Thêm, chỉnh sửa, xoá", "Xuất file excel"],
  },
  {
    key: "employees",
    title: "Nhân viên & phân quyền",
    permissions: [
      "Xem danh sách",
      "Thêm, chỉnh sửa, xoá nhân viên",
      "Thêm, chỉnh sửa, xoá phân quyền",
    ],
  },
  {
    key: "income",
    title: "Thu chi",
    permissions: [
      "Xem danh sách",
      "Thêm, chỉnh sửa, xoá",
      "Nguồn tiền",
      "Xuất file excel",
    ],
  },
  {
    key: "inventory",
    title: "Kho hàng & Tồn kho",
    permissions: [
      "Xem tồn kho",
      "Chỉnh sửa tồn kho",
      "Nhập kho",
      "Xuất kho",
      "Kiểm kho",
      "Trả hàng nhập",
      "Điều chuyển kho",
      "Nhà cung cấp",
    ],
  },
  {
    key: "forms",
    title: "Biểu mẫu",
    permissions: ["Xem danh sách", "Thêm, chỉnh sửa, xoá"],
  },
  {
    key: "settings",
    title: "Cài đặt cửa hàng",
    permissions: [
      "Chỉnh sửa thông tin cửa hàng",
      "Tích điểm và khuyến mãi",
      "Quy trình bán hàng",
      "Hóa đơn điện tử",
    ],
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = ["#2563eb", "#16a34a", "#9333ea", "#d97706", "#0891b2", "#be185d"];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

// ─── Component ────────────────────────────────────────────────────────────────
export function EmployeesScreen() {
  const [activeTab, setActiveTab] = useState<EmployeeTab>("employees");
  const [search, setSearch] = useState("");

  // Add Employee modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", role: "", branch: "Coffee MHOL" });

  // Role modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<Record<string, boolean>>({});
  const [editRole, setEditRole] = useState<Role | null>(null);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredEmployees = MOCK_EMPLOYEES.filter(
    (e) =>
      !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.phone.includes(search)
  );

  // ── Permission helpers ────────────────────────────────────────────────────
  const handleTogglePerm = (groupKey: string, perm: string, checked: boolean) => {
    setSelectedPerms((prev) => ({ ...prev, [`${groupKey}__${perm}`]: checked }));
  };

  const handleToggleGroup = (groupKey: string, permissions: string[], checked: boolean) => {
    setSelectedPerms((prev) => {
      const next = { ...prev };
      for (const p of permissions) next[`${groupKey}__${p}`] = checked;
      return next;
    });
  };

  const isGroupChecked = (groupKey: string, permissions: string[]) =>
    permissions.length > 0 && permissions.every((p) => selectedPerms[`${groupKey}__${p}`]);

  // ── Role modal open ───────────────────────────────────────────────────────
  const handleOpenRoleModal = (role?: Role) => {
    if (role) {
      setEditRole(role);
      setRoleName(role.name);
      setRoleDesc(role.description);
    } else {
      setEditRole(null);
      setRoleName("");
      setRoleDesc("");
    }
    setSelectedPerms({});
    setShowRoleModal(true);
  };

  // ── Submit role ───────────────────────────────────────────────────────────
  const handleSubmitRole = () => {
    if (!roleName.trim()) {
      alert("Vui lòng nhập tên vai trò");
      return;
    }
    const grouped: Record<string, string[]> = {};
    for (const [key, checked] of Object.entries(selectedPerms)) {
      if (checked) {
        const [gk, perm] = key.split("__");
        if (!grouped[gk]) grouped[gk] = [];
        grouped[gk].push(perm);
      }
    }
    console.log("Submit Role:", { name: roleName, description: roleDesc, permissions: grouped });
    setShowRoleModal(false);
  };

  return (
    <div className="emp-page">
      {/* Top Tabs */}
      <header className="emp-tabs-bar">
        {TOP_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`emp-tab${activeTab === tab.key ? " active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </header>

      {/* ══════ TAB: NHÂN VIÊN ══════ */}
      {activeTab === "employees" && (
        <section className="emp-section">
          <header className="emp-section-header">
            <h2 className="emp-section-title">Danh sách nhân viên</h2>
            <div className="emp-header-actions">
              <div className="emp-search-wrap">
                <Search size={14} className="emp-search-icon" />
                <input
                  className="emp-search-input"
                  placeholder="Tìm kiếm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="emp-btn emp-btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={14} />
                <span>Thêm</span>
              </button>
              <button type="button" className="emp-btn emp-btn-icon">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </header>

          <div className="emp-table-wrap">
            <table className="emp-table">
              <thead>
                <tr>
                  <th className="emp-th-check">
                    <input type="checkbox" />
                  </th>
                  <th>Tên nhân viên</th>
                  <th>Số điện thoại</th>
                  <th>Vai trò</th>
                  <th>Ngày tạo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="emp-tr">
                      <td className="emp-td-check">
                        <input type="checkbox" />
                      </td>
                      <td>
                        <div className="emp-name-cell">
                          <div
                            className="emp-avatar"
                            style={{ background: getAvatarColor(emp.name) }}
                          >
                            {getInitials(emp.name)}
                          </div>
                          <span className="emp-name">{emp.name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="emp-phone-cell">
                          <Phone size={13} className="emp-phone-icon" />
                          <span>{emp.phone}</span>
                        </div>
                      </td>
                      <td>
                        <span className="emp-role-text">
                          {emp.role} - {emp.branch}
                        </span>
                      </td>
                      <td className="emp-muted">{emp.createdAt}</td>
                      <td>
                        <button type="button" className="emp-row-action">
                          <MoreHorizontal size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="emp-empty">
                      <p>Không tìm thấy nhân viên</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ══════ TAB: VAI TRÒ ══════ */}
      {activeTab === "roles" && (
        <section className="emp-section">
          <header className="emp-section-header">
            <h2 className="emp-section-title">Danh sách vai trò</h2>
            <div className="emp-header-actions">
              <button
                type="button"
                className="emp-btn emp-btn-primary"
                onClick={() => handleOpenRoleModal()}
              >
                <Plus size={14} />
                <span>Thêm vai trò</span>
              </button>
            </div>
          </header>

          <div className="emp-table-wrap">
            <table className="emp-table">
              <thead>
                <tr>
                  <th>Tên vai trò</th>
                  <th>Mô tả</th>
                  <th>Số NV</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {MOCK_ROLES.map((role) => (
                  <tr key={role.id} className="emp-tr">
                    <td className="emp-role-name">{role.name}</td>
                    <td className="emp-muted">{role.description}</td>
                    <td className="emp-muted">{role.employeeCount} nhân viên</td>
                    <td>
                      <button
                        type="button"
                        className="emp-link-btn"
                        onClick={() => handleOpenRoleModal(role)}
                      >
                        Chỉnh sửa
                      </button>
                    </td>
                  </tr>
                ))}
                {MOCK_ROLES.length === 0 && (
                  <tr>
                    <td colSpan={4} className="emp-empty">
                      <p>Chưa có vai trò nào được định nghĩa</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ══════ MODAL: THÊM NHÂN VIÊN ══════ */}
      {showAddModal && (
        <div className="emp-overlay" onClick={() => setShowAddModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-header">
              <h3 className="emp-modal-title">Thêm nhân viên</h3>
              <button
                type="button"
                className="emp-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="emp-modal-body">
              <div className="emp-form-grid">
                <div className="emp-form-field">
                  <label className="emp-form-label">Tên nhân viên *</label>
                  <input
                    type="text"
                    className="emp-form-input"
                    placeholder="Nhập tên nhân viên"
                    value={addForm.name}
                    onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="emp-form-field">
                  <label className="emp-form-label">Số điện thoại *</label>
                  <input
                    type="tel"
                    className="emp-form-input"
                    placeholder="Nhập số điện thoại"
                    value={addForm.phone}
                    onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div className="emp-form-field">
                  <label className="emp-form-label">Vai trò</label>
                  <div className="emp-form-select-wrap">
                    <select
                      className="emp-form-select"
                      value={addForm.role}
                      onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                    >
                      <option value="">-- Chọn vai trò --</option>
                      {MOCK_ROLES.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="emp-form-field">
                  <label className="emp-form-label">Chi nhánh</label>
                  <input
                    type="text"
                    className="emp-form-input"
                    value={addForm.branch}
                    disabled
                  />
                </div>
              </div>
            </div>
            <div className="emp-modal-footer">
              <button
                type="button"
                className="emp-btn emp-btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="emp-btn emp-btn-primary"
                onClick={() => {
                  if (!addForm.name.trim() || !addForm.phone.trim()) {
                    alert("Vui lòng nhập tên và số điện thoại");
                    return;
                  }
                  console.log("Thêm nhân viên:", addForm);
                  setShowAddModal(false);
                }}
              >
                Thêm nhân viên
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ MODAL: TẠO / CHỈNH SỬA VAI TRÒ ══════ */}
      {showRoleModal && (
        <div className="emp-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="emp-modal emp-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-header">
              <h3 className="emp-modal-title">
                {editRole ? "Chỉnh sửa vai trò" : "Tạo vai trò"}
              </h3>
              <button
                type="button"
                className="emp-modal-close"
                onClick={() => setShowRoleModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="emp-modal-body">
              {/* Warning banner */}
              <div className="emp-role-warning">
                <AlertCircle size={16} />
                <span>
                  Mọi chỉnh sửa sẽ được áp dụng cho tất cả nhân viên có vai trò này
                </span>
              </div>

              {/* Role name + desc */}
              <div className="emp-form-col">
                <div className="emp-form-field">
                  <label className="emp-form-label">Tên vai trò *</label>
                  <input
                    type="text"
                    className="emp-form-input"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    style={{ maxWidth: 600 }}
                  />
                </div>
                <div className="emp-form-field">
                  <label className="emp-form-label">Mô tả</label>
                  <textarea
                    className="emp-form-input"
                    rows={2}
                    value={roleDesc}
                    onChange={(e) => setRoleDesc(e.target.value)}
                    style={{ maxWidth: 600, resize: "vertical" }}
                  />
                </div>
              </div>

              {/* Permissions */}
              <div className="emp-perm-grid">
                {PERMISSION_GROUPS.map((group) => {
                  const allChecked = isGroupChecked(group.key, group.permissions);
                  const indeterminate =
                    !allChecked &&
                    group.permissions.some((p) => selectedPerms[`${group.key}__${p}`]);
                  return (
                    <div key={group.key} className="emp-perm-group">
                      <h4 className="emp-perm-group-title">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          ref={(el) => {
                            if (el) el.indeterminate = indeterminate;
                          }}
                          onChange={(e) =>
                            handleToggleGroup(group.key, group.permissions, e.target.checked)
                          }
                        />
                        {group.title}
                      </h4>
                      <div className="emp-perm-list">
                        {group.permissions.map((perm) => (
                          <label key={perm} className="emp-perm-item">
                            <input
                              type="checkbox"
                              checked={!!selectedPerms[`${group.key}__${perm}`]}
                              onChange={(e) =>
                                handleTogglePerm(group.key, perm, e.target.checked)
                              }
                            />
                            <span>{perm}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="emp-modal-footer">
              <button
                type="button"
                className="emp-btn emp-btn-secondary"
                onClick={() => setShowRoleModal(false)}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="emp-btn emp-btn-primary"
                onClick={handleSubmitRole}
              >
                {editRole ? "Lưu thay đổi" : "Thêm vai trò"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
