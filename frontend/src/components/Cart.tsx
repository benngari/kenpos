import { useState } from "react";
import { Minus, Plus, Trash2, User as UserIcon } from "lucide-react";
import { useCartStore, computeTotals } from "../store/cartStore";
import { useUiStore } from "../store/uiStore";
import { Customer } from "../types";
import NumericKeypad from "./NumericKeypad";
import clsx from "clsx";

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
  const { touchMode } = useUiStore();
  const [keypadFor, setKeypadFor] = useState<string | null>(null);

  const totals = computeTotals(lines, overallDiscount);
  const keypadLine = lines.find((l) => l.product._id === keypadFor);

  return (
    <div
      className={clsx(
        "shrink-0 bg-white border-l border-slate-200 flex flex-col h-[calc(100vh-4rem)] sticky top-16 overflow-hidden",
        touchMode ? "w-[380px] xl:w-[420px]" : "w-[340px] xl:w-[380px]"
      )}
    >
      <div className="p-4 border-b border-slate-100 flex items-center gap-2">
        <UserIcon size={16} className="text-slate-400" />
        <select
          className={clsx(
            "flex-1 border border-slate-200 rounded-lg px-2",
            touchMode ? "text-base py-2.5" : "text-sm py-1.5"
          )}
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
                  <p className={clsx("font-medium text-slate-800 flex-1 leading-tight", touchMode ? "text-base" : "text-sm")}>
                    {line.product.name}
                  </p>
                  <button
                    onClick={() => removeLine(line.product._id)}
                    className={clsx("text-slate-300 hover:text-red-500", touchMode && "p-2 -m-2")}
                  >
                    <Trash2 size={touchMode ? 19 : 15} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  {touchMode ? (
                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl">
                      <button
                        className="h-11 w-11 flex items-center justify-center hover:bg-slate-50 active:bg-slate-100 rounded-l-xl"
                        onClick={() => incrementLine(line.product._id, -1)}
                      >
                        <Minus size={18} />
                      </button>
                      <button
                        onClick={() => setKeypadFor(line.product._id)}
                        className="w-12 text-center text-base font-semibold"
                      >
                        {line.quantity}
                      </button>
                      <button
                        className="h-11 w-11 flex items-center justify-center hover:bg-slate-50 active:bg-slate-100 rounded-r-xl"
                        onClick={() => incrementLine(line.product._id, 1)}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg">
                      <button className="p-1.5 hover:bg-slate-50" onClick={() => incrementLine(line.product._id, -1)}>
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
                  )}
                  <p className={clsx("font-semibold text-slate-700", touchMode ? "text-base" : "text-sm")}>
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
            className={clsx(
              "text-right border border-slate-200 rounded-lg px-2",
              touchMode ? "w-28 py-2 text-base" : "w-24 py-1 text-sm"
            )}
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
            className={clsx(
              "rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40",
              touchMode ? "py-4 text-base" : "py-2.5 text-sm"
            )}
          >
            Hold{!touchMode && " (F4)"}
          </button>
          <button
            onClick={() => (lines.length === 0 ? null : clear())}
            disabled={lines.length === 0}
            className={clsx(
              "rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40",
              touchMode ? "py-4 text-base" : "py-2.5 text-sm"
            )}
          >
            Clear
          </button>
        </div>
        <button
          onClick={onOpenPayment}
          disabled={lines.length === 0}
          className={clsx(
            "w-full rounded-lg bg-brand-600 hover:bg-brand-700 active:bg-brand-700 text-white font-semibold disabled:opacity-40",
            touchMode ? "py-5 text-lg" : "py-3"
          )}
        >
          Pay{!touchMode && " (F8)"} · KES {totals.total.toFixed(0)}
        </button>
      </div>

      {keypadLine && (
        <NumericKeypad
          title={`Quantity — ${keypadLine.product.name}`}
          initialValue={keypadLine.quantity}
          onClose={() => setKeypadFor(null)}
          onConfirm={(n) => {
            setQuantity(keypadLine.product._id, n);
            setKeypadFor(null);
          }}
        />
      )}
    </div>
  );
}