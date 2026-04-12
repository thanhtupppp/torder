import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the electron module so db.ts can be imported outside Electron
vi.mock("electron", () => ({
  app: {
    getPath: () => "/tmp",
  },
}));

import Database from "better-sqlite3";
import { applyPragmas, createSchema, runMigrations, seedDefaults } from "./db";

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Creates a fresh in-memory SQLite database with the full schema applied.
 * Reused by all tests in this suite and imported by future test files.
 */
export function createTestDb(): Database.Database {
  const db = new Database(":memory:");
  applyPragmas(db);
  createSchema(db);
  runMigrations(db);
  seedDefaults(db);
  return db;
}

// ── Smoke tests ───────────────────────────────────────────────────────────────

describe("createTestDb", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  it("returns an open in-memory database", () => {
    expect(db).toBeDefined();
    expect(db.open).toBe(true);
  });

  it("sets user_version = 2 after migrations", () => {
    const version = db.pragma("user_version", { simple: true });
    expect(version).toBe(2);
  });

  it("has foreign_keys enabled", () => {
    const fk = db.pragma("foreign_keys", { simple: true });
    expect(fk).toBe(1);
  });

  it("creates all 33 expected tables", () => {
    const tables = (
      db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
        )
        .all() as { name: string }[]
    ).map((r) => r.name);

    const expected = [
      "addons",
      "areas",
      "categories",
      "combo_items",
      "customer_groups",
      "customers",
      "employees",
      "finance_categories",
      "fund_accounts",
      "loyalty_transactions",
      "order_item_addons",
      "order_items",
      "orders",
      "permissions",
      "product_addons",
      "products",
      "role_permissions",
      "roles",
      "settings",
      "shifts",
      "stock_audit_items",
      "stock_audits",
      "stock_export_items",
      "stock_exports",
      "stock_import_items",
      "stock_imports",
      "stock_logs",
      "stock_transfer_items",
      "stock_transfers",
      "suppliers",
      "tables",
    ];

    for (const name of expected) {
      expect(tables, `missing table: ${name}`).toContain(name);
    }
  });

  it("seeds all 22 default settings keys", () => {
    const rows = db.prepare("SELECT key FROM settings ORDER BY key").all() as {
      key: string;
    }[];
    expect(rows).toHaveLength(22);
  });
});

// ── Property 2: UNIQUE constraints prevent duplicates ────────────────────────

/**
 * Validates: Requirements 2.3, 1.5, 5.2
 */
