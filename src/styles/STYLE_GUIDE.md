# STYLE GUIDE

Hướng dẫn ngắn để xây UI **đồng nhất** cho toàn bộ dự án.

## 1) Nguyên tắc chung

- Ưu tiên **tái sử dụng** class có sẵn trong `src/styles/components/`.
- Không hardcode màu/spacing/motion nếu đã có token.
- Mọi màn hình mới nên đi theo: **layout page + component primitives**.
- Khi thêm style mới, thiết kế để dùng lại cho màn hình khác.

---

## 2) Cấu trúc style hiện tại

- `tokens.css`
  - spacing, motion, font foundation
- `themes/light.css`, `themes/dark.css`
  - semantic color/focus cho từng theme
- `foundations/motion.css`
  - `:focus-visible`, behavior chuyển động cơ bản
- `components/*.css`
  - primitive/module dùng chung (buttons, forms, cards, tabs, chips, search, toggles, panels, ...)
- `global.css`
  - điều phối import + base layout/responsive tổng

---

## 3) Quy tắc dùng token

### Spacing

Dùng `--space-1..8` thay vì số px rời rạc.

- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 20px
- `--space-6`: 24px
- `--space-7`: 28px
- `--space-8`: 32px

### Motion

Dùng preset có sẵn:

- `--motion-fast`
- `--hover-lift`
- `--press-inset`

### Color/Theme

Dùng semantic variables từ theme:

- `--bg-app`, `--bg-surface`, `--bg-surface-soft`, `--bg-sidebar`
- `--text-primary`, `--text-secondary`, `--text-sidebar`
- `--border-soft`, `--shadow-soft`
- `--accent`, `--accent-soft`, `--success`
- `--focus-ring`

---

## 4) Accessibility bắt buộc

- Dùng `:focus-visible` (đã cấu hình trong foundation), không xoá ring mặc định của hệ thống style.
- Control tương tác phải có trạng thái rõ: hover, active, disabled.
- Text phải đủ tương phản theo theme hiện tại.

---

## 5) Khi nào tạo file CSS mới?

Tạo file mới trong `components/` khi:

1. Style có thể dùng lại từ **2 màn hình trở lên**.
2. Module hiện tại đã quá dài/khó bảo trì.
3. Primitive mới có tên rõ ràng (ví dụ: `badges.css`, `table.css`, `modal.css`).

Không tạo file mới nếu chỉ là tweak nhỏ và không tái sử dụng.

---

## 6) Quy ước đặt tên class

- Dùng tên theo vai trò UI, dễ đọc:
  - `.order-panel`, `.summary-row`, `.search-box`, `.tab-button`
- Tránh tên mơ hồ như `.box1`, `.item2`.
- Ưu tiên pattern nhất quán:
  - `block`
  - `block-element`
  - `block-variant` (ví dụ `.tab-button.active`)

---

## 7) Quy trình thêm UI mới (khuyến nghị)

1. Xác định có thể tái dùng primitive nào hiện có.
2. Dựng layout màn hình trước (grid/section positioning).
3. Áp dụng component styles (`buttons`, `cards`, `forms`, ...).
4. Nếu thiếu primitive, thêm vào `components/*.css` tương ứng.
5. Kiểm tra light/dark mode + keyboard focus + responsive.

---

## 8) Checklist trước khi merge

- [ ] Không hardcode spacing/motion/color trái token.
- [ ] Có trạng thái hover/active/disabled/focus-visible cho control mới.
- [ ] Không duplicate style đã có ở component khác.
- [ ] Hoạt động đúng ở cả light và dark theme.
- [ ] Build/lint pass.
