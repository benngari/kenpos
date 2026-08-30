import { useState } from "react";
import Modal from "./Modal";
import { Delete } from "lucide-react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];

export default function NumericKeypad({
  title = "Enter Quantity",
  initialValue = 1,
  onClose,
  onConfirm,
}: {
  title?: string;
  initialValue?: number;
  onClose: () => void;
  onConfirm: (value: number) => void;
}) {
  const [value, setValue] = useState(String(initialValue));

  function press(key: string) {
    if (key === "clear") {
      setValue("0");
    } else if (key === "back") {
      setValue((v) => (v.length > 1 ? v.slice(0, -1) : "0"));
    } else {
      setValue((v) => (v === "0" ? key : v + key));
    }
  }

  function confirm() {
    const n = Math.max(1, parseInt(value, 10) || 1);
    onConfirm(n);
  }

  return (
    <Modal title={title} onClose={onClose} width="max-w-sm">
      <div className="text-center text-5xl font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 rounded-2xl py-6 mb-5">
        {value}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-500 text-3xl font-bold text-slate-700 dark:text-slate-100 flex items-center justify-center"
          >
            {k === "clear" ? "C" : k === "back" ? <Delete size={26} /> : k}
          </button>
        ))}
      </div>
      <button
        onClick={confirm}
        className="w-full mt-5 py-5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xl font-bold"
      >
        Confirm
      </button>
    </Modal>
  );
}
