import { useEffect, useState } from "react";
import Header from "../components/Header";
import DataTable, { Column } from "../components/DataTable";
import Modal, { ConfirmDialog } from "../components/Modal";
import { api, errorMessage } from "../lib/api";
import { User } from "../types";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "cashier" });
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      setUsers(data);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", password: "", role: "cashier" });
    setShowForm(true);
  }
  function openEdit(u: User) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, phone: u.phone || "", password: "", role: u.role });
    setShowForm(true);
  }

  async function submit() {
    try {
      if (editing) {
        const payload: any = { name: form.name, phone: form.phone, role: form.role };
        if (form.password) payload.password = form.password;
        await api.put(`/users/${editing.id || (editing as any)._id}`, payload);
        toast.success("User updated");
      } else {
        await api.post("/users", form);
        toast.success("User created");
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
      await api.delete(`/users/${deleteTarget.id || (deleteTarget as any)._id}`);
      toast.success("User removed");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const columns: Column<any>[] = [
    { header: "Name", render: (u) => u.name },
    { header: "Email", render: (u) => u.email },
    { header: "Phone", render: (u) => u.phone || "-" },
    { header: "Role", render: (u) => <span className="capitalize text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">{u.role}</span> },
    {
      header: "Status",
      render: (u) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive !== false ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
          {u.isActive !== false ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "",
      render: (u) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => openEdit(u)} className="p-1.5 text-slate-400 hover:text-brand-600">
            <Pencil size={15} />
          </button>
          <button onClick={() => setDeleteTarget(u)} className="p-1.5 text-slate-400 hover:text-red-500">
            <Trash2 size={15} />
          </button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <>
      <Header title="Users & Roles" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium">
            <Plus size={16} /> Add User
          </button>
        </div>
        <DataTable columns={columns} rows={users as any} loading={loading} />
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-600 space-y-1">
          <p><strong>Admin:</strong> Full access to every module.</p>
          <p><strong>Manager:</strong> Sales, inventory, products, customers, suppliers and reports.</p>
          <p><strong>Cashier:</strong> POS, customers, and their own sales only.</p>
        </div>
      </div>

      {showForm && (
        <Modal title={editing ? "Edit User" : "Add User"} onClose={() => setShowForm(false)} width="max-w-sm">
          <div className="space-y-3">
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} disabled={!!editing} />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field label={editing ? "New Password (leave blank to keep)" : "Password"} type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
            <div>
              <label className="text-xs text-slate-500">Role</label>
              <select className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
              </select>
            </div>
          </div>
          <button onClick={submit} className="w-full mt-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold">
            {editing ? "Save Changes" : "Create User"}
          </button>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Remove user"
          message={`Remove ${deleteTarget.name}? They will no longer be able to log in.`}
          confirmLabel="Remove"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

function Field({ label, value, onChange, type = "text", disabled = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean }) {
  return (
    <div>
      <label className="text-xs text-slate-500">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
      />
    </div>
  );
}
