import { useEffect, useState } from "react";
import Header from "../components/Header";
import DataTable, { Column } from "../components/DataTable";
import Modal from "../components/Modal";
import { api, errorMessage } from "../lib/api";
import { Customer } from "../types";
import { Plus, FileText, Search } from "lucide-react";
import toast from "react-hot-toast";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", type: "retail", creditLimit: 0 });
  const [statement, setStatement] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/customers", { params: { q: search || undefined } });
      setCustomers(data);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function submit() {
    try {
      await api.post("/customers", form);
      toast.success("Customer added");
      setShowForm(false);
      setForm({ name: "", phone: "", email: "", address: "", type: "retail", creditLimit: 0 });
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function openStatement(c: Customer) {
    try {
      const { data } = await api.get(`/customers/${c._id}/statement`);
      setStatement(data);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function recordPayment() {
    if (!statement || !paymentAmount) return;
    try {
      await api.post(`/customers/${statement.customer._id}/credit-payment`, { amount: parseFloat(paymentAmount) });
      toast.success("Payment recorded");
      setPaymentAmount("");
      openStatement(statement.customer);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const columns: Column<Customer>[] = [
    { header: "Name", render: (c) => c.name },
    { header: "Phone", render: (c) => c.phone || "-" },
    { header: "Type", render: (c) => <span className="capitalize">{c.type}</span> },
    { header: "Credit Limit", render: (c) => `KES ${c.creditLimit.toFixed(2)}` },
    {
      header: "Balance",
      render: (c) => <span className={c.balance > 0 ? "text-red-500 font-medium" : "text-slate-600"}>KES {c.balance.toFixed(2)}</span>,
    },
    {
      header: "",
      render: (c) => (
        <button onClick={() => openStatement(c)} className="p-1.5 text-slate-400 hover:text-brand-600">
          <FileText size={15} />
        </button>
      ),
      className: "text-right",
    },
  ];

  return (
    <>
      <Header title="Customers" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium">
            <Plus size={16} /> Add Customer
          </button>
        </div>
        <DataTable columns={columns} rows={customers} loading={loading} emptyText="No customers yet" />
      </div>

      {showForm && (
        <Modal title="Add Customer" onClose={() => setShowForm(false)} width="max-w-sm">
          <div className="space-y-3">
            <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Input label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <div>
              <label className="text-xs text-slate-500">Type</label>
              <select className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
              </select>
            </div>
            <Input label="Credit Limit" type="number" value={String(form.creditLimit)} onChange={(v) => setForm({ ...form, creditLimit: parseFloat(v) || 0 })} />
          </div>
          <button onClick={submit} className="w-full mt-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold">
            Save Customer
          </button>
        </Modal>
      )}

      {statement && (
        <Modal title={`Statement - ${statement.customer.name}`} onClose={() => setStatement(null)}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Total Spent</p>
              <p className="font-bold text-slate-800">KES {statement.totalSpent.toFixed(2)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs text-red-500">Outstanding Balance</p>
              <p className="font-bold text-red-600">KES {statement.outstandingBalance.toFixed(2)}</p>
            </div>
          </div>

          {statement.outstandingBalance > 0 && (
            <div className="flex gap-2 mb-4">
              <input
                type="number"
                placeholder="Payment amount"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              <button onClick={recordPayment} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium">
                Record Payment
              </button>
            </div>
          )}

          <h4 className="text-sm font-semibold text-slate-700 mb-2">Purchase History</h4>
          <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {statement.sales.map((s: any) => (
              <li key={s._id} className="py-2 flex justify-between text-sm">
                <span>
                  {s.receiptNumber} · {new Date(s.createdAt).toLocaleDateString("en-KE")}
                </span>
                <span className="font-medium">KES {s.total.toFixed(2)}</span>
              </li>
            ))}
            {statement.sales.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No purchases yet</p>}
          </ul>
        </Modal>
      )}
    </>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-slate-500">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
    </div>
  );
}