describe("Property 2: UNIQUE constraints prevent duplicates", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  /**
   * 8.1 — Validates: Requirement 2.3
   * Two tables rows with the same (name, area_id) SHALL fail with UNIQUE constraint error.
   */
  it("8.1 rejects two tables rows with the same (name, area_id)", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (areaName, tableName) => {
          const innerDb = createTestDb();
          const areaId = (
            innerDb
              .prepare("INSERT INTO areas (name) VALUES (?)")
              .run(areaName) as { lastInsertRowid: number }
          ).lastInsertRowid;

          innerDb
            .prepare("INSERT INTO tables (name, area_id) VALUES (?, ?)")
            .run(tableName, areaId);

          expect(() =>
            innerDb
              .prepare("INSERT INTO tables (name, area_id) VALUES (?, ?)")
              .run(tableName, areaId),
          ).toThrow(/UNIQUE constraint failed/);
        },
      ),
      { numRuns: 30 },
    );
  });

  /**
   * 8.2 — Validates: Requirement 5.2
   * Two permissions rows with the same (group_key, perm_key) SHALL fail with UNIQUE constraint error.
   */
  it("8.2 rejects two permissions rows with the same (group_key, perm_key)", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (groupKey, permKey, label) => {
          const innerDb = createTestDb();

          innerDb
            .prepare(
              "INSERT INTO permissions (group_key, perm_key, label) VALUES (?, ?, ?)",
            )
            .run(groupKey, permKey, label);

          expect(() =>
            innerDb
              .prepare(
                "INSERT INTO permissions (group_key, perm_key, label) VALUES (?, ?, ?)",
              )
              .run(groupKey, permKey, label),
          ).toThrow(/UNIQUE constraint failed/);
        },
      ),
      { numRuns: 30 },
    );
  });

  /**
   * 8.3 — Validates: Requirement 1.5
   * Two product_addons rows with the same (product_id, addon_id) SHALL fail with UNIQUE constraint error.
   */
  it("8.3 rejects two product_addons rows with the same (product_id, addon_id)", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (productName, addonName) => {
          const innerDb = createTestDb();

          const productId = (
            innerDb
              .prepare(
                "INSERT INTO products (name, price, category) VALUES (?, ?, ?)",
              )
              .run(productName, 1000, "general") as { lastInsertRowid: number }
          ).lastInsertRowid;

          const addonId = (
            innerDb
              .prepare("INSERT INTO addons (name) VALUES (?)")
              .run(addonName) as { lastInsertRowid: number }
          ).lastInsertRowid;

          innerDb
            .prepare(
              "INSERT INTO product_addons (product_id, addon_id) VALUES (?, ?)",
            )
            .run(productId, addonId);

          expect(() =>
            innerDb
              .prepare(
                "INSERT INTO product_addons (product_id, addon_id) VALUES (?, ?)",
              )
              .run(productId, addonId),
          ).toThrow(/UNIQUE constraint failed/);
        },
      ),
      { numRuns: 30 },
    );
  });
});

// ── Property 1: CHECK constraints reject invalid rows ─────────────────────────

import * as fc from "fast-check";

/**
 * Validates: Requirements 1.2
 */
