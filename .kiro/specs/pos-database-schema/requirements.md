# Requirements Document

## Introduction

PosiOrder is a Vietnamese Point-of-Sale desktop application built with Electron + React + better-sqlite3. The application currently has a minimal SQLite schema covering only `products`, `orders`, and `order_items`. This feature delivers a complete, production-ready SQLite schema that covers all ten application modules: Sales, Tables, Catalog, Orders, Inventory, Reports, Finance, Customers, Employees, and Settings. The schema must be backward-compatible with the existing tables, enforce referential integrity, support soft-delete patterns, and provide indexes for every common query pattern used by the frontend.

---

## Glossary

- **DB**: The SQLite database file managed by better-sqlite3 at `app.getPath("userData")/posiorder.sqlite`.
- **Schema**: The complete set of `CREATE TABLE`, `CREATE INDEX`, and `CREATE TRIGGER` statements that define the DB structure.
- **Migration**: A versioned, idempotent SQL block guarded by `PRAGMA user_version` that alters the DB from one schema version to the next.
- **Soft-delete**: A pattern where rows are never physically removed; instead a `deleted_at TEXT` column is set to the current timestamp, and all queries filter `WHERE deleted_at IS NULL`.
- **INTEGER (money)**: All monetary amounts are stored as `INTEGER` representing Vietnamese Đồng (VND) in whole units (no decimals). This avoids floating-point rounding errors.
- **TEXT (ISO-8601)**: All timestamps are stored as `TEXT` in `datetime('now','localtime')` format (`YYYY-MM-DD HH:MM:SS`) for human-readable SQLite queries.
- **FK**: Foreign key constraint enforced via `PRAGMA foreign_keys = ON`.
- **Cascade delete**: `ON DELETE CASCADE` — child rows are deleted automatically when the parent row is deleted.
- **Restrict delete**: `ON DELETE RESTRICT` — deletion of a parent row is blocked while child rows reference it.
- **Set-null delete**: `ON DELETE SET NULL` — the FK column is set to NULL when the parent row is deleted.
- **Product**: A sellable item (goods, service, combo, or ingredient) defined in the Catalog module.
- **Category**: A grouping of Products.
- **Addon**: An optional extra item that can be attached to a Product (e.g., extra shot, topping).
- **Order**: A sales transaction containing one or more Order_Items.
- **Order_Item**: A single line in an Order referencing a Product with quantity, unit price, and optional addons.
- **Table**: A physical dining table in the restaurant.
- **Area**: A named zone containing one or more Tables (e.g., "Trong nhà", "Ngoài sân").
- **Supplier**: A vendor from whom inventory is purchased.
- **Stock_Import**: A purchase order that increases product stock.
- **Stock_Export**: A manual stock reduction document.
- **Stock_Audit**: A periodic physical count reconciliation document.
- **Stock_Transfer**: A movement of stock between locations/warehouses.
- **Voucher**: A finance document — either a receipt (phiếu thu), payment (phiếu chi), or transfer (phiếu chuyển tiền).
- **Fund_Account**: A named cash/bank/wallet account that holds a balance (e.g., "Tiền mặt", "Ngân hàng").
- **Finance_Category**: A named classification for income or expense vouchers.
- **Customer**: A registered buyer with optional loyalty points.
- **Customer_Group**: A tier or segment that groups Customers (e.g., VIP, Regular).
- **Employee**: A staff member who can log in and perform actions.
- **Role**: A named set of permissions assigned to one or more Employees.
- **Permission**: A granular access right within a permission group (e.g., `sales__create_order`).
- **Setting**: A key-value configuration entry for store-wide or module-specific options.
- **Shift**: A work session opened and closed by an Employee, used for end-of-shift reporting.

---

## Requirements

### Requirement 1: Catalog — Categories and Products

**User Story:** As a store manager, I want to manage product categories and products with full metadata, so that the sales screen can display and filter items correctly.

#### Acceptance Criteria

