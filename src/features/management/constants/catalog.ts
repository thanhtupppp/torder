import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  BadgeCheck,
  Lock,
  Percent,
  ScanLine,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";

// ── Local types ───────────────────────────────────────────────────────────────

export type CatalogTab = "products" | "categories" | "addons" | "notes";
export type ProductType = "goods" | "service" | "combo" | "ingredient";

// ── Tab definitions ───────────────────────────────────────────────────────────

export const TOP_TABS: Array<{ key: CatalogTab; label: string }> = [
  { key: "products", label: "Sản phẩm" },
  { key: "categories", label: "Danh mục" },
  { key: "addons", label: "Món thêm" },
  { key: "notes", label: "Ghi chú món" },
];

// ── Product type definitions ──────────────────────────────────────────────────

export const PRODUCT_TYPES: Array<{ key: ProductType; label: string }> = [
  { key: "goods", label: "Hàng hoá" },
  { key: "service", label: "Dịch vụ" },
  { key: "combo", label: "Combo" },
  { key: "ingredient", label: "Hàng chưa nguyên liệu" },
];

// ── Table column definitions ──────────────────────────────────────────────────

export type ProductColumn = { key: string; label: string };

export const PRODUCT_COLUMNS: ProductColumn[] = [
  { key: "code", label: "Mã hàng" },
  { key: "name", label: "Tên hàng" },
  { key: "barcode", label: "Barcode" },
  { key: "unit", label: "ĐVT" },
  { key: "group", label: "Nhóm hàng" },
  { key: "type", label: "Loại hàng" },
  { key: "cost", label: "Giá vốn" },
  { key: "vat", label: "VAT" },
  { key: "price", label: "Giá bán" },
  { key: "stock", label: "Tồn kho" },
  { key: "minStock", label: "Định mức tồn ít nhất" },
  { key: "maxStock", label: "Định mức tồn cao nhất" },
];

export const DEFAULT_VISIBLE_COLUMNS = new Set([
  "code",
  "name",
  "barcode",
  "unit",
  "type",
  "cost",
  "vat",
  "price",
  "stock",
]);

// ── Action menu ───────────────────────────────────────────────────────────────

export type ActionMenuItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  danger?: boolean;
};

export const ACTION_MENU_ITEMS: ActionMenuItem[] = [
  { key: "delete", label: "Xóa sản phẩm", icon: Trash2, danger: true },
  { key: "barcode", label: "In mã vạch", icon: ScanLine },
  { key: "change-vat", label: "Thay đổi tỷ lệ thuế", icon: Percent },
  { key: "move-category", label: "Chuyển nhóm hàng", icon: ArrowRightLeft },
  { key: "enable-sale", label: "Cho phép kinh doanh", icon: BadgeCheck },
  { key: "disable-sale", label: "Ngừng kinh doanh", icon: Lock },
  { key: "favorite", label: "Sản phẩm yêu thích", icon: Star },
  { key: "unfavorite", label: "Ngừng yêu thích", icon: StarOff },
];
