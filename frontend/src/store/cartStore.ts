import { create } from "zustand";
import { CartLine, Product } from "../types";

interface CartState {
  lines: CartLine[];
  overallDiscount: number;
  customer: string | null;
  holdReference: string | null;
  addProduct: (product: Product) => void;
  incrementLine: (productId: string, by?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  setLineDiscount: (productId: string, discount: number) => void;
  removeLine: (productId: string) => void;
  setOverallDiscount: (amount: number) => void;
  setCustomer: (customerId: string | null) => void;
  setHoldReference: (ref: string | null) => void;
  loadCart: (lines: CartLine[], customer?: string | null) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  overallDiscount: 0,
  customer: null,
  holdReference: null,

  addProduct: (product) => {
    const lines = get().lines;
    const existing = lines.find((l) => l.product._id === product._id);
    if (existing) {
      set({
        lines: lines.map((l) =>
          l.product._id === product._id ? { ...l, quantity: l.quantity + 1 } : l
        ),
      });
    } else {
      set({ lines: [...lines, { product, quantity: 1, discount: 0 }] });
    }
  },

  incrementLine: (productId, by = 1) => {
    set({
      lines: get()
        .lines.map((l) =>
          l.product._id === productId ? { ...l, quantity: Math.max(1, l.quantity + by) } : l
        )
        .filter((l) => l.quantity > 0),
    });
  },

  setQuantity: (productId, quantity) => {
    set({
      lines: get().lines.map((l) =>
        l.product._id === productId ? { ...l, quantity: Math.max(1, quantity) } : l
      ),
    });
  },

  setLineDiscount: (productId, discount) => {
    set({
      lines: get().lines.map((l) =>
        l.product._id === productId ? { ...l, discount: Math.max(0, discount) } : l
      ),
    });
  },

  removeLine: (productId) => {
    set({ lines: get().lines.filter((l) => l.product._id !== productId) });
  },

  setOverallDiscount: (amount) => set({ overallDiscount: Math.max(0, amount) }),
  setCustomer: (customerId) => set({ customer: customerId }),
  setHoldReference: (ref) => set({ holdReference: ref }),

  loadCart: (lines, customer = null) => set({ lines, customer, overallDiscount: 0 }),

  clear: () => set({ lines: [], overallDiscount: 0, customer: null, holdReference: null }),
}));

/** Client-side mirror of the backend calculation, used for instant UI feedback before the
 * authoritative /sales/preview response comes back. */
export function computeTotals(lines: CartLine[], overallDiscount: number) {
  let subtotal = 0;
  let tax = 0;
  let itemDiscount = 0;
  for (const l of lines) {
    const gross = l.product.sellingPrice * l.quantity;
    const net = gross - l.discount;
    const lineTax = (net * (l.product.taxRate || 0)) / 100;
    subtotal += gross;
    itemDiscount += l.discount;
    tax += lineTax;
  }
  const discount = itemDiscount + overallDiscount;
  const total = Math.max(0, subtotal - itemDiscount + tax - overallDiscount);
  return {
    subtotal: round2(subtotal),
    discount: round2(discount),
    tax: round2(tax),
    total: round2(total),
  };
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