1. THE DB SHALL contain a `categories` table with columns: `id` (INTEGER PK AUTOINCREMENT), `name` (TEXT NOT NULL UNIQUE), `sort_order` (INTEGER NOT NULL DEFAULT 0), `created_at`, `updated_at`, `deleted_at`.
2. THE DB SHALL contain a `products` table that replaces the existing minimal `products` table, with columns: `id`, `code` (TEXT UNIQUE), `name` (TEXT NOT NULL), `barcode` (TEXT), `unit` (TEXT NOT NULL DEFAULT 'cái'), `type` (TEXT NOT NULL CHECK in ('goods','service','combo','ingredient')), `cost` (INTEGER NOT NULL DEFAULT 0 CHECK >= 0), `vat` (INTEGER NOT NULL DEFAULT 0 CHECK between 0 and 100), `price` (INTEGER NOT NULL CHECK >= 0), `stock` (INTEGER NOT NULL DEFAULT 0), `min_stock` (INTEGER NOT NULL DEFAULT 0), `max_stock` (INTEGER), `category_id` (INTEGER FK → categories), `is_active` (INTEGER NOT NULL DEFAULT 1 CHECK in (0,1)), `is_favorite` (INTEGER NOT NULL DEFAULT 0 CHECK in (0,1)), `image_url` (TEXT), `created_at`, `updated_at`, `deleted_at`.
3. WHEN a `categories` row is soft-deleted, THE DB SHALL preserve all `products` rows that reference it via `category_id` (no cascade on soft-delete; FK uses `ON DELETE SET NULL` for hard-delete only).
4. THE DB SHALL contain an `addons` table with columns: `id`, `name` (TEXT NOT NULL), `price` (INTEGER NOT NULL DEFAULT 0 CHECK >= 0), `category_id` (INTEGER FK → categories ON DELETE SET NULL), `created_at`, `updated_at`, `deleted_at`.
5. THE DB SHALL contain a `product_addons` join table linking products to addons (N-N): `product_id` (FK → products ON DELETE CASCADE), `addon_id` (FK → addons ON DELETE CASCADE), PRIMARY KEY (product_id, addon_id).
6. THE DB SHALL contain a `combo_items` table for combo product composition: `combo_product_id` (FK → products ON DELETE CASCADE), `component_product_id` (FK → products ON DELETE RESTRICT), `quantity` (INTEGER NOT NULL CHECK > 0), PRIMARY KEY (combo_product_id, component_product_id).
7. THE DB SHALL create indexes: `idx_products_category` on `products(category_id) WHERE deleted_at IS NULL`, `idx_products_active` on `products(is_active) WHERE deleted_at IS NULL`, `idx_products_barcode` on `products(barcode) WHERE barcode IS NOT NULL`.
8. WHEN a product `code` is inserted as NULL, THE DB SHALL auto-generate a unique code using a trigger in the format `SP` + zero-padded `id` (e.g., `SP00001`).

---

### Requirement 2: Tables and Areas

**User Story:** As a waiter, I want to see which tables are available, occupied, or reserved, so that I can seat customers and assign orders to the correct table.

#### Acceptance Criteria

1. THE DB SHALL contain an `areas` table with columns: `id` (INTEGER PK AUTOINCREMENT), `name` (TEXT NOT NULL UNIQUE), `sort_order` (INTEGER NOT NULL DEFAULT 0), `note` (TEXT), `created_at`, `updated_at`, `deleted_at`.
2. THE DB SHALL contain a `tables` table with columns: `id` (INTEGER PK AUTOINCREMENT), `name` (TEXT NOT NULL), `area_id` (INTEGER NOT NULL FK → areas ON DELETE RESTRICT), `capacity` (INTEGER NOT NULL DEFAULT 4 CHECK > 0), `status` (TEXT NOT NULL DEFAULT 'empty' CHECK in ('empty','occupied','ordered')), `note` (TEXT), `created_at`, `updated_at`, `deleted_at`.
3. THE DB SHALL enforce that `(name, area_id)` is UNIQUE in the `tables` table so two tables in the same area cannot share a name.
4. THE DB SHALL create index `idx_tables_area` on `tables(area_id) WHERE deleted_at IS NULL`.
5. WHILE a `tables` row has `status = 'occupied'`, THE DB SHALL allow the status to be updated to `'empty'` only when no active (non-completed, non-cancelled) Order references that table.

---

### Requirement 3: Orders and Order Items

