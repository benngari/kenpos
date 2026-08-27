import { useEffect, useState } from "react";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import { api, errorMessage } from "../lib/api";
import {
  DollarSign,
  Receipt as ReceiptIcon,
  Package,
  Smartphone,
  CreditCard,
  Wallet,
  AlertTriangle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

function getRange(key: string) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (key === "yesterday") {
    start.setDate(now.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(now.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (key === "week") {
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
  } else if (key === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setHours(0, 0, 0, 0);
  }
  return { from: start.toISOString(), to: end.toISOString() };
}

const COLORS = ["#0f9d58", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Dashboard() {
  const [rangeKey, setRangeKey] = useState("today");
  const [summary, setSummary] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [byMethod, setByMethod] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [byCategory, setByCategory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { from, to } = getRange(rangeKey);
    setLoading(true);
    Promise.all([
      api.get("/reports/dashboard", { params: { from, to } }),
      api.get("/reports/sales-over-time", { params: { from, to } }),
      api.get("/reports/by-payment-method", { params: { from, to } }),
      api.get("/reports/top-products", { params: { from, to, limit: 5 } }),
      api.get("/reports/by-category", { params: { from, to } }),
    ])
      .then(([s, t, m, p, c]) => {
        setSummary(s.data);
        setTrend(t.data);
        setByMethod(m.data);
        setTopProducts(p.data);
        setByCategory(c.data);
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [rangeKey]);

  return (
    <>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRangeKey(r.key)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                rangeKey === r.key
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {loading || !summary ? (
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Sales" value={`KES ${summary.todaySales.toLocaleString()}`} icon={DollarSign} tone="green" />
              <StatCard label="Net Profit" value={`KES ${summary.netProfit.toLocaleString()}`} icon={TrendingUp} tone="blue" />
              <StatCard label="Transactions" value={String(summary.transactions)} icon={ReceiptIcon} />
              <StatCard label="Items Sold" value={String(summary.itemsSold)} icon={Package} />
              <StatCard label="Cash Sales" value={`KES ${summary.cashSales.toLocaleString()}`} icon={Wallet} />
              <StatCard label="M-Pesa Sales" value={`KES ${summary.mpesaSales.toLocaleString()}`} icon={Smartphone} tone="green" />
              <StatCard label="Card Sales" value={`KES ${summary.cardSales.toLocaleString()}`} icon={CreditCard} tone="blue" />
              <StatCard label="Expenses" value={`KES ${summary.expenses.toLocaleString()}`} icon={Wallet} tone="red" />
            </div>

            {(summary.lowStockCount > 0 || summary.outOfStockCount > 0) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertTriangle className="text-amber-600" size={20} />
                  <p className="text-sm text-amber-800">
                    <strong>{summary.lowStockCount}</strong> product(s) are running low on stock
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <XCircle className="text-red-600" size={20} />
                  <p className="text-sm text-red-800">
                    <strong>{summary.outOfStockCount}</strong> product(s) are out of stock
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Sales Over Time</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#0f9d58" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Sales by Payment Method</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byMethod} dataKey="total" nameKey="method" outerRadius={80} label>
                      {byMethod.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Top Selling Products</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topProducts} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Sales by Category</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byCategory}>
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#0f9d58" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