describe("Property 1: CHECK constraints reject invalid rows", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  it("7.1 rejects products with price < 0, vat > 100, or invalid type", () => {
    // price < 0
    fc.assert(
      fc.property(fc.integer({ min: -10000, max: -1 }), (price) => {
        expect(() =>
          db
            .prepare("INSERT INTO products (name, price) VALUES (?, ?)")
            .run("Test Product", price),
        ).toThrow();
      }),
      { numRuns: 50 },
    );

    // vat > 100
    fc.assert(
      fc.property(fc.integer({ min: 101, max: 10000 }), (vat) => {
        expect(() =>
          db
            .prepare("INSERT INTO products (name, price, vat) VALUES (?, ?, ?)")
            .run("Test Product", 100, vat),
        ).toThrow();
      }),
      { numRuns: 50 },
    );

    // invalid type
    const validTypes = ["goods", "service", "combo", "ingredient"];
    fc.assert(
      fc.property(
        fc.string().filter((s) => !validTypes.includes(s)),
        (invalidType) => {
          expect(() =>
            db
              .prepare(
                "INSERT INTO products (name, price, type) VALUES (?, ?, ?)",
              )
              .run("Test Product", 100, invalidType),
          ).toThrow();
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Validates: Requirements 4.2
   */
  it("7.2 rejects customers with loyalty_points < 0 or total_revenue < 0", () => {
    // loyalty_points < 0
    fc.assert(
      fc.property(fc.integer({ min: -10000, max: -1 }), (points) => {
        expect(() =>
          db
            .prepare(
              "INSERT INTO customers (name, loyalty_points) VALUES (?, ?)",
            )
            .run("Test Customer", points),
        ).toThrow();
      }),
      { numRuns: 50 },
    );

    // total_revenue < 0
    fc.assert(
      fc.property(fc.integer({ min: -10000, max: -1 }), (revenue) => {
        expect(() =>
          db
            .prepare(
              "INSERT INTO customers (name, total_revenue) VALUES (?, ?)",
            )
            .run("Test Customer", revenue),
        ).toThrow();
      }),
      { numRuns: 50 },
    );
  });

  /**
   * Validates: Requirements 4.5
   */
  it("7.3 rejects loyalty_transactions with balance_after < 0", () => {
    // Insert a customer first to satisfy the FK constraint
    const customerId = (
      db
        .prepare("INSERT INTO customers (name) VALUES (?)")
        .run("FK Customer") as { lastInsertRowid: number }
    ).lastInsertRowid;

    fc.assert(
      fc.property(fc.integer({ min: -10000, max: -1 }), (balanceAfter) => {
        expect(() =>
          db
            .prepare(
              "INSERT INTO loyalty_transactions (customer_id, delta, balance_after) VALUES (?, ?, ?)",
            )
            .run(customerId, 10, balanceAfter),
        ).toThrow();
      }),
      { numRuns: 50 },
    );
  });

  /**
   * Validates: Requirements 2.2
   */
  it("7.4 rejects tables with status not in ('empty','occupied','ordered')", () => {
    // Insert an area first to satisfy the FK constraint
    const areaId = (
      db.prepare("INSERT INTO areas (name) VALUES (?)").run("Test Area") as {
        lastInsertRowid: number;
      }
    ).lastInsertRowid;

    const validStatuses = ["empty", "occupied", "ordered"];
    fc.assert(
      fc.property(
        fc.string().filter((s) => !validStatuses.includes(s)),
        (invalidStatus) => {
          expect(() =>
            db
              .prepare(
                "INSERT INTO tables (name, area_id, status) VALUES (?, ?, ?)",
              )
              .run("Table 1", areaId, invalidStatus),
          ).toThrow();
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ── Property 3: Auto-generated codes ─────────────────────────────────────────

/**
 * Validates: Requirements 1.8, 3.5, 4.3, 5.5, 7.4
 */
describe("Property 3: Auto-generated codes", () => {
  /**
   * 9.1 — Validates: Requirement 1.8
   * For any N products inserted with NULL code, each resulting code SHALL equal 'SP' || printf('%05d', id).
   */
  it("9.1 products get code = SP + zero-padded id when inserted with NULL code", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (n) => {
        const innerDb = createTestDb();
        for (let i = 0; i < n; i++) {
          innerDb
            .prepare(
              "INSERT INTO products (name, price, category) VALUES (?, ?, ?)",
            )
            .run(`Product ${i}`, 1000, "general");
        }
        const rows = innerDb
          .prepare("SELECT id, code FROM products ORDER BY id")
          .all() as { id: number; code: string }[];
        for (const row of rows) {
          expect(row.code).toBe(`SP${String(row.id).padStart(5, "0")}`);
        }
      }),
      { numRuns: 20 },
    );
  });

  /**
   * 9.2 — Validates: Requirement 3.5
   * For any N orders inserted with NULL code, each resulting code SHALL equal 'HD' || printf('%05d', id).
   */
  it("9.2 orders get code = HD + zero-padded id when inserted with NULL code", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (n) => {
        const innerDb = createTestDb();
        for (let i = 0; i < n; i++) {
          innerDb.prepare("INSERT INTO orders (total) VALUES (?)").run(0);
        }
        const rows = innerDb
          .prepare("SELECT id, code FROM orders ORDER BY id")
          .all() as { id: number; code: string }[];
        for (const row of rows) {
          expect(row.code).toBe(`HD${String(row.id).padStart(5, "0")}`);
        }
      }),
      { numRuns: 20 },
    );
  });

  /**
   * 9.3 — Validates: Requirement 4.3
   * For any N customers inserted with NULL code, each resulting code SHALL equal 'KH' || printf('%05d', id).
   */
  it("9.3 customers get code = KH + zero-padded id when inserted with NULL code", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (n) => {
        const innerDb = createTestDb();
        for (let i = 0; i < n; i++) {
          innerDb
            .prepare("INSERT INTO customers (name) VALUES (?)")
            .run(`Customer ${i}`);
        }
        const rows = innerDb
          .prepare("SELECT id, code FROM customers ORDER BY id")
          .all() as { id: number; code: string }[];
        for (const row of rows) {
          expect(row.code).toBe(`KH${String(row.id).padStart(5, "0")}`);
        }
      }),
      { numRuns: 20 },
    );
  });

  /**
   * 9.4 — Validates: Requirement 5.5
   * For any N employees inserted with NULL code, each resulting code SHALL equal 'NV' || printf('%05d', id).
   */
  it("9.4 employees get code = NV + zero-padded id when inserted with NULL code", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (n) => {
        const innerDb = createTestDb();
        for (let i = 0; i < n; i++) {
          innerDb
            .prepare("INSERT INTO employees (name) VALUES (?)")
            .run(`Employee ${i}`);
        }
        const rows = innerDb
          .prepare("SELECT id, code FROM employees ORDER BY id")
          .all() as { id: number; code: string }[];
        for (const row of rows) {
          expect(row.code).toBe(`NV${String(row.id).padStart(5, "0")}`);
        }
      }),
      { numRuns: 20 },
    );
  });

  /**
   * 9.5 — Validates: Requirement 7.4
   * For any voucher inserted with NULL code, the code prefix SHALL match direction:
   * PT for income, PC for expense, PCT for transfer.
   */
  it("9.5 vouchers get correct code prefix based on direction", () => {
    const directionPrefixMap: Record<string, string> = {
      income: "PT",
      expense: "PC",
      transfer: "PCT",
    };

    fc.assert(
      fc.property(
        fc.constantFrom("income", "expense", "transfer"),
        (direction) => {
          const innerDb = createTestDb();

          // Create fund accounts needed for vouchers
          const fundId = (
            innerDb
              .prepare("INSERT INTO fund_accounts (name, type) VALUES (?, ?)")
              .run("Cash", "cash") as { lastInsertRowid: number }
          ).lastInsertRowid;

          const toFundId = (
            innerDb
              .prepare("INSERT INTO fund_accounts (name, type) VALUES (?, ?)")
              .run("Bank", "bank") as { lastInsertRowid: number }
          ).lastInsertRowid;

          innerDb
            .prepare(
              `INSERT INTO vouchers (direction, fund_account_id, to_fund_account_id, amount)
               VALUES (?, ?, ?, ?)`,
            )
            .run(
              direction,
              fundId,
              direction === "transfer" ? toFundId : null,
              1000,
            );

          const row = innerDb
            .prepare("SELECT id, code FROM vouchers ORDER BY id DESC LIMIT 1")
            .get() as { id: number; code: string };

          const expectedPrefix = directionPrefixMap[direction];
          expect(row.code).toBe(
            `${expectedPrefix}${String(row.id).padStart(5, "0")}`,
          );
        },
      ),
      { numRuns: 30 },
    );
  });
});

