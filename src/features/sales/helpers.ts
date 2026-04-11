import type { CartItem } from "../../types";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function calcLineTotal(item: CartItem) {
  return item.product.price * item.quantity;
}

export function calcCartTotal(cart: CartItem[]) {
  return cart.reduce((total, item) => total + calcLineTotal(item), 0);
}