**User Story:** As a cashier, I want every sales transaction to be fully recorded with items, discounts, payment method, and customer reference, so that order history and reports are accurate.

#### Acceptance Criteria

1. THE DB SHALL extend the existing `orders` table with columns: `code` (TEXT UNIQUE), `type` (TEXT NOT NULL DEFAULT 'dine-in' CHECK in ('dine-in','takeaway','delivery')), `status` (TEXT NOT NULL DEFAULT 'pending' CHECK in ('pending','processing','completed','cancelled','returned')), `table_id` (INTEGER FK → tables ON DELETE SET NULL), `customer_id` (INTEGER FK → customers ON DELETE SET NULL), `employee_id` (INTEGER FK → employees ON DELETE SET NULL), `discount_amount` (INTEGER NOT NULL DEFAULT 0 CHECK >= 0), `promotion_amount` (INTEGER NOT NULL DEFAULT 0 CHECK >= 0), `extra_fee` (INTEGER NOT NULL DEFAULT 0 CHECK >= 0), `subtotal` (INTEGER NOT NULL DEFAULT 0 CHECK >= 0), `total` (INTEGER NOT NULL CHECK >= 0), `cash_received` (INTEGER), `change_amount` (INTEGER), `payment_method` (TEXT CHECK in ('cash','transfer','card','wallet','point') or NULL), `note` (TEXT), `completed_at` (TEXT), `cancelled_at` (TEXT), `created_at`, `updated_at`.
2. THE DB SHALL extend the existing `order_items` table with columns: `note` (TEXT), `discount_amount` (INTEGER NOT NULL DEFAULT 0 CHECK >= 0), `addon_total` (INTEGER NOT NULL DEFAULT 0 CHECK >= 0), `line_total` (INTEGER NOT NULL CHECK >= 0).
3. THE DB SHALL contain an `order_item_addons` table: `id` (INTEGER PK AUTOINCREMENT), `order_item_id` (FK → order_items ON DELETE CASCADE), `addon_id` (FK → addons ON DELETE RESTRICT), `quantity` (INTEGER NOT NULL DEFAULT 1 CHECK > 0), `unit_price` (INTEGER NOT NULL CHECK >= 0), `line_total` (INTEGER NOT NULL CHECK >= 0).
4. THE DB SHALL create indexes: `idx_orders_status` on `orders(status)`, `idx_orders_table` on `orders(table_id) WHERE table_id IS NOT NULL`, `idx_orders_customer` on `orders(customer_id) WHERE customer_id IS NOT NULL`, `idx_orders_employee` on `orders(employee_id) WHERE employee_id IS NOT NULL`, `idx_orders_createdat` on `orders(created_at DESC)`.
5. WHEN an `orders` row `code` is inserted as NULL, THE DB SHALL auto-generate a code using a trigger in the format `HD` + zero-padded `id` (e.g., `HD00001`).
6. IF `orders.status` is set to `'completed'`, THEN THE DB SHALL record `completed_at = datetime('now','localtime')` via a trigger.
7. IF `orders.status` is set to `'cancelled'`, THEN THE DB SHALL record `cancelled_at = datetime('now','localtime')` via a trigger.

---

### Requirement 4: Customers and Customer Groups

**User Story:** As a store manager, I want to store customer profiles with loyalty points and group tiers, so that I can offer targeted promotions and track customer revenue.

#### Acceptance Criteria

