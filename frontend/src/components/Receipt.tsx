import { Sale } from "../types";

export default function Receipt({ sale, storeName = "Jambo Mart" }: { sale: Sale; storeName?: string }) {
  return (
    <div id="receipt-print" className="bg-white text-slate-800 mx-auto w-[300px] text-xs font-mono p-4 border border-slate-200 rounded-lg">
      <div className="text-center mb-2">
        <p className="font-bold text-sm">{storeName}</p>
        <p>Moi Avenue, Nairobi</p>
        <p>Tel: 0712 345 678</p>
      </div>
      <div className="border-t border-dashed border-slate-400 my-2" />
      <p>Receipt#: {sale.receiptNumber}</p>
      <p>Date: {new Date(sale.createdAt).toLocaleString("en-KE")}</p>
      <p>Cashier: {typeof sale.cashier === "object" ? sale.cashier.name : ""}</p>
      <div className="border-t border-dashed border-slate-400 my-2" />
      {sale.items.map((item, i) => (
        <div key={i} className="mb-1">
          <p>{item.name}</p>
          <div className="flex justify-between">
            <span>
              {item.quantity} x {item.unitPrice.toFixed(2)}
            </span>
            <span>{item.total.toFixed(2)}</span>
          </div>
        </div>
      ))}
      <div className="border-t border-dashed border-slate-400 my-2" />
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{sale.subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span>Discount</span>
        <span>-{sale.discount.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span>VAT</span>
        <span>{sale.tax.toFixed(2)}</span>
      </div>
      <div className="flex justify-between font-bold text-sm">
        <span>TOTAL</span>
        <span>KES {sale.total.toFixed(2)}</span>
      </div>
      <div className="border-t border-dashed border-slate-400 my-2" />
      {sale.payments.map((p, i) => (
        <div key={i} className="flex justify-between capitalize">
          <span>{p.method}</span>
          <span>{p.amount.toFixed(2)}</span>
        </div>
      ))}
      <div className="flex justify-between">
        <span>Change</span>
        <span>{sale.change.toFixed(2)}</span>
      </div>
      <div className="border-t border-dashed border-slate-400 my-2" />
      <p className="text-center">Asante kwa kutununulia! Karibu tena.</p>
    </div>
  );
}
