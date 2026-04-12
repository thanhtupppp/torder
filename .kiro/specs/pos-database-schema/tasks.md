# Tasks: pos-database-schema

## Task List

- [x] 1. Refactor db.ts for testability
  - [x] 1.1 Export `applyPragmas`, `createSchema`, `runMigrations`, and `seedDefaults` as named exports that each accept an arbitrary `Database` instance parameter, so they can be called with an in-memory DB in tests
    - Remove the `seedProducts` function entirely; replace with `seedDefaults` (see task 5)
    - Keep all existing logic intact — only change signatures to accept `database` as a parameter
    - _Requirements: 10.1, 10.2, 10.5_
  - [x] 1.2 Update `initDb()` to call the extracted functions in the correct order: `applyPragmas` → `createSchema` → `runMigrations` → `seedDefaults`
    - This matches the existing call order (migrations run AFTER schema creation, which is intentional — migration v1 uses `ALTER TABLE` on the table created by `createSchema`)
    - Replace the `seedProducts(database)` call with `seedDefaults(database)`
    - _Requirements: 10.2, 10.4_

- [x] 2. Implement Migration v2 — create all new tables
  - [x] 2.1 Add migration v2 block inside `runMigrations` guarded by `if (version < 2)`, wrapped in a single `database.transaction(...)` call; set `PRAGMA user_version = 2` at the end of the transaction
    - _Requirements: 10.1, 10.2, 10.4_
  - [x] 2.2 Create `categories` table: `id` INTEGER PK AUTOINCREMENT, `name` TEXT NOT NULL UNIQUE, `sort_order` INTEGER NOT NULL DEFAULT 0, `created_at`, `updated_at`, `deleted_at`
    - _Requirements: 1.1_
  - [x] 2.3 Extend `products` table via `ALTER TABLE` to add all missing columns: `code` TEXT UNIQUE, `barcode` TEXT, `unit` TEXT NOT NULL DEFAULT 'cái', `type` TEXT NOT NULL DEFAULT 'goods' CHECK in ('goods','service','combo','ingredient'), `cost` INTEGER NOT NULL DEFAULT 0 CHECK >= 0, `vat` INTEGER NOT NULL DEFAULT 0 CHECK between 0 and 100, `stock` INTEGER NOT NULL DEFAULT 0, `min_stock` INTEGER NOT NULL DEFAULT 0, `max_stock` INTEGER, `category_id` INTEGER FK → categories ON DELETE SET NULL, `is_active` INTEGER NOT NULL DEFAULT 1 CHECK in (0,1), `is_favorite` INTEGER NOT NULL DEFAULT 0 CHECK in (0,1), `image_url` TEXT
    - Note: `id`, `name`, `price`, `created_at`, `updated_at`, `deleted_at` already exist — do NOT add them again
    - Note: the legacy `category` TEXT column remains; new code should use `category_id` FK instead
    - _Requirements: 1.2_
  - [x] 2.4 Create `addons` table and `product_addons` join table and `combo_items` table
    - `addons`: `id`, `name` TEXT NOT NULL, `price` INTEGER NOT NULL DEFAULT 0 CHECK >= 0, `category_id` FK → categories ON DELETE SET NULL, `created_at`, `updated_at`, `deleted_at`
    - `product_addons`: `product_id` FK → products ON DELETE CASCADE, `addon_id` FK → addons ON DELETE CASCADE, PRIMARY KEY (product_id, addon_id)
    - `combo_items`: `combo_product_id` FK → products ON DELETE CASCADE, `component_product_id` FK → products ON DELETE RESTRICT, `quantity` INTEGER NOT NULL CHECK > 0, PRIMARY KEY (combo_product_id, component_product_id)
    - _Requirements: 1.4, 1.5, 1.6_
  - [x] 2.5 Create `areas` table and `tables` table
    - `areas`: `id`, `name` TEXT NOT NULL UNIQUE, `sort_order` INTEGER NOT NULL DEFAULT 0, `note` TEXT, `created_at`, `updated_at`, `deleted_at`
    - `tables`: `id`, `name` TEXT NOT NULL, `area_id` INTEGER NOT NULL FK → areas ON DELETE RESTRICT, `capacity` INTEGER NOT NULL DEFAULT 4 CHECK > 0, `status` TEXT NOT NULL DEFAULT 'empty' CHECK in ('empty','occupied','ordered'), `note` TEXT, `created_at`, `updated_at`, `deleted_at`, UNIQUE(name, area_id)
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 2.6 Create `customer_groups` table, `customers` table, and `loyalty_transactions` table
    - `customer_groups`: `id`, `name` TEXT NOT NULL UNIQUE, `point_rate` REAL NOT NULL DEFAULT 1.0 CHECK > 0, `condition_type` TEXT CHECK in ('revenue','order_count') or NULL, `condition_value` INTEGER, `auto_upgrade` INTEGER NOT NULL DEFAULT 0 CHECK in (0,1), `note` TEXT, `created_at`, `updated_at`, `deleted_at`
    - `customers`: `id`, `code` TEXT UNIQUE, `name` TEXT NOT NULL, `phone` TEXT UNIQUE, `email` TEXT, `dob` TEXT, `address` TEXT, `group_id` FK → customer_groups ON DELETE SET NULL, `tax_code` TEXT, `invoice_type` TEXT, `loyalty_points` INTEGER NOT NULL DEFAULT 0 CHECK >= 0, `total_revenue` INTEGER NOT NULL DEFAULT 0 CHECK >= 0, `total_orders` INTEGER NOT NULL DEFAULT 0 CHECK >= 0, `note` TEXT, `created_at`, `updated_at`, `deleted_at`
    - `loyalty_transactions`: `id`, `customer_id` FK → customers ON DELETE CASCADE, `order_id` FK → orders ON DELETE SET NULL, `delta` INTEGER NOT NULL, `balance_after` INTEGER NOT NULL CHECK >= 0, `note` TEXT, `created_at`
    - _Requirements: 4.1, 4.2, 4.5_
  - [x] 2.7 Create `roles`, `permissions`, `role_permissions`, and `employees` tables
    - `roles`: `id`, `name` TEXT NOT NULL UNIQUE, `description` TEXT, `created_at`, `updated_at`, `deleted_at`
    - `permissions`: `id`, `group_key` TEXT NOT NULL, `perm_key` TEXT NOT NULL, `label` TEXT NOT NULL, UNIQUE(group_key, perm_key)
    - `role_permissions`: `role_id` FK → roles ON DELETE CASCADE, `permission_id` FK → permissions ON DELETE CASCADE, PRIMARY KEY (role_id, permission_id)
    - `employees`: `id`, `code` TEXT UNIQUE, `name` TEXT NOT NULL, `phone` TEXT UNIQUE, `pin` TEXT, `role_id` FK → roles ON DELETE SET NULL, `branch` TEXT NOT NULL DEFAULT 'Main', `avatar_url` TEXT, `is_active` INTEGER NOT NULL DEFAULT 1 CHECK in (0,1), `created_at`, `updated_at`, `deleted_at`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 2.8 Create all inventory tables: `suppliers`, `stock_imports`, `stock_import_items`, `stock_exports`, `stock_export_items`, `stock_audits`, `stock_audit_items` (with `diff_qty` GENERATED ALWAYS AS (actual_qty - system_qty) STORED), `stock_transfers`, `stock_transfer_items`, `stock_logs`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_
  - [x] 2.9 Create `fund_accounts`, `finance_categories`, and `vouchers` tables
    - `vouchers` must include CHECK: `(direction != 'transfer' OR to_fund_account_id IS NOT NULL)` to enforce Requirement 7.6
    - `finance_categories` must have UNIQUE(name, direction)
    - _Requirements: 7.1, 7.2, 7.3, 7.6_
  - [x] 2.10 Create `settings` table: `key` TEXT PRIMARY KEY, `value` TEXT NOT NULL, `updated_at` TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    - _Requirements: 8.1_
  - [x] 2.11 Create `shifts` table and add `shift_id` FK column to `orders` via `ALTER TABLE`
    - `shifts`: `id`, `employee_id` FK → employees ON DELETE SET NULL, `opened_at` TEXT NOT NULL DEFAULT (datetime('now','localtime')), `closed_at` TEXT, `opening_cash` INTEGER NOT NULL DEFAULT 0 CHECK >= 0, `closing_cash` INTEGER, `note` TEXT, `status` TEXT NOT NULL DEFAULT 'open' CHECK in ('open','closed')
    - `ALTER TABLE orders ADD COLUMN shift_id INTEGER REFERENCES shifts(id) ON DELETE SET NULL`
    - _Requirements: 9.1, 9.3_
  - [x] 2.12 Extend `orders` table with all new columns via `ALTER TABLE`
    - Add: `code` TEXT UNIQUE, `type` TEXT NOT NULL DEFAULT 'dine-in' CHECK in ('dine-in','takeaway','delivery'), `status` TEXT NOT NULL DEFAULT 'pending' CHECK in ('pending','processing','completed','cancelled','returned'), `table_id` FK → tables ON DELETE SET NULL, `customer_id` FK → customers ON DELETE SET NULL, `employee_id` FK → employees ON DELETE SET NULL, `discount_amount` INTEGER NOT NULL DEFAULT 0 CHECK >= 0, `promotion_amount` INTEGER NOT NULL DEFAULT 0 CHECK >= 0, `extra_fee` INTEGER NOT NULL DEFAULT 0 CHECK >= 0, `subtotal` INTEGER NOT NULL DEFAULT 0 CHECK >= 0, `cash_received` INTEGER, `change_amount` INTEGER, `payment_method` TEXT CHECK in ('cash','transfer','card','wallet','point') or NULL, `completed_at` TEXT, `cancelled_at` TEXT, `updated_at` TEXT
    - Note: `id`, `total`, `note`, `created_at` already exist in `createSchema` — do NOT add them again
    - _Requirements: 3.1_
  - [x] 2.13 Extend `order_items` table with new columns via `ALTER TABLE`; create `order_item_addons` table
    - `ALTER TABLE order_items ADD COLUMN note TEXT`
    - `ALTER TABLE order_items ADD COLUMN discount_amount INTEGER NOT NULL DEFAULT 0 CHECK >= 0`
    - `ALTER TABLE order_items ADD COLUMN addon_total INTEGER NOT NULL DEFAULT 0 CHECK >= 0`
    - Note: `line_total` already exists — do NOT add it again
    - `order_item_addons`: `id`, `order_item_id` FK → order_items ON DELETE CASCADE, `addon_id` FK → addons ON DELETE RESTRICT, `quantity` INTEGER NOT NULL DEFAULT 1 CHECK > 0, `unit_price` INTEGER NOT NULL CHECK >= 0, `line_total` INTEGER NOT NULL CHECK >= 0
    - _Requirements: 3.2, 3.3_

