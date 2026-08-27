import { useEffect, useState } from "react";
import Header from "../components/Header";
import DataTable, { Column } from "../components/DataTable";
import Modal, { ConfirmDialog } from "../components/Modal";
import Receipt from "../components/Receipt";
import { api, errorMessage } from "../lib/api";
import { Sale } from "../types";
import { Eye, RotateCcw, Ban } from "lucide-react";
import { useAuthStore, can } from "../store/authStore";
import toast from "react-hot-toast";

export default function SalesHistory() {
  const { user } = useAuthStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Sale | null>(null);
  const [refunding, setRefunding] = useState<Sale | null>(null);
  const [refundQtys, setRefundQtys] = useState<Record<string, number>>({});
  const [refundReason, setRefundReason] = useState("");
  const [voidTarget, setVoidTarget] = useState<Sale | null>(null);
  const [filters, setFilters] = useState({ from: "", to: "", paymentMethod: "" });

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/sales", {
        params: {
          from: filters.from || undefined,
          to: filters.to || undefined,
          paymentMethod: filters.paymentMethod || undefined,
          limit: 50,
        },
      });
      setSales(data.items);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function confirmVoid() {
    if (!voidTarget) return;
    try {
      await api.post(`/sales/${voidTarget._id}/void`);
      toast.success("Sale voided and stock restored");
      setVoidTarget(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  function openRefund(sale: Sale) {
    setRefunding(sale);
    setRefundQtys(Object.fromEntries(sale.items.map((i) => [i.product, 0])));
    setRefundReason("");
  }

  async function submitRefund() {
    if (!refunding) return;
    const items = Object.entries(refundQtys)
      .filter(([, qty]) => qty > 0)
      .map(([product, quantity]) => ({ product, quantity }));
    if (!items.length) {
      toast.error("Select at least one item to refund");
      return;
    }
    try {
      await api.post(`/sales/${refunding._id}/refund`, { items, reason: refundReason });
      toast.success("Refund processed");
      setRefunding(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const columns: Column<Sale>[] = [
    { header: "Receipt#", render: (s) => s.receiptNumber },
    { header: "Date", render: (s) => new Date(s.createdAt).toLocaleString("en-KE") },
    { header: "Cashier", render: (s) => (typeof s.cashier === "object" ? s.cashier.name : "-") },
    { header: "Customer", render: (s) => (typeof s.customer === "object" && s.customer ? s.customer.name : "Walk-in") },
    { header: "Items", render: (s) => s.items.length },
    { header: "Total", render: (s) => `KES ${s.total.toFixed(2)}` },
    { header: "Payment", render: (s) => s.payments.map((p) => p.method).join(", ") },
    {
      header: "Status",
      render: (s) => (
        <span
          className={`text-xs px-2 py-0.5 rounded-full capitalize ${
            s.status === "completed"
              ? "bg-green-100 text-green-700"
              : s.status === "voided"
              ? "bg-red-100 text-red-600"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {s.status.replace("_", " ")}
        </span>
      ),
    },
    {
      header: "",
      render: (s) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => setViewing(s)} className="p-1.5 text-slate-400 hover:text-brand-600" title="View / Print">
            <Eye size={15} />
          </button>
          {can(user?.role, "manager") && s.status === "completed" && (
            <>
              <button onClick={() => openRefund(s)} className="p-1.5 text-slate-400 hover:text-amber-600" title="Refund">
                <RotateCcw size={15} />
              </button>
              <button onClick={() => setVoidTarget(s)} className="p-1.5 text-slate-400 hover:text-red-500" title="Void">
                <Ban size={15} />
              </button>
            </>
          )}
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <>
      <Header title="Sales History" />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          <input type="date" className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          <input type="date" className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          <select
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={filters.paymentMethod}
            onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
          >
            <option value="">All payment methods</option>
            <option value="cash">Cash</option>
            <option value="mpesa">M-Pesa</option>
            <option value="card">Card</option>
            <option value="bank">Bank</option>
            <option value="credit">Credit</option>
          </select>
        </div>
        <DataTable columns={columns} rows={sales} loading={loading} emptyText="No sales recorded yet" />
      </div>

      {viewing && (
        <Modal title="Sale Details" onClose={() => setViewing(null)} width="max-w-sm">
          <Receipt sale={viewing} />
          <button onClick={() => window.print()} className="w-full mt-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium">
            Print Receipt
          </button>
        </Modal>
      )}

      {refunding && (
        <Modal title={`Refund - ${refunding.receiptNumber}`} onClose={() => setRefunding(null)} width="max-w-md">
          <div className="space-y-3">
            {refunding.items.map((item) => (
              <div key={item.product} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-slate-400">Sold: {item.quantity}</p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={item.quantity}
                  className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm"
                  value={refundQtys[item.product] || 0}
                  onChange={(e) =>
                    setRefundQtys({
                      ...refundQtys,
                      [item.product]: Math.min(item.quantity, Math.max(0, parseInt(e.target.value) || 0)),
                    })
                  }
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-500">Reason</label>
              <input
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Damaged item, wrong product"
              />
            </div>
          </div>
          <button onClick={submitRefund} className="w-full mt-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold">
            Process Refund
          </button>
        </Modal>
      )}

      {voidTarget && (
        <ConfirmDialog
          title="Void sale"
          message={`Void receipt ${voidTarget.receiptNumber}? Stock will be restored and the sale marked voided.`}
          confirmLabel="Void Sale"
          danger
          onConfirm={confirmVoid}
          onCancel={() => setVoidTarget(null)}
        />
      )}
    </>
  );
}
