import { Router } from "express";
import { protect, permit } from "../middleware/auth";
import * as auth from "../controllers/auth.controller";
import * as category from "../controllers/category.controller";
import * as product from "../controllers/product.controller";
import * as sale from "../controllers/sale.controller";
import * as customer from "../controllers/customer.controller";
import * as supplier from "../controllers/supplier.controller";
import * as purchase from "../controllers/purchase.controller";
import * as inventory from "../controllers/inventory.controller";
import * as expense from "../controllers/expense.controller";
import * as register from "../controllers/register.controller";
import * as report from "../controllers/report.controller";

const router = Router();

/* Auth */
router.post("/auth/login", auth.login);
router.get("/auth/me", protect, auth.me);

/* Users (admin only) */
router.get("/users", protect, permit(), auth.listUsers);
router.post("/users", protect, permit(), auth.createUser);
router.put("/users/:id", protect, permit(), auth.updateUser);
router.delete("/users/:id", protect, permit(), auth.deleteUser);

/* Categories */
router.get("/categories", protect, category.listCategories);
router.post("/categories", protect, permit("manager"), category.createCategory);
router.put("/categories/:id", protect, permit("manager"), category.updateCategory);
router.delete("/categories/:id", protect, permit("manager"), category.deleteCategory);

/* Products */
router.get("/products", protect, product.listProducts);
router.get("/products/barcode/:code", protect, product.getProductByBarcode);
router.post("/products", protect, permit("manager"), product.createProduct);
router.put("/products/:id", protect, permit("manager"), product.updateProduct);
router.delete("/products/:id", protect, permit("manager"), product.deleteProduct);
router.post("/products/bulk-status", protect, permit("manager"), product.bulkUpdateStatus);

/* POS / Sales */
router.post("/sales/preview", protect, sale.previewCart);
router.post("/sales/checkout", protect, sale.checkout);
router.post("/sales/hold", protect, sale.holdSale);
router.get("/sales/held", protect, sale.listHeldSales);
router.delete("/sales/held/:id", protect, sale.deleteHeldSale);
router.get("/sales", protect, sale.listSales);
router.get("/sales/:id", protect, sale.getSale);
router.post("/sales/:id/void", protect, permit("manager"), sale.voidSale);
router.post("/sales/:id/refund", protect, permit("manager"), sale.refundSale);

/* Customers */
router.get("/customers", protect, customer.listCustomers);
router.post("/customers", protect, customer.createCustomer);
router.put("/customers/:id", protect, customer.updateCustomer);
router.delete("/customers/:id", protect, permit("manager"), customer.deleteCustomer);
router.get("/customers/:id/statement", protect, customer.customerStatement);
router.post("/customers/:id/credit-payment", protect, customer.recordCreditPayment);

/* Suppliers */
router.get("/suppliers", protect, permit("manager"), supplier.listSuppliers);
router.post("/suppliers", protect, permit("manager"), supplier.createSupplier);
router.put("/suppliers/:id", protect, permit("manager"), supplier.updateSupplier);
router.delete("/suppliers/:id", protect, permit("manager"), supplier.deleteSupplier);
router.get("/suppliers/:id/history", protect, permit("manager"), supplier.supplierHistory);

/* Purchases */
router.get("/purchases", protect, permit("manager"), purchase.listPurchases);
router.post("/purchases", protect, permit("manager"), purchase.createPurchase);
router.post("/purchases/:id/receive", protect, permit("manager"), purchase.receivePurchase);
router.post("/purchases/:id/cancel", protect, permit("manager"), purchase.cancelPurchase);

/* Inventory */
router.get("/inventory/summary", protect, permit("manager"), inventory.inventorySummary);
router.get("/inventory/movements", protect, permit("manager"), inventory.listMovements);
router.post("/inventory/movements", protect, permit("manager"), inventory.createMovement);

/* Expenses */
router.get("/expenses", protect, permit("manager"), expense.listExpenses);
router.post("/expenses", protect, permit("manager"), expense.createExpense);
router.put("/expenses/:id", protect, permit("manager"), expense.updateExpense);
router.delete("/expenses/:id", protect, permit("manager"), expense.deleteExpense);

/* Register / shifts */
router.get("/register/current", protect, register.currentSession);
router.post("/register/open", protect, register.openSession);
router.post("/register/:id/close", protect, register.closeSession);
router.get("/register/sessions", protect, permit("manager"), register.listSessions);

/* Reports & dashboard */
router.get("/reports/dashboard", protect, permit("manager"), report.dashboard);
router.get("/reports/sales-over-time", protect, permit("manager"), report.salesOverTime);
router.get("/reports/by-payment-method", protect, permit("manager"), report.salesByPaymentMethod);
router.get("/reports/top-products", protect, permit("manager"), report.topProducts);
router.get("/reports/by-category", protect, permit("manager"), report.salesByCategory);
router.get("/reports/by-cashier", protect, permit("manager"), report.cashierReport);
router.get("/reports/profit", protect, permit("manager"), report.profitReport);

export default router;