- [x] 3. Create all indexes
  - [x] 3.1 Add catalog indexes (use `CREATE INDEX IF NOT EXISTS` throughout)
    - `idx_products_active` on `products(is_active) WHERE deleted_at IS NULL`
    - `idx_products_barcode` on `products(barcode) WHERE barcode IS NOT NULL`
    - Note: `idx_products_category` and `idx_orders_createdat` and `idx_orderitems_orderid` already exist in `createSchema` — skip them
    - _Requirements: 1.7_
  - [x] 3.2 Add tables/areas index: `idx_tables_area` on `tables(area_id) WHERE deleted_at IS NULL`
    - _Requirements: 2.4_
  - [x] 3.3 Add orders indexes: `idx_orders_status` on `orders(status)`, `idx_orders_table` on `orders(table_id) WHERE table_id IS NOT NULL`, `idx_orders_customer` on `orders(customer_id) WHERE customer_id IS NOT NULL`, `idx_orders_employee` on `orders(employee_id) WHERE employee_id IS NOT NULL`
    - Note: `idx_orders_createdat` already exists in `createSchema`
    - _Requirements: 3.4_
  - [x] 3.4 Add customer indexes: `idx_customers_phone` on `customers(phone) WHERE deleted_at IS NULL`, `idx_customers_group` on `customers(group_id) WHERE deleted_at IS NULL`
    - _Requirements: 4.4_
  - [x] 3.5 Add employee indexes: `idx_employees_role` on `employees(role_id) WHERE deleted_at IS NULL`, `idx_employees_phone` on `employees(phone) WHERE deleted_at IS NULL`
    - _Requirements: 5.6_
  - [x] 3.6 Add inventory indexes: `idx_stocklogs_product` on `stock_logs(product_id, created_at DESC)`, `idx_stocklogs_source` on `stock_logs(source_type, source_id)`, `idx_stockimports_supplier` on `stock_imports(supplier_id)`, `idx_stockimports_status` on `stock_imports(status)`
    - _Requirements: 6.11_
  - [x] 3.7 Add finance indexes: `idx_vouchers_direction` on `vouchers(direction)`, `idx_vouchers_fund` on `vouchers(fund_account_id)`, `idx_vouchers_voucherat` on `vouchers(voucher_at DESC)`, `idx_vouchers_employee` on `vouchers(employee_id)`
    - _Requirements: 7.5_
  - [x] 3.8 Add shifts index: `idx_shifts_employee` on `shifts(employee_id, opened_at DESC)`
    - _Requirements: 9.2_

