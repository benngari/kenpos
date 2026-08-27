import { useEffect, useState } from "react";
import Header from "../components/Header";
import DataTable, { Column } from "../components/DataTable";
import { api, errorMessage } from "../lib/api";
import { Download } from "lucide-react";
import toast from "react-hot-toast";

const TABS = [
  { key: "sales", label: "Sales" },
  { key: "profit", label: "Profit" },
  { key: "inventory", label: "Inventory" },
  { key: "products", label: "Products" },
  { key: "cashiers", label: "Cashiers" },
  { key: "payments", label: "Payments" },
];

function toCSV(rows: any[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => JSON.stringify(r[h] ?? "")).join(","));
  }
  return lines.join("\n");
}

function downloadCSV(rows: any[], filename: string) {
  const csv = toCSV(rows);
  if (!csv) {
    toast.error("Nothing to export");
    return;
  }
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [tab, setTab] = useState("sales");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [salesRows, setSalesRows] = useState<any[]>([]);
  const [profit, setProfit] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [byMethod, setByMethod] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    const params = { from: from || undefined, to: to || undefined };
    Promise.all([
      api.get("/sales", { params: { ...params, limit: 100 } }),
      api.get("/reports/profit", { params }),
      api.get("/inventory/summary"),
      api.get("/reports/top-products", { params: { ...params, limit: 15 } }),
      api.get("/reports/by-cashier", { params }),
      api.get("/reports/by-payment-method", { params }),
    ])
      .then(([s, p, i, tp, c, m]) => {
        setSalesRows(s.data.items);
        setProfit(p.data);
        setInventory(i.data);
        setTopProducts(tp.data);
        setCashiers(c.data);
        setByMethod(m.data);
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [from, to]);

  const salesColumns: Column<any>[] = [
    { header: "Receipt#", render: (s) => s.receiptNumber },
    { header: "Date", render: (s) => new Date(s.createdAt).toLocaleDateString("en-KE") },
    { header: "Cashier", render: (s) => s.cashier?.name || "-" },
    { header: "Total", render: (s) => `KES ${s.total.toFixed(2)}` },
    { header: "Status", render: (s) => s.status },
  ];

  return (
    <>
      <Header title="Reports" />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <input type="date" className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
          <div className="flex gap-2 ml-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 text-sm rounded-lg border ${
                  tab === t.key ? "bg-brand-600 text-white border-brand-600" : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "sales" && (
          <>
            <div className="flex justify-end">
              <ExportButton onClick={() => downloadCSV(salesRows, "sales-report.csv")} />
            </div>
            <DataTable columns={salesColumns} rows={salesRows} loading={loading} />
          </>
        )}

        {tab === "profit" && profit && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <ReportStat label="Revenue" value={profit.revenue} />
            <ReportStat label="Cost of Goods" value={profit.costOfGoods} />
            <ReportStat label="Gross Profit" value={profit.grossProfit} tone="green" />
            <ReportStat label="Expenses" value={profit.expenses} tone="red" />
            <ReportStat label="Net Profit" value={profit.netProfit} tone="blue" />
          </div>
        )}

        {tab === "inventory" && inventory && (
          <>
            <div className="flex justify-end">
              <ExportButton onClick={() => downloadCSV(inventory.products, "inventory-report.csv")} />
            </div>
            <DataTable
              columns={[
                { header: "Product", render: (p: any) => p.name },
                { header: "Stock", render: (p: any) => `${p.stock} ${p.unit}` },
                { header: "Buying Price", render: (p: any) => `KES ${p.buyingPrice.toFixed(2)}` },
                { header: "Stock Value", render: (p: any) => `KES ${(p.stock * p.buyingPrice).toFixed(2)}` },
              ]}
              rows={inventory.products}
              loading={loading}
            />
          </>
        )}

        {tab === "products" && (
          <>
            <div className="flex justify-end">
              <ExportButton onClick={() => downloadCSV(topProducts, "product-report.csv")} />
            </div>
            <DataTable
              columns={[
                { header: "Product", render: (p: any) => p.name },
                { header: "Quantity Sold", render: (p: any) => p.quantity },
                { header: "Revenue", render: (p: any) => `KES ${p.revenue.toFixed(2)}` },
              ]}
              rows={topProducts}
              loading={loading}
            />
          </>
        )}

        {tab === "cashiers" && (
          <>
            <div className="flex justify-end">
              <ExportButton onClick={() => downloadCSV(cashiers, "cashier-report.csv")} />
            </div>
            <DataTable
              columns={[
                { header: "Cashier", render: (c: any) => c.name },
                { header: "Transactions", render: (c: any) => c.transactions },
                { header: "Total Sales", render: (c: any) => `KES ${c.total.toFixed(2)}` },
              ]}
              rows={cashiers}
              loading={loading}
            />
          </>
        )}

        {tab === "payments" && (
          <>
            <div className="flex justify-end">
              <ExportButton onClick={() => downloadCSV(byMethod, "payment-report.csv")} />
            </div>
            <DataTable
              columns={[
                { header: "Method", render: (m: any) => <span className="capitalize">{m.method}</span> },
                { header: "Total", render: (m: any) => `KES ${m.total.toFixed(2)}` },
              ]}
              rows={byMethod}
              loading={loading}
            />
          </>
        )}
      </div>
    </>
  );
}

function ReportStat({ label, value, tone = "slate" }: { label: string; value: number; tone?: string }) {
  const colors: Record<string, string> = { slate: "text-slate-800", green: "text-green-600", red: "text-red-500", blue: "text-blue-600" };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${colors[tone]}`}>KES {value.toLocaleString()}</p>
    </div>
  );
}

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
      <Download size={14} /> Export CSV
    </button>
  );
}
