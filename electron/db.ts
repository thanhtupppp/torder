import path from "node:path";
import crypto from "node:crypto";
import { app } from "electron";
import Database from "better-sqlite3";
import type {
  CreateEmployeePayload,
  CreateOrderPayload,
  EmployeeRecord,
  EmployeeRoleKey,
  Product,
  UpdateEmployeePayload,
} from "./types";

let db: Database.Database | null = null;

// ── Path ──────────────────────────────────────────────────────────────────────

function getDbPath(): string {
  return path.join(app.getPath("userData"), "posiorder.sqlite");
}

// ── Pragmas ───────────────────────────────────────────────────────────────────

export function applyPragmas(database: Database.Database): void {
  database.pragma("journal_mode = WAL");
  database.pragma("synchronous = NORMAL"); // safe with WAL [web:16]
  database.pragma("foreign_keys = ON"); // enforce FK constraints
  database.pragma("cache_size = -32000"); // 32MB page cache
  database.pragma("temp_store = MEMORY");
  database.pragma("mmap_size = 134217728"); // 128MB mmap
  database.pragma("busy_timeout = 5000"); // wait 5s instead of crash
}

// ── Migrations ─────────────────────────────────────────────────────────────────

export function runMigrations(database: Database.Database): void {
  const version = database.pragma("user_version", { simple: true }) as number;

  if (version < 1) {
    database.exec(`
      ALTER TABLE products ADD COLUMN created_at TEXT
        NOT NULL DEFAULT (datetime('now','localtime'));
      ALTER TABLE products ADD COLUMN updated_at TEXT
        NOT NULL DEFAULT (datetime('now','localtime'));
      ALTER TABLE products ADD COLUMN deleted_at TEXT;
    `);
    database.pragma("user_version = 1");
  }

  if (version < 2) {
    const migrate = database.transaction(() => {
      database.exec(`
        -- ── 2.2 categories ────────────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS categories (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          name       TEXT    NOT NULL UNIQUE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          updated_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          deleted_at TEXT
        );

        -- ── 2.3 Extend products ───────────────────────────────────────────────
        -- Note: SQLite does not allow ADD COLUMN with UNIQUE; index added below
        ALTER TABLE products ADD COLUMN code        TEXT;
        ALTER TABLE products ADD COLUMN barcode     TEXT;
        ALTER TABLE products ADD COLUMN unit        TEXT NOT NULL DEFAULT 'cái';
        ALTER TABLE products ADD COLUMN type        TEXT NOT NULL DEFAULT 'goods'
          CHECK(type IN ('goods','service','combo','ingredient'));
        ALTER TABLE products ADD COLUMN cost        INTEGER NOT NULL DEFAULT 0 CHECK(cost >= 0);
        ALTER TABLE products ADD COLUMN vat         INTEGER NOT NULL DEFAULT 0 CHECK(vat BETWEEN 0 AND 100);
        ALTER TABLE products ADD COLUMN stock       INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE products ADD COLUMN min_stock   INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE products ADD COLUMN max_stock   INTEGER;
        ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
        ALTER TABLE products ADD COLUMN is_active   INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1));
        ALTER TABLE products ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0 CHECK(is_favorite IN (0,1));
        ALTER TABLE products ADD COLUMN image_url   TEXT;

        -- ── 2.4 addons, product_addons, combo_items ───────────────────────────
        CREATE TABLE IF NOT EXISTS addons (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          name        TEXT    NOT NULL,
          price       INTEGER NOT NULL DEFAULT 0 CHECK(price >= 0),
          category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
          created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          updated_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          deleted_at  TEXT
        );

        CREATE TABLE IF NOT EXISTS product_addons (
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          addon_id   INTEGER NOT NULL REFERENCES addons(id)   ON DELETE CASCADE,
          PRIMARY KEY (product_id, addon_id)
        );

        CREATE TABLE IF NOT EXISTS combo_items (
          combo_product_id     INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          component_product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
          quantity             INTEGER NOT NULL CHECK(quantity > 0),
          PRIMARY KEY (combo_product_id, component_product_id)
        );

        -- ── 2.5 areas, tables ─────────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS areas (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          name       TEXT    NOT NULL UNIQUE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          note       TEXT,
          created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          updated_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          deleted_at TEXT
        );

        CREATE TABLE IF NOT EXISTS tables (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          name       TEXT    NOT NULL,
          area_id    INTEGER NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
          capacity   INTEGER NOT NULL DEFAULT 4 CHECK(capacity > 0),
          status     TEXT    NOT NULL DEFAULT 'empty'
                       CHECK(status IN ('empty','occupied','ordered')),
          note       TEXT,
          created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          updated_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          deleted_at TEXT,
          UNIQUE(name, area_id)
        );

        -- ── 2.6 customer_groups, customers, loyalty_transactions ──────────────
        CREATE TABLE IF NOT EXISTS customer_groups (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          name            TEXT    NOT NULL UNIQUE,
          point_rate      REAL    NOT NULL DEFAULT 1.0 CHECK(point_rate > 0),
          condition_type  TEXT    CHECK(condition_type IN ('revenue','order_count')),
          condition_value INTEGER,
          auto_upgrade    INTEGER NOT NULL DEFAULT 0 CHECK(auto_upgrade IN (0,1)),
          note            TEXT,
          created_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          updated_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          deleted_at      TEXT
        );

        CREATE TABLE IF NOT EXISTS customers (
          id             INTEGER PRIMARY KEY AUTOINCREMENT,
          code           TEXT    UNIQUE,
          name           TEXT    NOT NULL,
          phone          TEXT    UNIQUE,
          email          TEXT,
          dob            TEXT,
          address        TEXT,
          group_id       INTEGER REFERENCES customer_groups(id) ON DELETE SET NULL,
          tax_code       TEXT,
          invoice_type   TEXT,
          loyalty_points INTEGER NOT NULL DEFAULT 0 CHECK(loyalty_points >= 0),
          total_revenue  INTEGER NOT NULL DEFAULT 0 CHECK(total_revenue >= 0),
          total_orders   INTEGER NOT NULL DEFAULT 0 CHECK(total_orders >= 0),
          note           TEXT,
          created_at     TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          updated_at     TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          deleted_at     TEXT
        );

        CREATE TABLE IF NOT EXISTS loyalty_transactions (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id   INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          order_id      INTEGER REFERENCES orders(id) ON DELETE SET NULL,
          delta         INTEGER NOT NULL,
          balance_after INTEGER NOT NULL CHECK(balance_after >= 0),
          note          TEXT,
          created_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
        );

        -- ── 2.7 roles, permissions, role_permissions, employees ───────────────
        CREATE TABLE IF NOT EXISTS roles (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          name        TEXT    NOT NULL UNIQUE,
          description TEXT,
          created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          updated_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          deleted_at  TEXT
        );

        CREATE TABLE IF NOT EXISTS permissions (
          id        INTEGER PRIMARY KEY AUTOINCREMENT,
          group_key TEXT NOT NULL,
          perm_key  TEXT NOT NULL,
          label     TEXT NOT NULL,
          UNIQUE(group_key, perm_key)
        );

        CREATE TABLE IF NOT EXISTS role_permissions (
          role_id       INTEGER NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
          permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
          PRIMARY KEY (role_id, permission_id)
        );

        CREATE TABLE IF NOT EXISTS employees (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          code          TEXT    UNIQUE,
          name          TEXT    NOT NULL,
          phone         TEXT    UNIQUE,
          pin           TEXT,
          password_hash TEXT,
          role_id       INTEGER REFERENCES roles(id) ON DELETE SET NULL,
          branch        TEXT    NOT NULL DEFAULT 'Main',
          avatar_url    TEXT,
          is_active     INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
          created_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          updated_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          deleted_at    TEXT
        );

        -- ── 2.8 Inventory tables ──────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS suppliers (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          code       TEXT    UNIQUE,
          name       TEXT    NOT NULL,
          phone      TEXT,
          email      TEXT,
          address    TEXT,
          note       TEXT,
          created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          updated_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          deleted_at TEXT
        );

        CREATE TABLE IF NOT EXISTS stock_imports (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          code         TEXT    UNIQUE,
          supplier_id  INTEGER REFERENCES suppliers(id)  ON DELETE SET NULL,
          employee_id  INTEGER REFERENCES employees(id)  ON DELETE SET NULL,
          status       TEXT    NOT NULL DEFAULT 'draft'
                         CHECK(status IN ('draft','confirmed','cancelled')),
          total_cost   INTEGER NOT NULL DEFAULT 0 CHECK(total_cost >= 0),
          note         TEXT,
          confirmed_at TEXT,
          created_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          updated_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS stock_import_items (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          import_id  INTEGER NOT NULL REFERENCES stock_imports(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id)      ON DELETE RESTRICT,
          quantity   INTEGER NOT NULL CHECK(quantity > 0),
          unit_cost  INTEGER NOT NULL CHECK(unit_cost >= 0),
          line_total INTEGER NOT NULL CHECK(line_total >= 0)
        );

        CREATE TABLE IF NOT EXISTS stock_exports (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          code         TEXT    UNIQUE,
          employee_id  INTEGER REFERENCES employees(id) ON DELETE SET NULL,
          reason       TEXT,
          status       TEXT    NOT NULL DEFAULT 'draft'
                         CHECK(status IN ('draft','confirmed','cancelled')),
          note         TEXT,
          confirmed_at TEXT,
          created_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          updated_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS stock_export_items (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          export_id  INTEGER NOT NULL REFERENCES stock_exports(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id)      ON DELETE RESTRICT,
          quantity   INTEGER NOT NULL CHECK(quantity > 0),
          unit_cost  INTEGER NOT NULL CHECK(unit_cost >= 0),
          line_total INTEGER NOT NULL CHECK(line_total >= 0)
        );

        CREATE TABLE IF NOT EXISTS stock_audits (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          code         TEXT    UNIQUE,
          employee_id  INTEGER REFERENCES employees(id) ON DELETE SET NULL,
          status       TEXT    NOT NULL DEFAULT 'draft'
                         CHECK(status IN ('draft','balanced','cancelled')),
          note         TEXT,
          balanced_at  TEXT,
          created_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          updated_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS stock_audit_items (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          audit_id   INTEGER NOT NULL REFERENCES stock_audits(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id)     ON DELETE RESTRICT,
          system_qty INTEGER NOT NULL DEFAULT 0,
          actual_qty INTEGER NOT NULL DEFAULT 0 CHECK(actual_qty >= 0),
          diff_qty   INTEGER GENERATED ALWAYS AS (actual_qty - system_qty) STORED,
          unit_cost  INTEGER NOT NULL DEFAULT 0 CHECK(unit_cost >= 0)
        );

        CREATE TABLE IF NOT EXISTS stock_transfers (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          code          TEXT    UNIQUE,
          from_location TEXT    NOT NULL,
          to_location   TEXT    NOT NULL,
          employee_id   INTEGER REFERENCES employees(id) ON DELETE SET NULL,
          status        TEXT    NOT NULL DEFAULT 'draft'
                          CHECK(status IN ('draft','confirmed','cancelled')),
          note          TEXT,
          confirmed_at  TEXT,
          created_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          updated_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS stock_transfer_items (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          transfer_id INTEGER NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
          product_id  INTEGER NOT NULL REFERENCES products(id)        ON DELETE RESTRICT,
          quantity    INTEGER NOT NULL CHECK(quantity > 0)
        );

        CREATE TABLE IF NOT EXISTS stock_logs (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          delta         INTEGER NOT NULL,
          balance_after INTEGER NOT NULL,
          source_type   TEXT    NOT NULL
                          CHECK(source_type IN ('import','export','audit','transfer','sale','manual')),
          source_id     INTEGER,
          note          TEXT,
          created_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
        );

        -- ── 2.9 fund_accounts, finance_categories, vouchers ───────────────────
        CREATE TABLE IF NOT EXISTS fund_accounts (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          name       TEXT    NOT NULL UNIQUE,
          type       TEXT    NOT NULL CHECK(type IN ('cash','bank','wallet')),
          balance    INTEGER NOT NULL DEFAULT 0,
          is_active  INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
          created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          updated_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          deleted_at TEXT
        );

        CREATE TABLE IF NOT EXISTS finance_categories (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          name       TEXT    NOT NULL,
          direction  TEXT    NOT NULL CHECK(direction IN ('income','expense')),
          note       TEXT,
          created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          updated_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          deleted_at TEXT,
          UNIQUE(name, direction)
        );

        CREATE TABLE IF NOT EXISTS vouchers (
          id                 INTEGER PRIMARY KEY AUTOINCREMENT,
          code               TEXT    UNIQUE,
          direction          TEXT    NOT NULL CHECK(direction IN ('income','expense','transfer')),
          category_id        INTEGER REFERENCES finance_categories(id) ON DELETE SET NULL,
          fund_account_id    INTEGER NOT NULL REFERENCES fund_accounts(id) ON DELETE RESTRICT,
          to_fund_account_id INTEGER REFERENCES fund_accounts(id) ON DELETE RESTRICT,
          amount             INTEGER NOT NULL CHECK(amount > 0),
          person_name        TEXT,
          employee_id        INTEGER REFERENCES employees(id) ON DELETE SET NULL,
          accounting         INTEGER NOT NULL DEFAULT 1 CHECK(accounting IN (0,1)),
          note               TEXT,
          voucher_at         TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          created_at         TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          updated_at         TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          CHECK(direction != 'transfer' OR to_fund_account_id IS NOT NULL)
        );

        -- ── 2.10 settings ─────────────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS settings (
          key        TEXT PRIMARY KEY,
          value      TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
        );

        -- ── 2.11 shifts + orders.shift_id ─────────────────────────────────────
        CREATE TABLE IF NOT EXISTS shifts (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id  INTEGER REFERENCES employees(id) ON DELETE SET NULL,
          opened_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
          closed_at    TEXT,
          opening_cash INTEGER NOT NULL DEFAULT 0 CHECK(opening_cash >= 0),
          closing_cash INTEGER,
          note         TEXT,
          status       TEXT    NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed'))
        );

        ALTER TABLE orders ADD COLUMN shift_id INTEGER REFERENCES shifts(id) ON DELETE SET NULL;

        -- ── 2.12 Extend orders ────────────────────────────────────────────────
        -- Note: SQLite does not allow ADD COLUMN with UNIQUE; index added below
        ALTER TABLE orders ADD COLUMN code             TEXT;
        ALTER TABLE orders ADD COLUMN type             TEXT NOT NULL DEFAULT 'dine-in'
          CHECK(type IN ('dine-in','takeaway','delivery'));
        ALTER TABLE orders ADD COLUMN status           TEXT NOT NULL DEFAULT 'pending'
          CHECK(status IN ('pending','processing','completed','cancelled','returned'));
        ALTER TABLE orders ADD COLUMN table_id         INTEGER REFERENCES tables(id)    ON DELETE SET NULL;
        ALTER TABLE orders ADD COLUMN customer_id      INTEGER REFERENCES customers(id) ON DELETE SET NULL;
        ALTER TABLE orders ADD COLUMN employee_id      INTEGER REFERENCES employees(id) ON DELETE SET NULL;
        ALTER TABLE orders ADD COLUMN discount_amount  INTEGER NOT NULL DEFAULT 0 CHECK(discount_amount >= 0);
        ALTER TABLE orders ADD COLUMN promotion_amount INTEGER NOT NULL DEFAULT 0 CHECK(promotion_amount >= 0);
        ALTER TABLE orders ADD COLUMN extra_fee        INTEGER NOT NULL DEFAULT 0 CHECK(extra_fee >= 0);
        ALTER TABLE orders ADD COLUMN subtotal         INTEGER NOT NULL DEFAULT 0 CHECK(subtotal >= 0);
        ALTER TABLE orders ADD COLUMN cash_received    INTEGER;
        ALTER TABLE orders ADD COLUMN change_amount    INTEGER;
        ALTER TABLE orders ADD COLUMN payment_method   TEXT
          CHECK(payment_method IN ('cash','transfer','card','wallet','point'));
        ALTER TABLE orders ADD COLUMN completed_at     TEXT;
        ALTER TABLE orders ADD COLUMN cancelled_at     TEXT;
        ALTER TABLE orders ADD COLUMN updated_at       TEXT;

        -- ── 2.13 Extend order_items + order_item_addons ───────────────────────
        ALTER TABLE order_items ADD COLUMN note            TEXT;
        ALTER TABLE order_items ADD COLUMN discount_amount INTEGER NOT NULL DEFAULT 0 CHECK(discount_amount >= 0);
        ALTER TABLE order_items ADD COLUMN addon_total     INTEGER NOT NULL DEFAULT 0 CHECK(addon_total >= 0);

        CREATE TABLE IF NOT EXISTS order_item_addons (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
          addon_id      INTEGER NOT NULL REFERENCES addons(id)      ON DELETE RESTRICT,
          quantity      INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
          unit_price    INTEGER NOT NULL CHECK(unit_price >= 0),
          line_total    INTEGER NOT NULL CHECK(line_total >= 0)
        );

        -- ── 3.1 Catalog indexes ───────────────────────────────────────────────
        CREATE UNIQUE INDEX IF NOT EXISTS idx_products_code
          ON products(code) WHERE code IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_products_active
          ON products(is_active) WHERE deleted_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_products_barcode
          ON products(barcode) WHERE barcode IS NOT NULL;

        -- ── 3.2 Tables/areas index ────────────────────────────────────────────
        CREATE INDEX IF NOT EXISTS idx_tables_area
          ON tables(area_id) WHERE deleted_at IS NULL;

        -- ── 3.3 Orders indexes ────────────────────────────────────────────────
        CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_code
          ON orders(code) WHERE code IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_orders_status
          ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_table
          ON orders(table_id) WHERE table_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_orders_customer
          ON orders(customer_id) WHERE customer_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_orders_employee
          ON orders(employee_id) WHERE employee_id IS NOT NULL;

        -- ── 3.4 Customer indexes ──────────────────────────────────────────────
        CREATE INDEX IF NOT EXISTS idx_customers_phone
          ON customers(phone) WHERE deleted_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_customers_group
          ON customers(group_id) WHERE deleted_at IS NULL;

        -- ── 3.5 Employee indexes ──────────────────────────────────────────────
        CREATE INDEX IF NOT EXISTS idx_employees_role
          ON employees(role_id) WHERE deleted_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_employees_phone
          ON employees(phone) WHERE deleted_at IS NULL;

        -- ── 3.6 Inventory indexes ─────────────────────────────────────────────
        CREATE INDEX IF NOT EXISTS idx_stocklogs_product
          ON stock_logs(product_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_stocklogs_source
          ON stock_logs(source_type, source_id);
        CREATE INDEX IF NOT EXISTS idx_stockimports_supplier
          ON stock_imports(supplier_id);
        CREATE INDEX IF NOT EXISTS idx_stockimports_status
          ON stock_imports(status);

        -- ── 3.7 Finance indexes ───────────────────────────────────────────────
        CREATE INDEX IF NOT EXISTS idx_vouchers_direction
          ON vouchers(direction);
        CREATE INDEX IF NOT EXISTS idx_vouchers_fund
          ON vouchers(fund_account_id);
        CREATE INDEX IF NOT EXISTS idx_vouchers_voucherat
          ON vouchers(voucher_at DESC);
        CREATE INDEX IF NOT EXISTS idx_vouchers_employee
          ON vouchers(employee_id);

        -- ── 3.8 Shifts index ──────────────────────────────────────────────────
        CREATE INDEX IF NOT EXISTS idx_shifts_employee
          ON shifts(employee_id, opened_at DESC);

        -- ── 4.1 trg_products_code ─────────────────────────────────────────────
        CREATE TRIGGER IF NOT EXISTS trg_products_code
        AFTER INSERT ON products
        WHEN NEW.code IS NULL
        BEGIN
          UPDATE products SET code = 'SP' || printf('%05d', NEW.id) WHERE id = NEW.id;
        END;

        -- ── 4.2 trg_orders_code ───────────────────────────────────────────────
        CREATE TRIGGER IF NOT EXISTS trg_orders_code
        AFTER INSERT ON orders
        WHEN NEW.code IS NULL
        BEGIN
          UPDATE orders SET code = 'HD' || printf('%05d', NEW.id) WHERE id = NEW.id;
        END;

        -- ── 4.3 trg_orders_completed_at ───────────────────────────────────────
        CREATE TRIGGER IF NOT EXISTS trg_orders_completed_at
        AFTER UPDATE ON orders
        WHEN NEW.status = 'completed' AND OLD.status != 'completed'
        BEGIN
          UPDATE orders SET completed_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        -- ── 4.4 trg_orders_cancelled_at ───────────────────────────────────────
        CREATE TRIGGER IF NOT EXISTS trg_orders_cancelled_at
        AFTER UPDATE ON orders
        WHEN NEW.status = 'cancelled' AND OLD.status != 'cancelled'
        BEGIN
          UPDATE orders SET cancelled_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        -- ── 4.5 trg_customers_code ────────────────────────────────────────────
        CREATE TRIGGER IF NOT EXISTS trg_customers_code
        AFTER INSERT ON customers
        WHEN NEW.code IS NULL
        BEGIN
          UPDATE customers SET code = 'KH' || printf('%05d', NEW.id) WHERE id = NEW.id;
        END;

        -- ── 4.6 trg_employees_code ────────────────────────────────────────────
        CREATE TRIGGER IF NOT EXISTS trg_employees_code
        AFTER INSERT ON employees
        WHEN NEW.code IS NULL
        BEGIN
          UPDATE employees SET code = 'NV' || printf('%05d', NEW.id) WHERE id = NEW.id;
        END;

        -- ── 4.7 Inventory document code triggers ──────────────────────────────
        CREATE TRIGGER IF NOT EXISTS trg_stock_imports_code
        AFTER INSERT ON stock_imports
        WHEN NEW.code IS NULL
        BEGIN
          UPDATE stock_imports SET code = 'NK' || printf('%05d', NEW.id) WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_stock_exports_code
        AFTER INSERT ON stock_exports
        WHEN NEW.code IS NULL
        BEGIN
          UPDATE stock_exports SET code = 'XK' || printf('%05d', NEW.id) WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_stock_audits_code
        AFTER INSERT ON stock_audits
        WHEN NEW.code IS NULL
        BEGIN
          UPDATE stock_audits SET code = 'KK' || printf('%05d', NEW.id) WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_stock_transfers_code
        AFTER INSERT ON stock_transfers
        WHEN NEW.code IS NULL
        BEGIN
          UPDATE stock_transfers SET code = 'DC' || printf('%05d', NEW.id) WHERE id = NEW.id;
        END;

        -- ── 4.8 trg_vouchers_code ─────────────────────────────────────────────
        CREATE TRIGGER IF NOT EXISTS trg_vouchers_code
        AFTER INSERT ON vouchers
        WHEN NEW.code IS NULL
        BEGIN
          UPDATE vouchers SET code =
            CASE NEW.direction
              WHEN 'income'   THEN 'PT'  || printf('%05d', NEW.id)
              WHEN 'expense'  THEN 'PC'  || printf('%05d', NEW.id)
              WHEN 'transfer' THEN 'PCT' || printf('%05d', NEW.id)
            END
          WHERE id = NEW.id;
        END;

        -- ── 4.9 trg_settings_updated_at ───────────────────────────────────────
        CREATE TRIGGER IF NOT EXISTS trg_settings_updated_at
        AFTER UPDATE ON settings
        BEGIN
          UPDATE settings SET updated_at = datetime('now','localtime') WHERE key = NEW.key;
        END;

        -- ── 4.10 trg_*_updated_at for all tables with updated_at ──────────────
        CREATE TRIGGER IF NOT EXISTS trg_categories_updated_at
        AFTER UPDATE ON categories
        BEGIN
          UPDATE categories SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_products_updated_at
        AFTER UPDATE ON products
        BEGIN
          UPDATE products SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_addons_updated_at
        AFTER UPDATE ON addons
        BEGIN
          UPDATE addons SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_areas_updated_at
        AFTER UPDATE ON areas
        BEGIN
          UPDATE areas SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_tables_updated_at
        AFTER UPDATE ON tables
        BEGIN
          UPDATE tables SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_customer_groups_updated_at
        AFTER UPDATE ON customer_groups
        BEGIN
          UPDATE customer_groups SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_customers_updated_at
        AFTER UPDATE ON customers
        BEGIN
          UPDATE customers SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_roles_updated_at
        AFTER UPDATE ON roles
        BEGIN
          UPDATE roles SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_employees_updated_at
        AFTER UPDATE ON employees
        BEGIN
          UPDATE employees SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_suppliers_updated_at
        AFTER UPDATE ON suppliers
        BEGIN
          UPDATE suppliers SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_stock_imports_updated_at
        AFTER UPDATE ON stock_imports
        BEGIN
          UPDATE stock_imports SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_stock_exports_updated_at
        AFTER UPDATE ON stock_exports
        BEGIN
          UPDATE stock_exports SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_stock_audits_updated_at
        AFTER UPDATE ON stock_audits
        BEGIN
          UPDATE stock_audits SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_stock_transfers_updated_at
        AFTER UPDATE ON stock_transfers
        BEGIN
          UPDATE stock_transfers SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_fund_accounts_updated_at
        AFTER UPDATE ON fund_accounts
        BEGIN
          UPDATE fund_accounts SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_finance_categories_updated_at
        AFTER UPDATE ON finance_categories
        BEGIN
          UPDATE finance_categories SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_vouchers_updated_at
        AFTER UPDATE ON vouchers
        BEGIN
          UPDATE vouchers SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_orders_updated_at
        AFTER UPDATE ON orders
        BEGIN
          UPDATE orders SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
        END;
      `);

      database.pragma("user_version = 2");
    });

    migrate();
  }

  if (version < 3) {
    const employeeColumns = database
      .prepare("PRAGMA table_info(employees)")
      .all() as Array<{ name: string }>;

    const hasPasswordHash = employeeColumns.some(
      (col) => col.name === "password_hash",
    );

    if (!hasPasswordHash) {
      database.exec(`
        ALTER TABLE employees ADD COLUMN password_hash TEXT;
      `);
    }

    database.pragma("user_version = 3");
  }
}