1. THE DB SHALL contain a `customer_groups` table with columns: `id` (INTEGER PK AUTOINCREMENT), `name` (TEXT NOT NULL UNIQUE), `point_rate` (REAL NOT NULL DEFAULT 1.0 CHECK > 0), `condition_type` (TEXT CHECK in ('revenue','order_count') or NULL), `condition_value` (INTEGER), `auto_upgrade` (INTEGER NOT NULL DEFAULT 0 CHECK in (0,1)), `note` (TEXT), `created_at`, `updated_at`, `deleted_at`.
2. THE DB SHALL contain a `customers` table with columns: `id` (INTEGER PK AUTOINCREMENT), `code` (TEXT UNIQUE), `name` (TEXT NOT NULL), `phone` (TEXT UNIQUE), `email` (TEXT), `dob` (TEXT), `address` (TEXT), `group_id` (INTEGER FK → customer_groups ON DELETE SET NULL), `tax_code` (TEXT), `invoice_type` (TEXT), `loyalty_points` (INTEGER NOT NULL DEFAULT 0 CHECK >= 0), `total_revenue` (INTEGER NOT NULL DEFAULT 0 CHECK >= 0), `total_orders` (INTEGER NOT NULL DEFAULT 0 CHECK >= 0), `note` (TEXT), `created_at`, `updated_at`, `deleted_at`.
3. WHEN a `customers` row `code` is inserted as NULL, THE DB SHALL auto-generate a code using a trigger in the format `KH` + zero-padded `id` (e.g., `KH00001`).
4. THE DB SHALL create indexes: `idx_customers_phone` on `customers(phone) WHERE deleted_at IS NULL`, `idx_customers_group` on `customers(group_id) WHERE deleted_at IS NULL`.
5. THE DB SHALL contain a `loyalty_transactions` table to record every point earn/spend event: `id` (INTEGER PK AUTOINCREMENT), `customer_id` (FK → customers ON DELETE CASCADE), `order_id` (FK → orders ON DELETE SET NULL), `delta` (INTEGER NOT NULL — positive = earn, negative = spend), `balance_after` (INTEGER NOT NULL CHECK >= 0), `note` (TEXT), `created_at`.

---

### Requirement 5: Employees, Roles, and Permissions

**User Story:** As a store owner, I want to define roles with granular permissions and assign them to employees, so that each staff member can only access the features they are authorized to use.

#### Acceptance Criteria

1. THE DB SHALL contain a `roles` table with columns: `id` (INTEGER PK AUTOINCREMENT), `name` (TEXT NOT NULL UNIQUE), `description` (TEXT), `created_at`, `updated_at`, `deleted_at`.
2. THE DB SHALL contain a `permissions` table with columns: `id` (INTEGER PK AUTOINCREMENT), `group_key` (TEXT NOT NULL — e.g., 'sales', 'orders', 'inventory'), `perm_key` (TEXT NOT NULL — e.g., 'create_order', 'cancel_order'), `label` (TEXT NOT NULL), UNIQUE (group_key, perm_key).
3. THE DB SHALL contain a `role_permissions` join table (N-N): `role_id` (FK → roles ON DELETE CASCADE), `permission_id` (FK → permissions ON DELETE CASCADE), PRIMARY KEY (role_id, permission_id).
4. THE DB SHALL contain an `employees` table with columns: `id` (INTEGER PK AUTOINCREMENT), `code` (TEXT UNIQUE), `name` (TEXT NOT NULL), `phone` (TEXT UNIQUE), `pin` (TEXT — hashed 4-6 digit PIN for POS login), `role_id` (INTEGER FK → roles ON DELETE SET NULL), `branch` (TEXT NOT NULL DEFAULT 'Main'), `avatar_url` (TEXT), `is_active` (INTEGER NOT NULL DEFAULT 1 CHECK in (0,1)), `created_at`, `updated_at`, `deleted_at`.
5. WHEN an `employees` row `code` is inserted as NULL, THE DB SHALL auto-generate a code using a trigger in the format `NV` + zero-padded `id` (e.g., `NV00001`).
6. THE DB SHALL create indexes: `idx_employees_role` on `employees(role_id) WHERE deleted_at IS NULL`, `idx_employees_phone` on `employees(phone) WHERE deleted_at IS NULL`.

---

### Requirement 6: Inventory — Stock, Imports, Exports, Audits, Transfers, Suppliers

**User Story:** As a warehouse manager, I want to track stock levels and all inventory movements (imports, exports, audits, transfers) with full document trails, so that I can reconcile physical stock against system records.

#### Acceptance Criteria

