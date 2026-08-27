import { useEffect, useState } from "react";
import Header from "../components/Header";
import DataTable, { Column } from "../components/DataTable";
import Modal from "../components/Modal";
import { ConfirmDialog } from "../components/Modal";
import { api, errorMessage } from "../lib/api";
import { Category, Product } from "../types";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import toast from "react-hot-toast";

const emptyForm = {
  name: "",
  sku: "",
  barcode: "",
  category: "",
  brand: "",
  description: "",
  imageUrl: "",
  buyingPrice: 0,
  sellingPrice: 0,
  taxRate: 16,
  stock: 0,
  minStock: 5,
  unit: "pc",
  expiryDate: "",
  status: "active" as const,
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/products", { params: { q: search || undefined, limit: 100 } });
      setProducts(data.items);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, category: categories[0]?._id || "" });
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      ...p,
      category: typeof p.category === "object" ? p.category._id : p.category,
      expiryDate: p.expiryDate ? p.expiryDate.slice(0, 10) : "",
    });
    setShowForm(true);
  }

  async function submit() {
    try {
      if (editing) {
        await api.put(`/products/${editing._id}`, form);
        toast.success("Product updated");
      } else {
        await api.post("/products", form);
        toast.success("Product created");
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/products/${deleteTarget._id}`);
      toast.success("Product deleted");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const columns: Column<Product>[] = [
    {
      header: "Product",
      render: (p) => (
        <div>
          <p className="font-medium text-slate-800">{p.name}</p>
          <p className="text-xs text-slate-400">
            {p.sku} {p.barcode ? `· ${p.barcode}` : ""}
          </p>
        </div>
      ),
    },
    { header: "Category", render: (p) => (typeof p.category === "object" ? p.category.name : "-") },
    { header: "Buy", render: (p) => `KES ${p.buyingPrice.toFixed(2)}` },
    { header: "Sell", render: (p) => `KES ${p.sellingPrice.toFixed(2)}` },
    {
      header: "Margin",
      render: (p) => {
        const margin = p.sellingPrice - p.buyingPrice;
        const pct = p.buyingPrice ? ((margin / p.buyingPrice) * 100).toFixed(1) : "0";
        return (
          <span className={margin >= 0 ? "text-green-600" : "text-red-500"}>
            KES {margin.toFixed(2)} ({pct}%)
          </span>
        );
      },
    },
    {
      header: "Stock",
      render: (p) => (
        <span className={p.stock <= 0 ? "text-red-500" : p.stock <= p.minStock ? "text-amber-600" : "text-slate-700"}>
          {p.stock} {p.unit}
        </span>
      ),
    },
    {
      header: "Status",
      render: (p) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
          {p.status}
        </span>
      ),
    },
    {
      header: "",
      render: (p) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-brand-600">
            <Pencil size={15} />
          </button>
          <button onClick={() => setDeleteTarget(p)} className="p-1.5 text-slate-400 hover:text-red-500">
            <Trash2 size={15} />
          </button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <>
      <Header title="Products" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>

        <DataTable columns={columns} rows={products} loading={loading} emptyText="No products yet" />
      </div>

      {showForm && (
        <Modal title={editing ? "Edit Product" : "Add Product"} onClose={() => setShowForm(false)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} span2 />
            <Field label="SKU" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} />
            <Field label="Barcode" value={form.barcode} onChange={(v) => setForm({ ...form, barcode: v })} />
            <div>
              <label className="text-xs text-slate-500">Category</label>
              <select
                className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Brand" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
            <Field label="Unit" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} />
            <Field
              label="Buying Price"
              type="number"
              value={form.buyingPrice}
              onChange={(v) => setForm({ ...form, buyingPrice: parseFloat(v) || 0 })}
            />
            <Field
              label="Selling Price"
              type="number"
              value={form.sellingPrice}
              onChange={(v) => setForm({ ...form, sellingPrice: parseFloat(v) || 0 })}
            />
            <Field
              label="Tax Rate (%)"
              type="number"
              value={form.taxRate}
              onChange={(v) => setForm({ ...form, taxRate: parseFloat(v) || 0 })}
            />
            <Field
              label="Current Stock"
              type="number"
              value={form.stock}
              onChange={(v) => setForm({ ...form, stock: parseFloat(v) || 0 })}
            />
            <Field
              label="Minimum Stock"
              type="number"
              value={form.minStock}
              onChange={(v) => setForm({ ...form, minStock: parseFloat(v) || 0 })}
            />
            <Field label="Expiry Date" type="date" value={form.expiryDate} onChange={(v) => setForm({ ...form, expiryDate: v })} />
            <div>
              <label className="text-xs text-slate-500">Status</label>
              <select
                className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <Field label="Image URL" value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} span2 />
            <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} span2 />
          </div>
          <button onClick={submit} className="w-full mt-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold">
            {editing ? "Save Changes" : "Create Product"}
          </button>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete product"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  span2 = false,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <label className="text-xs text-slate-500">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}