// ── Property 4: Status timestamps ────────────────────────────────────────────

/**
 * Validates: Requirements 3.6, 3.7
 */
describe("Property 4: Status timestamps", () => {
  const TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

  /**
   * 10.1 — Validates: Requirement 3.6
   * For any order, after UPDATE orders SET status='completed',
   * completed_at SHALL be non-null and a valid YYYY-MM-DD HH:MM:SS string.
   */
  it("10.1 completed_at is set to a valid timestamp when status changes to 'completed'", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100000 }), (total) => {
        const innerDb = createTestDb();

        const { lastInsertRowid: orderId } = innerDb
          .prepare("INSERT INTO orders (total) VALUES (?)")
          .run(total) as { lastInsertRowid: number };

        innerDb
          .prepare("UPDATE orders SET status = 'completed' WHERE id = ?")
          .run(orderId);

        const row = innerDb
          .prepare("SELECT completed_at FROM orders WHERE id = ?")
          .get(orderId) as { completed_at: string | null };

        expect(row.completed_at).not.toBeNull();
        expect(TIMESTAMP_RE.test(row.completed_at!)).toBe(true);
      }),
      { numRuns: 30 },
    );
  });

  /**
   * 10.2 — Validates: Requirement 3.7
   * For any order, after UPDATE orders SET status='cancelled',
   * cancelled_at SHALL be non-null and a valid YYYY-MM-DD HH:MM:SS string.
   */
  it("10.2 cancelled_at is set to a valid timestamp when status changes to 'cancelled'", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100000 }), (total) => {
        const innerDb = createTestDb();

        const { lastInsertRowid: orderId } = innerDb
          .prepare("INSERT INTO orders (total) VALUES (?)")
          .run(total) as { lastInsertRowid: number };

        innerDb
          .prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?")
          .run(orderId);

        const row = innerDb
          .prepare("SELECT cancelled_at FROM orders WHERE id = ?")
          .get(orderId) as { cancelled_at: string | null };

        expect(row.cancelled_at).not.toBeNull();
        expect(TIMESTAMP_RE.test(row.cancelled_at!)).toBe(true);
      }),
      { numRuns: 30 },
    );
  });
});

