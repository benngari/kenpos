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
        "shrink-0 bg-white border-l border-slate-200 flex flex-col sticky overflow-hidden",
        touchMode
          ? "w-[400px] xl:w-[440px] h-[calc(100vh-6rem)] top-24"
          : "w-[340px] xl:w-[380px] h-[calc(100vh-4rem)] top-16"
      )}
    >
      <div className={clsx("border-b border-slate-100 flex items-center gap-2", touchMode ? "p-5" : "p-4")}>
        <UserIcon size={touchMode ? 20 : 16} className="text-slate-400" />
        <select
          className={clsx(
            "flex-1 border border-slate-200 rounded-lg px-3",
            touchMode ? "text-lg py-3.5" : "text-sm py-1.5"
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

      <div className={clsx("flex-1 overflow-y-auto scrollbar-thin", touchMode ? "px-5 py-3" : "px-4 py-2")}>
        {lines.length === 0 ? (
          <p className={clsx("text-center text-slate-400 mt-10", touchMode ? "text-base" : "text-sm")}>
            Cart is empty. Tap a product to add it.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {lines.map((line) => (
              <li key={line.product._id} className={touchMode ? "py-4" : "py-3"}>
                <div className="flex justify-between items-start gap-2">
                  <p className={clsx("font-medium text-slate-800 flex-1 leading-tight", touchMode ? "text-lg" : "text-sm")}>
                    {line.product.name}
                  </p>
                  <button
                    onClick={() => removeLine(line.product._id)}
                    className={clsx("text-slate-300 hover:text-red-500", touchMode && "p-2.5 -m-2.5")}
                  >
                    <Trash2 size={touchMode ? 22 : 15} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2.5">
                  {touchMode ? (
                    <div className="flex items-center gap-3 border-2 border-slate-200 rounded-2xl">
                      <button
                        className="h-14 w-14 flex items-center justify-center hover:bg-slate-50 active:bg-slate-100 rounded-l-2xl"
                        onClick={() => incrementLine(line.product._id, -1)}
                      >
                        <Minus size={22} />
                      </button>
                      <button
                        onClick={() => setKeypadFor(line.product._id)}
                        className="w-14 text-center text-xl font-bold"
                      >
                        {line.quantity}
                      </button>
                      <button
                        className="h-14 w-14 flex items-center justify-center hover:bg-slate-50 active:bg-slate-100 rounded-r-2xl"
                        onClick={() => incrementLine(line.product._id, 1)}
                      >
                        <Plus size={22} />
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
                  <p className={clsx("font-semibold text-slate-700", touchMode ? "text-lg" : "text-sm")}>
                    KES {(line.product.sellingPrice * line.quantity - line.discount).toFixed(0)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={clsx("border-t border-slate-100 space-y-2.5", touchMode ? "p-5" : "p-4")}>
        <div className={clsx("flex justify-between text-slate-600", touchMode ? "text-base" : "text-sm")}>
          <span>Subtotal</span>
          <span>KES {totals.subtotal.toFixed(2)}</span>
        </div>
        <div className={clsx("flex justify-between text-slate-600 items-center", touchMode ? "text-base" : "text-sm")}>
          <span>Overall discount</span>
          <input
            type="number"
            min={0}
            className={clsx(
              "text-right border border-slate-200 rounded-lg px-2",
              touchMode ? "w-32 py-2.5 text-lg" : "w-24 py-1 text-sm"
            )}
            value={overallDiscount || ""}
            placeholder="0"
            onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className={clsx("flex justify-between text-slate-600", touchMode ? "text-base" : "text-sm")}>
          <span>VAT</span>
          <span>KES {totals.tax.toFixed(2)}</span>
        </div>
        <div
          className={clsx(
            "flex justify-between font-bold text-slate-900 pt-2.5 border-t border-slate-100",
            touchMode ? "text-2xl" : "text-base"
          )}
        >
          <span>Total</span>
          <span>KES {totals.total.toFixed(2)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            onClick={onHold}
            disabled={lines.length === 0}
            className={clsx(
              "rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-40",
              touchMode ? "py-5 text-lg" : "py-2.5 text-sm"
            )}
          >
            Hold{!touchMode && " (F4)"}
          </button>
          <button
            onClick={() => (lines.length === 0 ? null : clear())}
            disabled={lines.length === 0}
            className={clsx(
              "rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-40",
              touchMode ? "py-5 text-lg" : "py-2.5 text-sm"
            )}
          >
            Clear
          </button>
        </div>
        <button
          onClick={onOpenPayment}
          disabled={lines.length === 0}
          className={clsx(
            "w-full rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-700 text-white font-bold disabled:opacity-40",
            touchMode ? "py-6 text-xl" : "py-3 text-base"
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