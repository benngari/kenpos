import { useEffect, useState } from "react";
import Header from "../components/Header";
import DataTable, { Column } from "../components/DataTable";
import Modal from "../components/Modal";
import { api, errorMessage } from "../lib/api";
import { Supplier } from "../types";
import { Plus, FileText } from "lucide-react";
import toast from "react-hot-toast";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", taxPin: "" });
  const [history, setHistory] = useState<any>(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/suppliers");
      setSuppliers(data);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function submit() {
    try {
      await api.post("/suppliers", form);
      toast.success("Supplier added");
      setShowForm(false);
      setForm({ name: "", phone: "", email: "", address: "", taxPin: "" });
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function viewHistory(s: Supplier) {
    try {
      const { data } = await api.get(`/suppliers/${s._id}/history`);
      setHistory(data);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const columns: Column<Supplier>[] = [
    { header: "Name", render: (s) => s.name },
    { header: "Phone", render: (s) => s.phone || "-" },
    { header: "Email", render: (s) => s.email || "-" },
    { header: "KRA PIN", render: (s) => s.taxPin || "-" },
    { header: "Balance", render: (s) => `KES ${s.balance.toFixed(2)}` },
    {
      header: "",
      render: (s) => (
        <button onClick={() => viewHistory(s)} className="p-1.5 text-slate-400 hover:text-brand-600">
          <FileText size={15} />
        </button>
      ),
      className: "text-right",
    },
  ];

  return (
    <>
      <Header title="Suppliers" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium">
            <Plus size={16} /> Add Supplier
          </button>
        </div>
        <DataTable columns={columns} rows={suppliers} loading={loading} emptyText="No suppliers yet" />
      </div>

      {showForm && (
        <Modal title="Add Supplier" onClose={() => setShowForm(false)} width="max-w-sm">
          <div className="space-y-3">
            {(["name", "phone", "email", "address", "taxPin"] as const).map((f) => (
              <div key={f}>
                <label className="text-xs text-slate-500 capitalize">{f === "taxPin" ? "KRA PIN" : f}</label>
                <input
                  value={(form as any)[f]}
                  onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
          <button onClick={submit} className="w-full mt-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold">
            Save Supplier
          </button>
        </Modal>
      )}

      {history && (
        <Modal title={`Purchase History - ${history.supplier.name}`} onClose={() => setHistory(null)}>
          <div className="bg-slate-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-slate-500">Outstanding Balance</p>
            <p className="font-bold text-slate-800">KES {history.supplier.balance.toFixed(2)}</p>
          </div>
          <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {history.purchases.map((p: any) => (
              <li key={p._id} className="py-2 flex justify-between text-sm">
                <span>
                  {p.invoiceNumber} · {new Date(p.createdAt).toLocaleDateString("en-KE")}
                </span>
                <span className="font-medium">KES {p.total.toFixed(2)} ({p.status})</span>
              </li>
            ))}
            {history.purchases.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No purchases yet</p>}
          </ul>
        </Modal>
      )}
    </>
  );
}
