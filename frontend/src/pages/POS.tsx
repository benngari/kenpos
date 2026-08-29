import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { api, errorMessage } from "../lib/api";
import { Category, Customer, Product, Sale } from "../types";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import Cart from "../components/Cart";
import PaymentModal from "../components/PaymentModal";
import Modal from "../components/Modal";
import Receipt from "../components/Receipt";
import { useCartStore, computeTotals } from "../store/cartStore";
import { useUiStore } from "../store/uiStore";
import { cacheProducts, getCachedProducts, queueSale } from "../lib/offlineDb";
import { Search, Barcode, PauseCircle } from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [showHeld, setShowHeld] = useState(false);
  const [heldSales, setHeldSales] = useState<any[]>([]);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { lines, overallDiscount, customer, addProduct, loadCart, clear, setHoldReference, holdReference } =
    useCartStore();
  const { touchMode } = useUiStore();

  const loadProducts = useCallback(async () => {
    try {
      const { data } = await api.get("/products", { params: { limit: 100, status: "active" } });
      setProducts(data.items);
      await cacheProducts(data.items);
    } catch (err) {
      const cached = await getCachedProducts();
      if (cached.length) {
        setProducts(cached);
        toast("Working offline with cached product list", { icon: "🟡" });
      } else {
        toast.error(errorMessage(err));
      }
    }
  }, []);

  useEffect(() => {
    loadProducts();
    api.get("/categories").then((r) => setCategories(r.data)).catch(() => {});
    api.get("/customers").then((r) => setCustomers(r.data)).catch(() => {});
  }, [loadProducts]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        if (lines.length) setShowHeldPrompt(true);
      } else if (e.key === "F8") {
        e.preventDefault();
        if (lines.length) setShowPayment(true);
      } else if (e.key === "Escape") {
        setShowPayment(false);
        setShowHeld(false);
        setCompletedSale(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.length]);

  const [showHeldPrompt, setShowHeldPrompt] = useState(false);
  const [holdName, setHoldName] = useState("");

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory) {
      list = list.filter((p) => {
        const catId = typeof p.category === "object" ? p.category._id : p.category;
        return catId === activeCategory;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode?.includes(q)
      );
    }
    return list;
  }, [products, activeCategory, search]);

  // Barcode scanner support: fast sequential keystrokes ending in Enter while search focused
  async function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const code = search.trim();
    if (!code) return;
    const exact = products.find((p) => p.barcode === code || p.sku === code);
    if (exact) {
      addProduct(exact);
      setSearch("");
      return;
    }
    try {
      const { data } = await api.get(`/products/barcode/${code}`);
      addProduct(data);
      setSearch("");
    } catch {
      toast.error("No product found for that code");
    }
  }

  async function handleHold() {
    if (!holdName.trim()) {
      toast.error("Give this held sale a name or reference");
      return;
    }
    try {
      await api.post("/sales/hold", {
        items: lines.map((l) => ({ product: l.product._id, quantity: l.quantity, discount: l.discount })),
        overallDiscount,
        customer: customer || undefined,
        holdReference: holdName,
      });
      toast.success(`Sale held as "${holdName}"`);
      clear();
      setShowHeldPrompt(false);
      setHoldName("");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function openHeldSales() {
    try {
      const { data } = await api.get("/sales/held");
      setHeldSales(data);
      setShowHeld(true);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function resumeHeld(sale: any) {
    const resumedLines = sale.items
      .map((item: any) => {
        const product = products.find((p) => p._id === item.product);
        if (!product) return null;
        return { product, quantity: item.quantity, discount: item.discount };
      })
      .filter(Boolean);
    loadCart(resumedLines, sale.customer?._id || sale.customer || null);
    setHoldReference(sale.holdReference);
    await api.delete(`/sales/held/${sale._id}`);
    setShowHeld(false);
  }

  async function deleteHeld(id: string) {
    await api.delete(`/sales/held/${id}`);
    setHeldSales(heldSales.filter((s) => s._id !== id));
  }

  async function handlePaymentConfirm(payments: any[]) {
    const payload = {
      items: lines.map((l) => ({ product: l.product._id, quantity: l.quantity, discount: l.discount })),
      overallDiscount,
      payments,
      customer: customer || undefined,
    };
    setSubmitting(true);
    try {
      const { data } = await api.post("/sales/checkout", payload);
      setCompletedSale(data);
      clear();
      setShowPayment(false);
      loadProducts();
    } catch (err) {
      if (!navigator.onLine) {
        await queueSale(payload);
        toast.success("Offline: sale queued and will sync when back online");
        clear();
        setShowPayment(false);
      } else {
        toast.error(errorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const totals = computeTotals(lines, overallDiscount);

  return (
    <div className="flex w-full min-w-0">
      <div className="flex-1 min-w-0">
        <Header title="Point of Sale" />
        <div className={touchMode ? "p-6" : "p-4"}>
          <div className={clsx("flex items-center gap-3", touchMode ? "mb-6" : "mb-4")}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={touchMode ? 20 : 16} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={touchMode ? "Search by name, SKU, or scan barcode" : "Search by name, SKU, or scan barcode (F2)"}
                className={clsx(
                  "w-full pl-10 pr-10 border-2 border-slate-200 rounded-xl",
                  touchMode ? "py-5 text-lg rounded-2xl" : "py-2.5 text-sm"
                )}
              />
              <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={touchMode ? 20 : 16} />
            </div>
            <button
              onClick={openHeldSales}
              className={clsx(
                "flex items-center gap-2 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 whitespace-nowrap font-semibold",
                touchMode ? "px-6 py-5 text-lg rounded-2xl" : "px-3 py-2.5 text-sm rounded-lg"
              )}
            >
              <PauseCircle size={touchMode ? 24 : 16} /> Held Sales
            </button>
          </div>

          <div className={clsx("flex gap-2.5 overflow-x-auto scrollbar-thin pb-1", touchMode ? "mb-6" : "mb-4")}>
            <button
              onClick={() => setActiveCategory(null)}
              className={clsx(
                "rounded-full font-semibold whitespace-nowrap border-2",
                touchMode ? "px-5 py-3.5 text-base" : "px-3 py-1.5 text-xs",
                !activeCategory ? "bg-brand-600 text-white border-brand-600" : "border-slate-200 text-slate-600"
              )}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setActiveCategory(c._id)}
                className={clsx(
                  "rounded-full font-semibold whitespace-nowrap border-2",
                  touchMode ? "px-5 py-3.5 text-base" : "px-3 py-1.5 text-xs",
                  activeCategory === c._id ? "bg-brand-600 text-white border-brand-600" : "border-slate-200 text-slate-600"
                )}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>

          <div
            className={clsx(
              "grid",
              touchMode
                ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
            )}
          >
            {filtered.map((p) => (
              <ProductCard key={p._id} product={p} onClick={() => addProduct(p)} />
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full text-center text-slate-400 py-10 text-sm">No products match your search</p>
            )}
          </div>
        </div>
      </div>

      <Cart customers={customers} onOpenPayment={() => lines.length && setShowPayment(true)} onHold={() => setShowHeldPrompt(true)} />

      {showPayment && (
        <PaymentModal
          total={totals.total}
          hasCustomer={!!customer}
          onClose={() => setShowPayment(false)}
          onConfirm={handlePaymentConfirm}
          submitting={submitting}
        />
      )}

      {showHeldPrompt && (
        <Modal title="Hold this sale" onClose={() => setShowHeldPrompt(false)} width="max-w-sm">
          <input
            autoFocus
            placeholder='e.g. "Table 4" or "Customer John"'
            value={holdName}
            onChange={(e) => setHoldName(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-3"
          />
          <button onClick={handleHold} className="w-full py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold">
            Hold Sale
          </button>
        </Modal>
      )}

      {showHeld && (
        <Modal title="Held Sales" onClose={() => setShowHeld(false)}>
          {heldSales.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No held sales</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {heldSales.map((s) => (
                <li key={s._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{s.holdReference}</p>
                    <p className="text-xs text-slate-400">
                      {s.items.length} item(s) · KES {s.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => resumeHeld(s)} className="text-xs px-3 py-1.5 bg-brand-600 text-white rounded-lg">
                      Resume
                    </button>
                    <button onClick={() => deleteHeld(s._id)} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-red-500">
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {completedSale && (
        <Modal title="Payment Successful" onClose={() => setCompletedSale(null)} width="max-w-sm">
          <Receipt sale={completedSale} />
          <div className="grid grid-cols-3 gap-2 mt-4">
            <button onClick={() => window.print()} className="py-2 text-xs rounded-lg border border-slate-200">
              Print
            </button>
            <button onClick={() => window.print()} className="py-2 text-xs rounded-lg border border-slate-200">
              Download
            </button>
            <button
              onClick={() => setCompletedSale(null)}
              className="py-2 text-xs rounded-lg bg-brand-600 text-white font-medium"
            >
              New Sale
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}