- [x] 4. Implement all triggers
  - [x] 4.1 Add `trg_products_code` AFTER INSERT on `products`: `UPDATE products SET code = 'SP' || printf('%05d', NEW.id) WHERE id = NEW.id AND NEW.code IS NULL`
    - _Requirements: 1.8_
  - [x] 4.2 Add `trg_orders_code` AFTER INSERT on `orders`: set `code = 'HD' || printf('%05d', NEW.id)` when `NEW.code IS NULL`
    - _Requirements: 3.5_
  - [x] 4.3 Add `trg_orders_completed_at` AFTER UPDATE on `orders`: set `completed_at = datetime('now','localtime')` when `NEW.status = 'completed' AND OLD.status != 'completed'`
    - _Requirements: 3.6_
  - [x] 4.4 Add `trg_orders_cancelled_at` AFTER UPDATE on `orders`: set `cancelled_at = datetime('now','localtime')` when `NEW.status = 'cancelled' AND OLD.status != 'cancelled'`
    - _Requirements: 3.7_
  - [x] 4.5 Add `trg_customers_code` AFTER INSERT on `customers`: set `code = 'KH' || printf('%05d', NEW.id)` when `NEW.code IS NULL`
    - _Requirements: 4.3_
  - [x] 4.6 Add `trg_employees_code` AFTER INSERT on `employees`: set `code = 'NV' || printf('%05d', NEW.id)` when `NEW.code IS NULL`
    - _Requirements: 5.5_
  - [x] 4.7 Add inventory document code triggers:
    - `trg_stock_imports_code`: `NK` + printf('%05d', id) when code IS NULL
    - `trg_stock_exports_code`: `XK` + printf('%05d', id) when code IS NULL
    - `trg_stock_audits_code`: `KK` + printf('%05d', id) when code IS NULL
    - `trg_stock_transfers_code`: `DC` + printf('%05d', id) when code IS NULL
    - _Requirements: 6.12_
  - [x] 4.8 Add `trg_vouchers_code` AFTER INSERT on `vouchers`: set code to `PT`/`PC`/`PCT` + printf('%05d', id) based on direction when `NEW.code IS NULL`
    - _Requirements: 7.4_
  - [x] 4.9 Add `trg_settings_updated_at` AFTER UPDATE on `settings`: set `updated_at = datetime('now','localtime')`
    - _Requirements: 8.3_
  - [x] 4.10 Add `trg_*_updated_at` AFTER UPDATE triggers for all tables with `updated_at`: `categories`, `products`, `addons`, `areas`, `tables`, `customer_groups`, `customers`, `roles`, `employees`, `suppliers`, `stock_imports`, `stock_exports`, `stock_audits`, `stock_transfers`, `fund_accounts`, `finance_categories`, `vouchers`, `orders`
    - Each trigger: `UPDATE <table> SET updated_at = datetime('now','localtime') WHERE id = NEW.id`
    - _Requirements: 10.10_