// ── Schema ─────────────────────────────────────────────────────────────────────

export function createSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      price      INTEGER NOT NULL CHECK(price >= 0),
      category   TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      note       TEXT,
      total      INTEGER NOT NULL CHECK(total >= 0)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id    INTEGER NOT NULL,
      product_id  INTEGER NOT NULL,
      quantity    INTEGER NOT NULL CHECK(quantity > 0),
      unit_price  INTEGER NOT NULL CHECK(unit_price >= 0),
      line_total  INTEGER NOT NULL CHECK(line_total >= 0),
      FOREIGN KEY(order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE RESTRICT
    );

    -- ✅ Indexes cho các cột thường query
    CREATE INDEX IF NOT EXISTS idx_orderitems_orderid
      ON order_items(order_id);

    CREATE INDEX IF NOT EXISTS idx_orders_createdat
      ON orders(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_products_category
      ON products(category) WHERE deleted_at IS NULL;
  `);
  // Fresh databases already have the v1 columns in createSchema,
  // so skip migration v1 by setting user_version = 1 if starting from 0.
  const version = database.pragma("user_version", { simple: true }) as number;
  if (version < 1) {
    database.pragma("user_version = 1");
  }
}

// ── Seed ───────────────────────────────────────────────────────────────────────

export function seedDefaults(db: Database.Database): void {
  const insert = db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
  );

  const defaults: [string, string][] = [
    ["app.setup.completed", "false"],
    ["store.name", ""],
    ["store.address", ""],
    ["store.phone", ""],
    ["store.email", ""],
    ["store.wifi", ""],
    ["sales.allowNegativeStock", "false"],
    ["sales.showImages", "true"],
    ["sales.showConfirmDialog", "true"],
    ["sales.staffRequired", "false"],
    ["sales.fastCheckout", "false"],
    ["sales.autoPrint", "false"],
    ["sales.autoFinish", "false"],
    ["payment.cash", "true"],
    ["payment.transfer", "true"],
    ["payment.card", "false"],
    ["payment.wallet", "false"],
    ["payment.point", "false"],
    ["display.text", ""],
    ["display.website", ""],
    ["display.showOrderInfo", "true"],
    ["loyalty.pointsPerVnd", "1000"],
    ["loyalty.pointValue", "100"],
  ];

  const seed = db.transaction(() => {
    for (const [key, value] of defaults) {
      insert.run(key, value);
    }
  });

  seed();
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function initDb(): Database.Database {
  if (db) return db;

  const database = new Database(getDbPath());
  applyPragmas(database);
  createSchema(database);
  runMigrations(database);
  seedDefaults(database);

  db = database;
  return database;
}

export function getDb(): Database.Database {
  if (!db) throw new Error("DB not initialized. Call initDb() first.");
  return db;
}

export function backupDb(): Promise<void> {
  const backupPath = path.join(
    app.getPath("userData"),
    `posiorder-backup-${Date.now()}.sqlite`,
  );
  return getDb()
    .backup(backupPath)
    .then(() => {});
}

export function getInitialSetupState() {
  const database = getDb();

  const setupFlag =
    (
      database
        .prepare(
          "SELECT value FROM settings WHERE key = 'app.setup.completed' LIMIT 1",
        )
        .get() as { value?: string } | undefined
    )?.value === "true";

  const hasAdmin =
    Number(
      (
        database
          .prepare(
            "SELECT COUNT(1) as count FROM employees WHERE deleted_at IS NULL",
          )
          .get() as { count: number }
      ).count,
    ) > 0;

  const storeInfo = database
    .prepare(
      "SELECT key, value FROM settings WHERE key IN ('store.name','store.address','store.phone')",
    )
    .all() as Array<{ key: string; value: string }>;

  const map = Object.fromEntries(storeInfo.map((i) => [i.key, i.value]));
  const hasStoreInfo = Boolean(
    map["store.name"] && map["store.address"] && map["store.phone"],
  );

  return {
    isCompleted: setupFlag,
    hasAdmin,
    hasStoreInfo,
  };
}

function hashPassword(raw: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(raw, salt, 64);
  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;
}

function verifyPassword(raw: string, encoded: string): boolean {
  if (!encoded) return false;

  const parts = encoded.split(":");

  // Backward compatibility for legacy sha256 hashes
  if (parts.length === 1) {
    const legacy = crypto.createHash("sha256").update(raw).digest("hex");
    return legacy === encoded;
  }

  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  const derived = crypto.scryptSync(raw, salt, expected.length);

  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function resolveRoleAndPermissions(roleName: string | null): {
  role: "admin" | "manager" | "cashier";
  permissions: string[];
} {
  const normalized = (roleName ?? "").toLowerCase();

  if (normalized.includes("manager") || normalized.includes("quản lý")) {
    return {
      role: "manager",
      permissions: [
        "app:access",
        "sales:access",
        "tables:access",
        "catalog:access",
        "orders:access",
        "inventory:access",
        "customers:access",
        "reports:access",
      ],
    };
  }

  if (normalized.includes("cashier") || normalized.includes("thu ngân")) {
    return {
      role: "cashier",
      permissions: [
        "app:access",
        "sales:access",
        "tables:access",
        "orders:access",
        "customers:access",
      ],
    };
  }

  return {
    role: "admin",
    permissions: [
      "app:access",
      "sales:access",
      "tables:access",
      "catalog:access",
      "orders:access",
      "inventory:access",
      "reports:access",
      "finance:access",
      "customers:access",
      "employees:access",
      "settings:access",
    ],
  };
}

function roleKeyToName(roleKey: EmployeeRoleKey): string {
  if (roleKey === "admin") return "Chủ cửa hàng";
  if (roleKey === "manager") return "Quản lý";
  return "Thu ngân";
}

function ensureRole(database: Database.Database, roleKey: EmployeeRoleKey): number {
  const roleName = roleKeyToName(roleKey);
  database
    .prepare(
      `INSERT OR IGNORE INTO roles (name, description, created_at, updated_at)
       VALUES (?, ?, datetime('now','localtime'), datetime('now','localtime'))`,
    )
    .run(roleName, `Vai trò ${roleName}`);

  const role = database
    .prepare("SELECT id FROM roles WHERE name = ? LIMIT 1")
    .get(roleName) as { id: number } | undefined;

  if (!role) throw new Error("Không thể xác định vai trò nhân viên.");
  return role.id;
}

export function listEmployees(): EmployeeRecord[] {
  const rows = getDb()
    .prepare(
      `SELECT e.id, e.name, e.phone, e.branch, e.is_active, e.created_at, r.name AS role_name
       FROM employees e
       LEFT JOIN roles r ON r.id = e.role_id
       WHERE e.deleted_at IS NULL
       ORDER BY e.id DESC`,
    )
    .all() as Array<{
    id: number;
    name: string;
    phone: string;
    branch: string;
    is_active: number;
    created_at: string;
    role_name: string | null;
  }>;

  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    phone: row.phone,
    roleKey: resolveRoleAndPermissions(row.role_name).role,
    roleName: row.role_name ?? roleKeyToName("cashier"),
    branch: row.branch,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  }));
}

export function createEmployee(payload: CreateEmployeePayload): number {
  const database = getDb();
  const roleId = ensureRole(database, payload.roleKey);

  const exists = database
    .prepare("SELECT id FROM employees WHERE phone = ? AND deleted_at IS NULL LIMIT 1")
    .get(payload.phone) as { id: number } | undefined;

  if (exists) {
    throw new Error("Số điện thoại đã tồn tại. Vui lòng dùng số khác.");
  }

  const result = database
    .prepare(
      `INSERT INTO employees (name, phone, pin, password_hash, role_id, branch, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now','localtime'), datetime('now','localtime'))`,
    )
    .run(
      payload.name,
      payload.phone,
      payload.pin ?? null,
      hashPassword(payload.password),
      roleId,
      payload.branch,
    );

  return Number(result.lastInsertRowid);
}

