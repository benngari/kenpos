import mongoose, { Schema, Document, Types } from "mongoose";

/* ------------------------------------------------------------------ */
/* Store / Branch                                                      */
/* ------------------------------------------------------------------ */
export interface IStore extends Document {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  kraPin?: string;
  vatRate: number;
  currency: string;
  receiptFooter?: string;
  logoUrl?: string;
  lowStockThreshold: number;
}
const StoreSchema = new Schema<IStore>(
  {
    name: { type: String, required: true, default: "My Shop" },
    address: String,
    phone: String,
    email: String,
    kraPin: String,
    vatRate: { type: Number, default: 16 },
    currency: { type: String, default: "KES" },
    receiptFooter: { type: String, default: "Thank you for shopping with us!" },
    logoUrl: String,
    lowStockThreshold: { type: Number, default: 5 },
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/* Role / User                                                         */
/* ------------------------------------------------------------------ */
export type RoleName = "admin" | "manager" | "cashier";

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: RoleName;
  store: Types.ObjectId;
  isActive: boolean;
}
const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: String,
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "manager", "cashier"], default: "cashier" },
    store: { type: Schema.Types.ObjectId, ref: "Store" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/* Category                                                             */
/* ------------------------------------------------------------------ */
export interface ICategory extends Document {
  name: string;
  icon?: string;
  imageUrl?: string;
}
const CategorySchema = new Schema<ICategory>(
  { name: { type: String, required: true, unique: true }, icon: String, imageUrl: String },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/* Product                                                              */
/* ------------------------------------------------------------------ */
export interface IProduct extends Document {
  name: string;
  sku: string;
  barcode?: string;
  category: Types.ObjectId;
  brand?: string;
  description?: string;
  imageUrl?: string;
  buyingPrice: number;
  sellingPrice: number;
  taxRate: number;
  stock: number;
  minStock: number;
  unit: string;
  supplier?: Types.ObjectId;
  expiryDate?: Date;
  status: "active" | "inactive";
}
const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    barcode: { type: String, index: true, sparse: true, unique: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    brand: String,
    description: String,
    imageUrl: String,
    buyingPrice: { type: Number, required: true, default: 0 },
    sellingPrice: { type: Number, required: true, default: 0 },
    taxRate: { type: Number, default: 16 },
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 5 },
    unit: { type: String, default: "pc" },
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier" },
    expiryDate: Date,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/* Customer                                                             */
/* ------------------------------------------------------------------ */
export interface ICustomer extends Document {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  type: "retail" | "wholesale";
  creditLimit: number;
  balance: number;
}
const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    phone: { type: String, index: true },
    email: String,
    address: String,
    type: { type: String, enum: ["retail", "wholesale"], default: "retail" },
    creditLimit: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/* Supplier                                                             */
/* ------------------------------------------------------------------ */
export interface ISupplier extends Document {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxPin?: string;
  balance: number;
}
const SupplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true },
    phone: String,
    email: String,
    address: String,
    taxPin: String,
    balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/* Sale (with embedded items + payments)                               */
/* ------------------------------------------------------------------ */
export interface ISaleItem {
  product: Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  total: number;
}
const SaleItemSchema = new Schema<ISaleItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: String,
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 16 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

export interface IPayment {
  method: "cash" | "mpesa" | "card" | "bank" | "credit";
  amount: number;
  reference?: string; // mpesa code / card ref / bank ref
  phone?: string; // mpesa phone
}
const PaymentSchema = new Schema<IPayment>(
  {
    method: { type: String, enum: ["cash", "mpesa", "card", "bank", "credit"], required: true },
    amount: { type: Number, required: true },
    reference: String,
    phone: String,
  },
  { _id: false }
);

export interface ISale extends Document {
  receiptNumber: string;
  items: ISaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  change: number;
  payments: IPayment[];
  customer?: Types.ObjectId;
  cashier: Types.ObjectId;
  status: "completed" | "held" | "voided" | "refunded" | "partially_refunded";
  holdReference?: string;
  registerSession?: Types.ObjectId;
  createdAt: Date;
}
const SaleSchema = new Schema<ISale>(
  {
    receiptNumber: { type: String, required: true, unique: true, index: true },
    items: [SaleItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    change: { type: Number, default: 0 },
    payments: [PaymentSchema],
    customer: { type: Schema.Types.ObjectId, ref: "Customer" },
    cashier: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["completed", "held", "voided", "refunded", "partially_refunded"],
      default: "completed",
    },
    holdReference: String,
    registerSession: { type: Schema.Types.ObjectId, ref: "RegisterSession" },
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/* Refund                                                               */
/* ------------------------------------------------------------------ */
export interface IRefundItem {
  product: Types.ObjectId;
  name: string;
  quantity: number;
  amount: number;
}
const RefundItemSchema = new Schema<IRefundItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    name: String,
    quantity: Number,
    amount: Number,
  },
  { _id: false }
);
export interface IRefund extends Document {
  sale: Types.ObjectId;
  items: IRefundItem[];
  reason: string;
  totalRefunded: number;
  processedBy: Types.ObjectId;
}
const RefundSchema = new Schema<IRefund>(
  {
    sale: { type: Schema.Types.ObjectId, ref: "Sale", required: true },
    items: [RefundItemSchema],
    reason: String,
    totalRefunded: { type: Number, required: true },
    processedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/* Purchase (with embedded items)                                      */
/* ------------------------------------------------------------------ */
export interface IPurchaseItem {
  product: Types.ObjectId;
  name: string;
  quantity: number;
  buyingPrice: number;
  total: number;
}
const PurchaseItemSchema = new Schema<IPurchaseItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: String,
    quantity: { type: Number, required: true },
    buyingPrice: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);
export interface IPurchase extends Document {
  supplier: Types.ObjectId;
  invoiceNumber: string;
  items: IPurchaseItem[];
  total: number;
  status: "pending" | "received" | "cancelled";
  receivedAt?: Date;
  createdBy: Types.ObjectId;
}
const PurchaseSchema = new Schema<IPurchase>(
  {
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    invoiceNumber: { type: String, required: true },
    items: [PurchaseItemSchema],
    total: { type: Number, required: true },
    status: { type: String, enum: ["pending", "received", "cancelled"], default: "pending" },
    receivedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/* Inventory Movement                                                   */
/* ------------------------------------------------------------------ */
export interface IInventoryMovement extends Document {
  product: Types.ObjectId;
  type: "in" | "out" | "adjustment" | "transfer" | "sale" | "return" | "purchase";
  quantity: number; // positive = added, negative = removed
  reason?: string;
  reference?: string; // e.g. sale receipt number, purchase invoice
  user: Types.ObjectId;
}
const InventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    type: {
      type: String,
      enum: ["in", "out", "adjustment", "transfer", "sale", "return", "purchase"],
      required: true,
    },
    quantity: { type: Number, required: true },
    reason: String,
    reference: String,
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/* Expense                                                              */
/* ------------------------------------------------------------------ */
export interface IExpense extends Document {
  title: string;
  category: string;
  amount: number;
  description?: string;
  paymentMethod: "cash" | "mpesa" | "card" | "bank";
  date: Date;
  user: Types.ObjectId;
}
const ExpenseSchema = new Schema<IExpense>(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["Transport", "Rent", "Electricity", "Salaries", "Internet", "Supplies", "Maintenance", "Other"],
      default: "Other",
    },
    amount: { type: Number, required: true },
    description: String,
    paymentMethod: { type: String, enum: ["cash", "mpesa", "card", "bank"], default: "cash" },
    date: { type: Date, default: Date.now },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/* Register Session (Cashier Shift)                                     */
/* ------------------------------------------------------------------ */
export interface IRegisterSession extends Document {
  cashier: Types.ObjectId;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  difference?: number;
  status: "open" | "closed";
  openedAt: Date;
  closedAt?: Date;
}
const RegisterSessionSchema = new Schema<IRegisterSession>(
  {
    cashier: { type: Schema.Types.ObjectId, ref: "User", required: true },
    openingCash: { type: Number, required: true },
    closingCash: Number,
    expectedCash: Number,
    difference: Number,
    status: { type: String, enum: ["open", "closed"], default: "open" },
    openedAt: { type: Date, default: Date.now },
    closedAt: Date,
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/* Audit Log                                                            */
/* ------------------------------------------------------------------ */
export interface IAuditLog extends Document {
  user: Types.ObjectId;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
}
const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: String,
    details: String,
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
export const Store = mongoose.model<IStore>("Store", StoreSchema);
export const User = mongoose.model<IUser>("User", UserSchema);
export const Category = mongoose.model<ICategory>("Category", CategorySchema);
export const Product = mongoose.model<IProduct>("Product", ProductSchema);
export const Customer = mongoose.model<ICustomer>("Customer", CustomerSchema);
export const Supplier = mongoose.model<ISupplier>("Supplier", SupplierSchema);
export const Sale = mongoose.model<ISale>("Sale", SaleSchema);
export const Refund = mongoose.model<IRefund>("Refund", RefundSchema);
export const Purchase = mongoose.model<IPurchase>("Purchase", PurchaseSchema);
export const InventoryMovement = mongoose.model<IInventoryMovement>(
  "InventoryMovement",
  InventoryMovementSchema
);
export const Expense = mongoose.model<IExpense>("Expense", ExpenseSchema);
export const RegisterSession = mongoose.model<IRegisterSession>(
  "RegisterSession",
  RegisterSessionSchema
);
export const AuditLog = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
