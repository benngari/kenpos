import { useState } from "react";
import Header from "../components/Header";
import { useUiStore } from "../store/uiStore";
import { Keyboard, Hand } from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";

const DEFAULTS = {
  storeName: "Jambo Mart",
  address: "Moi Avenue, Nairobi",
  phone: "0712345678",
  email: "info@jambomart.co.ke",
  kraPin: "P051234567X",
  vatRate: 16,
  currency: "KES",
  receiptFooter: "Asante kwa kutununulia! Karibu tena.",
  lowStockThreshold: 5,
};

/**
 * NOTE: this reads/writes localStorage as a working placeholder so the screen is fully
 * functional out of the box. A `Store` Mongoose model + `/api/store` routes already exist
 * on the backend (see backend/src/models/index.ts) - wiring this form to GET/PUT /api/store
 * is the integration point to make settings persist server-side and be shared across devices.
 */
export default function Settings() {
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem("kenpos_settings");
    return saved ? JSON.parse(saved) : DEFAULTS;
  });
  const { touchMode, setTouchMode } = useUiStore();

  function save() {
    localStorage.setItem("kenpos_settings", JSON.stringify(form));
    toast.success("Settings saved");
  }

  return (
    <>
      <Header title="Settings" />
      <div className="p-6 max-w-2xl space-y-6">
        <Section title="Device Preferences">
          <p className="text-xs text-slate-500 -mt-1 mb-2">
            This applies to this device only — useful when the same cashier uses a desktop at the
            till and a tablet on the floor.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTouchMode(false)}
              className={clsx(
                "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium",
                !touchMode ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <Keyboard size={22} />
              Keyboard &amp; Mouse
              <span className="text-[11px] font-normal text-slate-400">F-key shortcuts, compact layout</span>
            </button>
            <button
              onClick={() => setTouchMode(true)}
              className={clsx(
                "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium",
                touchMode ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <Hand size={22} />
              Touch / Tablet
              <span className="text-[11px] font-normal text-slate-400">Bigger buttons, on-screen keypad</span>
            </button>
          </div>
        </Section>

        <Section title="Store Information">
          <Field label="Store Name" value={form.storeName} onChange={(v) => setForm({ ...form, storeName: v })} />
          <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="KRA PIN" value={form.kraPin} onChange={(v) => setForm({ ...form, kraPin: v })} />
        </Section>

        <Section title="Tax & Currency">
          <Field label="VAT Rate (%)" type="number" value={form.vatRate} onChange={(v) => setForm({ ...form, vatRate: parseFloat(v) || 0 })} />
          <Field label="Currency" value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} />
        </Section>

        <Section title="Receipt">
          <div>
            <label className="text-xs text-slate-500">Receipt Footer Message</label>
            <textarea
              className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.receiptFooter}
              onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
            />
          </div>
        </Section>

        <Section title="Inventory">
          <Field
            label="Default Low-Stock Threshold"
            type="number"
            value={form.lowStockThreshold}
            onChange={(v) => setForm({ ...form, lowStockThreshold: parseFloat(v) || 0 })}
          />
        </Section>

        <Section title="Integrations (architecture ready, not yet live)">
          <p className="text-sm text-slate-500 leading-relaxed">
            The Payment model already stores M-Pesa transaction codes and phone numbers manually. A real
            Daraja API integration (STK push, callback URLs) can be added later using this same schema. The
            same applies to KRA eTIMS - no live integration is claimed here.
          </p>
        </Section>

        <button onClick={save} className="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">
          Save Settings
        </button>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-slate-500">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
    </div>
  );
}