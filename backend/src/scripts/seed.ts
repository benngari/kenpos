import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import {
  Store,
  User,
  Category,
  Product,
  Customer,
  Supplier,
  Sale,
  Purchase,
  Expense,
  InventoryMovement,
} from "../models";
import { generateReceiptNumber, round2 } from "../utils/helpers";

async function seed() {
  await connectDB();
  console.log("[seed] clearing existing data...");
  await Promise.all([
    Store.deleteMany({}),
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Customer.deleteMany({}),
    Supplier.deleteMany({}),
    Sale.deleteMany({}),
    Purchase.deleteMany({}),
    Expense.deleteMany({}),
    InventoryMovement.deleteMany({}),
  ]);

  const store = await Store.create({
    name: "Jambo Mart",
    address: "Moi Avenue, Nairobi",
    phone: "0712345678",
    email: "info@jambomart.co.ke",
    kraPin: "P051234567X",
    vatRate: 16,
    currency: "KES",
    receiptFooter: "Asante kwa kutununulia! Karibu tena.",
    lowStockThreshold: 5,
  });

  const passwordHash = await bcrypt.hash("password123", 10);
  const [admin, manager, cashier] = await User.create([
    { name: "Amina Wanjiru", email: "admin@kenpos.co.ke", passwordHash, role: "admin", store: store._id },
    { name: "Brian Otieno", email: "manager@kenpos.co.ke", passwordHash, role: "manager", store: store._id },
    { name: "Cynthia Achieng", email: "cashier@kenpos.co.ke", passwordHash, role: "cashier", store: store._id },
  ]);
  console.log("[seed] users created. Password for all: password123");

  const categories = await Category.create([
    { name: "Bakery", icon: "🍞" },
    { name: "Dairy", icon: "🥛" },
    { name: "Grains & Cereals", icon: "🌾" },
    { name: "Beverages", icon: "🥤" },
    { name: "Snacks", icon: "🍪" },
    { name: "Household & Cleaning", icon: "🧼" },
    { name: "Personal Care", icon: "🧴" },
  ]);
  const catMap = Object.fromEntries(categories.map((c) => [c.name, c._id]));

  const suppliers = await Supplier.create([
    { name: "Brookside Distributors", phone: "0722000111", email: "sales@brookside.co.ke", taxPin: "P000111222A" },
    { name: "Bidco Africa Ltd", phone: "0733000222", email: "orders@bidco.co.ke", taxPin: "P000222333B" },
    { name: "Unga Group Suppliers", phone: "0744000333", email: "info@unga.co.ke", taxPin: "P000333444C" },
  ]);

  const productDefs = [
    { name: "White Bread 400g", cat: "Bakery", buy: 48, sell: 60, stock: 40, unit: "loaf" },
    { name: "Brown Bread 400g", cat: "Bakery", buy: 52, sell: 65, stock: 25, unit: "loaf" },
    { name: "Fresh Milk 500ml", cat: "Dairy", buy: 45, sell: 55, stock: 60, unit: "packet" },
    { name: "Fresh Milk 1L", cat: "Dairy", buy: 85, sell: 100, stock: 50, unit: "packet" },
    { name: "Yoghurt 500ml", cat: "Dairy", buy: 110, sell: 140, stock: 20, unit: "bottle" },
    { name: "Sugar 2kg", cat: "Grains & Cereals", buy: 240, sell: 280, stock: 30, unit: "pkt" },
    { name: "Rice Pishori 2kg", cat: "Grains & Cereals", buy: 320, sell: 380, stock: 25, unit: "pkt" },
    { name: "Wheat Flour 2kg", cat: "Grains & Cereals", buy: 180, sell: 220, stock: 4, unit: "pkt" },
    { name: "Cooking Oil 1L", cat: "Grains & Cereals", buy: 260, sell: 310, stock: 18, unit: "bottle" },
    { name: "Soda 500ml", cat: "Beverages", buy: 45, sell: 60, stock: 80, unit: "bottle" },
    { name: "Mineral Water 500ml", cat: "Beverages", buy: 30, sell: 50, stock: 100, unit: "bottle" },
    { name: "Digestive Biscuits", cat: "Snacks", buy: 55, sell: 75, stock: 35, unit: "pkt" },
    { name: "Potato Crisps", cat: "Snacks", buy: 60, sell: 90, stock: 3, unit: "pkt" },
    { name: "Bar Soap 800g", cat: "Household & Cleaning", buy: 130, sell: 160, stock: 22, unit: "bar" },
    { name: "Detergent Powder 1kg", cat: "Household & Cleaning", buy: 210, sell: 260, stock: 15, unit: "pkt" },
    { name: "Toilet Tissue 4-pack", cat: "Household & Cleaning", buy: 140, sell: 180, stock: 0, unit: "pack" },
    { name: "Toothpaste 100g", cat: "Personal Care", buy: 95, sell: 130, stock: 28, unit: "tube" },
    { name: "Eggs (Tray of 30)", cat: "Grains & Cereals", buy: 380, sell: 450, stock: 12, unit: "tray" },
  ];

  const products = await Product.create(
    productDefs.map((p, idx) => ({
      name: p.name,
      sku: `SKU-${String(idx + 1).padStart(4, "0")}`,
      barcode: `89912300${String(idx + 1).padStart(4, "0")}`,
      category: catMap[p.cat],
      buyingPrice: p.buy,
      sellingPrice: p.sell,
      taxRate: 16,
      stock: p.stock,
      minStock: 5,
      unit: p.unit,
      supplier: suppliers[idx % suppliers.length]._id,
      status: "active",
    }))
  );

  await InventoryMovement.create(
    products.map((p) => ({
      product: p._id,
      type: "in",
      quantity: p.stock,
      reason: "Initial seed stock",
      user: admin._id,
    }))
  );

  const customers = await Customer.create([
    { name: "Walk-in Customer", phone: "", type: "retail", creditLimit: 0, balance: 0 },
    { name: "John Kamau", phone: "0700111222", type: "retail", creditLimit: 5000, balance: 750 },
    { name: "Grace Njeri", phone: "0711222333", type: "wholesale", creditLimit: 20000, balance: 3200 },
  ]);

  // A handful of sample completed sales for realistic dashboard/report data
  for (let i = 0; i < 8; i++) {
    const p1 = products[Math.floor(Math.random() * products.length)];
    const p2 = products[Math.floor(Math.random() * products.length)];
    const qty1 = 1 + Math.floor(Math.random() * 3);
    const qty2 = 1 + Math.floor(Math.random() * 2);
    const subtotal = round2(p1.sellingPrice * qty1 + p2.sellingPrice * qty2);
    const tax = round2(subtotal * 0.16 - subtotal * 0.16 * 0); // simple flat tax approximation
    const total = round2(subtotal);
    const method = ["cash", "mpesa", "card"][i % 3];

    await Sale.create({
      receiptNumber: generateReceiptNumber(),
      items: [
        {
          product: p1._id,
          name: p1.name,
          quantity: qty1,
          unitPrice: p1.sellingPrice,
          discount: 0,
          taxRate: p1.taxRate,
          total: round2(p1.sellingPrice * qty1),
        },
        {
          product: p2._id,
          name: p2.name,
          quantity: qty2,
          unitPrice: p2.sellingPrice,
          discount: 0,
          taxRate: p2.taxRate,
          total: round2(p2.sellingPrice * qty2),
        },
      ],
      subtotal,
      discount: 0,
      tax,
      total,
      amountPaid: total,
      change: 0,
      payments: [{ method, amount: total, reference: method !== "cash" ? "SEED12345" : undefined }],
      customer: customers[i % customers.length]._id,
      cashier: [manager._id, cashier._id][i % 2],
      status: "completed",
    });
  }

  await Purchase.create({
    supplier: suppliers[0]._id,
    invoiceNumber: "INV-2026-0001",
    items: [
      { product: products[0]._id, name: products[0].name, quantity: 50, buyingPrice: products[0].buyingPrice, total: 50 * products[0].buyingPrice },
    ],
    total: 50 * products[0].buyingPrice,
    status: "pending",
    createdBy: manager._id,
  });

  await Expense.create([
    { title: "Shop rent - August", category: "Rent", amount: 25000, paymentMethod: "bank", date: new Date(), user: admin._id },
    { title: "KPLC electricity bill", category: "Electricity", amount: 3200, paymentMethod: "mpesa", date: new Date(), user: manager._id },
    { title: "Staff transport allowance", category: "Transport", amount: 1500, paymentMethod: "cash", date: new Date(), user: manager._id },
  ]);

  console.log("[seed] Done! Sample logins (password: password123):");
  console.log("  Admin:   admin@kenpos.co.ke");
  console.log("  Manager: manager@kenpos.co.ke");
  console.log("  Cashier: cashier@kenpos.co.ke");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
