import { Minus, Plus, Trash2, User as UserIcon } from "lucide-react";
import { useCartStore, computeTotals } from "../store/cartStore";
import { Customer } from "../types";

export default function Cart({
  customers,
  onOpenPayment,
  onHold,
}: {
  customers: Customer[];
  onOpenPayment: () => void;
  onHold: () => void;
}) {
  const {
    lines,
    overallDiscount,
    customer,
    incrementLine,
    setQuantity,
    removeLine,
    setOverallDiscount,
    setCustomer,
    clear,
  } = useCartStore();

  const totals = computeTotals(lines, overallDiscount);

  return (
    <div className="w-[380px] shrink-0 bg-white border-l border-slate-200 flex flex-col h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 border-b border-slate-100 flex items-center gap-2">
        <UserIcon size={16} className="text-slate-400" />
        <select
          className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-1.5"
          value={customer || ""}
          onChange={(e) => setCustomer(e.target.value || null)}
        >
          <option value="">Walk-in Customer</option>
          {customers.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} {c.phone ? `(${c.phone})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-2">
        {lines.length === 0 ? (
          <p className="text-center text-slate-400 text-sm mt-10">Cart is empty. Tap a product to add it.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {lines.map((line) => (
              <li key={line.product._id} className="py-3">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm font-medium text-slate-800 flex-1 leading-tight">{line.product.name}</p>
                  <button onClick={() => removeLine(line.product._id)} className="text-slate-300 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg">
                    <button
                      className="p-1.5 hover:bg-slate-50"
                      onClick={() => incrementLine(line.product._id, -1)}
                    >
                      <Minus size={13} />
                    </button>
                    <input
                      className="w-10 text-center text-sm outline-none"
                      value={line.quantity}
                      onChange={(e) => setQuantity(line.product._id, parseInt(e.target.value) || 1)}
                    />
                    <button className="p-1.5 hover:bg-slate-50" onClick={() => incrementLine(line.product._id, 1)}>
                      <Plus size={13} />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    KES {(line.product.sellingPrice * line.quantity - line.discount).toFixed(0)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-100 p-4 space-y-2">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span>KES {totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-600 items-center">
          <span>Overall discount</span>
          <input
            type="number"
            min={0}
            className="w-24 text-right border border-slate-200 rounded-lg px-2 py-1 text-sm"
            value={overallDiscount || ""}
            placeholder="0"
            onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="flex justify-between text-sm text-slate-600">
          <span>VAT</span>
          <span>KES {totals.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
          <span>Total</span>
          <span>KES {totals.total.toFixed(2)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onHold}
            disabled={lines.length === 0}
            className="py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
          >
            Hold (F4)
          </button>
          <button
            onClick={() => (lines.length === 0 ? null : clear())}
            disabled={lines.length === 0}
            className="py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
          >
            Clear
          </button>
        </div>
        <button
          onClick={onOpenPayment}
          disabled={lines.length === 0}
          className="w-full py-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-40"
        >
          Pay (F8) · KES {totals.total.toFixed(0)}
        </button>
      </div>
    </div>
  );
}