- [x] 5. Implement settings seeding
  - [x] 5.1 Add `seedDefaults(db: Database.Database): void` function that inserts all 22 default settings keys using `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)` so it is safe to call on every startup
    - Keys and default values to seed (all values stored as TEXT per Requirement 10.7):
      1. `store.name` → `''`
      2. `store.address` → `''`
      3. `store.phone` → `''`
      4. `store.email` → `''`
      5. `store.wifi` → `''`
      6. `sales.allowNegativeStock` → `'false'`
      7. `sales.showImages` → `'true'`
      8. `sales.showConfirmDialog` → `'true'`
      9. `sales.staffRequired` → `'false'`
      10. `sales.fastCheckout` → `'false'`
      11. `sales.autoPrint` → `'false'`
      12. `sales.autoFinish` → `'false'`
      13. `payment.cash` → `'true'`
      14. `payment.transfer` → `'true'`
      15. `payment.card` → `'false'`
      16. `payment.wallet` → `'false'`
      17. `payment.point` → `'false'`
      18. `display.text` → `''`
      19. `display.website` → `''`
      20. `display.showOrderInfo` → `'true'`
      21. `loyalty.pointsPerVnd` → `'1000'`
      22. `loyalty.pointValue` → `'100'`
    - _Requirements: 8.2_

