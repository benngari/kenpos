import { useEffect, useState } from "react";
import Header from "../components/Header";
import DataTable, { Column } from "../components/DataTable";
import Modal from "../components/Modal";
import { api, errorMessage } from "../lib/api";
import { Expense } from "../types";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = ["Transport", "Rent", "Electricity", "Salaries", "Internet", "Supplies", "Maintenance", "Other"];

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "Other",
    amount: 0,
    description: "",
    paymentMethod: "cash",
    date: new Date().toISOString().slice(0, 10),
  });

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/expenses");
      setExpenses(data);
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
      await api.post("/expenses", form);
      toast.success("Expense recorded");
      setShowForm(false);
      setForm({ title: "", category: "Other", amount: 0, description: "", paymentMethod: "cash", date: new Date().toISOString().slice(0, 10) });
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const columns: Column<Expense>[] = [
    { header: "Title", render: (e) => e.title },
    { header: "Category", render: (e) => e.category },
    { header: "Amount", render: (e) => `KES ${e.amount.toFixed(2)}` },
    { header: "Method", render: (e) => <span className="capitalize">{e.paymentMethod}</span> },
    { header: "Recorded By", render: (e) => e.user?.name || "-" },
    { header: "Date", render: (e) => new Date(e.date).toLocaleDateString("en-KE") },
  ];

  return (
    <>
      <Header title="Expenses" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5">
            <span className="text-xs text-slate-500 mr-2">Total Expenses</span>
            <span className="font-bold text-slate-800">KES {total.toLocaleString()}</span>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium">
            <Plus size={16} /> Add Expense
          </button>
        </div>
        <DataTable columns={columns} rows={expenses} loading={loading} emptyText="No expenses recorded yet" />
      </div>

      {showForm && (
        <Modal title="Record Expense" onClose={() => setShowForm(false)} width="max-w-sm">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500">Title</label>
              <input className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Category</label>
              <select className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Amount</label>
              <input type="number" className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Payment Method</label>
              <select
                className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="card">Card</option>
                <option value="bank">Bank</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Date</label>
              <input type="date" className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Description</label>
              <textarea className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <button onClick={submit} className="w-full mt-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold">
            Save Expense
          </button>
        </Modal>
      )}
    </>
  );
}
