import { useEffect, useState } from "react";
import Header from "../components/Header";
import DataTable, { Column } from "../components/DataTable";
import Modal from "../components/Modal";
import StatCard from "../components/StatCard";
import { api, errorMessage } from "../lib/api";
import { Product } from "../types";
import { Boxes, AlertTriangle, XCircle, DollarSign, PlusCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function Inventory() {
  const [summary, setSummary] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMove, setShowMove] = useState(false);
  const [form, setForm] = useState({ product: "", type: "in", quantity: 1, reason: "" });

  async function load() {
    setLoading(true);
    try {
      const [s, m] = await Promise.all([
        api.get("/inventory/summary"),
        api.get("/inventory/movements", { params: { limit: 30 } }),
      ]);
      setSummary(s.data);
      setMovements(m.data.items);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submitMovement() {
    try {
      await api.post("/inventory/movements", form);
      toast.success("Stock movement recorded");
      setShowMove(false);
      setForm({ product: "", type: "in", quantity: 1, reason: "" });
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const stockColumns: Column<Product>[] = [
    { header: "Product", render: (p) => p.name },
    { header: "SKU", render: (p) => p.sku },
    {
      header: "Stock",
      render: (p) => (
        <span className={p.stock <= 0 ? "text-red-500" : p.stock <= p.minStock ? "text-amber-600" : "text-slate-700"}>
          {p.stock} {p.unit}
        </span>
      ),
    },
    { header: "Min Stock", render: (p) => p.minStock },
    { header: "Stock Value", render: (p) => `KES ${(p.stock * p.buyingPrice).toFixed(2)}` },
  ];

  return (
    <>
      <Header title="Inventory" />
      <div className="p-6 space-y-6">
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Products" value={String(summary.totalProducts)} icon={Boxes} />
            <StatCard label="Stock Value" value={`KES ${summary.stockValue.toLocaleString()}`} icon={DollarSign} tone="green" />
            <StatCard label="Low Stock" value={String(summary.lowStock.length)} icon={AlertTriangle} tone="amber" />
            <StatCard label="Out of Stock" value={String(summary.outOfStock.length)} icon={XCircle} tone="red" />
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => setShowMove(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium"
          >
            <PlusCircle size={16} /> Record Stock Movement
          </button>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Current Stock</h3>
          <DataTable columns={stockColumns} rows={summary?.products || []} loading={loading} />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Recent Stock Movements</h3>
          <DataTable
            columns={[
              { header: "Product", render: (m: any) => m.product?.name || "-" },
              {
                header: "Type",
                render: (m: any) => <span className="capitalize">{m.type}</span>,
              },
              {
                header: "Quantity",
                render: (m: any) => (
                  <span className={m.quantity >= 0 ? "text-green-600" : "text-red-500"}>
                    {m.quantity >= 0 ? "+" : ""}
                    {m.quantity}
                  </span>
                ),
              },
              { header: "Reason / Ref", render: (m: any) => m.reason || m.reference || "-" },
              { header: "User", render: (m: any) => m.user?.name || "-" },
              { header: "Date", render: (m: any) => new Date(m.createdAt).toLocaleString("en-KE") },
            ]}
            rows={movements}
            loading={loading}
          />
        </div>
      </div>

      {showMove && (
        <Modal title="Record Stock Movement" onClose={() => setShowMove(false)} width="max-w-sm">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500">Product</label>
              <select
                className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
              >
                <option value="">Select product</option>
                {(summary?.products || []).map((p: Product) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.stock} {p.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Movement Type</label>
              <select
                className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="in">Stock In</option>
                <option value="out">Stock Out (damage/loss/expiry)</option>
                <option value="adjustment">Adjustment</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Quantity</label>
              <input
                type="number"
                className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
              />
              {form.type === "adjustment" && (
                <p className="text-[11px] text-slate-400 mt-1">Use a negative number to decrease stock.</p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-500">Reason</label>
              <input
                className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
          </div>
          <button onClick={submitMovement} className="w-full mt-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold">
            Record Movement
          </button>
        </Modal>
      )}
    </>
  );
}