- [x] 6. Set up test infrastructure
  - [x] 6.1 Install `fast-check` dev dependency if not already present; confirm `vitest` and `better-sqlite3` are available; add a `test` script to `package.json` if missing
    - _Requirements: 10.1, 10.2_
  - [x] 6.2 Create `electron/db.test.ts` with a `createTestDb()` helper that builds a fresh in-memory SQLite DB by calling `applyPragmas`, `createSchema`, `runMigrations`, and `seedDefaults` in order — this helper is reused by all tests below
    - _Requirements: 10.1, 10.2, 10.5_

- [x] 7. Write property-based tests (Property 1: CHECK constraints reject invalid rows)
  - [x] 7.1 Write property test: for any product row with `price < 0`, `vat > 100`, or `type` not in ('goods','service','combo','ingredient'), insertion SHALL throw a SQLite constraint error
    - _Requirements: 1.2_
  - [x] 7.2 Write property test: for any customer row with `loyalty_points < 0` or `total_revenue < 0`, insertion SHALL throw
    - _Requirements: 4.2_
  - [x] 7.3 Write property test: for any `loyalty_transactions` row with `balance_after < 0`, insertion SHALL throw
    - _Requirements: 4.5_
  - [x] 7.4 Write property test: for any `tables` row with `status` not in ('empty','occupied','ordered'), insertion SHALL throw
    - _Requirements: 2.2_

- [x] 8. Write property-based tests (Property 2: UNIQUE constraints prevent duplicates)
  - [x] 8.1 Write property test: inserting two `tables` rows with the same `(name, area_id)` SHALL fail with a UNIQUE constraint error
    - _Requirements: 2.3_
  - [x] 8.2 Write property test: inserting two `permissions` rows with the same `(group_key, perm_key)` SHALL fail
    - _Requirements: 5.2_
  - [x] 8.3 Write property test: inserting two `product_addons` rows with the same `(product_id, addon_id)` SHALL fail
    - _Requirements: 1.5_

- [x] 9. Write property-based tests (Property 3: Auto-generated codes)
  - [x] 9.1 Write property test: for any N products inserted with NULL code, each resulting code SHALL equal `'SP' || printf('%05d', id)`
    - _Requirements: 1.8_
  - [x] 9.2 Write property test: for any N orders inserted with NULL code, each resulting code SHALL equal `'HD' || printf('%05d', id)`
    - _Requirements: 3.5_
  - [x] 9.3 Write property test: for any N customers inserted with NULL code, each resulting code SHALL equal `'KH' || printf('%05d', id)`
    - _Requirements: 4.3_
  - [x] 9.4 Write property test: for any N employees inserted with NULL code, each resulting code SHALL equal `'NV' || printf('%05d', id)`
    - _Requirements: 5.5_
  - [x] 9.5 Write property test: for any voucher inserted with NULL code, the code prefix SHALL match direction: `PT` for income, `PC` for expense, `PCT` for transfer
    - _Requirements: 7.4_

- [x] 10. Write property-based tests (Property 4: Status timestamps)
  - [x] 10.1 Write property test: for any order, after `UPDATE orders SET status='completed'`, `completed_at` SHALL be non-null and a valid `YYYY-MM-DD HH:MM:SS` string
    - _Requirements: 3.6_
  - [x] 10.2 Write property test: for any order, after `UPDATE orders SET status='cancelled'`, `cancelled_at` SHALL be non-null and a valid `YYYY-MM-DD HH:MM:SS` string
    - _Requirements: 3.7_