export function updateEmployee(payload: UpdateEmployeePayload): void {
  const database = getDb();
  const roleId = ensureRole(database, payload.roleKey);

  const exists = database
    .prepare(
      "SELECT id FROM employees WHERE phone = ? AND id != ? AND deleted_at IS NULL LIMIT 1",
    )
    .get(payload.phone, Number(payload.id)) as { id: number } | undefined;

  if (exists) {
    throw new Error("Số điện thoại đã tồn tại. Vui lòng dùng số khác.");
  }

  if (payload.password && payload.password.trim()) {
    database
      .prepare(
        `UPDATE employees
         SET name = ?, phone = ?, pin = ?, password_hash = ?, role_id = ?, branch = ?,
             is_active = ?, updated_at = datetime('now','localtime')
         WHERE id = ? AND deleted_at IS NULL`,
      )
      .run(
        payload.name,
        payload.phone,
        payload.pin ?? null,
        hashPassword(payload.password),
        roleId,
        payload.branch,
        payload.isActive ? 1 : 0,
        Number(payload.id),
      );
    return;
  }

  database
    .prepare(
      `UPDATE employees
       SET name = ?, phone = ?, pin = ?, role_id = ?, branch = ?,
           is_active = ?, updated_at = datetime('now','localtime')
       WHERE id = ? AND deleted_at IS NULL`,
    )
    .run(
      payload.name,
      payload.phone,
      payload.pin ?? null,
      roleId,
      payload.branch,
      payload.isActive ? 1 : 0,
      Number(payload.id),
    );
}

