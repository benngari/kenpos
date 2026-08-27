export type Role = "admin" | "manager" | "cashier";

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  isActive?: boolean;
}

export interface Category {
  _id: string;
  name: string;
  icon?: string;
  imageUrl?: string;
  productCount?: number;
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: Category | string;
  brand?: string;
  description?: string;
  imageUrl?: string;
  buyingPrice: number;
  sellingPrice: number;
  taxRate: number;
  stock: number;
  minStock: number;
  unit: string;
  supplier?: { _id: string; name: string } | string;
  expiryDate?: string;
  status: "active" | "inactive";
}

export interface CartLine {
  product: Product;
  quantity: number;
  discount: number;
}

export interface SaleItem {
  product: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  total: number;
}

export type PaymentMethod = "cash" | "mpesa" | "card" | "bank" | "credit";

export interface Payment {
  method: PaymentMethod;
  amount: number;
  reference?: string;
  phone?: string;
}

export interface Sale {
  _id: string;
  receiptNumber: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  change: number;
  payments: Payment[];
  customer?: { _id: string; name: string; phone?: string } | string;
  cashier: { _id: string; name: string } | string;
  status: "completed" | "held" | "voided" | "refunded" | "partially_refunded";
  holdReference?: string;
  createdAt: string;
}

export interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  type: "retail" | "wholesale";
  creditLimit: number;
  balance: number;
}

export interface Supplier {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxPin?: string;
  balance: number;
}

export interface Expense {
  _id: string;
  title: string;
  category: string;
  amount: number;
  description?: string;
  paymentMethod: PaymentMethod;
  date: string;
  user?: { _id: string; name: string };
}

export interface RegisterSession {
  _id: string;
  cashier: { _id: string; name: string } | string;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  difference?: number;
  status: "open" | "closed";
  openedAt: string;
  closedAt?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}