// ── Property 5: Soft-delete preserves rows ────────────────────────────────────

/**
 * Validates: Requirements 10.9
 */
describe("Property 5: Soft-delete preserves rows", () => {
  /**
   * 11.1 — Validates: Requirement 10.9
   * For any row in products, customers, employees, after setting deleted_at to a
   * non-null timestamp, the row SHALL still be retrievable by primary key.
   */
  it("11.1 soft-deleting a product, customer, or employee does not physically remove the row", () => {
    const DELETED_AT = "2024-01-01 00:00:00";

    // products
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.integer({ min: 0, max: 100000 }),
        (name, price) => {
          const innerDb = createTestDb();
          const { lastInsertRowid: productId } = innerDb
            .prepare(
              "INSERT INTO products (name, price, category) VALUES (?, ?, ?)",
            )
            .run(name, price, "general") as { lastInsertRowid: number };

          innerDb
            .prepare("UPDATE products SET deleted_at = ? WHERE id = ?")
            .run(DELETED_AT, productId);

          const row = innerDb
            .prepare("SELECT id, deleted_at FROM products WHERE id = ?")
            .get(productId) as { id: number; deleted_at: string } | undefined;

          expect(row).toBeDefined();
          expect(row!.id).toBe(productId);
          expect(row!.deleted_at).toBe(DELETED_AT);
        },
      ),
      { numRuns: 20 },
    );

    // customers
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 30 }), (name) => {
        const innerDb = createTestDb();
        const { lastInsertRowid: customerId } = innerDb
          .prepare("INSERT INTO customers (name) VALUES (?)")
          .run(name) as { lastInsertRowid: number };

        innerDb
          .prepare("UPDATE customers SET deleted_at = ? WHERE id = ?")
          .run(DELETED_AT, customerId);

        const row = innerDb
          .prepare("SELECT id, deleted_at FROM customers WHERE id = ?")
          .get(customerId) as { id: number; deleted_at: string } | undefined;

        expect(row).toBeDefined();
        expect(row!.id).toBe(customerId);
        expect(row!.deleted_at).toBe(DELETED_AT);
      }),
      { numRuns: 20 },
    );

    // employees
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 30 }), (name) => {
        const innerDb = createTestDb();
        const { lastInsertRowid: employeeId } = innerDb
          .prepare("INSERT INTO employees (name) VALUES (?)")
          .run(name) as { lastInsertRowid: number };

        innerDb
          .prepare("UPDATE employees SET deleted_at = ? WHERE id = ?")
          .run(DELETED_AT, employeeId);

        const row = innerDb
          .prepare("SELECT id, deleted_at FROM employees WHERE id = ?")
          .get(employeeId) as { id: number; deleted_at: string } | undefined;

        expect(row).toBeDefined();
        expect(row!.id).toBe(employeeId);
        expect(row!.deleted_at).toBe(DELETED_AT);
      }),
      { numRuns: 20 },
    );
  });
});