1. THE DB SHALL contain a `suppliers` table with columns: `id` (INTEGER PK AUTOINCREMENT), `code` (TEXT UNIQUE), `name` (TEXT NOT NULL), `phone` (TEXT), `email` (TEXT), `address` (TEXT), `note` (TEXT), `created_at`, `updated_at`, `deleted_at`.
2. THE DB SHALL contain a `stock_imports` table (phiếu nhập kho) with columns: `id` (INTEGER PK AUTOINCREMENT), `code` (TEXT UNIQUE), `supplier_id` (INTEGER FK → suppliers ON DELETE SET NULL), `employee_id` (INTEGER FK → employees ON DELETE SET NULL), `status` (TEXT NOT NULL DEFAULT 'draft' CHECK in ('draft','confirmed','cancelled')), `total_cost` (INTEGER NOT NULL DEFAULT 0 CHECK >= 0), `note` (TEXT), `confirmed_at` (TEXT), `created_at`, `updated_at`.
3. THE DB SHALL contain a `stock_import_items` table: `id` (INTEGER PK AUTOINCREMENT), `import_id` (FK → stock_imports ON DELETE CASCADE), `product_id` (FK → products ON DELETE RESTRICT), `quantity` (INTEGER NOT NULL CHECK > 0), `unit_cost` (INTEGER NOT NULL CHECK >= 0), `line_total` (INTEGER NOT NULL CHECK >= 0).
4. THE DB SHALL contain a `stock_exports` table (phiếu xuất kho) with columns: `id` (INTEGER PK AUTOINCREMENT), `code` (TEXT UNIQUE), `employee_id` (INTEGER FK → employees ON DELETE SET NULL), `reason` (TEXT), `status` (TEXT NOT NULL DEFAULT 'draft' CHECK in ('draft','confirmed','cancelled')), `note` (TEXT), `confirmed_at` (TEXT), `created_at`, `updated_at`.
5. THE DB SHALL contain a `stock_export_items` table: `id` (INTEGER PK AUTOINCREMENT), `export_id` (FK → stock_exports ON DELETE CASCADE), `product_id` (FK → products ON DELETE RESTRICT), `quantity` (INTEGER NOT NULL CHECK > 0), `unit_cost` (INTEGER NOT NULL CHECK >= 0), `line_total` (INTEGER NOT NULL CHECK >= 0).
6. THE DB SHALL contain a `stock_audits` table (phiếu kiểm kho) with columns: `id` (INTEGER PK AUTOINCREMENT), `code` (TEXT UNIQUE), `employee_id` (FK → employees ON DELETE SET NULL), `status` (TEXT NOT NULL DEFAULT 'draft' CHECK in ('draft','balanced','cancelled')), `note` (TEXT), `balanced_at` (TEXT), `created_at`, `updated_at`.
7. THE DB SHALL contain a `stock_audit_items` table: `id` (INTEGER PK AUTOINCREMENT), `audit_id` (FK → stock_audits ON DELETE CASCADE), `product_id` (FK → products ON DELETE RESTRICT), `system_qty` (INTEGER NOT NULL DEFAULT 0), `actual_qty` (INTEGER NOT NULL DEFAULT 0 CHECK >= 0), `diff_qty` (INTEGER GENERATED ALWAYS AS (actual_qty - system_qty) STORED), `unit_cost` (INTEGER NOT NULL DEFAULT 0 CHECK >= 0).
8. THE DB SHALL contain a `stock_transfers` table (phiếu điều chuyển) with columns: `id` (INTEGER PK AUTOINCREMENT), `code` (TEXT UNIQUE), `from_location` (TEXT NOT NULL), `to_location` (TEXT NOT NULL), `employee_id` (FK → employees ON DELETE SET NULL), `status` (TEXT NOT NULL DEFAULT 'draft' CHECK in ('draft','confirmed','cancelled')), `note` (TEXT), `confirmed_at` (TEXT), `created_at`, `updated_at`.
9. THE DB SHALL contain a `stock_transfer_items` table: `id` (INTEGER PK AUTOINCREMENT), `transfer_id` (FK → stock_transfers ON DELETE CASCADE), `product_id` (FK → products ON DELETE RESTRICT), `quantity` (INTEGER NOT NULL CHECK > 0).
10. THE DB SHALL contain a `stock_logs` table to record every stock movement: `id` (INTEGER PK AUTOINCREMENT), `product_id` (FK → products ON DELETE CASCADE), `delta` (INTEGER NOT NULL — positive = in, negative = out), `balance_after` (INTEGER NOT NULL), `source_type` (TEXT NOT NULL CHECK in ('import','export','audit','transfer','sale','manual')), `source_id` (INTEGER), `note` (TEXT), `created_at`.
11. THE DB SHALL create indexes: `idx_stocklogs_product` on `stock_logs(product_id, created_at DESC)`, `idx_stocklogs_source` on `stock_logs(source_type, source_id)`, `idx_stockimports_supplier` on `stock_imports(supplier_id)`, `idx_stockimports_status` on `stock_imports(status)`.
12. WHEN a `stock_imports` row `code` is inserted as NULL, THE DB SHALL auto-generate a code in the format `NK` + zero-padded `id`. WHEN a `stock_exports` row `code` is inserted as NULL, THE DB SHALL auto-generate a code in the format `XK` + zero-padded `id`. WHEN a `stock_audits` row `code` is inserted as NULL, THE DB SHALL auto-generate a code in the format `KK` + zero-padded `id`. WHEN a `stock_transfers` row `code` is inserted as NULL, THE DB SHALL auto-generate a code in the format `DC` + zero-padded `id`.