export function deleteEmployee(id: string): void {
  getDb()
    .prepare(
      `UPDATE employees
       SET deleted_at = datetime('now','localtime'), updated_at = datetime('now','localtime')
       WHERE id = ? AND deleted_at IS NULL`,
    )
    .run(Number(id));
}

export function authenticateEmployee(phone: string, password: string) {
  const row = getDb()
    .prepare(
      `SELECT e.id, e.name, e.password_hash, r.name as role_name
       FROM employees e
       LEFT JOIN roles r ON r.id = e.role_id
       WHERE e.phone = ? AND e.deleted_at IS NULL AND e.is_active = 1
       LIMIT 1`,
    )
    .get(phone) as
    | {
        id: number;
        name: string;
        password_hash: string | null;
        role_name: string | null;
      }
    | undefined;

  if (!row || !row.password_hash) return null;
  if (!verifyPassword(password, row.password_hash)) return null;

  const roleInfo = resolveRoleAndPermissions(row.role_name);

  return {
    userId: String(row.id),
    displayName: row.name,
    role: roleInfo.role,
    permissions: roleInfo.permissions,
    isAuthenticated: true,
  };
}

export function completeInitialSetup(payload: {
  adminName: string;
  adminPhone: string;
  adminPin: string;
  adminPassword: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  storeWifi: string;
}) {
  const database = getDb();

  const tx = database.transaction(() => {
    const now = "datetime('now','localtime')";

    database
      .prepare(
        `INSERT OR IGNORE INTO roles (name, description, created_at, updated_at)
         VALUES ('Chủ cửa hàng', 'Toàn quyền hệ thống', ${now}, ${now})`,
      )
      .run();

    const ownerRole = database
      .prepare("SELECT id FROM roles WHERE name = 'Chủ cửa hàng' LIMIT 1")
      .get() as { id: number };

    const exists = database
      .prepare(
        "SELECT id FROM employees WHERE phone = ? AND deleted_at IS NULL LIMIT 1",
      )
      .get(payload.adminPhone) as { id: number } | undefined;

    if (exists) {
      throw new Error(
        "Số điện thoại quản trị đã tồn tại. Vui lòng dùng số khác.",
      );
    }

    database
      .prepare(
        `INSERT INTO employees (name, phone, pin, password_hash, role_id, branch, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'Main', 1, ${now}, ${now})`,
      )
      .run(
        payload.adminName,
        payload.adminPhone,
        payload.adminPin,
        hashPassword(payload.adminPassword),
        ownerRole.id,
      );

    const upsert = database.prepare(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (?, ?, datetime('now','localtime'))
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now','localtime')`,
    );

    const settings: Array<[string, string]> = [
      ["store.name", payload.storeName],
      ["store.address", payload.storeAddress],
      ["store.phone", payload.storePhone],
      ["store.email", payload.storeEmail],
      ["store.wifi", payload.storeWifi],
      ["app.setup.completed", "true"],
    ];

    for (const [key, value] of settings) {
      upsert.run(key, value);
    }
  });

  tx();
}

