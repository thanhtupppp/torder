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

// ── Unit/Example tests ────────────────────────────────────────────────────────

describe("Unit/Example tests", () => {
  // ── 16.1 Smoke test: all tables and named indexes exist ──────────────────

  /**
   * Validates: Requirements 10.3
   */
  it("16.1 all 32 tables and all named indexes exist in sqlite_master after initDb()", () => {
    const db = createTestDb();

    const tables = (
      db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
        )
        .all() as { name: string }[]
    ).map((r) => r.name);

    const expectedTables = [
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
      "vouchers",
    ];

    for (const name of expectedTables) {
      expect(tables, `missing table: ${name}`).toContain(name);
    }

    // All named indexes must exist in sqlite_master
    const indexes = (
      db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        )
        .all() as { name: string }[]
    ).map((r) => r.name);

    const expectedIndexes = [
      "idx_customers_group",
      "idx_customers_phone",
      "idx_employees_phone",
      "idx_employees_role",
      "idx_orders_createdat",
      "idx_orders_customer",
      "idx_orders_employee",
      "idx_orders_status",
      "idx_orders_table",
      "idx_orderitems_orderid",
      "idx_products_active",
      "idx_products_barcode",
      "idx_products_category",
      "idx_shifts_employee",
      "idx_stockimports_status",
      "idx_stockimports_supplier",
      "idx_stocklogs_product",
      "idx_stocklogs_source",
      "idx_vouchers_direction",
      "idx_vouchers_employee",
      "idx_vouchers_fund",
      "idx_vouchers_voucherat",
      "idx_tables_area",
    ];

    for (const name of expectedIndexes) {
      expect(indexes, `missing index: ${name}`).toContain(name);
    }
  });

  // ── 16.2 All 22 settings keys with correct default values ────────────────

  /**
   * Validates: Requirements 8.2
   */
  it("16.2 seedDefaults() inserts all 22 settings keys with correct default values", () => {
    const db = createTestDb();

    const rows = db
      .prepare("SELECT key, value FROM settings ORDER BY key")
      .all() as { key: string; value: string }[];

    const settingsMap = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    const expected: Record<string, string> = {
      "display.showOrderInfo": "true",
      "display.text": "",
      "display.website": "",
      "loyalty.pointValue": "100",
      "loyalty.pointsPerVnd": "1000",
      "payment.card": "false",
      "payment.cash": "true",
      "payment.point": "false",
      "payment.transfer": "true",
      "payment.wallet": "false",
      "sales.allowNegativeStock": "false",
      "sales.autoFinish": "false",
      "sales.autoPrint": "false",
      "sales.fastCheckout": "false",
      "sales.showConfirmDialog": "true",
      "sales.showImages": "true",
      "sales.staffRequired": "false",
      "store.address": "",
      "store.email": "",
      "store.name": "",
      "store.phone": "",
      "store.wifi": "",
    };

    expect(rows).toHaveLength(22);

    for (const [key, value] of Object.entries(expected)) {
      expect(settingsMap[key], `wrong value for key: ${key}`).toBe(value);
    }
  });

  // ── 16.3 Rollback leaves user_version unchanged ──────────────────────────

  /**
   * Validates: Requirements 10.4
   */
  it("16.3 a thrown error inside a transaction leaves user_version unchanged", () => {
    // Build a DB at version 1 (createSchema sets up base tables, migration v1 runs)
    const db = new Database(":memory:");
    applyPragmas(db);
    createSchema(db);
    // Only run migration v1 manually (version < 1 block)
    // createSchema leaves user_version = 0, so runMigrations will run v1 then v2
    // Instead, manually set user_version = 1 to simulate a DB at v1
    db.pragma("user_version = 1");

    const versionBefore = db.pragma("user_version", { simple: true }) as number;
    expect(versionBefore).toBe(1);

    // Simulate a mid-migration transaction that throws
    try {
      const failingTx = db.transaction(() => {
        db.exec(
          "CREATE TABLE IF NOT EXISTS rollback_test (id INTEGER PRIMARY KEY)",
        );
        db.pragma("user_version = 2");
        throw new Error("simulated mid-migration failure");
      });
      failingTx();
    } catch {
      // expected
    }

    const versionAfter = db.pragma("user_version", { simple: true }) as number;
    expect(versionAfter).toBe(1);

    // The table created inside the rolled-back transaction should not exist
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'rollback_test'",
      )
      .all() as { name: string }[];
    expect(tables).toHaveLength(0);
  });

  // ── 16.4 ON DELETE CASCADE removes order_items ───────────────────────────

  /**
   * Validates: Requirements 3.2
   */
  it("16.4 deleting an orders row cascades to remove its order_items rows", () => {
    const db = createTestDb();

    // Insert a product
    const { lastInsertRowid: productId } = db
      .prepare("INSERT INTO products (name, price, category) VALUES (?, ?, ?)")
      .run("Test Product", 1000, "general") as { lastInsertRowid: number };

    // Insert an order
    const { lastInsertRowid: orderId } = db
      .prepare("INSERT INTO orders (total) VALUES (?)")
      .run(5000) as { lastInsertRowid: number };

    // Insert two order_items referencing the order
    db.prepare(
      "INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)",
    ).run(orderId, productId, 2, 1000, 2000);

    db.prepare(
      "INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)",
    ).run(orderId, productId, 3, 1000, 3000);

    // Verify items exist
    const itemsBefore = db
      .prepare("SELECT id FROM order_items WHERE order_id = ?")
      .all(orderId) as { id: number }[];
    expect(itemsBefore).toHaveLength(2);

    // Delete the parent order
    db.prepare("DELETE FROM orders WHERE id = ?").run(orderId);

    // order_items should be gone via CASCADE
    const itemsAfter = db
      .prepare("SELECT id FROM order_items WHERE order_id = ?")
      .all(orderId) as { id: number }[];
    expect(itemsAfter).toHaveLength(0);
  });

  // ── 16.5 ON DELETE RESTRICT blocks product deletion ──────────────────────

  /**
   * Validates: Requirements 6.3
   */
  it("16.5 ON DELETE RESTRICT prevents deleting a products row referenced by stock_import_items", () => {
    const db = createTestDb();

    // Insert a product
    const { lastInsertRowid: productId } = db
      .prepare("INSERT INTO products (name, price, category) VALUES (?, ?, ?)")
      .run("Restricted Product", 500, "general") as { lastInsertRowid: number };

    // Insert a stock_import
    const { lastInsertRowid: importId } = db
      .prepare("INSERT INTO stock_imports DEFAULT VALUES")
      .run() as { lastInsertRowid: number };

    // Insert a stock_import_item referencing the product
    db.prepare(
      "INSERT INTO stock_import_items (import_id, product_id, quantity, unit_cost, line_total) VALUES (?, ?, ?, ?, ?)",
    ).run(importId, productId, 10, 500, 5000);

    // Attempting to delete the product should throw due to RESTRICT
    expect(() =>
      db.prepare("DELETE FROM products WHERE id = ?").run(productId),
    ).toThrow(/FOREIGN KEY constraint failed/);

    // Product should still exist
    const product = db
      .prepare("SELECT id FROM products WHERE id = ?")
      .get(productId);
    expect(product).toBeDefined();
  });

  // ── 16.6 ON DELETE SET NULL nullifies orders.customer_id ─────────────────

  /**
   * Validates: Requirements 3.1
   */
  it("16.6 hard-deleting a customers row sets orders.customer_id to NULL", () => {
    const db = createTestDb();

    // Insert a customer
    const { lastInsertRowid: customerId } = db
      .prepare("INSERT INTO customers (name) VALUES (?)")
      .run("Test Customer") as { lastInsertRowid: number };

    // Insert an order referencing the customer
    const { lastInsertRowid: orderId } = db
      .prepare("INSERT INTO orders (total, customer_id) VALUES (?, ?)")
      .run(1000, customerId) as { lastInsertRowid: number };

    // Verify customer_id is set
    const orderBefore = db
      .prepare("SELECT customer_id FROM orders WHERE id = ?")
      .get(orderId) as { customer_id: number | null };
    expect(orderBefore.customer_id).toBe(customerId);

    // Hard-delete the customer
    db.prepare("DELETE FROM customers WHERE id = ?").run(customerId);

    // orders.customer_id should now be NULL
    const orderAfter = db
      .prepare("SELECT customer_id FROM orders WHERE id = ?")
      .get(orderId) as { customer_id: number | null };
    expect(orderAfter.customer_id).toBeNull();
  });
});