---

### Requirement 7: Finance — Vouchers, Fund Accounts, Finance Categories

**User Story:** As a store owner, I want to record all income and expense vouchers linked to fund accounts, so that I can track cash flow and generate financial reports.

#### Acceptance Criteria

1. THE DB SHALL contain a `fund_accounts` table with columns: `id` (INTEGER PK AUTOINCREMENT), `name` (TEXT NOT NULL UNIQUE), `type` (TEXT NOT NULL CHECK in ('cash','bank','wallet')), `balance` (INTEGER NOT NULL DEFAULT 0), `is_active` (INTEGER NOT NULL DEFAULT 1 CHECK in (0,1)), `created_at`, `updated_at`, `deleted_at`.
2. THE DB SHALL contain a `finance_categories` table with columns: `id` (INTEGER PK AUTOINCREMENT), `name` (TEXT NOT NULL), `direction` (TEXT NOT NULL CHECK in ('income','expense')), `note` (TEXT), `created_at`, `updated_at`, `deleted_at`; UNIQUE (name, direction).
3. THE DB SHALL contain a `vouchers` table with columns: `id` (INTEGER PK AUTOINCREMENT), `code` (TEXT UNIQUE), `direction` (TEXT NOT NULL CHECK in ('income','expense','transfer')), `category_id` (INTEGER FK → finance_categories ON DELETE SET NULL), `fund_account_id` (INTEGER FK → fund_accounts ON DELETE RESTRICT), `to_fund_account_id` (INTEGER FK → fund_accounts ON DELETE RESTRICT — used only for transfer direction), `amount` (INTEGER NOT NULL CHECK > 0), `person_name` (TEXT), `employee_id` (INTEGER FK → employees ON DELETE SET NULL), `accounting` (INTEGER NOT NULL DEFAULT 1 CHECK in (0,1)), `note` (TEXT), `voucher_at` (TEXT NOT NULL DEFAULT (datetime('now','localtime'))), `created_at`, `updated_at`.
4. WHEN a `vouchers` row `code` is inserted as NULL, THE DB SHALL auto-generate a code: `PT` + zero-padded `id` for income, `PC` + zero-padded `id` for expense, `PCT` + zero-padded `id` for transfer.
5. THE DB SHALL create indexes: `idx_vouchers_direction` on `vouchers(direction)`, `idx_vouchers_fund` on `vouchers(fund_account_id)`, `idx_vouchers_voucherat` on `vouchers(voucher_at DESC)`, `idx_vouchers_employee` on `vouchers(employee_id)`.
6. IF `vouchers.direction = 'transfer'` AND `vouchers.to_fund_account_id IS NULL`, THEN THE DB SHALL reject the insert via a CHECK constraint.

---

### Requirement 8: Settings

**User Story:** As a store owner, I want all application configuration (store info, sales rules, payment methods, loyalty settings, printer config) to be persisted in the database, so that settings survive application restarts.

#### Acceptance Criteria