export function listProducts(): Product[] {
  const rows = getDb()
    .prepare(
      `
      SELECT id, name, price, category
      FROM products
      WHERE deleted_at IS NULL
      ORDER BY id DESC
    `,
    )
    .all() as Array<{
    id: number;
    name: string;
    price: number;
    category: string;
  }>;

  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    price: row.price,
    category: row.category,
  }));
}

export function createOrder(payload: CreateOrderPayload): number {
  if (!payload.items.length) throw new Error("Order items are required");

  const database = getDb();

  const productByIdStmt = database.prepare(
    "SELECT id, price FROM products WHERE id = ? AND deleted_at IS NULL LIMIT 1",
  );
  const insertOrderStmt = database.prepare(
    "INSERT INTO orders (note, total) VALUES (?, ?)",
  );
  const insertOrderItemStmt = database.prepare(
    "INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)",
  );

  const transaction = database.transaction(() => {
    let total = 0;

    const enriched = payload.items.map((item) => {
      if (item.quantity <= 0)
        throw new Error(`Invalid quantity: ${item.quantity}`);

      const product = productByIdStmt.get(Number(item.productId)) as
        | { id: number; price: number }
        | undefined;

      if (!product) throw new Error(`Product not found: ${item.productId}`);

      const lineTotal = product.price * item.quantity;
      total += lineTotal;
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        lineTotal,
      };
    });

    const result = insertOrderStmt.run(payload.note ?? null, total);
    const orderId = Number(result.lastInsertRowid);

    for (const item of enriched) {
      insertOrderItemStmt.run(
        orderId,
        item.productId,
        item.quantity,
        item.unitPrice,
        item.lineTotal,
      );
    }

    return orderId;
  });

  return transaction() as number;
}