- [x] 11. Write property-based tests (Property 5: Soft-delete preserves rows)
  - [x] 11.1 Write property test: for any row in `products`, `customers`, `employees`, after setting `deleted_at` to a non-null timestamp, the row SHALL still be retrievable by primary key (SELECT by id returns the row)
    - _Requirements: 10.9_

- [x] 12. Write property-based tests (Property 6: updated_at refresh)
  - [x] 12.1 Write property test: for any row in `products`, `orders`, `customers`, `employees`, after any UPDATE, the new `updated_at` value SHALL be >= the previous `updated_at` value
    - _Requirements: 10.10_

- [x] 13. Write property-based tests (Property 7: diff_qty invariant)
  - [x] 13.1 Write property test: for any `stock_audit_items` row with arbitrary `system_qty` and `actual_qty >= 0`, `diff_qty` SHALL equal `actual_qty - system_qty`
    - _Requirements: 6.7_

- [x] 14. Write property-based tests (Property 8: Transfer voucher constraint)
  - [x] 14.1 Write property test: for any voucher with `direction='transfer'` and `to_fund_account_id IS NULL`, insertion SHALL throw a CHECK constraint error
    - _Requirements: 7.6_
  - [x] 14.2 Write property test: for any voucher with `direction` in ('income','expense'), insertion SHALL succeed regardless of `to_fund_account_id` value
    - _Requirements: 7.6_

- [x] 15. Write property-based tests (Property 9: Migration idempotency)
  - [x] 15.1 Write property test: running `initDb()` on a fresh in-memory DB SHALL result in `PRAGMA user_version = 2` and all expected tables present in `sqlite_master`
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 15.2 Write property test: running `applyPragmas` + `createSchema` + `runMigrations` + `seedDefaults` twice on the same in-memory DB SHALL leave `user_version` and table count unchanged
    - _Requirements: 10.2, 10.4_

- [x] 16. Write unit/example tests
  - [x] 16.1 Write smoke test: after `initDb()` on an in-memory DB, all 33 tables SHALL exist in `sqlite_master` (categories, products, addons, product_addons, combo_items, areas, tables, customer_groups, customers, loyalty_transactions, roles, permissions, role_permissions, employees, suppliers, stock_imports, stock_import_items, stock_exports, stock_export_items, stock_audits, stock_audit_items, stock_transfers, stock_transfer_items, stock_logs, fund_accounts, finance_categories, vouchers, settings, shifts, orders, order_items, order_item_addons, and all named indexes)
    - _Requirements: 10.3_
  - [-] 16.2 Write example test: after `seedDefaults()`, all 22 settings keys SHALL be present in the `settings` table with their correct default values
    - _Requirements: 8.2_
  - [ ]\* 16.3 Write example test: inserting a product mid-migration and then rolling back (simulated via a thrown error inside the transaction) SHALL leave `user_version` unchanged at the pre-migration value
    - _Requirements: 10.4_
  - [ ]\* 16.4 Write example test: `ON DELETE CASCADE` removes `order_items` rows when the parent `orders` row is deleted
    - _Requirements: 3.2_
  - [ ]\* 16.5 Write example test: `ON DELETE RESTRICT` blocks deletion of a `products` row that has `stock_import_items` referencing it
    - _Requirements: 6.3_
  - [ ]\* 16.6 Write example test: `ON DELETE SET NULL` nullifies `orders.customer_id` when the referenced `customers` row is hard-deleted
    - _Requirements: 3.1_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All indexes use `CREATE INDEX IF NOT EXISTS` to be safe across re-runs
- `idx_products_category`, `idx_orders_createdat`, and `idx_orderitems_orderid` already exist in `createSchema` — migration v2 must not recreate them
- `orders` already has `id`, `total`, `note`, `created_at` — migration v2 must not add these columns again
- `order_items` already has `id`, `order_id`, `product_id`, `quantity`, `unit_price`, `line_total` — migration v2 must not add these columns again
- `seedDefaults` uses `INSERT OR IGNORE` so it is safe to call on every app startup without duplicating rows
- All monetary values are stored as INTEGER (VND, no decimals); all booleans as INTEGER CHECK in (0,1); all timestamps as TEXT in `datetime('now','localtime')` format