1. THE DB SHALL contain a `settings` table with columns: `key` (TEXT PRIMARY KEY), `value` (TEXT NOT NULL), `updated_at` (TEXT NOT NULL DEFAULT (datetime('now','localtime'))).
2. THE DB SHALL seed the `settings` table with default rows for the following keys on first initialization: `store.name`, `store.address`, `store.phone`, `store.email`, `store.wifi`, `sales.allowNegativeStock` (default `'false'`), `sales.showImages` (default `'true'`), `sales.showConfirmDialog` (default `'true'`), `sales.staffRequired` (default `'false'`), `sales.fastCheckout` (default `'false'`), `sales.autoPrint` (default `'false'`), `sales.autoFinish` (default `'false'`), `payment.cash` (default `'true'`), `payment.transfer` (default `'true'`), `payment.card` (default `'false'`), `payment.wallet` (default `'false'`), `payment.point` (default `'false'`), `display.text`, `display.website`, `display.showOrderInfo` (default `'true'`), `loyalty.pointsPerVnd` (default `'1000'` — 1 point per 1000 VND), `loyalty.pointValue` (default `'100'` — 1 point = 100 VND).
3. WHEN a `settings` row is updated, THE DB SHALL set `updated_at = datetime('now','localtime')` via a trigger.

---

### Requirement 9: Shifts (Ca làm việc)

**User Story:** As a store manager, I want to track employee work shifts with opening/closing cash balances, so that end-of-shift reports can reconcile sales against cash on hand.

#### Acceptance Criteria

1. THE DB SHALL contain a `shifts` table with columns: `id` (INTEGER PK AUTOINCREMENT), `employee_id` (INTEGER FK → employees ON DELETE SET NULL), `opened_at` (TEXT NOT NULL DEFAULT (datetime('now','localtime'))), `closed_at` (TEXT), `opening_cash` (INTEGER NOT NULL DEFAULT 0 CHECK >= 0), `closing_cash` (INTEGER), `note` (TEXT), `status` (TEXT NOT NULL DEFAULT 'open' CHECK in ('open','closed')).
2. THE DB SHALL create index `idx_shifts_employee` on `shifts(employee_id, opened_at DESC)`.
3. THE DB SHALL add a `shift_id` column (FK → shifts ON DELETE SET NULL) to the `orders` table so each order is associated with the shift during which it was created.

---

### Requirement 10: Schema Versioning and Migration Safety

**User Story:** As a developer, I want the schema to be managed through versioned migrations guarded by `PRAGMA user_version`, so that the database can be upgraded safely across application releases without data loss.

#### Acceptance Criteria

1. THE DB SHALL use `PRAGMA user_version` to track the current schema version as an integer.
2. WHEN the application starts, THE DB SHALL compare `PRAGMA user_version` against the latest known version and execute only the migrations needed to reach the latest version.
3. THE Schema SHALL be structured so that migration version 1 (existing) adds `created_at`, `updated_at`, `deleted_at` to the legacy `products` table, and migration version 2 creates all new tables defined in Requirements 1–9.
4. IF a migration fails mid-execution, THEN THE DB SHALL roll back the entire migration block via a SQLite transaction, leaving `user_version` unchanged.
5. THE DB SHALL enforce `PRAGMA foreign_keys = ON`, `PRAGMA journal_mode = WAL`, and `PRAGMA synchronous = NORMAL` on every connection open.
6. THE DB SHALL enforce `PRAGMA busy_timeout = 5000` so concurrent Electron IPC calls wait up to 5 seconds before returning a busy error.
7. THE Schema SHALL use `INTEGER` for all boolean columns with `CHECK(col IN (0,1))` rather than a TEXT 'true'/'false' pattern, except for the `settings` table which stores all values as TEXT for flexibility.
8. THE Schema SHALL use `INTEGER` for all monetary amounts (VND, no decimals) with `CHECK(col >= 0)` on non-negative fields.
9. THE Schema SHALL apply `deleted_at TEXT` soft-delete to: `categories`, `products`, `addons`, `areas`, `tables`, `customers`, `customer_groups`, `employees`, `roles`, `suppliers`, `fund_accounts`, `finance_categories`.
10. WHEN any table with `updated_at` has a row updated, THE DB SHALL set `updated_at = datetime('now','localtime')` via a per-table `AFTER UPDATE` trigger.
