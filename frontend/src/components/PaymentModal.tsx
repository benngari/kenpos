import { useState } from "react";
import Modal from "./Modal";
import { Payment, PaymentMethod } from "../types";
import clsx from "clsx";
import { Plus, Trash2 } from "lucide-react";

const METHODS: { key: PaymentMethod; label: string }[] = [
  { key: "cash", label: "Cash" },
  { key: "mpesa", label: "M-Pesa" },
  { key: "card", label: "Card" },
  { key: "bank", label: "Bank" },
  { key: "credit", label: "Credit" },
];

export default function PaymentModal({
  total,
  hasCustomer,
  onClose,
  onConfirm,
  submitting,
}: {
  total: number;
  hasCustomer: boolean;
  onClose: () => void;
  onConfirm: (payments: Payment[]) => void;
  submitting: boolean;
}) {
  const [splitMode, setSplitMode] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState(total.toFixed(2));
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("");
  const [splits, setSplits] = useState<Payment[]>([]);

  const singleAmount = parseFloat(amount) || 0;
  const change = Math.max(0, singleAmount - total);

  const splitTotal = splits.reduce((s, p) => s + p.amount, 0);
  const splitRemaining = Math.max(0, total - splitTotal);

  function addSplitLine() {
    if (!singleAmount) return;
    setSplits([...splits, { method, amount: singleAmount, reference: reference || undefined, phone: phone || undefined }]);
    setAmount("");
    setReference("");
    setPhone("");
  }

  function removeSplit(idx: number) {
    setSplits(splits.filter((_, i) => i !== idx));
  }

  function submit() {
    if (splitMode) {
      if (Math.abs(splitTotal - total) > 0.5) return;
      onConfirm(splits);
    } else {
      if (method === "credit" && !hasCustomer) return;
      const payments: Payment[] = [
        {
          method,
          amount: method === "cash" ? Math.min(singleAmount, total) : singleAmount,
          reference: reference || undefined,
          phone: phone || undefined,
        },
      ];
      onConfirm(payments);
    }
  }

  const canSubmit = splitMode
    ? Math.abs(splitTotal - total) <= 0.5 && splits.length > 0
    : singleAmount >= total || method === "credit"
    ? method !== "credit" || hasCustomer
    : false;

  return (
    <Modal title="Take Payment" onClose={onClose} width="max-w-md">
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-slate-50 rounded-lg p-3">
          <span className="text-sm text-slate-500">Amount due</span>
          <span className="text-xl font-bold text-slate-900">KES {total.toFixed(2)}</span>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={splitMode} onChange={(e) => setSplitMode(e.target.checked)} />
          Split payment across multiple methods
        </label>

        <div className="grid grid-cols-5 gap-1.5">
          {METHODS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMethod(m.key)}
              disabled={m.key === "credit" && !hasCustomer}
              className={clsx(
                "py-2 text-xs font-medium rounded-lg border",
                method === m.key
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50",
                m.key === "credit" && !hasCustomer && "opacity-30 cursor-not-allowed"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {method === "credit" && !hasCustomer && (
          <p className="text-xs text-red-500">Select a customer in the cart before using credit.</p>
        )}

        <div className="space-y-2">
          <label className="text-xs text-slate-500">
            {splitMode ? "Amount for this method" : "Amount received"}
          </label>
          <input
            type="number"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {method === "mpesa" && (
            <>
              <input
                placeholder="M-Pesa transaction code"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
              <input
                placeholder="Phone number"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}
          {(method === "card" || method === "bank") && (
            <input
              placeholder="Reference number"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          )}
        </div>

        {splitMode && (
          <button
            onClick={addSplitLine}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-sm rounded-lg border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50"
          >
            <Plus size={14} /> Add payment line
          </button>
        )}

        {splitMode && splits.length > 0 && (
          <div className="space-y-1.5">
            {splits.map((s, i) => (
              <div key={i} className="flex justify-between items-center text-sm bg-slate-50 rounded-lg px-3 py-1.5">
                <span className="capitalize">{s.method}: KES {s.amount.toFixed(2)}</span>
                <button onClick={() => removeSplit(i)} className="text-slate-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <div className="flex justify-between text-xs text-slate-500 px-1">
              <span>Remaining</span>
              <span>KES {splitRemaining.toFixed(2)}</span>
            </div>
          </div>
        )}

        {!splitMode && method === "cash" && singleAmount > total && (
          <div className="flex justify-between text-sm font-medium bg-green-50 text-green-700 rounded-lg px-3 py-2">
            <span>Change</span>
            <span>KES {change.toFixed(2)}</span>
          </div>
        )}

        <button
          onClick={submit}
          disabled={!canSubmit || submitting}
          className="w-full py-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-40"
        >
          {submitting ? "Processing..." : "Complete Payment"}
        </button>
      </div>
    </Modal>
  );
}
