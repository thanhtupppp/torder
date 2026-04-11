"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = initDb;
exports.listProducts = listProducts;
exports.createOrder = createOrder;
const node_path_1 = __importDefault(require("node:path"));
const electron_1 = require("electron");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
let db = null;
function getDbPath() {
    const userData = electron_1.app.getPath("userData");
    return node_path_1.default.join(userData, "posiorder.sqlite");
}
function seedProducts(database) {
    const count = database
        .prepare("SELECT COUNT(*) as count FROM products")
        .get();
    if (count.count > 0) {
        return;
    }
    const insert = database.prepare("INSERT INTO products (name, price, category) VALUES (@name, @price, @category)");
    const sampleProducts = [
        { name: "Cà phê đen", price: 25000, category: "Đồ uống" },
        { name: "Cà phê sữa", price: 30000, category: "Đồ uống" },
        { name: "Bánh mì bò", price: 45000, category: "Món chính" },
        { name: "Bánh ngọt phô mai", price: 35000, category: "Tráng miệng" },
        { name: "Nước cam", price: 28000, category: "Đồ uống" },
        { name: "Mì xào hải sản", price: 65000, category: "Món chính" },
    ];
    const transaction = database.transaction((rows) => {
        for (const row of rows) {
            insert.run(row);
        }
    });
    transaction(sampleProducts);
}
function initDb() {
    if (db)
        return db;
    const database = new better_sqlite3_1.default(getDbPath());
    database.pragma("journal_mode = WAL");
    database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      note TEXT,
      total INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price INTEGER NOT NULL,
      line_total INTEGER NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );
  `);
    seedProducts(database);
    db = database;
    return database;
}
function listProducts() {
    const database = initDb();
    const rows = database
        .prepare("SELECT id, name, price, category FROM products ORDER BY id DESC")
        .all();
    return rows.map((row) => ({
        id: String(row.id),
        name: row.name,
        price: row.price,
        category: row.category,
    }));
}
function createOrder(payload) {
    if (!payload.items.length) {
        throw new Error("Order items are required");
    }
    const database = initDb();
    const productByIdStmt = database.prepare("SELECT id, price FROM products WHERE id = ? LIMIT 1");
    const insertOrderStmt = database.prepare("INSERT INTO orders (note, total) VALUES (?, ?)");
    const insertOrderItemStmt = database.prepare(`INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
     VALUES (?, ?, ?, ?, ?)`);
    const transaction = database.transaction(() => {
        let total = 0;
        const enrichedItems = payload.items.map((item) => {
            const product = productByIdStmt.get(Number(item.productId));
            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }
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
        for (const item of enrichedItems) {
            insertOrderItemStmt.run(orderId, item.productId, item.quantity, item.unitPrice, item.lineTotal);
        }
        return { orderId };
    });
    return transaction();
}
