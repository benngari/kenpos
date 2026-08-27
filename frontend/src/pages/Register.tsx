import { useEffect, useState } from "react";
import Header from "../components/Header";
import DataTable, { Column } from "../components/DataTable";
import Modal from "../components/Modal";
import { api, errorMessage } from "../lib/api";
import { useAuthStore, can } from "../store/authStore";
import toast from "react-hot-toast";

export default function Register() {
  const { user } = useAuthStore();
  const [current, setCurrent] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [openingCash, setOpeningCash] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [closeSummary, setCloseSummary] = useState<any>(null);

  async function load() {
    try {
      const { data } = await api.get("/register/current");
      setCurrent(data);
    } catch (err) {
      toast.error(errorMessage(err));
    }
    if (can(user?.role, "manager")) {
      try {
        const { data } = await api.get("/register/sessions");
        setSessions(data);
      } catch {
        /* ignore for non-managers */
      }
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openRegister() {
    try {
      await api.post("/register/open", { openingCash: parseFloat(openingCash) || 0 });
      toast.success("Register opened");
      setShowOpen(false);
      setOpeningCash("");
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function closeRegister() {
    if (!current) return;
    try {
      const { data } = await api.post(`/register/${current._id}/close`, { closingCash: parseFloat(closingCash) || 0 });
      setCloseSummary(data);
      setShowClose(false);
      setClosingCash("");
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const columns: Column<any>[] = [
    { header: "Cashier", render: (s) => s.cashier?.name || "-" },
    { header: "Opened", render: (s) => new Date(s.openedAt).toLocaleString("en-KE") },
    { header: "Opening Cash", render: (s) => `KES ${s.openingCash.toFixed(2)}` },
    { header: "Expected", render: (s) => (s.expectedCash != null ? `KES ${s.expectedCash.toFixed(2)}` : "-") },
    { header: "Actual", render: (s) => (s.closingCash != null ? `KES ${s.closingCash.toFixed(2)}` : "-") },
    {
      header: "Difference",
      render: (s) =>
        s.difference != null ? (
          <span className={s.difference < 0 ? "text-red-500" : "text-green-600"}>KES {s.difference.toFixed(2)}</span>
        ) : (
          "-"
        ),
    },
    { header: "Status", render: (s) => <span className="capitalize">{s.status}</span> },
  ];

  return (
    <>
      <Header title="Cashier Register" />
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          {current ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Register open since</p>
                <p className="font-semibold text-slate-800">{new Date(current.openedAt).toLocaleString("en-KE")}</p>
                <p className="text-sm text-slate-500 mt-1">Opening cash: KES {current.openingCash.toFixed(2)}</p>
              </div>
              <button onClick={() => setShowClose(true)} className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">
                Close Register
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">You don't have an open register session.</p>
              <button onClick={() => setShowOpen(true)} className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">
                Open Register
              </button>
            </div>
          )}
        </div>

        {can(user?.role, "manager") && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Register Session History</h3>
            <DataTable columns={columns} rows={sessions} />
          </div>
        )}
      </div>

      {showOpen && (
        <Modal title="Open Register" onClose={() => setShowOpen(false)} width="max-w-sm">
          <label className="text-xs text-slate-500">Opening Cash Amount</label>
          <input
            type="number"
            autoFocus
            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            placeholder="e.g. 10000"
          />
          <button onClick={openRegister} className="w-full mt-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold">
            Open Register
          </button>
        </Modal>
      )}

      {showClose && (
        <Modal title="Close Register" onClose={() => setShowClose(false)} width="max-w-sm">
          <label className="text-xs text-slate-500">Actual Cash Counted</label>
          <input
            type="number"
            autoFocus
            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={closingCash}
            onChange={(e) => setClosingCash(e.target.value)}
          />
          <button onClick={closeRegister} className="w-full mt-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">
            Close Register
          </button>
        </Modal>
      )}

      {closeSummary && (
        <Modal title="Register Closed" onClose={() => setCloseSummary(null)} width="max-w-sm">
          <div className="space-y-2 text-sm">
            <Row label="Expected Cash" value={`KES ${closeSummary.session.expectedCash.toFixed(2)}`} />
            <Row label="Actual Cash" value={`KES ${closeSummary.session.closingCash.toFixed(2)}`} />
            <Row
              label="Difference"
              value={`KES ${closeSummary.session.difference.toFixed(2)}`}
              tone={closeSummary.session.difference < 0 ? "text-red-500" : "text-green-600"}
            />
            <Row label="Total Sales" value={String(closeSummary.summary.totalSales)} />
            {Object.entries(closeSummary.summary.byMethod).map(([method, amount]) => (
              <Row key={method} label={method} value={`KES ${(amount as number).toFixed(2)}`} />
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

function Row({ label, value, tone = "text-slate-800" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex justify-between capitalize">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium ${tone}`}>{value}</span>
    </div>
  );
}