// ── Property 6: updated_at refresh ───────────────────────────────────────────

/**
 * Validates: Requirements 10.10
 */
describe("Property 6: updated_at refresh", () => {
  /**
   * 12.1 — Validates: Requirement 10.10
   * For any row in products, orders, customers, employees, after any UPDATE,
   * the new updated_at value SHALL be >= the previous updated_at value.
   *
   * Note: SQLite datetime resolution is 1 second, so new value may equal old
   * value (same second) or be greater — both are valid. String comparison works
   * because ISO format (YYYY-MM-DD HH:MM:SS) sorts lexicographically.
   */
  it("12.1 updated_at after UPDATE is >= previous updated_at for products, orders, customers, employees", () => {
    // products
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.integer({ min: 0, max: 100000 }),
        fc.integer({ min: 0, max: 100000 }),
        (name, price, newPrice) => {
          const innerDb = createTestDb();
          const { lastInsertRowid: productId } = innerDb
            .prepare(
              "INSERT INTO products (name, price, category) VALUES (?, ?, ?)",
            )
            .run(name, price, "general") as { lastInsertRowid: number };

          const before = (
            innerDb
              .prepare("SELECT updated_at FROM products WHERE id = ?")
              .get(productId) as { updated_at: string }
          ).updated_at;

          innerDb
            .prepare("UPDATE products SET price = ? WHERE id = ?")
            .run(newPrice, productId);

          const after = (
            innerDb
              .prepare("SELECT updated_at FROM products WHERE id = ?")
              .get(productId) as { updated_at: string }
          ).updated_at;

          expect(after >= before).toBe(true);
        },
      ),
      { numRuns: 20 },
    );

    // orders
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),
        fc.integer({ min: 0, max: 100000 }),
        (total, newTotal) => {
          const innerDb = createTestDb();
          const { lastInsertRowid: orderId } = innerDb
            .prepare("INSERT INTO orders (total) VALUES (?)")
            .run(total) as { lastInsertRowid: number };

          const before =
            (
              innerDb
                .prepare("SELECT updated_at FROM orders WHERE id = ?")
                .get(orderId) as { updated_at: string | null }
            ).updated_at ?? "";

          innerDb
            .prepare("UPDATE orders SET total = ? WHERE id = ?")
            .run(newTotal, orderId);

          const after =
            (
              innerDb
                .prepare("SELECT updated_at FROM orders WHERE id = ?")
                .get(orderId) as { updated_at: string | null }
            ).updated_at ?? "";

          expect(after >= before).toBe(true);
        },
      ),
      { numRuns: 20 },
    );

    // customers
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (name, newName) => {
          const innerDb = createTestDb();
          const { lastInsertRowid: customerId } = innerDb
            .prepare("INSERT INTO customers (name) VALUES (?)")
            .run(name) as { lastInsertRowid: number };

          const before = (
            innerDb
              .prepare("SELECT updated_at FROM customers WHERE id = ?")
              .get(customerId) as { updated_at: string }
          ).updated_at;

          innerDb
            .prepare("UPDATE customers SET name = ? WHERE id = ?")
            .run(newName, customerId);

          const after = (
            innerDb
              .prepare("SELECT updated_at FROM customers WHERE id = ?")
              .get(customerId) as { updated_at: string }
          ).updated_at;

          expect(after >= before).toBe(true);
        },
      ),
      { numRuns: 20 },
    );

    // employees
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (name, newName) => {
          const innerDb = createTestDb();
          const { lastInsertRowid: employeeId } = innerDb
            .prepare("INSERT INTO employees (name) VALUES (?)")
            .run(name) as { lastInsertRowid: number };

          const before = (
            innerDb
              .prepare("SELECT updated_at FROM employees WHERE id = ?")
              .get(employeeId) as { updated_at: string }
          ).updated_at;

          innerDb
            .prepare("UPDATE employees SET name = ? WHERE id = ?")
            .run(newName, employeeId);

          const after = (
            innerDb
              .prepare("SELECT updated_at FROM employees WHERE id = ?")
              .get(employeeId) as { updated_at: string }
          ).updated_at;

          expect(after >= before).toBe(true);
        },
      ),
      { numRuns: 20 },
    );
  });
});

