import {
  ChevronDown,
  MessageSquareDot,
  Minus,
  MoreHorizontal,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  User,
  UtensilsCrossed,
  Wallet,
  X,
} from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Await, useLoaderData } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { getAppApi } from "../../lib/api";
import type { Product } from "../../types";
import { calcCartTotal, calcLineTotal, formatCurrency } from "./helpers";

// ─── Local types ─────────────────────────────────────────────────────────────

type LocalCartItem = {
  product: Product;
  quantity: number;
  note: string;
};

type DiscountState = {
  discount: number;
  promotion: number;
  extraFee: number;
};

type OrderType = "dine-in" | "takeaway" | "delivery";

type OrderTab = {
  id: string;
  label: string;
  cart: LocalCartItem[];
  tableId: string | null;
  tableName: string | null;
  customerId: string | null;
  customerName: string;
  orderType: OrderType;
  note: string;
  discounts: DiscountState;
  cashReceived: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TABLES = [
  { id: "t1", name: "Bàn 1", area: "Trong nhà", capacity: 4, status: "occupied" },
  { id: "t2", name: "Bàn 2", area: "Trong nhà", capacity: 4, status: "empty" },
  { id: "t3", name: "Bàn 3", area: "Trong nhà", capacity: 2, status: "empty" },
  { id: "t4", name: "Bàn 4", area: "Ngoài sân", capacity: 6, status: "ordered" },
  { id: "t5", name: "Bàn 5", area: "Ngoài sân", capacity: 6, status: "empty" },
  { id: "t6", name: "VIP 1", area: "Phòng VIP", capacity: 10, status: "occupied" },
  { id: "t7", name: "VIP 2", area: "Phòng VIP", capacity: 10, status: "empty" },
  { id: "t8", name: "Bàn 6", area: "Trong nhà", capacity: 4, status: "empty" },
] as const;

type TableStatus = (typeof MOCK_TABLES)[number]["status"];

const MOCK_CUSTOMERS = [
  { id: "c1", name: "Nguyễn Văn A", phone: "0901 234 567" },
  { id: "c2", name: "Trần Thị B", phone: "0912 345 678" },
  { id: "c3", name: "Lê Văn C", phone: "0923 456 789" },
  { id: "c4", name: "Phạm Thị D", phone: "0934 567 890" },
  { id: "c5", name: "Hoàng Văn E", phone: "0945 678 901" },
];

const ORDER_TYPES: { value: OrderType; label: string }[] = [
  { value: "dine-in",  label: "Tại bàn" },
  { value: "takeaway", label: "Mang về" },
  { value: "delivery", label: "Giao hàng" },
];

const STATUS_LABEL: Record<TableStatus, string> = {
  empty:    "Bàn trống",
  occupied: "Đang phục vụ",
  ordered:  "Đã đặt",
};

// ─── Tab factory ──────────────────────────────────────────────────────────────

let _counter = 1;

function makeTab(id: string, label: string): OrderTab {
  return {
    id,
    label,
    cart: [],
    tableId: null,
    tableName: null,
    customerId: null,
    customerName: "",
    orderType: "takeaway",
    note: "",
    discounts: { discount: 0, promotion: 0, extraFee: 0 },
    cashReceived: "",
  };
}

// ─── Loader types ─────────────────────────────────────────────────────────────

type SalesLoaderData = { products: Promise<Product[]> };
type SalesContentProps = { products: Product[] };

// ─── Main component ───────────────────────────────────────────────────────────

function SalesContent({ products }: SalesContentProps) {
  const [tabs, setTabs]           = useState<OrderTab[]>([makeTab("tab-1", "Đơn mới")]);
  const [activeTabId, setActiveTabId] = useState("tab-1");
  const [keyword, setKeyword]     = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading]     = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [expandedItemId, setExpandedItemId]   = useState<string | null>(null);
  const [customerQuery, setCustomerQuery]     = useState("");
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);

  const customerWrapRef = useRef<HTMLDivElement>(null);
  const appApi = getAppApi();

  const activeTab = tabs.find((t) => t.id === activeTabId)!;

  // Close customer dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (customerWrapRef.current && !customerWrapRef.current.contains(e.target as Node)) {
        setShowCustomerDrop(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // ── Tab helpers ────────────────────────────────────────────────────────────

  function updateTab(partial: Partial<OrderTab>) {
    setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, ...partial } : t)));
  }

  function addTab() {
    _counter++;
    const id  = `tab-${_counter}`;
    const tab = makeTab(id, `Đơn ${_counter}`);
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(id);
    setCustomerQuery("");
    setExpandedItemId(null);
  }

  function closeTab(tabId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (tabs.length === 1) return;
    setTabs((prev) => {
      const idx      = prev.findIndex((t) => t.id === tabId);
      const filtered = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId) {
        setActiveTabId(filtered[Math.min(idx, filtered.length - 1)].id);
      }
      return filtered;
    });
  }

  function switchTab(tabId: string) {
    setActiveTabId(tabId);
    setCustomerQuery(tabs.find((t) => t.id === tabId)?.customerName ?? "");
    setExpandedItemId(null);
  }

  // ── Cart helpers ───────────────────────────────────────────────────────────

  function addToCart(product: Product) {
    const found = activeTab.cart.find((i) => i.product.id === product.id);
    if (!found) {
      updateTab({ cart: [...activeTab.cart, { product, quantity: 1, note: "" }] });
    } else {
      updateTab({
        cart: activeTab.cart.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      });
    }
  }

  function updateQty(productId: string, nextQty: number) {
    if (nextQty <= 0) {
      removeItem(productId);
      return;
    }
    updateTab({
      cart: activeTab.cart.map((i) =>
        i.product.id === productId ? { ...i, quantity: nextQty } : i,
      ),
    });
  }

  function removeItem(productId: string) {
    updateTab({ cart: activeTab.cart.filter((i) => i.product.id !== productId) });
    if (expandedItemId === productId) setExpandedItemId(null);
  }

  function updateItemNote(productId: string, note: string) {
    updateTab({
      cart: activeTab.cart.map((i) =>
        i.product.id === productId ? { ...i, note } : i,
      ),
    });
  }

  function updateDiscount(field: keyof DiscountState, value: string) {
    const n = Number.parseFloat(value);
    updateTab({ discounts: { ...activeTab.discounts, [field]: Number.isNaN(n) ? 0 : n } });
  }

  // ── Table / customer helpers ───────────────────────────────────────────────

  function selectTable(tableId: string, tableName: string) {
    updateTab({ tableId, tableName, orderType: "dine-in" });
    setShowTablePicker(false);
  }

  function clearTable() {
    updateTab({ tableId: null, tableName: null });
  }

  function selectCustomer(id: string, name: string) {
    updateTab({ customerId: id, customerName: name });
    setCustomerQuery(name);
    setShowCustomerDrop(false);
  }

  function clearCustomer() {
    updateTab({ customerId: null, customerName: "" });
    setCustomerQuery("");
  }

  // ── Checkout ───────────────────────────────────────────────────────────────

  async function checkout() {
    if (!activeTab.cart.length || loading) return;
    setLoading(true);
    try {
      await appApi.order.create({
        items: activeTab.cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        note: activeTab.note.trim() || undefined,
      });
      updateTab({
        cart: [],
        note: "",
        discounts: { discount: 0, promotion: 0, extraFee: 0 },
        cashReceived: "",
        customerId: null,
        customerName: "",
        tableId: null,
        tableName: null,
      });
      setCustomerQuery("");
      alert("Tạo đơn thành công");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category)));
    return ["Tất cả", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    return products.filter((p) => {
      const matchText     = p.name.toLowerCase().includes(text);
      const matchCategory = activeCategory === "all" || p.category === activeCategory;
      return matchText && matchCategory;
    });
  }, [products, keyword, activeCategory]);

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return MOCK_CUSTOMERS;
    return MOCK_CUSTOMERS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.replace(/\s/g, "").includes(q),
    );
  }, [customerQuery]);

  const total   = useMemo(() => calcCartTotal(activeTab.cart), [activeTab.cart]);
  const payable = useMemo(
    () =>
      Math.max(
        0,
        total -
          activeTab.discounts.discount -
          activeTab.discounts.promotion +
          activeTab.discounts.extraFee,
      ),
    [activeTab.discounts, total],
  );

  const cashReceived = Number.parseFloat(activeTab.cashReceived) || 0;
  const change       = cashReceived - payable;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="sales-page">

      {/* ═══ LEFT: Products ═══ */}
      <section className="sales-left">
        <div className="sales-toolbar">
          <div className="search-box">
            <input
              className="input"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm theo tên sản phẩm hoặc mã"
            />
            <Button variant="ghost">
              <Search size={14} />
            </Button>
          </div>
          <Button variant="secondary">
            <Plus size={14} /> Thêm hàng hóa
          </Button>
        </div>

        <div className="category-tabs">
          {categories.map((cat) => {
            const key = cat === "Tất cả" ? "all" : cat;
            return (
              <button
                key={cat}
                type="button"
                className={activeCategory === key ? "tab-button active" : "tab-button"}
                onClick={() => setActiveCategory(key)}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <Card className="products-panel" title="Danh sách sản phẩm">
          {filteredProducts.length === 0 ? (
            <p className="muted">Không tìm thấy sản phẩm.</p>
          ) : (
            <div className="product-list">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="product-card card--interactive"
                  onClick={() => addToCart(product)}
                >
                  <div className="product-top-row">
                    <span className="product-code">{product.id.toUpperCase()}</span>
                    <span className="product-price-badge">{formatCurrency(product.price)}</span>
                  </div>
                  <div className="product-thumb" />
                  <span className="product-name">{product.name}</span>
                  <span className="product-category">{product.category}</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* ═══ RIGHT: Order ═══ */}
      <aside className="sales-right">

        {/* ── Order tabs ── */}
        <div className="order-header">
          <div className="order-tabs-scrollable">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`order-tab ${activeTabId === tab.id ? "active" : ""}`}
                onClick={() => switchTab(tab.id)}
              >
                <span className="order-tab-label">{tab.label}</span>
                {tabs.length > 1 && (
                  <span
                    className="order-tab-close"
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => closeTab(tab.id, e)}
                    onKeyDown={() => {}}
                  >
                    <X size={11} />
                  </span>
                )}
              </button>
            ))}
            <button
              type="button"
              className="order-tab-add"
              onClick={addTab}
              title="Thêm đơn mới"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="order-header-actions">
            <button
              type="button"
              className={`btn-table-picker ${activeTab.tableName ? "has-table" : ""}`}
              onClick={() => setShowTablePicker(true)}
            >
              <UtensilsCrossed size={13} />
              <span>{activeTab.tableName ?? "Phòng bàn"}</span>
              {activeTab.tableName && (
                <span
                  className="btn-table-clear"
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => { e.stopPropagation(); clearTable(); }}
                  onKeyDown={() => {}}
                >
                  <X size={10} />
                </span>
              )}
            </button>
            <Button variant="ghost">
              <MoreHorizontal size={14} />
            </Button>
          </div>
        </div>

        {/* ── Order meta ── */}
        <div className="order-meta">
          {/* Order type button group */}
          <div className="order-type-group">
            {ORDER_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`order-type-btn ${activeTab.orderType === value ? "active" : ""}`}
                onClick={() => updateTab({ orderType: value })}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Customer search */}
          <div className="customer-search-wrap" ref={customerWrapRef}>
            <div className="customer-field-row">
              <div className={`customer-badge ${activeTab.customerId ? "selected" : "muted"}`}>
                <User size={12} />
                <span>{activeTab.customerId ? activeTab.customerName : "Khách lẻ"}</span>
                {activeTab.customerId && (
                  <button type="button" className="customer-badge-clear" onClick={clearCustomer}>
                    <X size={10} />
                  </button>
                )}
              </div>
              <div className="customer-input-wrap">
                <Search size={12} className="customer-input-icon" />
                <input
                  className="input customer-input"
                  placeholder="Tìm khách hàng..."
                  value={customerQuery}
                  onChange={(e) => { setCustomerQuery(e.target.value); setShowCustomerDrop(true); }}
                  onFocus={() => setShowCustomerDrop(true)}
                />
                <ChevronDown size={12} className="customer-input-chevron" />
              </div>
            </div>

            {showCustomerDrop && (
              <div className="customer-dropdown">
                {filteredCustomers.length === 0 ? (
                  <div className="customer-dropdown-empty">Không tìm thấy khách hàng</div>
                ) : (
                  filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`customer-option ${activeTab.customerId === c.id ? "selected" : ""}`}
                      onClick={() => selectCustomer(c.id, c.name)}
                    >
                      <span className="customer-option-name">{c.name}</span>
                      <span className="customer-option-phone">{c.phone}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Cart ── */}
        <Card className="order-panel" title="Giỏ hàng">
          {activeTab.cart.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-logo">
                <ShoppingCart size={34} />
              </div>
              <p>Chưa có sản phẩm trong giỏ hàng</p>
            </div>
          ) : (
            <div className="order-list">
              {activeTab.cart.map((item) => (
                <div key={item.product.id} className="order-item-wrap">
                  {/* Main row */}
                  <div
                    className="order-item"
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setExpandedItemId(
                        expandedItemId === item.product.id ? null : item.product.id,
                      )
                    }
                    onKeyDown={() => {}}
                  >
                    <div className="order-item-info">
                      <p className="order-item-name">{item.product.name}</p>
                      <small className="order-item-price muted">
                        {formatCurrency(item.product.price)}
                        {item.note && (
                          <span className="order-item-note-badge"> · {item.note}</span>
                        )}
                      </small>
                    </div>

                    <div
                      className="qty-control"
                      role="presentation"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" onClick={() => updateQty(item.product.id, item.quantity - 1)}>
                        <Minus size={12} />
                      </Button>
                      <span>{item.quantity}</span>
                      <Button variant="ghost" onClick={() => updateQty(item.product.id, item.quantity + 1)}>
                        <Plus size={12} />
                      </Button>
                    </div>

                    <div className="order-item-right">
                      <strong>{formatCurrency(calcLineTotal(item))}</strong>
                      <button
                        type="button"
                        className="cart-item-delete"
                        title="Xoá"
                        onClick={(e) => { e.stopPropagation(); removeItem(item.product.id); }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Per-item note row */}
                  {expandedItemId === item.product.id && (
                    <div className="order-item-note-row">
                      <MessageSquareDot size={13} className="muted" />
                      <input
                        className="input"
                        placeholder="Ghi chú món này..."
                        value={item.note}
                        onChange={(e) => updateItemNote(item.product.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        // biome-ignore lint/a11y/noAutofocus: intended UX
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="summary-panel">
            <div className="summary-row">
              <span>Tổng tiền hàng</span>
              <strong className="value-number">{formatCurrency(total)}</strong>
            </div>
            <div className="summary-row">
              <span>Giảm giá</span>
              <input
                className="input input-inline"
                type="number"
                value={activeTab.discounts.discount}
                onChange={(e) => updateDiscount("discount", e.target.value)}
              />
            </div>
            <div className="summary-row">
              <span>Khuyến mãi</span>
              <input
                className="input input-inline"
                type="number"
                value={activeTab.discounts.promotion}
                onChange={(e) => updateDiscount("promotion", e.target.value)}
              />
            </div>
            <div className="summary-row">
              <span>Thu khác</span>
              <input
                className="input input-inline"
                type="number"
                value={activeTab.discounts.extraFee}
                onChange={(e) => updateDiscount("extraFee", e.target.value)}
              />
            </div>
            <div className="summary-row total">
              <span>Tổng cộng</span>
              <strong className="value-number">{formatCurrency(payable)}</strong>
            </div>

            {/* Cash + change */}
            <div className="summary-row cash-row">
              <span>Tiền khách đưa</span>
              <input
                className="input input-inline"
                type="number"
                placeholder="0"
                value={activeTab.cashReceived}
                onChange={(e) => updateTab({ cashReceived: e.target.value })}
              />
            </div>
            {cashReceived > 0 && (
              <div className={`summary-row change-row ${change >= 0 ? "positive" : "negative"}`}>
                <span>{change >= 0 ? "Tiền thừa" : "Còn thiếu"}</span>
                <strong className="value-number">{formatCurrency(Math.abs(change))}</strong>
              </div>
            )}
          </div>

          <label className="note-label" htmlFor="order-note">
            <MessageSquareDot size={14} />
            <span>Ghi chú đơn</span>
          </label>
          <textarea
            id="order-note"
            className="input note"
            rows={2}
            placeholder="Nhập ghi chú cho đơn hàng"
            value={activeTab.note}
            onChange={(e) => updateTab({ note: e.target.value })}
          />

          <div className="order-actions-row">
            <Button variant="ghost">Lưu đơn</Button>
            <Button variant="secondary">Tạm tính</Button>
            <Button onClick={checkout} disabled={!activeTab.cart.length || loading} fullWidth>
              <Wallet size={14} /> {loading ? "Đang xử lý..." : "Thanh toán"}
            </Button>
          </div>
        </Card>
      </aside>

      {/* ═══ Table Picker Modal ═══ */}
      {showTablePicker && (
        <div className="sales-overlay" onClick={() => setShowTablePicker(false)}>
          <div
            className="table-picker-modal card"
            role="dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="table-picker-header">
              <h3>Chọn bàn</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowTablePicker(false)}
              >
                <X size={14} />
              </button>
            </header>

            <div className="table-picker-grid">
              {/* "No table" option */}
              <button
                type="button"
                className={`table-picker-card card--interactive status-none ${!activeTab.tableId ? "selected" : ""}`}
                onClick={() => { updateTab({ tableId: null, tableName: null, orderType: "takeaway" }); setShowTablePicker(false); }}
              >
                <span className="tpc-name">Không bàn</span>
                <span className="tpc-cap">—</span>
                <span className="tpc-badge">Mang về</span>
              </button>

              {MOCK_TABLES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`table-picker-card card--interactive status-${t.status} ${activeTab.tableId === t.id ? "selected" : ""}`}
                  onClick={() => selectTable(t.id, t.name)}
                >
                  <span className="tpc-name">{t.name}</span>
                  <span className="tpc-cap">{t.capacity} người · {t.area}</span>
                  <span className="tpc-badge">{STATUS_LABEL[t.status]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Wrapper ──────────────────────────────────────────────────────────────────

export function SalesScreen() {
  const { products } = useLoaderData() as SalesLoaderData;

  return (
    <Suspense fallback={<div className="card">Đang tải sản phẩm...</div>}>
      <Await
        resolve={products}
        errorElement={
          <section className="card">
            <h3>Không thể tải sản phẩm</h3>
            <p className="muted" style={{ marginTop: 8 }}>
              Vui lòng thử lại sau.
            </p>
          </section>
        }
      >
        {(resolvedProducts) => <SalesContent products={resolvedProducts} />}
      </Await>
    </Suspense>
  );
}
