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
    <Modal title={title} onClose={onClose} width="max-w-xs">
      <div className="text-center text-4xl font-bold text-slate-800 bg-slate-50 rounded-xl py-4 mb-4">
        {value}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className="h-16 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-2xl font-semibold text-slate-700 flex items-center justify-center"
          >
            {k === "clear" ? "C" : k === "back" ? <Delete size={22} /> : k}
          </button>
        ))}
      </div>
      <button
        onClick={confirm}
        className="w-full mt-4 py-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-lg font-bold"
      >
        Confirm
      </button>
    </Modal>
  );
}