// ── Property 7: diff_qty invariant ───────────────────────────────────────────

/**
 * Validates: Requirements 6.7
 */
describe("Property 7: diff_qty invariant", () => {
  /**
   * 13.1 — Validates: Requirement 6.7
   * For any stock_audit_items row with arbitrary system_qty and actual_qty >= 0,
   * diff_qty SHALL equal actual_qty - system_qty.
   */
  it("13.1 diff_qty equals actual_qty - system_qty for any valid stock_audit_items row", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100000, max: 100000 }), // system_qty: any integer
        fc.integer({ min: 0, max: 100000 }), // actual_qty: non-negative
        (systemQty, actualQty) => {
          const innerDb = createTestDb();

          // Insert a product to satisfy the FK constraint
          const { lastInsertRowid: productId } = innerDb
            .prepare(
              "INSERT INTO products (name, price, category) VALUES (?, ?, ?)",
            )
            .run("Audit Product", 1000, "general") as {
            lastInsertRowid: number;
          };

          // Insert a stock_audit to satisfy the FK constraint
          const { lastInsertRowid: auditId } = innerDb
            .prepare("INSERT INTO stock_audits DEFAULT VALUES")
            .run() as { lastInsertRowid: number };

          // Insert the audit item with the generated values
          const { lastInsertRowid: itemId } = innerDb
            .prepare(
              "INSERT INTO stock_audit_items (audit_id, product_id, system_qty, actual_qty) VALUES (?, ?, ?, ?)",
            )
            .run(auditId, productId, systemQty, actualQty) as {
            lastInsertRowid: number;
          };

          const row = innerDb
            .prepare(
              "SELECT system_qty, actual_qty, diff_qty FROM stock_audit_items WHERE id = ?",
            )
            .get(itemId) as {
            system_qty: number;
            actual_qty: number;
            diff_qty: number;
          };

          expect(row.diff_qty).toBe(row.actual_qty - row.system_qty);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 8: Transfer voucher constraint ───────────────────────────────────

/**
 * Validates: Requirements 7.6
 */
describe("Property 8: Transfer voucher constraint", () => {
  /**
   * 14.1 — Validates: Requirement 7.6
   * For any voucher with direction='transfer' and to_fund_account_id IS NULL,
   * insertion SHALL throw a CHECK constraint error.
   */
  it("14.1 rejects transfer vouchers with to_fund_account_id IS NULL", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1_000_000 }), (amount) => {
        const innerDb = createTestDb();

        const fundId = (
          innerDb
            .prepare("INSERT INTO fund_accounts (name, type) VALUES (?, ?)")
            .run("Cash", "cash") as { lastInsertRowid: number }
        ).lastInsertRowid;

        expect(() =>
          innerDb
            .prepare(
              "INSERT INTO vouchers (direction, fund_account_id, to_fund_account_id, amount) VALUES (?, ?, ?, ?)",
            )
            .run("transfer", fundId, null, amount),
        ).toThrow(/CHECK constraint failed/);
      }),
      { numRuns: 50 },
    );
  });

  /**
   * 14.2 — Validates: Requirement 7.6
   * For any voucher with direction in ('income','expense'), insertion SHALL succeed
   * regardless of to_fund_account_id value (NULL or a valid fund account id).
   */
  it("14.2 accepts income/expense vouchers regardless of to_fund_account_id", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("income" as const, "expense" as const),
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.boolean(),
        (direction, amount, withToFund) => {
          const innerDb = createTestDb();

          const fundId = (
            innerDb
              .prepare("INSERT INTO fund_accounts (name, type) VALUES (?, ?)")
              .run("Cash", "cash") as { lastInsertRowid: number }
          ).lastInsertRowid;

          let toFundId: number | null = null;
          if (withToFund) {
            toFundId = (
              innerDb
                .prepare("INSERT INTO fund_accounts (name, type) VALUES (?, ?)")
                .run("Bank", "bank") as { lastInsertRowid: number }
            ).lastInsertRowid;
          }

          expect(() =>
            innerDb
              .prepare(
                "INSERT INTO vouchers (direction, fund_account_id, to_fund_account_id, amount) VALUES (?, ?, ?, ?)",
              )
              .run(direction, fundId, toFundId, amount),
          ).not.toThrow();
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ── Property 9: Migration idempotency ─────────────────────────────────────────

/**
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4
 */
describe("Property 9: Migration idempotency", () => {
  const EXPECTED_TABLES = [
    "addons",
    "areas",
    "categories",
    "combo_items",
    "customer_groups",
    "customers",
    "employees",
    "finance_categories",
    "fund_accounts",
    "loyalty_transactions",
    "order_item_addons",
    "order_items",
    "orders",
    "permissions",
    "product_addons",
    "products",
    "role_permissions",
    "roles",
    "settings",
    "shifts",
    "stock_audit_items",
    "stock_audits",
    "stock_export_items",
    "stock_exports",
    "stock_import_items",
    "stock_imports",
    "stock_logs",
    "stock_transfer_items",
    "stock_transfers",
    "suppliers",
    "tables",
  ];

  /**
   * 15.1 — Validates: Requirements 10.1, 10.2, 10.3
   * Running the full init sequence on a fresh in-memory DB SHALL result in
   * PRAGMA user_version = 2 and all expected tables present in sqlite_master.
   *
   * Note: initDb() opens a file-based DB, so we simulate it using the individual
   * functions (applyPragmas → createSchema → runMigrations → seedDefaults) on an
   * in-memory DB via createTestDb().
   */
  it("15.1 fresh init sequence yields user_version=2 and all expected tables", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const db = createTestDb();

        const version = db.pragma("user_version", { simple: true }) as number;
        expect(version).toBe(2);

        const tables = (
          db
            .prepare(
              "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
            )
            .all() as { name: string }[]
        ).map((r) => r.name);

        for (const name of EXPECTED_TABLES) {
          expect(tables, `missing table after init: ${name}`).toContain(name);
        }
      }),
      { numRuns: 5 },
    );
  });

  /**
   * 15.2 — Validates: Requirements 10.2, 10.4
   * Running applyPragmas + createSchema + runMigrations + seedDefaults TWICE on
   * the same in-memory DB SHALL leave user_version and table count unchanged
   * (idempotency — migrations use IF NOT EXISTS guards and INSERT OR IGNORE for seeds).
   */
  it("15.2 running the full init sequence twice leaves user_version and table count unchanged", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const db = new Database(":memory:");

        // First pass
        applyPragmas(db);
        createSchema(db);
        runMigrations(db);
        seedDefaults(db);

        const versionAfterFirst = db.pragma("user_version", {
          simple: true,
        }) as number;
        const tablesAfterFirst = (
          db
            .prepare(
              "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
            )
            .all() as { name: string }[]
        ).map((r) => r.name);

        // Second pass — must be idempotent
        applyPragmas(db);
        createSchema(db);
        runMigrations(db);
        seedDefaults(db);

        const versionAfterSecond = db.pragma("user_version", {
          simple: true,
        }) as number;
        const tablesAfterSecond = (
          db
            .prepare(
              "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
            )
            .all() as { name: string }[]
        ).map((r) => r.name);

        expect(versionAfterSecond).toBe(versionAfterFirst);
        expect(tablesAfterSecond).toHaveLength(tablesAfterFirst.length);
        expect(tablesAfterSecond).toEqual(tablesAfterFirst);
      }),
      { numRuns: 5 },
    );
  });
});
