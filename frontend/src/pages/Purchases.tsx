import { useEffect, useState } from "react";
import Header from "../components/Header";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { api, errorMessage } from "../lib/api";
import { Product, Supplier } from "../types";
import { Plus, Trash2, PackageCheck, XCircle } from "lucide-react";
import toast from "react-hot-toast";

interface PurchaseLine {
  product: string;
  name: string;
  quantity: number;
  buyingPrice: number;
}

export default function Purchases() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [supplier, setSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [lines, setLines] = useState<PurchaseLine[]>([]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/purchases");
      setPurchases(data);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    api.get("/suppliers").then((r) => setSuppliers(r.data));
    api.get("/products", { params: { limit: 200 } }).then((r) => setProducts(r.data.items));
  }, []);

  function addLine() {
    if (!products.length) return;
    const p = products[0];
    setLines([...lines, { product: p._id, name: p.name, quantity: 1, buyingPrice: p.buyingPrice }]);
  }

  function updateLine(idx: number, patch: Partial<PurchaseLine>) {
    setLines(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function removeLine(idx: number) {
    setLines(lines.filter((_, i) => i !== idx));
  }

  async function submit() {
    if (!supplier || !invoiceNumber || lines.length === 0) {
      toast.error("Supplier, invoice number, and at least one item are required");
      return;
    }
    try {
      await api.post("/purchases", { supplier, invoiceNumber, items: lines });
      toast.success("Purchase order created");
      setShowForm(false);
      setSupplier("");
      setInvoiceNumber("");
      setLines([]);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function receive(id: string) {
    try {
      await api.post(`/purchases/${id}/receive`);
      toast.success("Purchase received - stock updated");
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function cancel(id: string) {
    try {
      await api.post(`/purchases/${id}/cancel`);
      toast.success("Purchase cancelled");
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <>
      <Header title="Purchases" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium">
            <Plus size={16} /> New Purchase
          </button>
        </div>
        <DataTable
          columns={[
            { header: "Invoice#", render: (p: any) => p.invoiceNumber },
            { header: "Supplier", render: (p: any) => p.supplier?.name || "-" },
            { header: "Items", render: (p: any) => p.items.length },
            { header: "Total", render: (p: any) => `KES ${p.total.toFixed(2)}` },
            {
              header: "Status",
              render: (p: any) => (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    p.status === "received" ? "bg-green-100 text-green-700" : p.status === "cancelled" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {p.status}
                </span>
              ),
            },
            { header: "Date", render: (p: any) => new Date(p.createdAt).toLocaleDateString("en-KE") },
            {
              header: "",
              render: (p: any) =>
                p.status === "pending" ? (
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => receive(p._id)} className="p-1.5 text-slate-400 hover:text-green-600" title="Mark received">
                      <PackageCheck size={15} />
                    </button>
                    <button onClick={() => cancel(p._id)} className="p-1.5 text-slate-400 hover:text-red-500" title="Cancel">
                      <XCircle size={15} />
                    </button>
                  </div>
                ) : null,
              className: "text-right",
            },
          ]}
          rows={purchases}
          loading={loading}
          emptyText="No purchases recorded yet"
        />
      </div>

      {showForm && (
        <Modal title="New Purchase Order" onClose={() => setShowForm(false)} width="max-w-2xl">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-slate-500">Supplier</label>
              <select className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Invoice Number</label>
              <input className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            {lines.map((l, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                  value={l.product}
                  onChange={(e) => {
                    const p = products.find((pp) => pp._id === e.target.value);
                    updateLine(idx, { product: e.target.value, name: p?.name || "", buyingPrice: p?.buyingPrice || 0 });
                  }}
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                  value={l.quantity}
                  onChange={(e) => updateLine(idx, { quantity: parseFloat(e.target.value) || 0 })}
                  placeholder="Qty"
                />
                <input
                  type="number"
                  className="w-28 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                  value={l.buyingPrice}
                  onChange={(e) => updateLine(idx, { buyingPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="Buy price"
                />
                <span className="w-24 text-sm text-slate-600">KES {(l.quantity * l.buyingPrice).toFixed(2)}</span>
                <button onClick={() => removeLine(idx)} className="text-slate-400 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button onClick={addLine} className="text-sm text-brand-600 font-medium">
              + Add item
            </button>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
            <span className="font-semibold text-slate-700">
              Total: KES {lines.reduce((s, l) => s + l.quantity * l.buyingPrice, 0).toFixed(2)}
            </span>
            <button onClick={submit} className="px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold">
              Create Purchase
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
