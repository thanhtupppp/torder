import path from "node:path";
import { app } from "electron";
import Database from "better-sqlite3";
import type { CreateOrderPayload, Product } from "./types";

let db: Database.Database | null = null;

// ── Path ──────────────────────────────────────────────────────────────────────

function getDbPath(): string {
  return path.join(app.getPath("userData"), "posiorder.sqlite");
}

// ── Pragmas ───────────────────────────────────────────────────────────────────

function applyPragmas(database: Database.Database): void {
  database.pragma("journal_mode = WAL");
  database.pragma("synchronous = NORMAL"); // safe with WAL [web:16]
  database.pragma("foreign_keys = ON"); // enforce FK constraints
  database.pragma("cache_size = -32000"); // 32MB page cache
  database.pragma("temp_store = MEMORY");
  database.pragma("mmap_size = 134217728"); // 128MB mmap
  database.pragma("busy_timeout = 5000"); // wait 5s instead of crash
}

// ── Migrations ─────────────────────────────────────────────────────────────────

function runMigrations(database: Database.Database): void {
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
}

// ── Schema ─────────────────────────────────────────────────────────────────────

function createSchema(database: Database.Database): void {
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
}

// ── Seed ───────────────────────────────────────────────────────────────────────

function seedProducts(database: Database.Database): void {
  const { count } = database
    .prepare("SELECT COUNT(*) as count FROM products")
    .get() as { count: number };

  if (count > 0) return;

  const insert = database.prepare(
    "INSERT INTO products (name, price, category) VALUES (@name, @price, @category)",
  );

  const seed = database.transaction((rows: typeof sampleProducts) => {
    for (const row of rows) insert.run(row);
  });

  const sampleProducts = [
    { name: "Cà phê đen", price: 25000, category: "Đồ uống" },
    { name: "Cà phê sữa", price: 30000, category: "Đồ uống" },
    { name: "Bánh mì bò", price: 45000, category: "Món chính" },
    { name: "Bánh ngọt", price: 35000, category: "Tráng miệng" },
    { name: "Nước cam", price: 28000, category: "Đồ uống" },
    { name: "Mì xào", price: 65000, category: "Món chính" },
  ];

  seed(sampleProducts);
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function initDb(): Database.Database {
  if (db) return db;

  const database = new Database(getDbPath());
  applyPragmas(database);
  createSchema(database);
  runMigrations(database);
  seedProducts(database);

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
  return getDb().backup(backupPath);
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
