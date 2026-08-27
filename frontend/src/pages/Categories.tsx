import { useEffect, useState } from "react";
import Header from "../components/Header";
import Modal, { ConfirmDialog } from "../components/Modal";
import { api, errorMessage } from "../lib/api";
import { Category } from "../types";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  async function load() {
    const { data } = await api.get("/categories");
    setCategories(data);
  }
  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setIcon("");
    setShowForm(true);
  }
  function openEdit(c: Category) {
    setEditing(c);
    setName(c.name);
    setIcon(c.icon || "");
    setShowForm(true);
  }

  async function submit() {
    try {
      if (editing) await api.put(`/categories/${editing._id}`, { name, icon });
      else await api.post("/categories", { name, icon });
      setShowForm(false);
      load();
      toast.success(editing ? "Category updated" : "Category created");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/categories/${deleteTarget._id}`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <>
      <Header title="Categories" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium">
            <Plus size={16} /> Add Category
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((c) => (
            <div key={c._id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl">{c.icon || "🏷️"}</p>
                <p className="font-medium text-slate-800 mt-1">{c.name}</p>
                <p className="text-xs text-slate-400">{c.productCount ?? 0} products</p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-brand-600">
                  <Pencil size={15} />
                </button>
                <button onClick={() => setDeleteTarget(c)} className="p-1.5 text-slate-400 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <Modal title={editing ? "Edit Category" : "Add Category"} onClose={() => setShowForm(false)} width="max-w-sm">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Icon (emoji)</label>
              <input value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <button onClick={submit} className="w-full mt-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold">
            Save
          </button>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete category"
          message={`Delete "${deleteTarget.name}"? Products using it must be reassigned first.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
